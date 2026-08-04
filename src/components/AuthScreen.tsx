import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, Lock, Eye, EyeOff, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Language } from '../types';

interface AuthScreenProps {
  onSuccess: (authData: { method: 'email' | 'phone'; identifier: string; mode: 'signup' | 'login' }) => void;
  language: Language;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onSuccess, language }) => {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [method, setMethod] = useState<'email' | 'phone'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (method === 'email') {
      if (!email || !email.includes('@')) {
        setError(language === 'am' ? 'እባክዎን ትክክለኛ ኢሜይል ያስገቡ' : 'Please enter a valid email address');
        return;
      }
      if (password.length < 6) {
        setError(language === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
        return;
      }
    } else {
      if (!phone || phone.length < 9) {
        setError(language === 'am' ? 'እባክዎን ትክክለኛ የስልክ ቁጥር ያስገቡ' : 'Please enter a valid Ethiopian phone number (+251...)');
        return;
      }
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSuccess({
        method,
        identifier: method === 'email' ? email : `+251 ${phone.replace(/^\+251\s*/, '')}`,
        mode,
      });
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-6 bg-black text-white relative">
      <div>
        {/* iOS Header Title */}
        <div className="mt-4 mb-6 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {mode === 'signup'
              ? (language === 'am' ? 'መለያ ይፍጠሩ' : 'Create Account')
              : (language === 'am' ? 'ይግቡ' : 'Welcome Back')}
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            {language === 'am' ? 'በትምህርት ጉዞዎ ይጀምሩ' : 'Start your study journey with EduEthiopia'}
          </p>
        </div>

        {/* iOS React Native Segmented Control: Sign Up vs Log In */}
        <div className="bg-neutral-900 p-1 rounded-2xl flex border border-neutral-800 mb-6 relative">
          <button
            type="button"
            onClick={() => { setMode('signup'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all relative z-10 ${
              mode === 'signup' ? 'text-black' : 'text-neutral-400'
            }`}
          >
            {language === 'am' ? 'ተመዝገብ' : 'Sign Up'}
          </button>
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all relative z-10 ${
              mode === 'login' ? 'text-black' : 'text-neutral-400'
            }`}
          >
            {language === 'am' ? 'ግባ' : 'Log In'}
          </button>
          
          <motion.div
            layout
            className="absolute top-1 bottom-1 bg-white rounded-xl z-0"
            style={{
              width: 'calc(50% - 4px)',
              left: mode === 'signup' ? '4px' : 'calc(50%)',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        </div>

        {/* Method Toggle: Email vs Phone */}
        <div className="flex space-x-2 mb-6">
          <button
            type="button"
            onClick={() => { setMethod('email'); setError(''); }}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
              method === 'email'
                ? 'bg-neutral-800 border-neutral-600 text-white shadow-md'
                : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>{language === 'am' ? 'በኢሜይል' : 'Email'}</span>
          </button>

          <button
            type="button"
            onClick={() => { setMethod('phone'); setError(''); }}
            className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-medium flex items-center justify-center space-x-2 transition-all ${
              method === 'phone'
                ? 'bg-neutral-800 border-neutral-600 text-white shadow-md'
                : 'bg-neutral-950 border-neutral-850 text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>{language === 'am' ? 'በስልክ ቁጥር' : 'Phone'}</span>
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {method === 'email' ? (
              <motion.div
                key="email-form"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    {language === 'am' ? 'ኢሜይል አድራሻ' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="student@eduethiopia.et"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-sm rounded-xl pl-10 pr-4 py-3 outline-none transition-all placeholder:text-neutral-600 font-sans"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    {language === 'am' ? 'ደህንነቱ የተጠበቀ የይለፍ ቃል' : 'Secure Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-neutral-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-sm rounded-xl pl-10 pr-10 py-3 outline-none transition-all placeholder:text-neutral-600 font-sans"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-neutral-500 hover:text-neutral-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="phone-form"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    {language === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር' : 'Ethiopian Phone Number'}
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3 py-1 px-2 bg-neutral-800 rounded-lg text-xs font-mono text-neutral-300 border border-neutral-700">
                      🇪🇹 +251
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="911 234 567"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-white text-white text-sm rounded-xl pl-24 pr-4 py-3 outline-none transition-all placeholder:text-neutral-600 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {language === 'am' ? 'የማረጋገጫ ኮድ ይላክሎታል' : 'SMS confirmation code will be sent'}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-neutral-900 border border-neutral-700 text-neutral-200 text-xs rounded-xl flex items-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 shrink-0 text-white" />
              <span>{error}</span>
            </motion.div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-white text-black font-semibold text-sm flex items-center justify-center space-x-2 shadow-lg hover:bg-neutral-200 transition-all border border-neutral-200 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'signup'
                    ? (language === 'am' ? 'ቀጥል' : 'Continue to Profile')
                    : (language === 'am' ? 'ግቡ' : 'Log In')}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </form>
      </div>

      {/* Security Footer Badge */}
      <div className="pt-6 border-t border-neutral-900 text-center">
        <p className="text-[11px] text-neutral-500 flex items-center justify-center space-x-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Encrypted Auth • EduEthiopia Security</span>
        </p>
      </div>
    </div>
  );
};
