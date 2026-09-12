import { useLanguage } from '../../contexts/LanguageContext';
import './Done.css';

export default function Done({ onNavigate }) {
  const { t } = useLanguage();

  return (
    <div className="done-container selection-rust">
      {/* TOP FIXED HEADER */}
      <header className="done-header">
        <div className="done-header-inner">
          {/* Left: Wordmark & Dept Room */}
          <div className="done-header-left">
            <div className="done-brand-box">
              <div className="done-brand-title">
                <span className="brand-dot"></span>
                <span>AyuLeakha</span>
              </div>
              <span className="done-brand-sub">{t('done.brandSub')}</span>
            </div>
          </div>

          {/* Right: Controls & Token Chip & Avatar */}
          <div className="done-header-right">
            {/* Language selector */}
            <div className="done-lang-switcher">
              <button type="button" className="lang-active">EN</button>
              <span className="lang-sep">/</span>
              <button type="button">हिन्दी</button>
              <span className="lang-sep">/</span>
              <button type="button">বাংলা</button>
            </div>

            {/* Listen / Audio Assistant */}
            <button className="listen-btn-done focus-ring" title="Listen / सुनें">
              <span className="material-symbols-outlined listen-icon-done">volume_up</span>
              <span className="listen-text-done">{t('done.listenAssist')}</span>
            </button>

            {/* Token Chip */}
            <div className="token-chip-done">
              <span className="token-text-done">{t('done.tokenPrefix')}</span>
            </div>

            {/* Avatar */}
            <div className="user-badge-done" title="Patient Avatar">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>

        {/* LEKHA RAIL */}
        <div className="done-rail-wrapper">
          <div className="done-rail-inner">
            <div className="done-rail-nav">
              
              <div className="nav-item-done completed">
                <span className="material-symbols-outlined check-icon">check</span>
                <span>{t('done.nav1')}</span>
              </div>
              <span className="nav-sep-done">•</span>

              <div className="nav-item-done completed">
                <span className="material-symbols-outlined check-icon">check</span>
                <span>{t('done.nav2')}</span>
              </div>
              <span className="nav-sep-done">•</span>

              <div className="nav-item-done completed">
                <span className="material-symbols-outlined check-icon">check</span>
                <span>{t('done.nav3')}</span>
              </div>
              <span className="nav-sep-done">•</span>

              <div className="nav-item-done completed">
                <span className="material-symbols-outlined check-icon">check</span>
                <span>{t('done.nav4')}</span>
              </div>
              <span className="nav-sep-done">•</span>

              <div className="nav-item-done completed">
                <span className="material-symbols-outlined check-icon">check</span>
                <span>{t('done.nav5')}</span>
              </div>
              <span className="nav-sep-done">•</span>

              <div className="nav-item-done active">
                <span className="active-dot"></span>
                <span className="active-text">{t('done.nav6')}</span>
                <div className="active-underline"></div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* MAIN EDITORIAL CONTENT */}
      <main className="done-main">
        <div className="done-content-wrapper">
          
          {/* Flat Confirmation Mark */}
          <div className="done-check-box">
            <div className="done-check-circle" aria-label="Completed checkmark">
              <span className="material-symbols-outlined done-check-icon">check</span>
            </div>
          </div>

          {/* Display Heading */}
          <div className="done-heading">
            <h1 className="done-title">{t('done.title')}</h1>
            <p className="done-subtitle">{t('done.subtitle')}</p>
          </div>

          {/* Supporting Reassurance Paragraph */}
          <div className="done-desc-box">
            <p className="desc-en">{t('done.desc1')}</p>
            <p className="desc-hi">{t('done.desc1Hi')}</p>
          </div>

          {/* CALM STATUS BLOCK */}
          <div className="done-status-block">
            <div className="status-header">
              <span className="material-symbols-outlined status-icon">schedule</span>
              <span className="status-title">{t('done.tokenStatus')}</span>
            </div>
            
            <div className="status-wait-box">
              <p className="wait-en">{t('done.waitText1')}</p>
              <p className="wait-hi">{t('done.waitText1Hi')}</p>
            </div>

            <div className="status-footer">
              <span className="footer-dot"></span>
              <span>{t('done.doctorNotified')}</span>
            </div>
          </div>

          {/* OPTIONAL SECTION */}
          <div className="done-optional-section">
            <div className="optional-text-box">
              <p className="opt-en">{t('done.optionalTitle')}</p>
              <p className="opt-hi">{t('done.optionalTitleHi')}</p>
            </div>

            <div className="optional-actions">
              <button 
                className="btn-add-records focus-ring" 
                type="button"
                onClick={() => onNavigate && onNavigate('records')}
              >
                <span className="material-symbols-outlined">add_a_photo</span>
                <span>{t('done.btnAddRecords')}</span>
              </button>

              <button className="btn-listen-done focus-ring" type="button">
                <span className="material-symbols-outlined listen-blue">volume_up</span>
                <span>{t('done.btnListen')}</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* PERSISTENT EMERGENCY ROW */}
      <footer className="done-footer">
        <div className="done-footer-inner">
          <div className="footer-left-done">
            <div className="emergency-icon-box">
              <span className="material-symbols-outlined emergency-cross">medical_services</span>
            </div>
            <span className="emergency-text-done">{t('done.emergencyText')}</span>
          </div>

          <div className="footer-right-done">
            <a href="tel:01126588500" className="helpline-link focus-ring">
              <span className="material-symbols-outlined call-icon">call</span>
              <span>{t('done.emergencyNumber')}</span>
            </a>
            <span className="helpline-sep">·</span>
            <span>{t('done.helpline')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
