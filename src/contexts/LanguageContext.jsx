import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en';
import hi from '../locales/hi';
import pa from '../locales/pa';
import mr from '../locales/mr';
import bn from '../locales/bn';
import ta from '../locales/ta';
import ml from '../locales/ml';
import te from '../locales/te';

const translations = { en, hi, pa, mr, bn, ta, ml, te };

export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', speechLang: 'en-IN', flag: '🇬🇧', subtitle: 'Select English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', speechLang: 'hi-IN', flag: '🇮🇳', subtitle: 'हिंदी चुनें' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', speechLang: 'pa-IN', flag: '🇮🇳', subtitle: 'ਪੰਜਾਬੀ ਚੁਣੋ' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', speechLang: 'mr-IN', flag: '🇮🇳', subtitle: 'मराठी निवडा' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', speechLang: 'bn-IN', flag: '🇮🇳', subtitle: 'বাংলা বাছুন' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', speechLang: 'ta-IN', flag: '🇮🇳', subtitle: 'தமிழ் தேர்வு' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', speechLang: 'ml-IN', flag: '🇮🇳', subtitle: 'മലയാളം തിരെഞ്ഞെടുക്കുക' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', speechLang: 'te-IN', flag: '🇮🇳', subtitle: 'తెలుగును ఎంచుకోండి' },
];

export const getSpeechLang = (code) => {
  const found = LANGUAGES.find((l) => l.code === code);
  return found ? found.speechLang : 'en-IN';
};

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('ayulekha_lang');
    return saved || 'en';
  });

  // Language popup opens first when loading the website
  const [isModalOpen, setIsModalOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('ayulekha_lang', language);
    document.documentElement.lang = language;
    document.documentElement.setAttribute('translate', 'no');
    document.documentElement.classList.add('notranslate');
  }, [language]);

  const t = (key, returnArray = false) => {
    const keys = key.split('.');
    let targetDict = translations[language] || translations['en'];
    let value = targetDict;

    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }

    if (value === undefined || value === null) {
      // Fallback to English if string missing in target locale
      value = translations['en'];
      for (const k of keys) {
        if (value === undefined || value === null) break;
        value = value[k];
      }
    }
    
    if (value === undefined || value === null) return key;
    return value;
  };

  const toggleLanguage = (lang) => {
    setLanguage(lang);
    sessionStorage.setItem('ayulekha_lang_chosen', 'true');
  };

  const openLanguageModal = () => setIsModalOpen(true);
  const closeLanguageModal = () => {
    setIsModalOpen(false);
    sessionStorage.setItem('ayulekha_lang_chosen', 'true');
  };

  const selectLanguage = (lang) => {
    toggleLanguage(lang);
    closeLanguageModal();
  };

  return (
    <LanguageContext.Provider value={{
      language,
      toggleLanguage,
      t,
      LANGUAGES,
      getSpeechLang,
      isModalOpen,
      openLanguageModal,
      closeLanguageModal,
      selectLanguage
    }}>
      {children}
    </LanguageContext.Provider>
  );
};
