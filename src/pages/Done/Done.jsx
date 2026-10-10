import { useLanguage } from '../../contexts/LanguageContext';
import './Done.css';

export default function Done({ onNavigate }) {
  const { language, openLanguageModal, LANGUAGES, t } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

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
            <button 
              type="button" 
              className="done-lang-switcher"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: '#f1f5f9', border: '2px solid #000', borderRadius: '8px', fontWeight: 'bold' }}
              onClick={openLanguageModal}
              title="Select Language"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>translate</span>
              <span>{currentLangObj.nativeName}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_drop_down</span>
            </button>

            {/* Listen / Audio Assistant */}
            <button className="listen-btn-done focus-ring" title={t('listen') || 'Listen'}>
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
          </div>

          {/* CALM STATUS BLOCK */}
          <div className="done-status-block">
            <div className="status-header">
              <span className="material-symbols-outlined status-icon">schedule</span>
              <span className="status-title">{t('done.tokenStatus')}</span>
            </div>
            
            <div className="status-wait-box">
              <p className="wait-en">{t('done.waitText1')}</p>
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
            </div>

            <div className="optional-actions">
              <button 
                className="btn-add-records focus-ring" 
                type="button"
                onClick={() => onNavigate && onNavigate('dashboard')}
                style={{ backgroundColor: '#4a2c4e', color: 'white' }}
              >
                <span className="material-symbols-outlined">dashboard</span>
                <span>Go to Dashboard</span>
              </button>

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
