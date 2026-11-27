import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { LANGUAGES, DEFAULT_LANGUAGE, getLanguageConfig, getSpeechLang } from '../config/languages';
import enFallback from '../locales/en.json';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Initial browser language detection with fallback to English
const detectInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('ayulekha_lang');
    if (saved && LANGUAGES.some((l) => l.code === saved)) {
      return saved;
    }
    if (typeof navigator !== 'undefined' && navigator.language) {
      const browserLang = navigator.language.toLowerCase();
      const match = LANGUAGES.find(
        (l) => browserLang === l.code || browserLang.startsWith(`${l.code}-`)
      );
      if (match) return match.code;
    }
  } catch (e) {
    console.warn('Locale detection notice:', e);
  }
  return DEFAULT_LANGUAGE;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(detectInitialLanguage);
  const [currentTranslations, setCurrentTranslations] = useState(enFallback);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [isLoadingTranslations, setIsLoadingTranslations] = useState(false);

  // In-memory cache for loaded translation JSONs
  const localesCache = useRef({ en: enFallback });

  // Dynamically load active language JSON
  const loadLanguageTranslations = useCallback(async (langCode) => {
    if (localesCache.current[langCode]) {
      setCurrentTranslations(localesCache.current[langCode]);
      return;
    }

    setIsLoadingTranslations(true);
    try {
      // Dynamic import loads only the requested locale file on demand
      const mod = await import(`../locales/${langCode}.json`);
      const dict = mod.default || mod;
      localesCache.current[langCode] = dict;
      setCurrentTranslations(dict);
    } catch (err) {
      console.warn(`Failed to dynamically load ${langCode}.json, falling back to English:`, err);
      setCurrentTranslations(enFallback);
    } finally {
      setIsLoadingTranslations(false);
    }
  }, []);

  // Sync HTML attributes, document title, and storage when language changes
  useEffect(() => {
    try {
      localStorage.setItem('ayulekha_lang', language);
    } catch (e) {
      console.warn('Storage notice:', e);
    }

    const config = getLanguageConfig(language);

    // Set <html lang="..." dir="...">
    document.documentElement.lang = language;
    document.documentElement.dir = config.dir || 'ltr';

    // Load active locale dictionary
    loadLanguageTranslations(language);
  }, [language, loadLanguageTranslations]);

  // Clean any legacy third-party translation cookies on startup
  useEffect(() => {
    try {
      document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    } catch {}
  }, []);

  /**
   * Main Translation Function
   * @param {string} key - Dot notation key path, e.g., 'header.title'
   * @param {string|object} [fallbackOrParams] - Optional fallback string or params object
   * @param {object} [params] - Optional interpolation params, e.g., { name: 'Ram' }
   */
  const t = useCallback((key, fallbackOrParams, params) => {
    if (!key) return '';

    let fallback = '';
    let interpolation = {};

    if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
      interpolation = fallbackOrParams;
    } else if (typeof fallbackOrParams === 'string') {
      fallback = fallbackOrParams;
      if (typeof params === 'object' && params !== null) {
        interpolation = params;
      }
    }

    const keys = key.split('.');

    // Lookup in active translations
    let value = currentTranslations;
    for (const k of keys) {
      if (value === undefined || value === null) break;
      value = value[k];
    }

    // Fallback to English baseline if missing or undefined
    if (value === undefined || value === null) {
      value = enFallback;
      for (const k of keys) {
        if (value === undefined || value === null) break;
        value = value[k];
      }
    }

    if (value === undefined || value === null) {
      return fallback || key;
    }

    // Handle string interpolation {param}
    if (typeof value === 'string' && Object.keys(interpolation).length > 0) {
      return value.replace(/\{(\w+)\}/g, (_, match) => {
        return interpolation[match] !== undefined ? interpolation[match] : `{${match}}`;
      });
    }

    return value;
  }, [currentTranslations]);

  // Intl Formatting Helpers
  const formatDate = useCallback((date, options = { dateStyle: 'medium' }) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return new Intl.DateTimeFormat(language, options).format(d);
    } catch {
      return String(date);
    }
  }, [language]);

  const formatNumber = useCallback((number, options) => {
    try {
      return new Intl.NumberFormat(language, options).format(number);
    } catch {
      return String(number);
    }
  }, [language]);

  const formatCurrency = useCallback((amount, currency = 'INR') => {
    try {
      return new Intl.NumberFormat(language, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(amount);
    } catch {
      return `₹${amount}`;
    }
  }, [language]);

  const currentLangObj = getLanguageConfig(language);

  const toggleLanguage = (lang) => {
    if (LANGUAGES.some((l) => l.code === lang)) {
      setLanguage(lang);
      sessionStorage.setItem('ayulekha_lang_chosen', 'true');
    }
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
    <LanguageContext.Provider
      value={{
        language,
        currentLangObj,
        LANGUAGES,
        DEFAULT_LANGUAGE,
        toggleLanguage,
        selectLanguage,
        isModalOpen,
        openLanguageModal,
        closeLanguageModal,
        t,
        formatDate,
        formatNumber,
        formatCurrency,
        getSpeechLang: () => getSpeechLang(language),
        isLoadingTranslations
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export { LANGUAGES, getSpeechLang };
