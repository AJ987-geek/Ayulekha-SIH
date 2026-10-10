import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './LanguageModal.css';

export default function LanguageModal({ onSelectLanguage }) {
  const { isModalOpen, closeLanguageModal, selectLanguage, language, LANGUAGES } = useLanguage();

  if (!isModalOpen) return null;

  const handleSelect = (langCode) => {
    selectLanguage(langCode);
    if (onSelectLanguage) {
      onSelectLanguage(langCode);
    }
  };

  return (
    <div className="lang-modal-backdrop" onClick={closeLanguageModal}>
      <div className="lang-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="lang-modal-header">
          <div className="lang-modal-badge">
            <span className="material-symbols-outlined icon">translate</span>
            <span>MULTILINGUAL AI INTAKE</span>
          </div>
          <button className="lang-modal-close" onClick={closeLanguageModal} aria-label="Close language selector">
            &times;
          </button>
        </div>

        <div className="lang-modal-body">
          <h2 className="lang-modal-title">Select Your Language</h2>
          <p className="lang-modal-subtitle">
            Please choose your preferred language • अपनी पसंदीदा भाषा का चयन करें
          </p>

          <div className="lang-grid">
            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  className={`lang-option-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleSelect(lang.code)}
                >
                  <div className="lang-card-top">
                    <span className="lang-native">{lang.nativeName}</span>
                    {isSelected && <span className="lang-check-badge">✓ Selected</span>}
                  </div>
                  <div className="lang-card-bottom">
                    <span className="lang-name-en">{lang.name}</span>
                    <span className="lang-sub">{lang.subtitle}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="lang-modal-footer">
          <p className="lang-footer-hint">
            <span className="material-symbols-outlined mic-hint-icon">mic</span>
            You can speak or type in any selected language during your consultation.
          </p>
          <button className="lang-continue-btn" onClick={closeLanguageModal}>
            Continue in {LANGUAGES.find(l => l.code === language)?.name || 'English'} →
          </button>
        </div>
      </div>
    </div>
  );
}
