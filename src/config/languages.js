/**
 * Language Configuration for AyuLekha Multi-Language Translation System
 * Config-driven architecture: to add a new language, simply add an entry here
 * and create the corresponding JSON file in src/locales/<code wide>.json.
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
  },
  {
    code: 'mr',
    name: 'Marathi',
    nativeName: 'मराठी',
    speechLang: 'mr-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
    subtitle: 'मराठी निवडा',
    flag: '🇮🇳'
  },
  {
    code: 'pa',
    name: 'Punjabi',
    nativeName: 'ਪੰਜਾਬੀ',
    speechLang: 'pa-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Gurmukhi', sans-serif",
    subtitle: 'ਪੰਜਾਬੀ ਚੁਣੋ',
    flag: '🇮🇳'
  },
  {
    code: 'ta',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    speechLang: 'ta-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Tamil', sans-serif",
    subtitle: 'தமிழ் தேர்வு',
    flag: '🇮🇳'
  },
  {
    code: 'te',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    speechLang: 'te-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Telugu', sans-serif",
    subtitle: 'తెలుగును ఎంచుకోండి',
    flag: '🇮🇳'
  },
  {
    code: 'kn',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    speechLang: 'kn-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Kannada', sans-serif",
    subtitle: 'ಕನ್ನಡ ಆಯ್ಕೆಮಾಡಿ',
    flag: '🇮🇳'
  },
  {
    code: 'ml',
    name: 'Malayalam',
    nativeName: 'മലയാളം',
    speechLang: 'ml-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Malayalam', sans-serif",
    subtitle: 'മലയാളം തിരെഞ്ഞെടുക്കുക',
    flag: '🇮🇳'
  },
  {
    code: 'bn',
    name: 'Bengali',
    nativeName: 'বাংলা',
    speechLang: 'bn-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Bengali', sans-serif",
    subtitle: 'বাংলা বাছুন',
    flag: '🇮🇳'
  },
  {
    code: 'gu',
    name: 'Gujarati',
    nativeName: 'ગુજરાતી',
    speechLang: 'gu-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Gujarati', sans-serif",
    subtitle: 'ગુજરાતી પસંદ કરો',
    flag: '🇮🇳'
  },
  {
    code: 'or',
    name: 'Odia',
    nativeName: 'ଓଡ଼ିଆ',
    speechLang: 'or-IN',
    dir: 'ltr',
    fontFamily: "'Noto Sans Oriya', sans-serif",
    subtitle: 'ଓଡ଼ିଆ ବାଛନ୍ତୁ',
    flag: '🇮🇳'
  },
  {
    code: 'ur',
    name: 'Urdu',
    nativeName: 'اردو',
    speechLang: 'ur-IN',
    dir: 'rtl',
    fontFamily: "'Noto Nastaliq Urdu', 'Noto Sans Arabic', Tahoma, sans-serif",
    subtitle: 'اردو منتخب کریں',
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
