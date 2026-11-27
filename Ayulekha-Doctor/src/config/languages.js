/**
 * Language Configuration for AyuLekha Translation System
 * Restricted to English and Hindi.
 */

export const LANGUAGES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    speechLang: 'en-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans', sans-serif",
    subtitle: 'Select English',
    flag: '🇮🇳'
  },
  {
    code: 'hi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    speechLang: 'hi-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
    subtitle: 'हिंदी चुनें',
    flag: '🇮🇳'
  }
];

export const DEFAULT_LANGUAGE = 'en';

export const getLanguageConfig = (code) => {
  return LANGUAGES.find((l) => l.code === code) || LANGUAGES[0];
};

export const getSpeechLang = (code) => {
  const cfg = getLanguageConfig(code);
  return cfg.speechLang || 'en-IN';
};
