import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '../locales/en';
import hi from '../locales/hi';

const translations = { en, hi };

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // try to load from local storage
    const saved = localStorage.getItem('ayulekha_lang');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('ayulekha_lang', language);
    document.documentElement.lang = language === 'hi' ? 'hi' : 'en';
  }, [language]);

  const t = (key, returnArray = false) => {
    const keys = key.split('.');
    let value = translations[language];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    if (value === undefined) return key;
    return value;
  };

  const toggleLanguage = (lang) => {
    setLanguage(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
