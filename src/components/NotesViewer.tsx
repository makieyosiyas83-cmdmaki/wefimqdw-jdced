import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NoteItem, Language, NoteTopic, ExplanationResponse } from '../types';
import { Copy, Sparkles, Check, HelpCircle, X, ChevronRight, ThumbsUp, ThumbsDown, BookOpen, Layers, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

interface NotesViewerProps {
  note: NoteItem;
  language: Language;
  onBack: () => void;
}

export const NotesViewer: React.FC<NotesViewerProps> = ({ note, language, onBack }) => {
  const [copied, setCopied] = useState(false);
  const [showExplanationModal, setShowExplanationModal] = useState(false);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explanationData, setExplanationData] = useState<ExplanationResponse | null>(null);

  // Interactive Check Question State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submittedAnswer, setSubmittedAnswer] = useState(false);
  const [likedExplanation, setLikedExplanation] = useState<boolean | null>(null);

  // Ensure topics array is available (parse content if legacy note)
  const topics: NoteTopic[] = useMemo(() => {
    if (note.topics && note.topics.length > 0) {
      return note.topics;
    }

    // Fallback parser for legacy notes or unstructured raw markdown
    const rawParagraphs = note.content.split(/\n(?=### |## |# )/g);
    if (rawParagraphs.length > 1) {
      return rawParagraphs.map((block, idx) => {
        const lines = block.trim().split('\n');
        const headerLine = lines[0] || `Topic ${idx + 1}`;
        const title = headerLine.replace(/^#+\s*/, '').replace(/\*/g, '');
        const bodyLines = lines.slice(1).join('\n');

        // Extract key points from bullet points
        const keyPoints = bodyLines
          .split('\n')
          .filter(l => l.trim().startsWith('- ') || l.trim().startsWith('* '))
          .map(l => l.replace(/^[-*]\s*/, '').trim())
          .slice(0, 4);

        return {
          id: `topic-${idx + 1}`,
          title: title.startsWith('Topic') ? title : `Topic ${idx + 1}: ${title}`,
          summary: bodyLines.slice(0, 140).replace(/[*#\n]/g, ' ') + '...',
          keyPoints: keyPoints.length > 0 ? keyPoints : ['Review source material and detailed notes below.'],
          details: bodyLines || block,
        };
      });
    }

    // Default single topic fallback
    return [
      {
        id: 'topic-1',
        title: 'Topic 1: Core Content',
        summary: note.summary || 'Main material notes',
        keyPoints: ['Exclusively extracted from source material.'],
        details: note.content,
      },
    ];
  }, [note]);

  // Active topic state ('overview' | topic.id | 'all')
  const [activeTopicId, setActiveTopicId] = useState<string>(
    topics.length > 0 ? topics[0].id : 'overview'
  );

  const activeTopicIndex = useMemo(() => {
    return topics.findIndex(t => t.id === activeTopicId);
  }, [topics, activeTopicId]);

  const activeTopic = useMemo(() => {
    return topics.find(t => t.id === activeTopicId) || topics[0];
  }, [topics, activeTopicId]);

  const handleCopy = () => {
    const textToCopy = activeTopicId === 'all' 
      ? note.content 
      : `${activeTopic.title}\n\nSummary:\n${activeTopic.summary}\n\nKey Takeaways:\n${activeTopic.keyPoints.map(k => `- ${k}`).join('\n')}\n\nNotes:\n${activeTopic.details}`;
    
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFetchExplanation = async () => {
    setShowExplanationModal(true);
    if (explanationData) return; // cache

    setExplainLoading(true);
    try {
      const textToExplain = activeTopic ? activeTopic.details : note.content.slice(0, 1500);
      const res = await fetch('/api/explain-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textSnippet: textToExplain,
          language,
          grade: note.grade,
        }),
      });
      const data = await res.json();
      setExplanationData(data);
    } catch (err) {
      console.error('Failed to get simple explanation:', err);
    } finally {
      setExplainLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-white p-4 sm:p-6 overflow-y-auto min-h-0">
      {/* Top Header Controls */}
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-900 shrink-0">
        <button
          onClick={onBack}
          className="text-xs font-semibold text-neutral-300 hover:text-white px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 transition-colors flex items-center space-x-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{language === 'am' ? 'ተመለስ' : 'Back to Upload'}</span>
        </button>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
            title="Copy Current Topic Notes"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? (language === 'am' ? 'ተቀድቷል' : 'Copied!') : (language === 'am' ? 'ቅዳ' : 'Copy')}</span>
          </button>

          <button
            onClick={handleFetchExplanation}
            className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-extrabold flex items-center space-x-1.5 shadow-md hover:bg-neutral-200 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 fill-black text-black" />
            <span>{language === 'am' ? 'በቀላል ሁኔታ አስረዳኝ' : 'Explain Concept (ELI5)'}</span>
          </button>
        </div>
      </div>

      {/* Note Title & Material Metadata */}
      <div className="mb-4 bg-neutral-900/70 p-4 rounded-2xl border border-neutral-800 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono">
            <span className="px-2 py-0.5 rounded-full bg-neutral-800 border border-neutral-700 text-white font-semibold">
              Grade {note.grade}
            </span>
            <span>•</span>
            <span className="truncate max-w-[180px]">{note.materialTitle}</span>
          </div>

          <div className="flex items-center space-x-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>100% Grounded in Material</span>
          </div>
        </div>

        <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{note.title}</h2>
        {note.customInstruction && (
          <p className="text-xs text-neutral-400 mt-1 font-mono italic">
            Focus: "{note.customInstruction}"
          </p>
        )}
      </div>

      {/* Interactive Topics Tab Bar */}
      <div className="mb-5 shrink-0">
        <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-400 mb-2">
          <Layers className="w-3.5 h-3.5 text-white" />
          <span>{language === 'am' ? 'ርዕሶች (ክሊክ በማድረግ ይመልከቱ)' : 'Select Topic to Study:'}</span>
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {topics.map((tp, idx) => {
            const isActive = activeTopicId === tp.id;
            return (
              <button
                key={tp.id}
                onClick={() => setActiveTopicId(tp.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 border shrink-0 ${
                  isActive
                    ? 'bg-white text-black border-white shadow-md'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-mono font-bold ${
                  isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'
                }`}>
                  {idx + 1}
                </span>
                <span className="truncate max-w-[150px]">{tp.title.replace(/^Topic \d+:\s*/i, '')}</span>
              </button>
            );
          })}

          <button
            onClick={() => setActiveTopicId('all')}
            className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
              activeTopicId === 'all'
                ? 'bg-white text-black border-white shadow-md'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            All Notes
          </button>
        </div>
      </div>

      {/* Active Topic Content Card */}
      {activeTopicId === 'all' ? (
        /* Render Full Markdown Notes */
        <div className="prose prose-invert max-w-none text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-3 font-sans pb-10">
          {note.content.split('\n\n').map((paragraph, idx) => {
            if (paragraph.startsWith('### ')) {
              return (
                <h3 key={idx} className="text-base font-bold text-white mt-4 mb-2 border-b border-neutral-800 pb-1">
                  {paragraph.replace('### ', '')}
                </h3>
              );
            }
            if (paragraph.startsWith('#### ')) {
              return (
                <h4 key={idx} className="text-sm font-semibold text-neutral-200 mt-3 mb-1">
                  {paragraph.replace('#### ', '')}
                </h4>
              );
            }
            if (paragraph.startsWith('- ')) {
              return (
                <ul key={idx} className="list-disc list-inside space-y-1 text-neutral-300 my-2 pl-2">
                  {paragraph.split('\n').map((li, lidx) => (
                    <li key={lidx}>{li.replace(/^- /, '')}</li>
                  ))}
                </ul>
              );
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>
      ) : activeTopic ? (
        /* Render Selected Topic Card */
        <div className="flex-1 flex flex-col space-y-4 pb-12">
          {/* Topic Title & Summary Box */}
          <div className="bg-neutral-900 p-4 rounded-2xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider">
                Topic {activeTopicIndex + 1} of {topics.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">{activeTopic.title}</h3>
            {activeTopic.summary && (
              <p className="text-xs text-neutral-300 bg-neutral-950/80 p-3 rounded-xl border border-neutral-850 leading-relaxed">
                {activeTopic.summary}
              </p>
            )}
          </div>

          {/* Key Takeaways Box */}
          {activeTopic.keyPoints && activeTopic.keyPoints.length > 0 && (
            <div className="bg-neutral-900/60 p-4 rounded-2xl border border-neutral-850 space-y-2">
              <h4 className="text-[10px] font-mono font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5 text-white" />
                <span>{language === 'am' ? 'ዋና ዋና ነጥቦች' : 'Key Takeaways'}</span>
              </h4>
              <div className="space-y-1.5">
                {activeTopic.keyPoints.map((kp, kidx) => (
                  <div key={kidx} className="flex items-start space-x-2 text-xs text-neutral-200 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800">
                    <span className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center font-mono text-[10px] shrink-0 mt-0.5">
                      ✓
                    </span>
                    <span className="leading-snug">{kp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Topic Detailed Notes */}
          <div className="bg-neutral-900/30 p-4 rounded-2xl border border-neutral-850 prose prose-invert max-w-none text-xs sm:text-sm text-neutral-200 leading-relaxed space-y-3 font-sans">
            {activeTopic.details.split('\n\n').map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-sm font-bold text-white mt-3 mb-1 border-b border-neutral-800 pb-1">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('#### ')) {
                return (
                  <h4 key={idx} className="text-xs font-semibold text-neutral-200 mt-2 mb-1">
                    {paragraph.replace('#### ', '')}
                  </h4>
                );
              }
              if (paragraph.startsWith('- ')) {
                return (
                  <ul key={idx} className="list-disc list-inside space-y-1 text-neutral-300 my-2 pl-2">
                    {paragraph.split('\n').map((li, lidx) => (
                      <li key={lidx}>{li.replace(/^- /, '')}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={idx}>{paragraph}</p>;
            })}
          </div>

          {/* Interactive Topic Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-900">
            <button
              disabled={activeTopicIndex <= 0}
              onClick={() => {
                if (activeTopicIndex > 0) {
                  setActiveTopicId(topics[activeTopicIndex - 1].id);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-300 disabled:opacity-30 disabled:cursor-not-allowed hover:text-white flex items-center space-x-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ቀደመው ርዕስ' : 'Previous Topic'}</span>
            </button>

            <span className="text-[10px] font-mono text-neutral-500">
              {activeTopicIndex + 1} / {topics.length}
            </span>

            <button
              disabled={activeTopicIndex >= topics.length - 1}
              onClick={() => {
                if (activeTopicIndex < topics.length - 1) {
                  setActiveTopicId(topics[activeTopicIndex + 1].id);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-white text-black text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-200 flex items-center space-x-1.5 transition-all shadow-md"
            >
              <span>{language === 'am' ? 'ቀጣዩ ርዕስ' : 'Next Topic'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* iOS Modal: Explain Like I'm 5 Explanation */}
      <AnimatePresence>
        {showExplanationModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto text-white shadow-2xl relative"
            >
              {/* Modal Close Button */}
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
                    5
                  </div>
                  <h3 className="font-bold text-sm">
                    {language === 'am' ? 'በቀላል መንገድ ማብራሪያ' : 'Simple Concept Breakdown (ELI5)'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowExplanationModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {explainLoading ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-8 h-8 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-neutral-400 font-mono">
                    {language === 'am' ? 'ማብራሪያ በመዘጋጀት ላይ ነው...' : 'Generating simple topic breakdown...'}
                  </p>
                </div>
              ) : explanationData ? (
                <div className="space-y-4 text-xs">
                  {/* Simple Explanation Paragraph */}
                  <div className="bg-black/60 p-4 rounded-2xl border border-neutral-800 leading-relaxed text-neutral-200">
                    <p className="whitespace-pre-line">{explanationData.simpleExplanation}</p>
                  </div>

                  {/* Takeaway Key Points */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-neutral-300 uppercase tracking-wider text-[10px] font-mono">
                      {language === 'am' ? 'ዋና ዋና ነጥቦች' : 'KEY TAKEAWAYS'}
                    </h4>
                    <div className="space-y-1.5">
                      {explanationData.keyPoints.map((pt, i) => (
                        <div key={i} className="flex items-start space-x-2 bg-neutral-950 p-2.5 rounded-xl border border-neutral-850">
                          <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                          <span className="text-neutral-300">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Check Question */}
                  {explanationData.checkQuestion && (
                    <div className="mt-4 p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center space-x-2 text-white font-semibold">
                        <HelpCircle className="w-4 h-4 text-neutral-300" />
                        <span>{language === 'am' ? 'መገንዘቦን ያረጋግጡ' : 'Quick Topic Quiz'}</span>
                      </div>
                      <p className="text-neutral-300 font-medium">{explanationData.checkQuestion.question}</p>

                      <div className="space-y-2">
                        {explanationData.checkQuestion.options.map((opt, oidx) => {
                          const isSelected = selectedOption === oidx;
                          const isCorrect = oidx === explanationData.checkQuestion.correctIndex;
                          let btnStyle = 'bg-neutral-900 border-neutral-800 text-neutral-300';

                          if (submittedAnswer) {
                            if (isCorrect) btnStyle = 'bg-white text-black font-bold border-white';
                            else if (isSelected) btnStyle = 'bg-neutral-900 border-neutral-600 text-neutral-400 line-through';
                          } else if (isSelected) {
                            btnStyle = 'bg-white text-black font-semibold border-white';
                          }

                          return (
                            <button
                              key={oidx}
                              disabled={submittedAnswer}
                              onClick={() => setSelectedOption(oidx)}
                              className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${btnStyle}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>

                      {!submittedAnswer ? (
                        <button
                          disabled={selectedOption === null}
                          onClick={() => setSubmittedAnswer(true)}
                          className="w-full mt-2 py-2.5 rounded-xl bg-white text-black font-bold text-xs disabled:opacity-40"
                        >
                          {language === 'am' ? 'መልስ ያረጋግጡ' : 'Submit Answer'}
                        </button>
                      ) : (
                        <div className="p-3 bg-neutral-900 rounded-xl border border-neutral-800 text-neutral-300 space-y-2">
                          <p className="font-mono text-[11px] text-white">
                            {explanationData.checkQuestion.feedback}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-neutral-800 text-[11px]">
                            <span className="text-neutral-400">Did this help you understand?</span>
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setLikedExplanation(true)}
                                className={`p-1.5 rounded-lg border ${likedExplanation === true ? 'bg-white text-black' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setLikedExplanation(false)}
                                className={`p-1.5 rounded-lg border ${likedExplanation === false ? 'bg-white text-black' : 'bg-neutral-800 border-neutral-700 text-neutral-300'}`}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
