import React from 'react';
import { motion } from 'motion/react';
import { MainTab, Language } from '../types';
import { Home, History, User, Wifi, Battery, Signal, Sparkles } from 'lucide-react';

interface IOSWrapperProps {
  children: React.ReactNode;
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
  showNav: boolean;
  language: Language;
  onLanguageToggle?: () => void;
  title?: string;
}

export const IOSWrapper: React.FC<IOSWrapperProps> = ({
  children,
  activeTab,
  onTabChange,
  showNav,
  language,
  onLanguageToggle,
  title = 'EduEthiopia',
}) => {
  const [timeStr, setTimeStr] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col justify-center items-center p-0 sm:p-4 select-none font-sans">
      {/* Container simulating high-end iOS device screen */}
      <div className="w-full max-w-md h-[100vh] sm:h-[880px] sm:max-h-[92vh] bg-neutral-950 sm:border sm:border-neutral-800 sm:rounded-[48px] shadow-2xl flex flex-col overflow-hidden relative border-0">
        
        {/* iOS Dynamic Island / Status Bar */}
        <div className="bg-neutral-950 px-6 pt-3 pb-2 flex justify-between items-center z-50 text-xs font-semibold text-neutral-300 tracking-tight shrink-0">
          <span>{timeStr || '09:41'}</span>
          
          {/* Dynamic Island Pill */}
          <div className="w-24 h-5 bg-black rounded-full border border-neutral-800 flex items-center justify-center space-x-1.5 px-2">
            <div className="w-2 h-2 rounded-full bg-neutral-600 animate-pulse" />
            <span className="text-[10px] text-neutral-400 font-mono tracking-tighter">EduETH</span>
          </div>

          <div className="flex items-center space-x-1.5 text-neutral-300">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Top App Bar Header */}
        {showNav && (
          <header className="px-5 py-3 border-b border-neutral-900 bg-neutral-950/90 backdrop-blur-md flex items-center justify-between z-40 shrink-0">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center font-bold text-xs shadow-sm">
                EE
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-tight text-white leading-tight">{title}</h1>
                <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-mono">
                  {language === 'am' ? 'የጥናት ረዳት' : 'STUDY SUITE'}
                </p>
              </div>
            </div>

            {onLanguageToggle && (
              <motion.button
                whileTap={{ scale: 0.92 }}
                onClick={onLanguageToggle}
                className="px-2.5 py-1 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-300 text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center space-x-1"
                title="Toggle Language"
              >
                <span className="text-[10px] uppercase font-mono">{language === 'en' ? 'EN | አማ' : 'አማ | EN'}</span>
              </motion.button>
            )}
          </header>
        )}

        {/* Main Screen Content Body */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col bg-neutral-950">
          {children}
        </main>

        {/* iOS Native Bottom Navigation Tab Bar */}
        {showNav && (
          <nav className="bg-neutral-950/95 backdrop-blur-xl border-t border-neutral-900 px-6 py-2 flex justify-around items-center z-50 shrink-0">
            <button
              onClick={() => onTabChange('home')}
              className={`flex flex-col items-center space-y-1 relative py-1 px-3 rounded-2xl transition-all ${
                activeTab === 'home' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">
                {language === 'am' ? 'ዋና ገጽ' : 'Home'}
              </span>
              {activeTab === 'home' && (
                <motion.div
                  layoutId="tabPill"
                  className="absolute inset-0 bg-neutral-900 rounded-2xl -z-10 border border-neutral-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => onTabChange('history')}
              className={`flex flex-col items-center space-y-1 relative py-1 px-3 rounded-2xl transition-all ${
                activeTab === 'history' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <History className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">
                {language === 'am' ? 'ታሪክ' : 'History'}
              </span>
              {activeTab === 'history' && (
                <motion.div
                  layoutId="tabPill"
                  className="absolute inset-0 bg-neutral-900 rounded-2xl -z-10 border border-neutral-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>

            <button
              onClick={() => onTabChange('profile')}
              className={`flex flex-col items-center space-y-1 relative py-1 px-3 rounded-2xl transition-all ${
                activeTab === 'profile' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium tracking-tight">
                {language === 'am' ? 'መገለጫ' : 'Profile'}
              </span>
              {activeTab === 'profile' && (
                <motion.div
                  layoutId="tabPill"
                  className="absolute inset-0 bg-neutral-900 rounded-2xl -z-10 border border-neutral-800"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          </nav>
        )}

        {/* iOS Home Indicator Bar */}
        <div className="bg-neutral-950 pb-1 flex justify-center items-center shrink-0">
          <div className="w-32 h-1 bg-neutral-700 rounded-full my-1 opacity-60" />
        </div>
      </div>
    </div>
  );
};
