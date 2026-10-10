import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Header({ onNavigate }) {
  const { openLanguageModal, currentLangObj, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (page) => {
    setMobileMenuOpen(false);
    if (onNavigate) onNavigate(page);
  };

  return (
    <>
      <header className="site-header">
        {/* Left: Mobile hamburger & Logo */}
        <div className="header-left-cluster">
          <button
            type="button"
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          <a 
            href="#portal" 
            className="logo-wrap"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('portal');
            }}
          >
            <div className="logo-icon">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none"/>
                <circle cx="11" cy="11" r="5.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.2" fill="none"/>
                <line x1="11" y1="1" x2="11" y2="5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="11" y1="17" x2="11" y2="21" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1" y1="11" x2="5" y2="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="17" y1="11" x2="21" y2="11" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="11" cy="11" r="2" fill="#E8631A"/>
              </svg>
            </div>
            <div className="logo-text">
              <span className="logo-name">AyuLekha</span>
              <span className="logo-tagline">
                {t('portal.tagline', 'National Digital Health Mission | Govt. of India')}
              </span>
            </div>
          </a>
        </div>

        {/* Desktop Nav */}
        <nav className="site-nav">
          <a 
            href="#portal" 
            className="active"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('portal');
            }}
          >
            {t('portal.portalHome', 'Portal Home')}
          </a>
          <a 
            href="#records"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('records');
            }}
          >
            {t('portal.healthRecords', 'Health Records')}
          </a>
          <a 
            href="#appointments"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('new-appointment');
            }}
          >
            {t('portal.appointments', 'Appointments')}
          </a>
          <a 
            href="#doctor"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('doctor-dashboard');
            }}
          >
            {t('portal.doctorPortal', 'Doctor Portal')}
          </a>
        </nav>

        {/* Actions */}
        <div className="header-actions">
          <a href="tel:1075" className="helpline-btn" title="24/7 Helpline: 1075">
            <span>📞</span>
            <span className="helpline-full-text">{t('portal.helplineText', '24/7 Helpline: 1075 (Toll-Free)')}</span>
            <span className="helpline-short-text">1075</span>
          </a>

          <button 
            type="button"
            className="lang-btn" 
            onClick={openLanguageModal}
            title={t('selectLanguage', 'Select Language')}
          >
            <span>🌐</span>
            <span className="lang-btn-text">{currentLangObj?.nativeName || 'English'} ▾</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="mobile-nav-backdrop" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-nav-header">
              <div className="logo-text">
                <span className="logo-name" style={{ color: '#fff' }}>AyuLekha</span>
                <span className="logo-tagline" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  {t('portal.tagline', 'National Digital Health Mission')}
                </span>
              </div>
              <button 
                type="button" 
                className="mobile-nav-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <nav className="mobile-nav-links">
              <a 
                href="#portal" 
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('portal');
                }}
              >
                <span>🏠</span>
                <span>{t('portal.portalHome', 'Portal Home')}</span>
              </a>
              <a 
                href="#records"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('records');
                }}
              >
                <span>📁</span>
                <span>{t('portal.healthRecords', 'Health Records')}</span>
              </a>
              <a 
                href="#appointments"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('new-appointment');
                }}
              >
                <span>📅</span>
                <span>{t('portal.appointments', 'Appointments')}</span>
              </a>
              <a 
                href="#doctor"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('doctor-dashboard');
                }}
              >
                <span>🩺</span>
                <span>{t('portal.doctorPortal', 'Doctor Portal')}</span>
              </a>
              <a 
                href="#register"
                className="mobile-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick('identity');
                }}
              >
                <span>🪪</span>
                <span>{t('siteFooter.citizenReg', 'Citizen Registration')}</span>
              </a>
            </nav>

            <div className="mobile-nav-footer">
              <button 
                type="button" 
                className="mobile-lang-trigger"
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLanguageModal();
                }}
              >
                <span>🌐 {t('selectLanguage', 'Select Language')}:</span>
                <strong>{currentLangObj?.nativeName || 'English'} ▾</strong>
              </button>

              <a href="tel:1075" className="mobile-helpline-link">
                <span>📞</span>
                <span>24/7 Helpline: 1075 (Toll-Free)</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Announcement Bar */}
      <div className="announcement-bar">
        <div className="badge">
          <span>🏛️</span>
          <span>
            {t('portal.badgeNdhm', 'National Digital Health Mission (NDHM) • Authorized Citizen Health Portal')}
          </span>
        </div>
        <div className="badge">
          <span>🔒</span>
          <span>
            {t('portal.badgeDpdp', 'DPDP Act 2023 Compliant • 256-Bit SSL')}
          </span>
        </div>
      </div>
    </>
  );
}
