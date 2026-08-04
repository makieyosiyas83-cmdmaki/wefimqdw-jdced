import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizSet, Language } from '../types';
import { Check, X, Clock, Award, RotateCcw, ArrowRight, HelpCircle } from 'lucide-react';

interface QuizPlayerProps {
  quizSet: QuizSet;
  language: Language;
  onBack: () => void;
  onSaveScore?: (score: number) => void;
}

export const QuizPlayer: React.FC<QuizPlayerProps> = ({ quizSet, language, onBack, onSaveScore }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const totalQuestions = quizSet.questions.length;
  const currentQuestion = quizSet.questions[currentIndex];

  useEffect(() => {
    if (isCompleted) return;
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted]);

  const handleSelectOption = (optionIndex: number) => {
    if (selectedAnswers[currentIndex] !== undefined) return; // already answered
    setSelectedAnswers((prev) => ({ ...prev, [currentIndex]: optionIndex }));
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsCompleted(true);
      // calculate score
      let correctCount = 0;
      quizSet.questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctIndex) {
          correctCount++;
        }
      });
      const scorePct = Math.round((correctCount / totalQuestions) * 100);
      if (onSaveScore) onSaveScore(scorePct);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    quizSet.questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correctCount++;
      }
    });
    return {
      correctCount,
      percentage: Math.round((correctCount / totalQuestions) * 100),
    };
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isCompleted) {
    const { correctCount, percentage } = calculateScore();

    return (
      <div className="flex-1 flex flex-col justify-between bg-neutral-950 text-white p-6">
        <div>
          <div className="text-center my-6">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl"
            >
              <Award className="w-10 h-10" />
            </motion.div>

            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
              {language === 'am' ? 'ፈተና ተጠናቋል!' : 'Quiz Completed!'}
            </h2>
            <p className="text-xs text-neutral-400 font-mono">
              {quizSet.title}
            </p>
          </div>

          {/* Score Card */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 text-center space-y-4 shadow-xl">
            <div>
              <span className="text-4xl font-extrabold text-white font-mono">{percentage}%</span>
              <p className="text-xs text-neutral-400 mt-1">
                {correctCount} of {totalQuestions} correct answers
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-neutral-800 text-xs font-mono">
              <div className="p-3 bg-black/60 rounded-2xl border border-neutral-850">
                <span className="text-neutral-500 block text-[10px]">TIME TAKEN</span>
                <span className="text-white font-bold">{formatTimer(elapsedTime)}</span>
              </div>
              <div className="p-3 bg-black/60 rounded-2xl border border-neutral-850">
                <span className="text-neutral-500 block text-[10px]">DIFFICULTY</span>
                <span className="text-white font-bold uppercase">{quizSet.difficulty}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="space-y-3 pt-6">
          <button
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setSelectedAnswers({});
              setShowExplanation(false);
              setElapsedTime(0);
            }}
            className="w-full py-3.5 rounded-2xl bg-neutral-900 border border-neutral-800 text-neutral-200 font-semibold text-xs flex items-center justify-center space-x-2 hover:bg-neutral-800"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{language === 'am' ? 'እንደገና ፈትን' : 'Retake Quiz'}</span>
          </button>

          <button
            onClick={onBack}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:bg-neutral-200"
          >
            <span>{language === 'am' ? 'ወደ ዋና ገጽ ተመለስ' : 'Return to Home'}</span>
          </button>
        </div>
      </div>
    );
  }

  const selectedOptionForCurrent = selectedAnswers[currentIndex];
  const hasAnsweredCurrent = selectedOptionForCurrent !== undefined;

  return (
    <div className="flex-1 flex flex-col justify-between bg-neutral-950 text-white p-5">
      {/* Header Bar */}
      <div>
        <div className="flex justify-between items-center mb-3 pb-3 border-b border-neutral-900">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900"
          >
            ← {language === 'am' ? 'ውጣ' : 'Exit Quiz'}
          </button>

          <div className="flex items-center space-x-3 text-xs font-mono text-neutral-400">
            <span className="flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(elapsedTime)}</span>
            </span>
            <span>•</span>
            <span>Q{currentIndex + 1}/{totalQuestions}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 bg-neutral-900 rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
          />
        </div>

        {/* Question Card */}
        <div className="mb-4">
          <div className="flex items-center space-x-2 text-[10px] text-neutral-400 font-mono mb-1">
            <span className="px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-white uppercase">
              {quizSet.quizType === 'true_false' ? 'True / False' : 'Multiple Choice'}
            </span>
            <span>•</span>
            <span className="uppercase">{quizSet.difficulty}</span>
          </div>

          <h2 className="text-base font-bold text-white leading-relaxed mt-2">
            {currentQuestion?.question}
          </h2>
        </div>

        {/* Options Grid */}
        <div className="space-y-2.5 my-4">
          {currentQuestion?.options.map((optionText, oidx) => {
            const isSelected = selectedOptionForCurrent === oidx;
            const isCorrect = oidx === currentQuestion.correctIndex;

            let style = 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700';

            if (hasAnsweredCurrent) {
              if (isCorrect) {
                style = 'bg-white text-black font-bold border-white';
              } else if (isSelected) {
                style = 'bg-neutral-900 text-neutral-400 border-neutral-600 line-through';
              } else {
                style = 'bg-neutral-950 text-neutral-600 border-neutral-900 opacity-60';
              }
            }

            return (
              <motion.button
                key={oidx}
                whileTap={{ scale: hasAnsweredCurrent ? 1 : 0.98 }}
                disabled={hasAnsweredCurrent}
                onClick={() => handleSelectOption(oidx)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all text-xs flex items-center justify-between ${style}`}
              >
                <span>{optionText}</span>
                {hasAnsweredCurrent && isCorrect && <Check className="w-4 h-4 text-black shrink-0 ml-2" />}
                {hasAnsweredCurrent && isSelected && !isCorrect && <X className="w-4 h-4 text-neutral-400 shrink-0 ml-2" />}
              </motion.button>
            );
          })}
        </div>

        {/* Answer Explanation Box */}
        {hasAnsweredCurrent && showExplanation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-xs space-y-1.5"
          >
            <div className="flex items-center space-x-1.5 font-bold text-white">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>{language === 'am' ? 'ማብራሪያ' : 'Explanation'}</span>
            </div>
            <p className="text-neutral-300 leading-relaxed font-mono text-[11px]">
              {currentQuestion?.explanation}
            </p>
          </motion.div>
        )}
      </div>

      {/* Next Question Action */}
      {hasAnsweredCurrent && (
        <div className="pt-4 border-t border-neutral-900">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleNextQuestion}
            className="w-full py-3.5 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg"
          >
            <span>
              {currentIndex < totalQuestions - 1
                ? (language === 'am' ? 'ቀጣይ ጥያቄ' : 'Next Question')
                : (language === 'am' ? 'ውጤት ተመልከት' : 'See Results')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      )}
    </div>
  );
};
