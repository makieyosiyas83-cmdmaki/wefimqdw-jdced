import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Globe, GraduationCap, Check, ArrowRight, User } from 'lucide-react';
import { Language, EthiopianDate, UserProfile } from '../types';
import { ETHIOPIAN_MONTHS, ETHIOPIAN_YEARS } from '../utils/ethiopianCalendar';
import { getUserIdFromIdentifier } from '../App';

interface OnboardingScreenProps {
  initialAuth: { method: 'email' | 'phone'; identifier: string; userId?: string };
  onComplete: (profile: UserProfile) => void;
  language: Language;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  initialAuth,
  onComplete,
  language: initialLang,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Profile data state
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(initialLang);
  const [ethDay, setEthDay] = useState<number>(1);
  const [ethMonth, setEthMonth] = useState<string>('Meskerem');
  const [ethYear, setEthYear] = useState<number>(2005);
  const [grade, setGrade] = useState<number>(11);
  const [fullName, setFullName] = useState<string>('');

  const handleFinish = () => {
    const ethiopianBirthday: EthiopianDate = {
      day: ethDay,
      month: ethMonth,
      year: ethYear,
    };

    const isEyosiyasmaki123Admin = Boolean(
      (initialAuth.identifier && (
        initialAuth.identifier.toLowerCase().includes('makieyosiyas83@gmail.com') ||
        initialAuth.identifier.toLowerCase().includes('eyosiyasmaki123')
      )) ||
      (fullName && fullName.toLowerCase().includes('eyosiyasmaki123'))
    );

    const userId = initialAuth.userId || (initialAuth.identifier ? getUserIdFromIdentifier(initialAuth.identifier) : `user_${Date.now()}`);

    const newProfile: UserProfile = {
      id: userId,
      name: fullName || (selectedLanguage === 'am' ? 'ተማሪ' : 'Student'),
      email: initialAuth.method === 'email' ? initialAuth.identifier : undefined,
      phone: initialAuth.method === 'phone' ? initialAuth.identifier : undefined,
      authMethod: initialAuth.method,
      ethiopianBirthday,
      language: selectedLanguage,
      grade,
      isPro: isEyosiyasmaki123Admin ? true : false,
    };

    onComplete(newProfile);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-black text-white relative">
      <div>
        {/* iOS Top Step Progress Indicator */}
        <div className="mt-2 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
              {selectedLanguage === 'am' ? 'ደረጃ' : 'STEP'} {step} OF 3
            </span>
            <span className="text-xs font-semibold text-white">
              {step === 1 && (selectedLanguage === 'am' ? 'የትውልድ ቀን' : 'Ethiopian Birthday')}
              {step === 2 && (selectedLanguage === 'am' ? 'የቋንቋ ምርጫ' : 'Language Preference')}
              {step === 3 && (selectedLanguage === 'am' ? 'የክፍል ደረጃ' : 'Grade Level')}
            </span>
          </div>

          <div className="h-1.5 w-full bg-neutral-900 rounded-full overflow-hidden flex">
            <motion.div
              className="bg-white h-full"
              initial={{ width: '33%' }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Step Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
            {selectedLanguage === 'am' ? 'ስለ እርስዎ ይንገሩን' : 'Tell Us About Yourself'}
          </h2>
          <p className="text-xs text-neutral-400">
            {selectedLanguage === 'am'
              ? 'የጥናት ይዘቶችን ለክፍልዎ እና ፍላጎትዎ ለማስተካከል'
              : 'Personalize your AI notes, quizzes, and learning materials'}
          </p>
        </div>

        {/* Step Form Body */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                  {selectedLanguage === 'am' ? 'ሙሉ ስም (አማራጭ)' : 'Full Name (Optional)'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedLanguage === 'am' ? 'አበበ በቀለ' : 'Abebe Bikila'}
                    className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-neutral-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Calendar className="w-4 h-4 text-white" />
                  <label className="text-xs font-medium text-white">
                    {selectedLanguage === 'am'
                      ? 'የትውልድ ቀንዎ በኢትዮጵያ ዘመን አቆጣጠር'
                      : 'Ethiopian Calendar Birthday (E.C.)'}
                  </label>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {/* Day Picker */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 font-mono">
                      {selectedLanguage === 'am' ? 'ቀን' : 'DAY'}
                    </label>
                    <select
                      value={ethDay}
                      onChange={(e) => setEthDay(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-xl px-2.5 py-3 outline-none font-mono"
                    >
                      {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                        <option key={d} value={d} className="bg-neutral-900">
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Month Picker */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 font-mono">
                      {selectedLanguage === 'am' ? 'ወር' : 'MONTH'}
                    </label>
                    <select
                      value={ethMonth}
                      onChange={(e) => setEthMonth(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-xl px-2 py-3 outline-none"
                    >
                      {ETHIOPIAN_MONTHS.map((m) => (
                        <option key={m.nameEn} value={m.nameEn} className="bg-neutral-900">
                          {selectedLanguage === 'am' ? m.nameAm : m.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Year Picker */}
                  <div>
                    <label className="block text-[10px] text-neutral-400 mb-1 font-mono">
                      {selectedLanguage === 'am' ? 'ዓ.ም.' : 'YEAR (E.C.)'}
                    </label>
                    <select
                      value={ethYear}
                      onChange={(e) => setEthYear(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-xs rounded-xl px-2 py-3 outline-none font-mono"
                    >
                      {ETHIOPIAN_YEARS.map((y) => (
                        <option key={y} value={y} className="bg-neutral-900">
                          {y} E.C.
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-[11px] text-neutral-400 font-mono flex justify-between items-center">
                  <span>Selected Ethiopian Birthday:</span>
                  <span className="text-white font-bold">
                    {ethMonth} {ethDay}, {ethYear} E.C.
                  </span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-white" />
                <label className="text-xs font-medium text-white">
                  {selectedLanguage === 'am' ? 'የመጀመሪያ ቋንቋዎ' : 'Primary Language Preference'}
                </label>
              </div>

              {/* Language Selection Cards */}
              <div className="grid grid-cols-1 gap-3">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setSelectedLanguage('en')}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedLanguage === 'en'
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-neutral-900 text-white border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      selectedLanguage === 'en' ? 'bg-black text-white' : 'bg-neutral-800 text-white'
                    }`}>
                      EN
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">English</h4>
                      <p className={`text-xs ${selectedLanguage === 'en' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        AI Notes and Quizzes generated in English
                      </p>
                    </div>
                  </div>
                  {selectedLanguage === 'en' && <Check className="w-5 h-5 text-black" />}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => setSelectedLanguage('am')}
                  className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedLanguage === 'am'
                      ? 'bg-white text-black border-white shadow-lg'
                      : 'bg-neutral-900 text-white border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                      selectedLanguage === 'am' ? 'bg-black text-white' : 'bg-neutral-800 text-white'
                    }`}>
                      አማ
                    </div>
                    <div>
                      <h4 className="font-bold text-sm">Amharic (አማርኛ)</h4>
                      <p className={`text-xs ${selectedLanguage === 'am' ? 'text-neutral-700' : 'text-neutral-400'}`}>
                        ማጠቃለያዎች እና ጥያቄዎች በአማርኛ ይዘጋጃሉ
                      </p>
                    </div>
                  </div>
                  {selectedLanguage === 'am' && <Check className="w-5 h-5 text-black" />}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <GraduationCap className="w-4 h-4 text-white" />
                <label className="text-xs font-medium text-white">
                  {selectedLanguage === 'am' ? 'የክፍል ደረጃዎን ይምረጡ (ከ 1 እስከ 12)' : 'Select Your Grade Level (1 to 12)'}
                </label>
              </div>

              {/* Grade Selection 12-Grid Pills */}
              <div className="grid grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <motion.button
                    key={g}
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`py-3 rounded-2xl font-bold text-sm transition-all border flex flex-col items-center justify-center ${
                      grade === g
                        ? 'bg-white text-black border-white shadow-md'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-[10px] font-mono opacity-60">
                      {selectedLanguage === 'am' ? 'ክፍል' : 'GRADE'}
                    </span>
                    <span>{g}</span>
                  </motion.button>
                ))}
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl text-center text-xs text-neutral-300 font-medium">
                {selectedLanguage === 'am'
                  ? `የተመረጠው ደረጃ: ክፍል ${grade}`
                  : `Selected: Grade ${grade} Ethiopian National Curriculum`}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="pt-6 border-t border-neutral-900 flex space-x-3">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((step - 1) as any)}
            className="px-5 py-3.5 rounded-2xl border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs font-semibold hover:bg-neutral-800 transition-colors"
          >
            {selectedLanguage === 'am' ? 'ተመለስ' : 'Back'}
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.96 }}
          type="button"
          onClick={() => {
            if (step < 3) {
              setStep((step + 1) as any);
            } else {
              handleFinish();
            }
          }}
          className="flex-1 py-3.5 px-6 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:bg-neutral-200 transition-all border border-neutral-200"
        >
          <span>
            {step === 3
              ? (selectedLanguage === 'am' ? 'መገለጫ ጨርስ' : 'Complete Profile')
              : (selectedLanguage === 'am' ? 'ቀጣይ' : 'Next Step')}
          </span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
