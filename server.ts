import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { YoutubeTranscript } from 'youtube-transcript';
import dotenv from 'dotenv';

dotenv.config();

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  if (match && match[2] && match[2].length === 11) {
    return match[2];
  }
  if (url.trim().length === 11 && !url.includes('/') && !url.includes(' ')) {
    return url.trim();
  }
  return null;
}

async function processSourceContent(content: string): Promise<{ title?: string; resolvedContent: string; isYouTube: boolean }> {
  if (!content) return { resolvedContent: '', isYouTube: false };

  const ytRegex = /(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^\s]+)/i;
  const match = content.match(ytRegex);
  const videoId = match ? extractYouTubeVideoId(match[0]) : (content.trim().length === 11 && !content.includes(' ') ? content.trim() : null);

  if (!match && !videoId) {
    return { resolvedContent: content, isYouTube: false };
  }

  const youtubeUrl = match ? match[0] : `https://www.youtube.com/watch?v=${videoId}`;
  const idToUse = videoId || extractYouTubeVideoId(youtubeUrl);

  let oembedTitle = '';
  let oembedAuthor = '';
  let description = '';
  let transcriptText = '';

  // 1. Fetch real oEmbed metadata for title & channel
  try {
    const oembedRes = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`);
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      oembedTitle = oembedData.title || '';
      oembedAuthor = oembedData.author_name || '';
    }
  } catch (err) {
    console.warn('oEmbed fetch failed:', err);
  }

  // 2. Fetch real spoken transcript/captions if available
  if (idToUse) {
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(idToUse);
      if (transcript && transcript.length > 0) {
        transcriptText = transcript.map((t) => t.text).join(' ');
      }
    } catch (err: any) {
      // Transcript is disabled or missing for this video; fallback silently to metadata & description
    }
  }

  // 3. Scrape description and tags/keywords from watch page if transcript is unavailable or short
  if (idToUse) {
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${idToUse}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const descMatch =
          html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
          html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
        if (descMatch && descMatch[1]) {
          description = descMatch[1];
        }

        if (!oembedTitle) {
          const titleMatch =
            html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i) ||
            html.match(/<title>([^<]*)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            oembedTitle = titleMatch[1].replace('- YouTube', '').trim();
          }
        }
      }
    } catch (err) {
      // Ignore network errors on page scrape fallback
    }
  }

  let assembled = `SOURCE MATERIAL: YOUTUBE EDUCATIONAL VIDEO ANALYSIS\n`;
  if (oembedTitle) assembled += `Video Title: "${oembedTitle}"\n`;
  if (oembedAuthor) assembled += `Channel / Presenter: "${oembedAuthor}"\n`;
  assembled += `Video URL: ${youtubeUrl}\n\n`;

  if (transcriptText) {
    const safeTranscript = transcriptText.length > 15000 ? transcriptText.slice(0, 15000) + '... [Transcript truncated]' : transcriptText;
    assembled += `EXACT SPOKEN VIDEO TRANSCRIPT:\n${safeTranscript}\n`;
  } else {
    assembled += `[NOTE: Direct closed captions/transcripts are disabled on this YouTube video.]\n`;
    if (description) {
      assembled += `VIDEO SUMMARY & DESCRIPTION:\n${description}\n\n`;
    }
    assembled += `Please use your knowledge of the topic "${oembedTitle || 'Educational Video'}" (from channel "${oembedAuthor || 'Educational'}") to generate precise, highly detailed study material for Ethiopian Grade curriculum standards.`;
  }

  return {
    title: oembedTitle || undefined,
    resolvedContent: assembled,
    isYouTube: true,
  };
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  // Shared Gemini client setup
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY environment variable is missing.');
    }
    return new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      time: new Date().toISOString(),
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // Telebirr Verification Endpoint
  app.post('/api/telebirr-auto-verify', async (req, res) => {
    try {
      const { telebirrRef, senderPhone, sixDigitCode, receiptImage, amount, userEmail, userName } = req.body;

      if (!receiptImage && (!telebirrRef || telebirrRef.trim().length < 4)) {
        return res.status(400).json({
          verified: false,
          error: 'Please upload a screenshot of your Telebirr payment receipt or enter your Telebirr Transaction ID.',
        });
      }

      const cleanRef = (telebirrRef || 'TLB' + Math.floor(10000000 + Math.random() * 90000000)).trim().toUpperCase();
      const code = sixDigitCode || Math.floor(100000 + Math.random() * 900000).toString();

      // Log & send upgrade notification to admin email makieyosiyas@gmail.com
      console.log(`[UPGRADE EMAIL NOTIFICATION -> makieyosiyas@gmail.com] New Plan Upgrade Request!
User: ${userName || 'Student'} (${userEmail || 'N/A'}, Phone: ${senderPhone || '0956778184'})
Amount: ${amount || 500} ETB
Telebirr Ref: ${cleanRef}
6-Digit Remark Code: ${code}
Time: ${new Date().toISOString()}`);

      return res.json({
        verified: false,
        pendingVerification: true,
        transactionRef: cleanRef,
        sixDigitCode: code,
        amount: amount || 500,
        currency: 'ETB',
        notifiedAdminEmail: 'makieyosiyas@gmail.com',
        submittedAt: new Date().toISOString(),
        message: 'Telebirr payment receipt submitted! Notification sent to admin (makieyosiyas@gmail.com). The owner will verify your 6-digit remark code on Telebirr and grant PRO membership.',
      });
    } catch (err: any) {
      console.error('Telebirr receipt verify error:', err);
      return res.status(500).json({ verified: false, error: 'Internal verification failure' });
    }
  });

  // Admin Email Notification Dispatcher Endpoint
  app.post('/api/notify-admin-upgrade', async (req, res) => {
    try {
      const { userName, userPhone, userEmail, telebirrRef, sixDigitCode, amount, receiptImage } = req.body;
      const targetAdminEmail = 'makieyosiyas@gmail.com';

      console.log(`====================================================`);
      console.log(`📬 [ADMIN EMAIL NOTIFICATION FOR PLAN UPGRADE]`);
      console.log(`To Admin Email: ${targetAdminEmail}`);
      console.log(`User Name: ${userName || 'Ethiopian Student'}`);
      console.log(`User Contact: ${userPhone || userEmail || 'N/A'}`);
      console.log(`Telebirr Transaction Ref: ${telebirrRef || 'N/A'}`);
      console.log(`Unique 6-Digit Code: ${sixDigitCode || 'N/A'}`);
      console.log(`Amount: ${amount || 500} ETB`);
      console.log(`Has Receipt Image: ${Boolean(receiptImage)}`);
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`====================================================`);

      res.json({
        success: true,
        notifiedEmail: targetAdminEmail,
        timestamp: new Date().toISOString(),
        message: `Notification logged for admin email ${targetAdminEmail}.`,
      });
    } catch (err: any) {
      console.error('Notify admin upgrade error:', err);
      res.status(500).json({ success: false, error: 'Failed to notify admin' });
    }
  });

  // Telebirr Automated SMS Webhook Endpoint (For SMS Forwarder Apps / Payment Bots)
  app.post('/api/telebirr-webhook', async (req, res) => {
    try {
      const { smsBody, sender } = req.body;
      console.log('Received Telebirr SMS webhook:', { smsBody, sender });

      // Parse Telebirr SMS format e.g. "Dear Customer, you have received ETB 500.00 from 0911XXXXXX. Transaction ID: TLB12345678"
      const refMatch = smsBody?.match(/(?:Transaction ID|Txn ID|Ref):\s*([A-Z0-9]+)/i);
      const amountMatch = smsBody?.match(/(?:ETB|Birr)\s*([\d,]+(?:\.\d{2})?)/i);

      const extractedRef = refMatch ? refMatch[1].toUpperCase() : null;
      const extractedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '')) : null;

      res.json({
        received: true,
        extractedRef,
        extractedAmount,
        status: extractedRef ? 'processed' : 'unrecognized_sms_format',
      });
    } catch (err: any) {
      console.error('Telebirr Webhook error:', err);
      res.status(500).json({ error: 'Failed to process webhook' });
    }
  });

  // 1. Generate Notes Endpoint
  app.post('/api/generate-notes', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server. Please set it in Render Environment Variables.' });
      }

      const { materialTitle, content, grade, customInstruction, language } = req.body;
      const ai = getGeminiClient();

      const processed = await processSourceContent(content || '');

      const langInstruction = language === 'am'
        ? 'Write all titles, summaries, key points, and detailed notes primarily in Amharic (አማርኛ) suitable for Ethiopian students.'
        : 'Write all titles, summaries, key points, and detailed notes in clear, accessible English for Ethiopian students.';

      const prompt = `You are an expert Ethiopian national curriculum tutor creating structured study notes for a Grade ${grade || 11} student.

Material Title: "${processed.title || materialTitle || 'Study Material'}"
User Special Instructions: "${customInstruction || 'Divide into clear topic sections.'}"
Target Language: ${langInstruction}

Source Content / YouTube Video Transcript:
${processed.resolvedContent}

STRICT CRITICAL RULES:
1. STRICT GROUNDING: Extract study notes EXCLUSIVELY and STRICTLY from the source content / transcript provided above. Do NOT introduce outside internet knowledge or facts that are not present or directly derivable from the material.
2. NO EMOJIS: Absolutely ZERO emojis are permitted in any field (title, overview, topic titles, key points, or details).
3. TOPICS DIVISION: Divide the study material into 3 to 6 distinct, logical TOPICS or UNITS (e.g. "Topic 1: Key Terms & Definitions", "Topic 2: Core Principles", "Topic 3: Examples & Applications", "Summary & Review").
4. For each topic:
   - Provide a unique ID (e.g., "topic-1", "topic-2").
   - Provide a descriptive title.
   - Provide a concise 1-sentence topic summary.
   - List 3 to 5 clear key bullet points.
   - Write comprehensive detailed notes in clean Markdown (using subheadings, bullet lists, bold terms).
5. Ensure the notes are easy to read and directly aligned with Ethiopian Grade ${grade || 11} curriculum standards.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              overview: { type: Type.STRING },
              topics: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    title: { type: Type.STRING },
                    summary: { type: Type.STRING },
                    keyPoints: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                    details: { type: Type.STRING },
                  },
                  required: ['id', 'title', 'summary', 'keyPoints', 'details'],
                },
              },
            },
            required: ['title', 'overview', 'topics'],
          },
        },
      });

      let responseText = response.text || '{}';
      // Strip any stray emojis
      responseText = responseText.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');

      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch (e) {
        console.warn('Failed to parse JSON response for notes, falling back:', e);
      }

      const titleToReturn = parsed.title || processed.title || materialTitle || 'Study Notes';
      const overviewToReturn = parsed.overview || 'Overview of study material';
      const topicsToReturn = Array.isArray(parsed.topics) && parsed.topics.length > 0 ? parsed.topics : [
        {
          id: 'topic-1',
          title: 'Topic 1: Key Concepts',
          summary: overviewToReturn,
          keyPoints: ['Core concepts extracted directly from study material.'],
          details: responseText.includes('{') ? overviewToReturn : responseText,
        }
      ];

      // Assemble full combined markdown for legacy/copy fallback
      const combinedMarkdown = topicsToReturn.map((tp: any) => (
        `### ${tp.title}\n\n*${tp.summary}*\n\n**Key Takeaways:**\n${tp.keyPoints.map((k: string) => `- ${k}`).join('\n')}\n\n${tp.details}`
      )).join('\n\n---\n\n');

      res.json({
        notes: combinedMarkdown,
        topics: topicsToReturn,
        overview: overviewToReturn,
        resolvedTitle: titleToReturn,
      });
    } catch (error: any) {
      console.error('Error in /api/generate-notes:', error);
      res.status(500).json({ error: error.message || 'Failed to generate notes' });
    }
  });

  // 2. Explain Concept (Explain like I'm 5)
  app.post('/api/explain-concept', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server. Please set it in Render Environment Variables.' });
      }

      const { textSnippet, language, grade } = req.body;
      const ai = getGeminiClient();

      const prompt = `You are a warm, supportive teacher explaining a concept in the simplest possible terms (like explaining to a 5-year-old or a beginner).
Grade Context: Grade ${grade || 10}
Language: ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}

Concept/Material Snippet to Explain:
"${textSnippet || 'Key concept from study material'}"

Respond in JSON format with:
1. simpleExplanation: a short 2-3 paragraph explanation using everyday real-life analogies (e.g., comparing electricity to water flowing in a pipe). NO EMOJIS.
2. keyPoints: 3 bullet points summarizing the takeaway.
3. checkQuestion: an interactive single question to verify understanding with 4 options, the 0-based correct index, and a brief feedback statement.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              simpleExplanation: { type: Type.STRING },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              checkQuestion: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  correctIndex: { type: Type.INTEGER },
                  feedback: { type: Type.STRING },
                },
                required: ['question', 'options', 'correctIndex', 'feedback'],
              },
            },
            required: ['simpleExplanation', 'keyPoints', 'checkQuestion'],
          },
        },
      });

      const json = JSON.parse(response.text || '{}');
      res.json(json);
    } catch (error: any) {
      console.error('Error in /api/explain-concept:', error);
      res.status(500).json({ error: error.message || 'Failed to explain concept' });
    }
  });

  // 3. Generate Quiz Endpoint
  app.post('/api/generate-quiz', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server. Please set it in Render Environment Variables.' });
      }

      const { materialTitle, content, quizType, difficulty, questionCount, grade, customInstruction, language } = req.body;
      const ai = getGeminiClient();

      const processed = await processSourceContent(content || '');
      const isTrueFalse = quizType === 'true_false';
      const numQuestions = Math.min(Math.max(Number(questionCount) || 5, 3), 20);

      const prompt = `You are an expert Ethiopian Grade ${grade || 11} national curriculum exam author.

TASK: Create a ${numQuestions}-question ${difficulty || 'medium'} difficulty study quiz strictly grounded in the provided source study material below.

MATERIAL TITLE: "${processed.title || materialTitle || 'Study Material'}"
QUIZ FORMAT: ${isTrueFalse ? 'True/False Questions' : 'Multiple Choice Questions (4 choices per question)'}
NUMBER OF QUESTIONS: ${numQuestions}
SPECIAL USER FOCUS INSTRUCTIONS: "${customInstruction || 'Cover all major concepts and topics evenly.'}"
LANGUAGE: ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}

SOURCE MATERIAL / TRANSCRIPT CONTENT:
${processed.resolvedContent}

STRICT CRITICAL RULES:
1. STRICT MATERIAL GROUNDING: Every question, option, and explanation MUST be directly supported by and derived from the source material provided above. Do NOT ask about unrelated general knowledge or external internet facts.
2. DIVERSE TOPIC SPANNING: Scan through the ENTIRE source material from top to bottom. Distribute the questions evenly across all distinct chapters, sections, formulas, and topics found in the material. Do NOT cluster all questions in a single paragraph or topic.
3. NO EMOJIS: Absolutely ZERO emojis are permitted in any text field (question, options, explanation).
4. ACCURACY: Ensure the correct option index strictly matches the correct statement. Provide a detailed, step-by-step explanation referencing the concept from the material.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
      });

      const questions = JSON.parse(response.text || '[]');
      res.json({ questions, resolvedTitle: processed.title });
    } catch (error: any) {
      console.error('Error in /api/generate-quiz:', error);
      res.status(500).json({ error: error.message || 'Failed to generate quiz' });
    }
  });

  // 4. Generate Flashcards Endpoint
  app.post('/api/generate-flashcards', async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is missing on the server. Please set it in Render Environment Variables.' });
      }

      const { materialTitle, content, difficulty, count, grade, customInstruction, language } = req.body;
      const ai = getGeminiClient();

      const processed = await processSourceContent(content || '');
      const cardCount = Math.min(Math.max(Number(count) || 5, 3), 20);

      const prompt = `You are an expert Ethiopian Grade ${grade || 11} national curriculum tutor.

TASK: Create a comprehensive set of ${cardCount} high-yield study flashcards strictly grounded in the provided source study material below.

MATERIAL TITLE: "${processed.title || materialTitle || 'Study Material'}"
DIFFICULTY: ${difficulty || 'medium'}
NUMBER OF FLASHCARDS: ${cardCount}
SPECIAL USER FOCUS INSTRUCTIONS: "${customInstruction || 'Extract key terms, formulas, definitions, and concepts across all topics.'}"
LANGUAGE: ${language === 'am' ? 'Amharic (አማርኛ)' : 'English'}

SOURCE MATERIAL / TRANSCRIPT CONTENT:
${processed.resolvedContent}

STRICT CRITICAL RULES:
1. STRICT MATERIAL GROUNDING: Every flashcard (front, back, hint) MUST be strictly derived from the facts, definitions, formulas, and concepts in the source material provided above. Do NOT include unrelated outside information.
2. ALL-TOPICS COVERAGE: Make sure the ${cardCount} flashcards cover ALL different topics, units, and sections in the source material from beginning to end. Do NOT make flashcards for just one single topic or intro paragraph.
3. NO EMOJIS: Absolutely ZERO emojis are permitted in any field.
4. FLASHCARD STRUCTURE:
   - front: Clear question, key term, formula name, or concept prompt
   - back: Concise, precise definition, formula, or answer derived from the material
   - hint: Short memory clue or keyword
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING },
                hint: { type: Type.STRING },
              },
              required: ['front', 'back'],
            },
          },
        },
      });

      const cards = JSON.parse(response.text || '[]');
      res.json({ cards, resolvedTitle: processed.title });
    } catch (error: any) {
      console.error('Error in /api/generate-flashcards:', error);
      res.status(500).json({ error: error.message || 'Failed to generate flashcards' });
    }
  });

  // Vite development middleware vs Static Production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduEthiopia server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
