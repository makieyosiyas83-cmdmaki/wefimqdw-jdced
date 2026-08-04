import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlashcardSet, Flashcard, Language } from '../types';
import { RotateCw, ChevronLeft, ChevronRight, CheckCircle, Plus, X, Trash2, Edit2, Layers, Sparkles } from 'lucide-react';

interface FlashcardsViewerProps {
  flashcardSet: FlashcardSet;
  language: Language;
  onBack: () => void;
  onUpdateFlashcards?: (updatedSet: FlashcardSet) => void;
}

export const FlashcardsViewer: React.FC<FlashcardsViewerProps> = ({
  flashcardSet,
  language,
  onBack,
  onUpdateFlashcards,
}) => {
  const [cards, setCards] = useState<Flashcard[]>(flashcardSet.cards || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<number>>(new Set());

  // Manual Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFront, setNewFront] = useState('');
  const [newBack, setNewBack] = useState('');
  const [newHint, setNewHint] = useState('');
  const [addError, setAddError] = useState('');

  // Edit Modal State
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);

  const total = cards.length;
  const currentCard = total > 0 ? cards[currentIndex] : null;

  const updateParent = (updatedCards: Flashcard[]) => {
    setCards(updatedCards);
    if (onUpdateFlashcards) {
      onUpdateFlashcards({
        ...flashcardSet,
        cards: updatedCards,
      });
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (total === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    if (total === 0) return;
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleMarkKnown = () => {
    if (total === 0) return;
    const updatedKnown = new Set(knownCards);
    updatedKnown.add(currentIndex);
    setKnownCards(updatedKnown);

    const updatedReview = new Set(reviewCards);
    updatedReview.delete(currentIndex);
    setReviewCards(updatedReview);

    handleNext();
  };

  const handleMarkReview = () => {
    if (total === 0) return;
    const updatedReview = new Set(reviewCards);
    updatedReview.add(currentIndex);
    setReviewCards(updatedReview);

    const updatedKnown = new Set(knownCards);
    updatedKnown.delete(currentIndex);
    setKnownCards(updatedKnown);

    handleNext();
  };

  const handleSaveNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFront.trim() || !newBack.trim()) {
      setAddError(language === 'am' ? 'እባክዎን ጥያቄውን እና መልሱን ይሙሉ' : 'Please fill in both Question and Answer.');
      return;
    }

    const createdCard: Flashcard = {
      id: `custom-${Date.now()}`,
      front: newFront.trim(),
      back: newBack.trim(),
      hint: newHint.trim() || undefined,
    };

    const updatedCards = [...cards, createdCard];
    updateParent(updatedCards);

    // Reset Form & Jump to newly created card
    setNewFront('');
    setNewBack('');
    setNewHint('');
    setAddError('');
    setShowAddModal(false);
    setIsFlipped(false);
    setCurrentIndex(updatedCards.length - 1);
  };

  const handleSaveEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    if (!editingCard.front.trim() || !editingCard.back.trim()) {
      setAddError(language === 'am' ? 'እባክዎን ጥያቄውን እና መልሱን ይሙሉ' : 'Please fill in both Question and Answer.');
      return;
    }

    const updatedCards = cards.map((c) => (c.id === editingCard.id ? editingCard : c));
    updateParent(updatedCards);
    setEditingCard(null);
    setAddError('');
  };

  const handleDeleteCard = (cardId: string) => {
    const updatedCards = cards.filter((c) => c.id !== cardId);
    updateParent(updatedCards);
    setIsFlipped(false);
    if (currentIndex >= updatedCards.length) {
      setCurrentIndex(Math.max(0, updatedCards.length - 1));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-950 text-white p-4 sm:p-5 justify-between relative overflow-y-auto min-h-0">
      {/* Header */}
      <div className="shrink-0">
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-900">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 transition-colors"
          >
            ← {language === 'am' ? 'ተመለስ' : 'Back'}
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setNewFront('');
                setNewBack('');
                setNewHint('');
                setAddError('');
                setShowAddModal(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white text-black font-extrabold text-xs flex items-center space-x-1.5 shadow-md hover:bg-neutral-200 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{language === 'am' ? 'በእጅ ፍላሽካርድ ጨምር' : 'Add Flashcard'}</span>
            </button>

            {total > 0 && (
              <span className="text-xs font-mono text-neutral-400 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800">
                {currentIndex + 1} / {total}
              </span>
            )}
          </div>
        </div>

        {/* Set Info */}
        <div className="mb-3">
          <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono mb-1">
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-white uppercase font-bold">
              {flashcardSet.difficulty}
            </span>
            <span>•</span>
            <span className="truncate max-w-[200px]">{flashcardSet.materialTitle}</span>
          </div>
          <h2 className="text-base font-bold text-white">{flashcardSet.title}</h2>
        </div>
      </div>

      {/* Main Flashcard Deck or Empty State */}
      {total === 0 ? (
        <div className="my-auto py-12 text-center text-neutral-500 border border-dashed border-neutral-850 rounded-3xl p-6 bg-neutral-900/50">
          <Layers className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
          <h3 className="text-sm font-bold text-white">
            {language === 'am' ? 'ምንም ፍላሽካርድ የለም' : 'No Flashcards in Deck'}
          </h3>
          <p className="text-xs text-neutral-400 mt-1 mb-4 max-w-xs mx-auto">
            {language === 'am'
              ? 'አዲስ ፍላሽካርዶችን በእጅዎ በማስገባት ጥናትዎን ይጀምሩ!'
              : 'Add custom flashcards manually or regenerate a set from study material.'}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white text-black font-bold text-xs inline-flex items-center space-x-2 shadow-lg hover:bg-neutral-200 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>{language === 'am' ? 'የመጀመሪያውን ፍላሽካርድ ጨምር' : 'Add First Flashcard'}</span>
          </button>
        </div>
      ) : (
        <div className="my-auto py-3 shrink-0">
          <div
            onClick={handleFlip}
            className="w-full h-72 sm:h-80 cursor-pointer perspective-1000 relative"
          >
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.45, ease: 'easeInOut' }}
              className="w-full h-full rounded-3xl bg-neutral-900 border border-neutral-800 p-6 flex flex-col justify-between shadow-2xl relative preserve-3d"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* FRONT OF CARD */}
              <div
                className={`absolute inset-0 p-6 flex flex-col justify-between rounded-3xl bg-neutral-900 backface-hidden ${
                  isFlipped ? 'pointer-events-none opacity-0' : 'opacity-100'
                }`}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-500 uppercase">
                  <span>QUESTION / CONCEPT</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) setEditingCard(currentCard);
                      }}
                      className="p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-white"
                      title="Edit card"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) handleDeleteCard(currentCard.id);
                      }}
                      className="p-1 rounded-md bg-neutral-800 text-neutral-400 hover:text-neutral-200"
                      title="Delete card"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <span className="flex items-center space-x-1 text-neutral-400 ml-1">
                      <RotateCw className="w-3 h-3" />
                      <span>Tap to flip</span>
                    </span>
                  </div>
                </div>

                <div className="my-auto text-center px-2">
                  <p className="text-base sm:text-lg font-bold text-white leading-snug">
                    {currentCard?.front}
                  </p>
                  {currentCard?.hint && (
                    <p className="text-xs text-neutral-400 mt-3 font-mono bg-neutral-950 p-2 rounded-xl border border-neutral-850 inline-block">
                      Hint: {currentCard.hint}
                    </p>
                  )}
                </div>

                <div className="text-center text-[11px] text-neutral-500 font-mono">
                  EduEthiopia Flashcards
                </div>
              </div>

              {/* BACK OF CARD (ANSWER) */}
              <div
                className={`absolute inset-0 p-6 flex flex-col justify-between rounded-3xl bg-white text-black backface-hidden ${
                  isFlipped ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                style={{ transform: 'rotateY(180deg)' }}
              >
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-600 uppercase font-bold">
                  <span>ANSWER / DEFINITION</span>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (currentCard) setEditingCard(currentCard);
                      }}
                      className="p-1 rounded-md bg-neutral-200 text-neutral-700 hover:text-black"
                      title="Edit card"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <span>EduEthiopia AI</span>
                  </div>
                </div>

                <div className="my-auto text-center px-2">
                  <p className="text-sm sm:text-base font-bold text-neutral-900 leading-relaxed">
                    {currentCard?.back}
                  </p>
                </div>

                <div className="text-center text-[11px] text-neutral-500 font-mono">
                  Tap card to flip back
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Control Actions */}
      {total > 0 && (
        <div className="space-y-3 pt-2 shrink-0">
          {/* Know vs Review Quick Rating */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleMarkReview}
              className="py-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-neutral-800 transition-all"
            >
              <RotateCw className="w-4 h-4 text-neutral-400" />
              <span>Need Review ({reviewCards.size})</span>
            </button>

            <button
              onClick={handleMarkKnown}
              className="py-3 rounded-2xl bg-white text-black font-semibold text-xs flex items-center justify-center space-x-2 shadow-md hover:bg-neutral-200 transition-all"
            >
              <CheckCircle className="w-4 h-4 text-black" />
              <span>Got It ({knownCards.size})</span>
            </button>
          </div>

          {/* Prev / Next Deck Stepper */}
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrev}
              className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs font-mono text-neutral-500">
              Card {currentIndex + 1} of {total}
            </span>

            <button
              onClick={handleNext}
              className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* ADD FLASHCARD MODAL */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <h3 className="font-bold text-sm">
                    {language === 'am' ? 'አዲስ ፍላሽካርድ ይፍጠሩ' : 'Add Custom Flashcard'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewCard} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    {language === 'am' ? 'ጥያቄ / ፅንሰ ሀሳብ (Front Side)' : 'Front: Question or Concept *'}
                  </label>
                  <textarea
                    rows={3}
                    value={newFront}
                    onChange={(e) => setNewFront(e.target.value)}
                    placeholder="e.g. What is the formula for Kinetic Energy?"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none resize-none placeholder:text-neutral-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    {language === 'am' ? 'መልስ / ፍቺ (Back Side)' : 'Back: Answer or Definition *'}
                  </label>
                  <textarea
                    rows={3}
                    value={newBack}
                    onChange={(e) => setNewBack(e.target.value)}
                    placeholder="e.g. KE = 1/2 * m * v^2"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none resize-none placeholder:text-neutral-600 font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    {language === 'am' ? 'አጋዥ ነጥብ (Optional Hint)' : 'Optional Memory Hint'}
                  </label>
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="e.g. Mass times velocity squared"
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none placeholder:text-neutral-600 font-sans"
                  />
                </div>

                {addError && (
                  <p className="text-xs text-neutral-300 bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-center font-medium">
                    {addError}
                  </p>
                )}

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-2xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-neutral-200 transition-all flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>{language === 'am' ? 'ፍላሽካርድ አስቀምጥ' : 'Save Flashcard to Deck'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT FLASHCARD MODAL */}
      <AnimatePresence>
        {editingCard && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl relative"
            >
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
                <div className="flex items-center space-x-2">
                  <Edit2 className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm">
                    {language === 'am' ? 'ፍላሽካርድ ያርትዑ' : 'Edit Flashcard'}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingCard(null)}
                  className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditCard} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Front: Question or Concept *
                  </label>
                  <textarea
                    rows={3}
                    value={editingCard.front}
                    onChange={(e) => setEditingCard({ ...editingCard, front: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Back: Answer or Definition *
                  </label>
                  <textarea
                    rows={3}
                    value={editingCard.back}
                    onChange={(e) => setEditingCard({ ...editingCard, back: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none resize-none font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                    Optional Memory Hint
                  </label>
                  <input
                    type="text"
                    value={editingCard.hint || ''}
                    onChange={(e) => setEditingCard({ ...editingCard, hint: e.target.value })}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-white text-white text-xs rounded-xl p-3 outline-none font-sans"
                  />
                </div>

                {addError && (
                  <p className="text-xs text-neutral-300 bg-neutral-950 p-2 rounded-xl border border-neutral-800 text-center font-medium">
                    {addError}
                  </p>
                )}

                <div className="pt-2 flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleDeleteCard(editingCard.id);
                      setEditingCard(null);
                    }}
                    className="py-3 px-4 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white font-bold text-xs"
                  >
                    Delete
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-white text-black font-extrabold text-xs shadow-lg hover:bg-neutral-200 transition-all"
                  >
                    Update Flashcard
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
