import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Records.css';

export default function Records({ onNavigate }) {
  const { t } = useLanguage();

  const handleNext = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('done');
    }
  };

  return (
    <div className="records-container selection-primary">
      {/* Header */}
      <header className="records-header">
        <div className="records-header-inner">
          <div className="records-header-left">
            <img 
              src="https://lh3.googleusercontent.com/aida/AEtjO1XZ69-LGCVhZ83XHZZeJ82DIDbDEyAJn-bssTAgeeCQJe-NVhrm2iM8gXhDPUK5mFP3_uA00jwtBnwCYLPlhcdUb9IGffUq19O-ow7zHMUzLpHBduXH_ohhq0mVKTXScLgrPdPigtJgHsQbAUsv0jUqKZrIlVoO60-V7k6s87H-CXEu-0TSx88sApYX4XhYbx2-9M9lI3n2iNdFHd1PqRqGwTbvpLQn7RLX82v4BH8Xvl7PnF9EEvze7w" 
              alt="AyuLeakha" 
              className="records-brand-logo" 
            />
            <div className="records-header-context-box">
              <span className="records-brand-title">AyuLeakha</span>
              <span className="records-brand-sub">{t('records.brandSub')}</span>
            </div>
          </div>

          <div className="records-header-right">
            <button className="listen-btn-records focus-ring" type="button">
              <span className="material-symbols-outlined listen-icon-records">volume_up</span>
              <span className="listen-text-records">{t('records.listenAssist')}</span>
            </button>

            <div className="records-lang-switcher">
              <button className="lang-btn-records lang-active focus-ring" type="button">EN</button>
              <span className="lang-sep-records">|</span>
              <button className="lang-btn-records focus-ring" type="button">हिन्दी</button>
              <span className="lang-sep-records">|</span>
              <button className="lang-btn-records focus-ring" type="button">বাংলা</button>
            </div>

            <div className="user-badge-records">
              <span className="material-symbols-outlined user-icon-records">person</span>
            </div>
          </div>
        </div>

        <div className="records-nav-wrapper">
          <div className="records-nav-inner">
            <nav className="records-nav-rail">
              <a href="#" className="nav-item-records">{t('records.nav1')}</a>
              <span className="nav-sep-records">•</span>
              <a href="#" className="nav-item-records">{t('records.nav2')}</a>
              <span className="nav-sep-records">•</span>
              <a href="#" className="nav-item-records">{t('records.nav3')}</a>
              <span className="nav-sep-records">•</span>
              <a href="#" className="nav-item-records nav-active-records" aria-current="page">
                <span className="nav-active-dot-records"></span>
                {t('records.nav4')}
              </a>
              <span className="nav-sep-records">•</span>
              <a href="#" className="nav-item-records">{t('records.nav5')}</a>
            </nav>
          </div>
          <div className="records-nav-border"></div>
        </div>
      </header>

      {/* Main Content */}
      <main className="records-main">
        <div className="records-content-wrapper">
          <div className="records-inner-flex">
            
            {/* Milestone Context Stamp */}
            <div className="records-milestone">
              <div className="milestone-left">
                <span className="milestone-dot"></span>
                <span className="milestone-text">{t('records.stageInfo')}</span>
              </div>
              <span className="engine-info">{t('records.engineInfo')}</span>
            </div>

            {/* Page Header Hierarchy */}
            <header className="records-page-header">
              <h1 className="records-hero-title">{t('records.heroTitle')}</h1>
              <p className="records-hero-subtitle-hi">{t('records.heroSubtitleHi')}</p>
              <p className="records-hero-desc">{t('records.heroDesc')}</p>
            </header>

            {/* Section Divider */}
            <div className="records-divider"></div>

            {/* Upload Capture Panel */}
            <section className="upload-panel">
              <div className="upload-panel-inner">
                <div className="upload-info-block">
                  <div className="upload-icon-box">
                    <span className="material-symbols-outlined upload-camera-icon">photo_camera</span>
                  </div>
                  <div className="upload-text-box">
                    <h2 className="upload-title">{t('records.uploadTitle')}</h2>
                    <p className="upload-subtitle-hi">{t('records.uploadSubtitleHi')}</p>
                    <div className="upload-note-box">
                      <span className="material-symbols-outlined note-shield-icon">verified_user</span>
                      <span>{t('records.uploadNote')}</span>
                    </div>
                  </div>
                </div>

                <div className="upload-action-box">
                  <input type="file" id="camera-input" className="hidden-input" accept="image/*,application/pdf" capture="environment" />
                  <label htmlFor="camera-input" className="btn-take-photo focus-ring">
                    <span className="material-symbols-outlined btn-photo-icon">add_a_photo</span>
                    <span>{t('records.btnPhoto')}</span>
                  </label>
                  <button type="button" className="btn-browse-files focus-ring" onClick={() => document.getElementById('camera-input').click()}>
                    <span className="material-symbols-outlined btn-browse-icon">folder_open</span>
                    <span>{t('records.btnBrowse')}</span>
                  </button>
                </div>
              </div>

              <div className="upload-assurance">
                <div className="assurance-left">
                  <span className="assurance-secure">{t('records.secureSync')}</span>
                  <span className="assurance-sep">•</span>
                  <span className="assurance-abdm">{t('records.abdmNote')}</span>
                </div>
                <span className="assurance-encryption">{t('records.encryption')}</span>
              </div>
            </section>

            <div className="records-divider"></div>

            {/* Clinical Verification Affirmation */}
            <div className="records-verification">
              <span className="material-symbols-outlined verification-icon">info</span>
              <p className="verification-text">
                <strong>{t('records.verificationNote')}</strong> {t('records.verificationDesc')}
              </p>
            </div>

            {/* Primary Bottom Step Flow Actions */}
            <section className="records-actions-bottom">
              <button type="button" className="btn-skip-records focus-ring" onClick={handleNext}>
                <span className="skip-arrow">←</span>
                <span>{t('records.btnSkip')}</span>
              </button>
              <button type="button" className="btn-continue-records focus-ring" onClick={handleNext}>
                <span>{t('records.btnContinue')}</span>
              </button>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="records-footer">
        <div className="records-footer-border"></div>
        <div className="records-footer-inner">
          <div className="records-footer-left">
            <span className="footer-title-records">Hospital Triage Registry</span>
            <span className="footer-sep-records">•</span>
            <span className="footer-sub-records">SWISS CLINICAL INTERFACE STANDARDS</span>
          </div>
          <a href="tel:01126588500" className="btn-emergency-records focus-ring">
            <span className="material-symbols-outlined emergency-icon-records">emergency</span>
            <span className="emergency-text-records">{t('records.emergencyText')}</span>
            <span className="emergency-number-records">{t('records.emergencyNumber')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
