import React from 'react';
import { useLang } from './LanguageContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, setLanguage } = useLang();

  const languages = [
    { code: 'en', label: 'EN', title: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ', title: 'Kannada' },
    { code: 'hi', label: 'हिंदी', title: 'Hindi' },
  ];

  return (
    <div
      role="group"
      aria-label="Language Switcher"
      className={`inline-flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-full p-0.5 border border-slate-200/80 dark:border-slate-700 shadow-xs ${className}`}
    >
      {languages.map((l) => {
        const isActive = lang === l.code;
        return (
          <button
            key={l.code}
            type="button"
            title={l.title}
            onClick={() => setLanguage(l.code)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-full transition-all duration-150 active:scale-95 ${
              isActive
                ? 'bg-white dark:bg-[#005D67] text-[#005D67] dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white/40'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
