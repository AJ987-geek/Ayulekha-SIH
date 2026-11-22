import { useLanguage } from '../../contexts/LanguageContext';
import './Header.css';

export default function Header({ onNavigate }) {
  const { language, toggleLanguage, t } = useLanguage();

  const TICKER = t('ticker');

  return (
    <header className="header">
      <div className="header-inner">
        {/* Logo */}
        <div className="header-logo" onClick={() => onNavigate?.('portal')} style={{ cursor: 'pointer' }}>
          <div className="logo-icon font-mono">AYU</div>
          <div className="logo-text">
            <span className="name">{t('header.title')}</span>
            <span className="sub font-mono">{t('header.subtitle')}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="header-nav font-mono">
          <a className="nav-link active" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('portal'); }}>{t('header.nav.patientPortal')}</a>
          <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('dashboard'); }}>{t('header.nav.opdSchedule')}</a>
          <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('identity'); }}>{t('header.nav.verifyAbha')}</a>
          <a className="nav-link" href="#" onClick={(e) => { e.preventDefault(); onNavigate?.('new-appointment'); }}>{t('header.nav.clinicalGuidelines')}</a>
        </nav>

        {/* Right */}
        <div className="header-right">
          <div className="emergency-badge font-mono">
            <span className="em-label">{t('header.emergency')}</span>
            <span className="em-num">{t('header.emergencyNum')}</span>
          </div>
          <div className="lang-switch font-mono">
            <button 
              className={`lang-btn ${language === 'en' ? 'active' : ''}`}
              onClick={() => toggleLanguage('en')}
            >
              EN
            </button>
            <button 
              className={`lang-btn ${language === 'hi' ? 'active' : ''}`}
              onClick={() => toggleLanguage('hi')}
            >
              हिंदी
            </button>
          </div>
          <div className="user-avatar">
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>person</span>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <div className="ticker-bar font-mono">
        <div className="ticker-track">
          {Array.isArray(TICKER) && TICKER.map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="ticker-dot" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
