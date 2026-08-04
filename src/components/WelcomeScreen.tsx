import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, BookOpen, GraduationCap, Sparkles } from 'lucide-react';
import { Language } from '../types';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  language: Language;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onGetStarted, language }) => {
  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-black text-white relative overflow-hidden">
      {/* Background Subtle Geometric Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#262626_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

      {/* Header Badge */}
      <div className="pt-8 flex justify-center z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/80 text-neutral-300 text-xs font-mono"
        >
          <GraduationCap className="w-4 h-4 text-white" />
          <span>ETHIOPIAN AI STUDY PLATFORM</span>
        </motion.div>
      </div>

      {/* Main Hero Content */}
      <div className="my-auto text-center z-10 px-2">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white text-black flex items-center justify-center shadow-2xl border border-neutral-200"
        >
          <BookOpen className="w-10 h-10" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3"
        >
          {language === 'am' ? 'እንኳን ወደ ኤዱ ኢትዮጵያ በደህና መጡ' : 'Welcome to EduEthiopia'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-neutral-400 text-sm max-w-xs mx-auto leading-relaxed"
        >
          {language === 'am'
            ? 'ከክፍል 1 እስከ 12 ያሉ ትምህርታዊ ቁሳቁሶችን፣ ማጠቃለያዎችን፣ ኩይዞችን እና ፍላሽካርዶችን በአርቴፊሻል ኢንተሊጀንስ ያዘጋጁ።'
            : 'Smarter studying for Ethiopian Grades 1–12. Upload materials, generate AI notes, custom quizzes, and interactive flashcards.'}
        </motion.p>
      </div>

      {/* Action Footer */}
      <div className="pb-6 z-10">
        <motion.button
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.01 }}
          onClick={onGetStarted}
          className="w-full py-4 px-6 rounded-2xl bg-white text-black font-semibold text-base flex items-center justify-center space-x-2 shadow-lg hover:bg-neutral-200 transition-all border border-neutral-200"
        >
          <span>{language === 'am' ? 'ይጀምሩ' : 'Get Started'}</span>
          <ArrowRight className="w-5 h-5" />
        </motion.button>
        <p className="text-center text-[11px] text-neutral-500 mt-3 font-mono">
          Grade 1-12 • Amharic & English • Ethiopian Calendar
        </p>
      </div>
    </div>
  );
};
