import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Header({ onNavigate }) {
  const { language, openLanguageModal, LANGUAGES, t } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const isHi = language === 'hi';

  return (
    <>
      <header className="site-header">
        {/* Logo */}
        <a 
          href="#portal" 
          className="logo-wrap"
          onClick={(e) => {
            e.preventDefault();
            if (onNavigate) onNavigate('portal');
          }}
        >
          <div className="logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none"/>
              <circle cx="11" cy="11" r="5.5" stroke="rgba(255,255,255,0.6)" stroke-width="1.2" fill="none"/>
              <line x1="11" y1="1" x2="11" y2="5" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" strokeLinecap="round"/>
              <line x1="11" y1="17" x2="11" y2="21" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" strokeLinecap="round"/>
              <line x1="1" y1="11" x2="5" y2="11" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" strokeLinecap="round"/>
              <line x1="17" y1="11" x2="21" y2="11" stroke="rgba(255,255,255,0.5)" stroke-width="1.5" strokeLinecap="round"/>
              <circle cx="11" cy="11" r="2" fill="#E8631A"/>
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-name">AyuLekha</span>
            <span className="logo-tagline">
              {isHi ? 'राष्ट्रीय डिजिटल स्वास्थ्य मिशन | भारत सरकार' : 'National Digital Health Mission | Govt. of India'}
            </span>
          </div>
        </a>

        {/* Nav */}
        <nav className="site-nav">
          <a 
            href="#portal" 
            className="active"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('portal');
            }}
          >
            {isHi ? 'पोर्टल होम' : 'Portal Home'}
          </a>
          <a 
            href="#records"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('records');
            }}
          >
            {isHi ? 'स्वास्थ्य रिकॉर्ड्स' : 'Health Records'}
          </a>
          <a 
            href="#appointments"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('new-appointment');
            }}
          >
            {isHi ? 'अपॉइंटमेंट' : 'Appointments'}
          </a>
          <a 
            href="#doctor"
            onClick={(e) => {
              e.preventDefault();
              if (onNavigate) onNavigate('doctor-dashboard');
            }}
          >
            {isHi ? 'चिकित्सक पोर्टल' : 'Doctor Portal'}
          </a>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <a href="tel:1075" className="helpline-btn">
            <span>📞</span>
            <span>{isHi ? '24/7 हेल्पलाइन: 1075 (टोल-फ्री)' : '24/7 Helpline: 1075 (Toll-Free)'}</span>
          </a>

          <button 
            type="button"
            className="lang-btn" 
            onClick={openLanguageModal}
            title={t('selectLanguage') || 'Select Language'}
          >
            🌐 <span>{currentLangObj?.nativeName || 'English'} ▾</span>
          </button>
        </div>
      </header>

      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="badge">
          <span>🏛️</span>
          <span>
            {isHi 
              ? 'राष्ट्रीय डिजिटल स्वास्थ्य मिशन (NDHM) • अधिकृत नागरिक स्वास्थ्य पोर्टल' 
              : 'National Digital Health Mission (NDHM) • Authorized Citizen Health Portal'}
          </span>
        </div>
        <div className="badge">
          <span>🔒</span>
          <span>
            {isHi 
              ? 'DPDP अधिनियम 2023 के तहत सुरक्षित' 
              : 'DPDP Act 2023 Compliant • 256-Bit SSL'}
          </span>
        </div>
      </div>
    </>
  );
}
