import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  HistoryItem,
  Language,
  GenerationType,
  NoteItem,
  FlashcardSet,
  QuizSet
} from '../types';
import { Search, BookOpen, Layers, HelpCircle, Trash2, Calendar, ChevronRight } from 'lucide-react';

import { NotesViewer } from './NotesViewer';
import { FlashcardsViewer } from './FlashcardsViewer';
import { QuizPlayer } from './QuizPlayer';

interface HistoryScreenProps {
  history: HistoryItem[];
  language: Language;
  onDeleteHistoryItem: (id: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ history, language, onDeleteHistoryItem }) => {
  const [filter, setFilter] = useState<GenerationType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<HistoryItem | null>(null);

  const filteredHistory = history.filter((item) => {
    const matchesFilter = filter === 'all' || item.type === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.materialTitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (activeItem) {
    if (activeItem.type === 'notes') {
      return (
        <NotesViewer
          note={activeItem.data as NoteItem}
          language={language}
          onBack={() => setActiveItem(null)}
        />
      );
    }
    if (activeItem.type === 'flashcards') {
      return (
        <FlashcardsViewer
          flashcardSet={activeItem.data as FlashcardSet}
          language={language}
          onBack={() => setActiveItem(null)}
          onUpdateFlashcards={(updatedSet) => {
            setActiveItem({
              ...activeItem,
              data: updatedSet,
            });
          }}
        />
      );
    }
    if (activeItem.type === 'quiz') {
      return (
        <QuizPlayer
          quizSet={activeItem.data as QuizSet}
          language={language}
          onBack={() => setActiveItem(null)}
        />
      );
    }
  }

  return (
    <div className="flex-1 flex flex-col p-5 bg-neutral-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-extrabold tracking-tight text-white">
          {language === 'am' ? 'የጥናት ታሪክ' : 'Study History'}
        </h2>
        <p className="text-xs text-neutral-400">
          {language === 'am' ? 'ያለፉ ማስታወሻዎች፣ ፈተናዎች እና ፍላሽካርዶች' : 'Access your previously generated study materials'}
        </p>
      </div>

      {/* Search Input */}
      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={language === 'am' ? 'በታሪክ ውስጥ ፈልግ...' : 'Search past notes, quizzes...'}
          className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-2xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-neutral-600"
        />
      </div>

      {/* Category Filter Pills */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-1 scrollbar-none font-mono text-[11px]">
        {(['all', 'notes', 'quiz', 'flashcards'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-xl border capitalize whitespace-nowrap transition-all ${
              filter === cat
                ? 'bg-white text-black font-bold border-white shadow-sm'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
            }`}
          >
            {cat === 'all' && (language === 'am' ? 'ሁሉም' : 'All')}
            {cat === 'notes' && (language === 'am' ? 'ማስታወሻዎች' : 'Notes')}
            {cat === 'quiz' && (language === 'am' ? 'ፈተናዎች' : 'Quizzes')}
            {cat === 'flashcards' && (language === 'am' ? 'ፍላሽካርዶች' : 'Flashcards')}
          </button>
        ))}
      </div>

      {/* History Items List */}
      <div className="space-y-3 flex-1 pb-6">
        {filteredHistory.length === 0 ? (
          <div className="py-12 text-center text-neutral-500 border border-dashed border-neutral-850 rounded-3xl p-6">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-neutral-600" />
            <p className="text-xs font-semibold text-neutral-400">
              {language === 'am' ? 'ምንም የታሪክ መረጃ አልተገኘም' : 'No study history items found'}
            </p>
            <p className="text-[11px] text-neutral-600 mt-1">
              Generate notes or quizzes on the home screen to save them here.
            </p>
          </div>
        ) : (
          filteredHistory.map((item) => (
            <motion.div
              key={item.id}
              whileTap={{ scale: 0.98 }}
              className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-all flex items-center justify-between group cursor-pointer"
              onClick={() => setActiveItem(item)}
            >
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center shrink-0">
                  {item.type === 'notes' && <BookOpen className="w-5 h-5 text-white" />}
                  {item.type === 'quiz' && <HelpCircle className="w-5 h-5 text-white" />}
                  {item.type === 'flashcards' && <Layers className="w-5 h-5 text-white" />}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-white truncate group-hover:text-neutral-200">
                    {item.title}
                  </h4>
                  <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono mt-0.5">
                    <span className="truncate">{item.materialTitle}</span>
                    <span>•</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteHistoryItem(item.id);
                  }}
                  className="p-2 rounded-xl text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800"
                  title="Delete from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-neutral-500" />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
