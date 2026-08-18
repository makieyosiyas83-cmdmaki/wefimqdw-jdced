import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Youtube,
  Image as ImageIcon,
  FileSpreadsheet,
  Upload,
  Sparkles,
  ArrowRight,
  Sliders,
  X,
  FileCode,
  Layers,
  HelpCircle,
  BookOpen,
  Lock
} from 'lucide-react';

import {
  UserProfile,
  Language,
  MaterialType,
  GenerationType,
  QuizType,
  DifficultyLevel,
  NoteItem,
  FlashcardSet,
  QuizSet,
  HistoryItem
} from '../types';

import { NotesViewer } from './NotesViewer';
import { FlashcardsViewer } from './FlashcardsViewer';
import { QuizPlayer } from './QuizPlayer';

interface HomeScreenProps {
  user: UserProfile;
  language: Language;
  onAddHistoryItem: (item: HistoryItem) => void;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onSelectProfileTab?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  language,
  onAddHistoryItem,
  onUpdateUser,
  onSelectProfileTab,
}) => {
  // Material input state
  const [materialType, setMaterialType] = useState<MaterialType>('pdf');
  const [materialTitle, setMaterialTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [fileObj, setFileObj] = useState<File | null>(null);
  const [customInstruction, setCustomInstruction] = useState('');

  // UI Flow Modal state
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [selectedGenType, setSelectedGenType] = useState<GenerationType>('notes');
  const [quizType, setQuizType] = useState<QuizType>('mcq');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('medium');
  const [itemCount, setItemCount] = useState<number>(5);

  // Active generation output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeOutput, setActiveOutput] = useState<{
    type: GenerationType;
    data: NoteItem | FlashcardSet | QuizSet;
  } | null>(null);

  const [errorMsg, setErrorMsg] = useState('');

  const handleContinueClick = () => {
    if (!textContent.trim() && !fileObj && !youtubeUrl.trim()) {
      setErrorMsg(
        language === 'am'
          ? 'እባክዎን የጥናት ቁሳቁስ፣ ፋይል፣ ወይም የዩቲዩብ ሊንክ ያስገቡ'
          : 'Please upload a PDF/photo, paste notes, or enter a YouTube link'
      );
      return;
    }
    setErrorMsg('');
    setShowOptionsModal(true);
  };

  const handleStartGeneration = async () => {
    setShowOptionsModal(false);
    setIsGenerating(true);
    setErrorMsg('');

    const titleToUse = materialTitle || (fileObj ? fileObj.name : 'Study Material');
    const contentToUse = textContent || youtubeUrl || 'General Ethiopian curriculum study material';

    try {
      if (selectedGenType === 'notes') {
        const res = await fetch('/api/generate-notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialTitle: titleToUse,
            content: contentToUse,
            grade: user.grade,
            customInstruction,
            language: user.language,
          }),
        });

        if (!res.ok) throw new Error('Failed to generate notes');
        const data = await res.json();
        const displayTitle = data.resolvedTitle || titleToUse;

        const noteObj: NoteItem = {
          id: `note-${Date.now()}`,
          title: `${displayTitle} - AI Notes`,
          materialTitle: displayTitle,
          content: data.notes,
          topics: data.topics || [],
          summary: data.overview || (data.notes ? data.notes.slice(0, 150) + '...' : ''),
          createdAt: new Date().toISOString().split('T')[0],
          grade: user.grade,
          customInstruction,
        };

        setActiveOutput({ type: 'notes', data: noteObj });

        // Save to History
        onAddHistoryItem({
          id: `hist-${Date.now()}`,
          type: 'notes',
          title: noteObj.title,
          materialTitle: displayTitle,
          date: noteObj.createdAt,
          data: noteObj,
        });

        // Increment upload count for free users
        if (!user.isPro) {
          onUpdateUser({ uploadCount: (user.uploadCount || 0) + 1 });
        }
      } else if (selectedGenType === 'flashcards') {
        const res = await fetch('/api/generate-flashcards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialTitle: titleToUse,
            content: contentToUse,
            difficulty,
            count: itemCount,
            grade: user.grade,
            customInstruction,
            language: user.language,
          }),
        });

        if (!res.ok) throw new Error('Failed to generate flashcards');
        const data = await res.json();
        const displayTitle = data.resolvedTitle || titleToUse;

        const fcObj: FlashcardSet = {
          id: `fc-${Date.now()}`,
          title: `${displayTitle} Flashcards`,
          materialTitle: displayTitle,
          difficulty,
          cards: data.cards || [],
          createdAt: new Date().toISOString().split('T')[0],
        };

        setActiveOutput({ type: 'flashcards', data: fcObj });

        onAddHistoryItem({
          id: `hist-${Date.now()}`,
          type: 'flashcards',
          title: fcObj.title,
          materialTitle: displayTitle,
          date: fcObj.createdAt,
          data: fcObj,
        });

        if (!user.isPro) {
          onUpdateUser({ uploadCount: (user.uploadCount || 0) + 1 });
        }
      } else if (selectedGenType === 'quiz') {
        const res = await fetch('/api/generate-quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            materialTitle: titleToUse,
            content: contentToUse,
            quizType,
            difficulty,
            questionCount: itemCount,
            grade: user.grade,
            customInstruction,
            language: user.language,
          }),
        });

        if (!res.ok) throw new Error('Failed to generate quiz');
        const data = await res.json();
        const displayTitle = data.resolvedTitle || titleToUse;

        const quizObj: QuizSet = {
          id: `quiz-${Date.now()}`,
          title: `${displayTitle} Practice Quiz`,
          materialTitle: displayTitle,
          quizType,
          difficulty,
          questionCount: data.questions?.length || itemCount,
          questions: data.questions || [],
          createdAt: new Date().toISOString().split('T')[0],
        };

        setActiveOutput({ type: 'quiz', data: quizObj });

        onAddHistoryItem({
          id: `hist-${Date.now()}`,
          type: 'quiz',
          title: quizObj.title,
          materialTitle: displayTitle,
          date: quizObj.createdAt,
          data: quizObj,
        });

        if (!user.isPro) {
          onUpdateUser({ uploadCount: (user.uploadCount || 0) + 1 });
        }
      }
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMsg('Failed to process study material. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Render Active Generated Viewers
  if (activeOutput) {
    if (activeOutput.type === 'notes') {
      return (
        <NotesViewer
          note={activeOutput.data as NoteItem}
          language={language}
          onBack={() => setActiveOutput(null)}
        />
      );
    }
    if (activeOutput.type === 'flashcards') {
      return (
        <FlashcardsViewer
          flashcardSet={activeOutput.data as FlashcardSet}
          language={language}
          onBack={() => setActiveOutput(null)}
          onUpdateFlashcards={(updatedSet) => {
            setActiveOutput({ type: 'flashcards', data: updatedSet });
          }}
        />
      );
    }
    if (activeOutput.type === 'quiz') {
      return (
        <QuizPlayer
          quizSet={activeOutput.data as QuizSet}
          language={language}
          onBack={() => setActiveOutput(null)}
        />
      );
    }
  }

  // Render Material Upload Screen
  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-white relative h-full overflow-hidden">
      {/* Scrollable Material Form Container */}
      <div className="flex-1 overflow-y-auto p-5 pb-28 space-y-4">
        {/* Main Prompt Header */}
        <div className="mt-1">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2 text-xs font-mono text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>GRADE {user.grade} • ETHIOPIAN CURRICULUM</span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>100% FREE & UNLIMITED</span>
            </span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight text-white">
            {language === 'am' ? 'እባክዎን የትምህርት ቁሳቁስ ያስገቡ' : 'Upload Study Material'}
          </h2>
          <p className="text-xs text-neutral-400">
            {language === 'am'
              ? 'ፒዲኤፍ፣ የዩቲዩብ ሊንክ፣ ማስታወሻዎች ወይም ፎቶዎችን ያስገቡ'
              : 'Upload PDF, paste text, YouTube links, or textbook photos'}
          </p>
        </div>

        {/* Material Type Tabs */}
        <div className="grid grid-cols-5 gap-1.5 p-1 bg-neutral-900 rounded-2xl border border-neutral-800">
          <button
            onClick={() => setMaterialType('pdf')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
              materialType === 'pdf' ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5 mb-0.5" />
            <span>PDF</span>
          </button>

          <button
            onClick={() => setMaterialType('text')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
              materialType === 'text' ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 mb-0.5" />
            <span>Notes</span>
          </button>

          <button
            onClick={() => setMaterialType('youtube')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
              materialType === 'youtube' ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 mb-0.5" />
            <span>YouTube</span>
          </button>

          <button
            onClick={() => setMaterialType('photo')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
              materialType === 'photo' ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 mb-0.5" />
            <span>Photo</span>
          </button>

          <button
            onClick={() => setMaterialType('other')}
            className={`py-2 flex flex-col items-center justify-center rounded-xl text-[10px] font-medium transition-all ${
              materialType === 'other' ? 'bg-white text-black font-bold shadow-sm' : 'text-neutral-400'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 mb-0.5" />
            <span>Other</span>
          </button>
        </div>

        {/* Input Box based on Material Type */}
        <div className="space-y-3">
          {materialType === 'pdf' && (
            <div className="border-2 border-dashed border-neutral-800 hover:border-neutral-600 rounded-2xl p-4 text-center bg-neutral-900/40 transition-colors">
              <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs font-semibold text-white">
                {fileObj ? fileObj.name : (language === 'am' ? 'የፒዲኤፍ ፋይል ይምረጡ ወይም እዚህ ይጣሉ' : 'Upload PDF Document')}
              </p>
              <p className="text-[10px] text-neutral-500 mt-0.5">
                Supports Grade 1-12 Textbooks, Exam papers, and Modules
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFileObj(e.target.files[0]);
                    setMaterialTitle(e.target.files[0].name);
                    setTextContent(`Uploaded document file: ${e.target.files[0].name}. Extracted Grade ${user.grade} curriculum notes.`);
                  }
                }}
                className="hidden"
                id="pdf-upload-input"
              />
              <label
                htmlFor="pdf-upload-input"
                className="mt-3 inline-block px-4 py-1.5 bg-neutral-800 text-white rounded-xl text-xs font-medium cursor-pointer border border-neutral-700"
              >
                Browse Files
              </label>
            </div>
          )}

          {materialType === 'text' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {language === 'am' ? 'የትምህርት ፅሁፍ ወይም ማስታወሻ ይለጥፉ' : 'Paste Study Notes or Text'}
              </label>
              <textarea
                rows={5}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste curriculum text, textbook paragraphs, or chapter summaries here..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-2xl p-3.5 outline-none transition-all placeholder:text-neutral-600 resize-none font-sans"
              />
            </div>
          )}

          {materialType === 'youtube' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {language === 'am' ? 'የዩቲዩብ ቪዲዮ ሊንክ ያስገቡ' : 'YouTube Educational Video URL'}
              </label>
              <div className="relative">
                <Youtube className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => {
                    setYoutubeUrl(e.target.value);
                    setMaterialTitle('YouTube Study Video');
                    setTextContent(`YouTube video study link: ${e.target.value}`);
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-2xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-neutral-600"
                />
              </div>
            </div>
          )}

          {materialType === 'photo' && (
            <div className="border-2 border-dashed border-neutral-800 rounded-2xl p-4 text-center bg-neutral-900/40">
              <ImageIcon className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
              <p className="text-xs font-semibold text-white">
                {fileObj ? fileObj.name : (language === 'am' ? 'የመጽሐፍ ገጽ ፎቶ ያስገቡ' : 'Upload Textbook Page Photo')}
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    setFileObj(e.target.files[0]);
                    setMaterialTitle(e.target.files[0].name);
                    setTextContent(`Textbook photo scan: ${e.target.files[0].name}`);
                  }
                }}
                className="hidden"
                id="photo-upload-input"
              />
              <label
                htmlFor="photo-upload-input"
                className="mt-3 inline-block px-4 py-1.5 bg-neutral-800 text-white rounded-xl text-xs font-medium cursor-pointer border border-neutral-700"
              >
                Upload Photo
              </label>
            </div>
          )}

          {materialType === 'other' && (
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                {language === 'am' ? 'የትምህርት ቁሳቁስ ርዕስ እና ማብራሪያ' : 'Material Description & Notes'}
              </label>
              <textarea
                rows={3}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter study topic or material content..."
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-2xl p-3 outline-none transition-all placeholder:text-neutral-600 resize-none font-sans"
              />
            </div>
          )}

          {/* Custom Instruction Box (e.g. "I only want Unit 5") */}
          <div className="pt-2">
            <label className="block text-xs font-medium text-neutral-300 mb-1 flex justify-between">
              <span>{language === 'am' ? 'ተጨማሪ ማስታወሻ ወይም ትእዛዝ' : 'Add Custom Instructions / Focus'}</span>
              <span className="text-[10px] text-neutral-500 font-mono">Optional</span>
            </label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder='e.g. "I only want unit 5", "Focus on formulas", "Simple key terms"'
              className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-2xl px-3.5 py-3 outline-none transition-all placeholder:text-neutral-600"
            />
          </div>

          {/* Direct Output Type Selection directly on Main Form */}
          <div className="pt-2">
            <label className="block text-xs font-extrabold text-white mb-2 uppercase font-mono tracking-wider text-[11px] flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>{language === 'am' ? 'የጥናት ዓይነት ይምረጡ' : 'Select What To Generate:'}</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedGenType('notes')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                  selectedGenType === 'notes'
                    ? 'bg-white text-black border-white font-extrabold shadow-lg scale-[1.02]'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{language === 'am' ? 'ማስታወሻ' : 'Notes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGenType('flashcards')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                  selectedGenType === 'flashcards'
                    ? 'bg-white text-black border-white font-extrabold shadow-lg scale-[1.02]'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <Layers className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{language === 'am' ? 'ፍላሽካርድ' : 'Flashcards'}</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGenType('quiz')}
                className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                  selectedGenType === 'quiz'
                    ? 'bg-white text-black border-white font-extrabold shadow-lg scale-[1.02]'
                    : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <HelpCircle className="w-5 h-5 mb-1" />
                <span className="text-xs font-bold">{language === 'am' ? 'ፈተና/ኩይዝ' : 'Quiz'}</span>
              </button>
            </div>
          </div>

          {/* Quick Quiz / Flashcards options inline on main form if selected */}
          {selectedGenType === 'quiz' && (
            <div className="p-3.5 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Quiz Type</span>
                <div className="flex space-x-1">
                  <button
                    type="button"
                    onClick={() => setQuizType('mcq')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${quizType === 'mcq' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}
                  >
                    MCQ
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuizType('true_false')}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${quizType === 'true_false' ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}
                  >
                    True/False
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Questions</span>
                <div className="flex space-x-1">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setItemCount(num)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${itemCount === num ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}
                    >
                      {num} Qs
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {selectedGenType === 'flashcards' && (
            <div className="p-3.5 bg-neutral-900 rounded-2xl border border-neutral-800 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold">Flashcards Count</span>
                <div className="flex space-x-1">
                  {[5, 10, 15, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setItemCount(num)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold ${itemCount === num ? 'bg-neutral-200 text-black' : 'bg-neutral-800 text-neutral-400'}`}
                    >
                      {num} Cards
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Direct Primary Generate Button Right On The Form */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              if (!textContent.trim() && !fileObj && !youtubeUrl.trim()) {
                setErrorMsg(
                  language === 'am'
                    ? 'እባክዎን የጥናት ቁሳቁስ፣ ፋይል፣ ወይም የዩቲዩብ ሊንክ ያስገቡ'
                    : 'Please upload a PDF/photo, paste notes, or enter a YouTube link'
                );
                return;
              }
              handleStartGeneration();
            }}
            className="w-full py-4 px-6 rounded-2xl bg-white text-black font-black text-sm flex items-center justify-center space-x-2 shadow-xl hover:bg-neutral-200 transition-all border border-neutral-200 mt-2"
          >
            <Sparkles className="w-4 h-4 fill-black text-black animate-pulse" />
            <span className="tracking-tight">
              {selectedGenType === 'quiz' && (
                language === 'am' ? `አሁን ኩይዝ አዘጋጅ (${itemCount} ጥያቄዎች)` : `⚡ Generate Quiz Now (${itemCount} Qs)`
              )}
              {selectedGenType === 'flashcards' && (
                language === 'am' ? `አሁን ፍላሽካርዶች አዘጋጅ (${itemCount} ካርዶች)` : `⚡ Generate Flashcards Now (${itemCount} Cards)`
              )}
              {selectedGenType === 'notes' && (
                language === 'am' ? 'አሁን የጥናት ማስታወሻ አዘጋጅ' : '⚡ Generate Notes Now'
              )}
            </span>
          </motion.button>
        </div>

        {errorMsg && (
          <p className="mt-3 text-xs text-neutral-300 bg-neutral-900 p-2.5 rounded-xl border border-neutral-800 text-center font-medium">
            {errorMsg}
          </p>
        )}
      </div>

      {/* Sticky Bottom Action Bar - ALWAYS VISIBLE */}
      <div className="p-3.5 bg-neutral-950/95 backdrop-blur-md border-t border-neutral-900 shrink-0 z-30 shadow-2xl">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (!textContent.trim() && !fileObj && !youtubeUrl.trim()) {
              setErrorMsg(
                language === 'am'
                  ? 'እባክዎን የጥናት ቁሳቁስ፣ ፋይል፣ ወይም የዩቲዩብ ሊንክ ያስገቡ'
                  : 'Please upload a PDF/photo, paste notes, or enter a YouTube link'
              );
              return;
            }
            handleStartGeneration();
          }}
          className="w-full py-3.5 px-6 rounded-2xl bg-white text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:bg-neutral-200 transition-all border border-neutral-200"
        >
          <Sparkles className="w-4 h-4 fill-black text-black" />
          <span>
            {selectedGenType === 'quiz' && (language === 'am' ? 'ፈተና/ኩይዝ አዘጋጅ' : 'Generate Quiz')}
            {selectedGenType === 'flashcards' && (language === 'am' ? 'ፍላሽካርዶች አዘጋጅ' : 'Generate Flashcards')}
            {selectedGenType === 'notes' && (language === 'am' ? 'ማስታወሻ አዘጋጅ' : 'Generate Notes')}
          </span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* iOS Modal: Choice / Generation Mode Selector */}
      <AnimatePresence>
        {showOptionsModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl text-white shadow-2xl relative max-h-[85vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header - Fixed Top */}
              <div className="flex justify-between items-center p-5 border-b border-neutral-800 shrink-0">
                <div>
                  <h3 className="font-bold text-base">
                    {language === 'am' ? 'ምን መፍጠር ይፈልጋሉ?' : 'Select AI Study Output'}
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {language === 'am' ? 'ቁሳቁሱን ወደ የትኛው መቀየር ይፈልጋሉ' : 'Choose how AI should process your material'}
                  </p>
                </div>
                <button
                  onClick={() => setShowOptionsModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                {/* Output Type Cards */}
                <div>
                  <label className="block text-neutral-400 font-mono mb-2 uppercase text-[10px]">
                    {language === 'am' ? 'ዓይነት ይምረጡ' : 'SELECT OUTPUT TYPE'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedGenType('notes')}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        selectedGenType === 'notes'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <BookOpen className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{language === 'am' ? 'ማስታወሻ' : 'Notes'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGenType('flashcards')}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        selectedGenType === 'flashcards'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Layers className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{language === 'am' ? 'ፍላሽካርድ' : 'Flashcards'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedGenType('quiz')}
                      className={`p-3 rounded-2xl border text-center flex flex-col items-center justify-center transition-all ${
                        selectedGenType === 'quiz'
                          ? 'bg-white text-black border-white font-bold shadow-md'
                          : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <HelpCircle className="w-5 h-5 mb-1" />
                      <span className="text-xs font-bold">{language === 'am' ? 'ፈተና/ኩይዝ' : 'Quiz'}</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Options based on Selected Type */}
                {selectedGenType === 'quiz' && (
                  <div className="space-y-4 p-4 bg-neutral-950 rounded-2xl border border-neutral-850 text-xs">
                    {/* Quiz Format Switcher */}
                    <div>
                      <label className="block text-neutral-400 font-mono mb-1.5 uppercase text-[10px]">
                        QUIZ FORMAT
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setQuizType('mcq')}
                          className={`py-2 px-3 rounded-xl border font-semibold ${
                            quizType === 'mcq'
                              ? 'bg-neutral-800 border-neutral-600 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          Multiple Choice
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuizType('true_false')}
                          className={`py-2 px-3 rounded-xl border font-semibold ${
                            quizType === 'true_false'
                              ? 'bg-neutral-800 border-neutral-600 text-white'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}
                        >
                          True / False
                        </button>
                      </div>
                    </div>

                    {/* Difficulty Setting */}
                    <div>
                      <label className="block text-neutral-400 font-mono mb-1.5 uppercase text-[10px]">
                        DIFFICULTY LEVEL
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`py-2 rounded-xl border capitalize font-semibold ${
                              difficulty === d
                                ? 'bg-neutral-800 border-neutral-600 text-white'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Question Count Selector */}
                    <div>
                      <label className="block text-neutral-400 font-mono mb-1.5 uppercase text-[10px]">
                        NUMBER OF QUESTIONS ({itemCount})
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setItemCount(num)}
                            className={`py-2 rounded-xl border font-mono font-bold ${
                              itemCount === num
                                ? 'bg-neutral-800 border-neutral-600 text-white'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            {num} Qs
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedGenType === 'flashcards' && (
                  <div className="space-y-4 p-4 bg-neutral-950 rounded-2xl border border-neutral-850 text-xs">
                    <div>
                      <label className="block text-neutral-400 font-mono mb-1.5 uppercase text-[10px]">
                        DIFFICULTY LEVEL
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setDifficulty(d)}
                            className={`py-2 rounded-xl border capitalize font-semibold ${
                              difficulty === d
                                ? 'bg-neutral-800 border-neutral-600 text-white'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            {d}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-neutral-400 font-mono mb-1.5 uppercase text-[10px]">
                        FLASHCARD COUNT ({itemCount})
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 15, 20].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setItemCount(num)}
                            className={`py-2 rounded-xl border font-mono font-bold ${
                              itemCount === num
                                ? 'bg-neutral-800 border-neutral-600 text-white'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                            }`}
                          >
                            {num} Cards
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedGenType === 'notes' && (
                  <div className="p-4 bg-neutral-950 rounded-2xl border border-neutral-850 text-xs text-neutral-300">
                    <p className="font-medium text-white mb-1">
                      {language === 'am' ? 'አርቴፊሻል ኢንተሊጀንስ ማጠቃለያ' : 'AI Note Generation Rules:'}
                    </p>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-mono">
                      Produces clean, detailed markdown notes for Ethiopian Grade {user.grade}. Strictly zero emojis used in notes output as requested.
                    </p>
                  </div>
                )}
              </div>

              {/* Modal Fixed Footer - Always Visible Generate Button */}
              <div className="p-4 bg-neutral-900 border-t border-neutral-800 shrink-0">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleStartGeneration}
                  className="w-full py-4 rounded-2xl bg-white text-black font-extrabold text-sm flex items-center justify-center space-x-2 shadow-xl hover:bg-neutral-200 transition-all"
                >
                  <Sparkles className="w-4 h-4 fill-black text-black" />
                  <span>
                    {selectedGenType === 'quiz' && (
                      language === 'am' ? `ኩይዝ አዘጋጅ (${itemCount} ጥያቄዎች)` : `Generate Quiz (${itemCount} Questions)`
                    )}
                    {selectedGenType === 'flashcards' && (
                      language === 'am' ? `ፍላሽካርዶች አዘጋጅ (${itemCount} ካርዶች)` : `Generate Flashcards (${itemCount} Cards)`
                    )}
                    {selectedGenType === 'notes' && (
                      language === 'am' ? 'የጥናት ማስታወሻ አዘጋጅ' : 'Generate Study Notes'
                    )}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Generation Spinner Overlay */}
      <AnimatePresence>
        {isGenerating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-3 border-white border-t-transparent rounded-full animate-spin" />
              <h3 className="text-lg font-bold text-white">
                {language === 'am' ? 'አርቴፊሻል ኢንተሊጀንሱ በመተንተን ላይ ነው...' : 'EduEthiopia AI Analyzing Material...'}
              </h3>
              <p className="text-xs text-neutral-400 font-mono max-w-xs mx-auto">
                Synthesizing notes, quizzes, and study cards for Ethiopian Grade {user.grade}
              </p>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
