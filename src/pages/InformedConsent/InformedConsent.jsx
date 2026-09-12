import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './InformedConsent.css';

export default function InformedConsent({ onNavigate }) {
  const { t } = useLanguage();
  const [consentEHR, setConsentEHR] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Audio states
  const [playingAudio1, setPlayingAudio1] = useState(false);
  const [playingAudio2, setPlayingAudio2] = useState(false);

  const toggleAudio1 = () => {
    if (!playingAudio1) {
      setPlayingAudio1(true);
      setTimeout(() => setPlayingAudio1(false), 18000);
    } else {
      setPlayingAudio1(false);
    }
  };

  const toggleAudio2 = () => {
    if (!playingAudio2) {
      setPlayingAudio2(true);
      setTimeout(() => setPlayingAudio2(false), 14000);
    } else {
      setPlayingAudio2(false);
    }
  };

  const handleConsentSubmission = () => {
    if (!consentEHR || !consentVoice) {
      setShowValidationHint(true);
      setTimeout(() => setShowValidationHint(false), 2500);
      return;
    }

    setShowValidationHint(false);
    setIsSubmitting(true);

    setTimeout(() => {
      if (onNavigate) onNavigate('story');
    }, 900);
  };

  const handlePaperOptOut = () => {
    if (window.confirm(t('informedConsent.optOutPrompt'))) {
      alert(t('informedConsent.optOutAlert'));
    }
  };

  return (
    <div className="consent-container">
      <header className="consent-header-wrapper">
        <div className="consent-header">
          <div className="header-left">
            <span className="material-symbols-outlined brand-icon-small">add</span>
            <div className="header-brand-text">
              <span className="brand-title">{t('informedConsent.brandTitle')}</span>
              <span className="brand-sub font-mono">{t('informedConsent.brandSub')}</span>
            </div>
          </div>
          <div className="header-right">
            <button className="listen-assist-btn font-mono">
              <span className="material-symbols-outlined">volume_up</span>
              {t('informedConsent.listenAssist')}
            </button>
            <div className="lang-toggle font-mono">
              <span className="active">EN</span> | <span>हिन्दी</span> | <span>বাংলা</span>
            </div>
            <div className="user-icon">
              <span className="material-symbols-outlined">person</span>
            </div>
          </div>
        </div>

        <div className="header-divider">
          <div className="progress-nav-container">
            <nav className="progress-nav">
              <a href="#" className="nav-item">{t('informedConsent.nav1')}</a>
              <a href="#" className="nav-item active">{t('informedConsent.nav2')}</a>
              <a href="#" className="nav-item">{t('informedConsent.nav3')}</a>
              <a href="#" className="nav-item">{t('informedConsent.nav4')}</a>
            </nav>
          </div>
        </div>
      </header>

      <main className="consent-main">
        <div className="consent-content">
          {/* Top Bar */}
          <div className="registry-top-bar">
            <div className="stage-info font-mono">
              <span className="dot"></span>
              {t('informedConsent.stageInfo')}
            </div>
            <div className="registry-ref font-mono">
              {t('informedConsent.registryRef')}
            </div>
          </div>

          <div className="divider"></div>

          {/* Intro Section */}
          <div className="intro-section">
            <div className="intro-title-group">
              <h1 className="intro-title">{t('informedConsent.introTitle')}</h1>
            </div>
            <p className="intro-desc">
              {t('informedConsent.introDesc')}
            </p>
            <div className="admin-stamp font-mono">
              <span className="stamp-badge">
                <span className="material-symbols-outlined">verified_user</span>
                {t('informedConsent.stampBadge')}
              </span>
              <span className="stamp-text">{t('informedConsent.stampText')}</span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Consent Items */}
          <div className="consent-items-list">

            {/* Item 1 */}
            <div className="consent-item">
              <label className="custom-checkbox-wrapper" htmlFor="consent-ehr">
                <input
                  type="checkbox"
                  id="consent-ehr"
                  className="sr-only"
                  checked={consentEHR}
                  onChange={(e) => setConsentEHR(e.target.checked)}
                />
                <div className={`custom-checkbox ${consentEHR ? 'checked' : ''} ${showValidationHint && !consentEHR ? 'error-ring' : ''}`}>
                  <span className="material-symbols-outlined check-icon">check</span>
                </div>
              </label>
              <div className="consent-item-content">
                <div className="item-header">
                  <label htmlFor="consent-ehr" className="item-title-label">
                    <span className="item-title-en">{t('informedConsent.ehrTitle')}</span>
                  </label>
                  <button className={`audio-btn font-mono ${playingAudio1 ? 'playing' : ''}`} onClick={toggleAudio1}>
                    {playingAudio1 ? (
                      <>
                        <span className="material-symbols-outlined spin-icon">sync</span>
                        {t('informedConsent.playingAudio1')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">play_circle</span>
                        {t('informedConsent.listenAudio1')}
                      </>
                    )}
                  </button>
                </div>
                <ul className="item-desc-list">
                  <li>
                    <span className="list-num font-mono">01.</span>
                    <span>{t('informedConsent.ehrL1')}</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">02.</span>
                    <span>{t('informedConsent.ehrL2')}</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">03.</span>
                    <span>{t('informedConsent.ehrL3')}</span>
                  </li>
                </ul>
                <div className="item-footer font-mono">
                  <span className="material-symbols-outlined">lock</span>
                  {t('informedConsent.ehrScope')}
                </div>
              </div>
            </div>

            <div className="divider my-xl"></div>

            {/* Item 2 */}
            <div className="consent-item">
              <label className="custom-checkbox-wrapper" htmlFor="consent-voice">


                <div className={`custom-checkbox ${consentVoice ? 'checked' : ''} ${showValidationHint && !consentVoice ? 'error-ring' : ''}`}>
                  <input
                    type="checkbox"
                    id="consent-voice"
                    className="sr-only"
                    checked={consentVoice}
                    onChange={(e) => setConsentVoice(e.target.checked)

                    }
                  />
                  <span className="material-symbols-outlined check-icon">check</span>
                </div>
              </label>
              <div className="consent-item-content">
                <div className="item-header">
                  <label htmlFor="consent-voice" className="item-title-label">
                    <span className="item-title-en">{t('informedConsent.voiceTitle')}</span>
                  </label>
                  <button className={`audio-btn font-mono ${playingAudio2 ? 'playing' : ''}`} onClick={toggleAudio2}>
                    {playingAudio2 ? (
                      <>
                        <span className="material-symbols-outlined spin-icon">sync</span>
                        {t('informedConsent.playingAudio2')}
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">play_circle</span>
                        {t('informedConsent.listenAudio2')}
                      </>
                    )}
                  </button>
                </div>
                <ul className="item-desc-list">
                  <li>
                    <span className="list-num font-mono">01.</span>
                    <span>{t('informedConsent.voiceL1')}</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">02.</span>
                    <span>{t('informedConsent.voiceL2')}</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">03.</span>
                    <span>{t('informedConsent.voiceL3')}</span>
                  </li>
                </ul>
                <div className="item-footer font-mono">
                  <span className="material-symbols-outlined">shield</span>
                  {t('informedConsent.voicePrivacy')}
                </div>
              </div>
            </div>

          </div>

          <div className="divider"></div>

          {/* Action Area */}
          <div className="action-area">
            {showValidationHint && (
              <div className="validation-hint font-mono">
                {t('informedConsent.validationHint')}
              </div>
            )}

            <button
              className="submit-consent-btn"
              onClick={handleConsentSubmission}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined spin-icon">progress_activity</span>
                  <span>{t('informedConsent.securingToken')}</span>
                </>
              ) : (
                <>
                  <span>{t('informedConsent.agreeContinue')}</span>
                  <span className="arrow-icon font-mono">&rarr;</span>
                </>
              )}
            </button>

            <button className="paper-opt-out-btn" onClick={handlePaperOptOut}>
              {t('informedConsent.optOut')}
            </button>
          </div>

          {/* Telemetry Footer */}
          <div className="telemetry-footer">
            <div className="telemetry-left font-mono">
              <span className="material-symbols-outlined">verified</span>
              {t('informedConsent.telemetryLeft')}
            </div>
            <div className="telemetry-right font-mono">
              {t('informedConsent.telemetryRight')}
            </div>
          </div>

        </div>
      </main>

      <footer className="fixed-bottom-footer">
        <div className="divider"></div>
        <div className="bottom-footer-content">
          <div className="footer-meta font-mono">
            <span className="uppercase">{t('informedConsent.footerMeta1')}</span>
            <span className="dot-sep">•</span>
            <span>{t('informedConsent.footerMeta2')}</span>
          </div>
          <a href="tel:01126588500" className="emergency-call-btn">
            <span className="material-symbols-outlined">emergency</span>
            <span className="em-text">{t('informedConsent.emText')}</span>
            <span className="em-num font-mono">{t('informedConsent.emNum')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
