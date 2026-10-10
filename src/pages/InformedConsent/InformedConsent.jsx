import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './InformedConsent.css';

export default function InformedConsent({ onNavigate, email, patientId, patient, medicalHistory }) {
  const { language, openLanguageModal, LANGUAGES, t } = useLanguage();
  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const [consentEHR, setConsentEHR] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');

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

  const handleConsentSubmission = async () => {
    if (!consentEHR || !consentVoice) {
      setShowValidationHint(true);
      setTimeout(() => setShowValidationHint(false), 2500);
      return;
    }

    setShowValidationHint(false);
    setApiError('');
    setIsSubmitting(true);

    try {
      // Use the verified email as the identifier for this session.
      const patientIdentifier = email || 'GUEST';

      const response = await fetch(
        '/api/patients/consent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            patientId: patientIdentifier,
            consent: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Consent submission failed');
      }

      console.log('Consent saved:', data);

      // Carry the verified email to the next page.
      if (onNavigate) {
        onNavigate('records', {
          email: email,
          patientId: patientIdentifier,
          patient: patient,
          medicalHistory: medicalHistory,
        });
      }
    } catch (error) {
      console.error('Consent backend error:', error);
      setApiError(
        error.message || 'Unable to save clinical consent. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="brand-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/assets/logo.svg" 
                alt="AyuLekha" 
                className="brand-logo-img" 
                style={{ height: '40px', width: 'auto' }}
              />
              <div className="header-brand-text">
                <span className="brand-title">
                  {t('informedConsent.brandTitle') || 'AyuLekha'}
                </span>
                <span className="brand-sub font-mono" style={{ fontSize: '11px', color: '#5C6172', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('informedConsent.brandSub') || 'AIIMS OPD • BLOCK B • ROOM 104'}
                </span>
              </div>
            </div>
          </div>

          <div className="header-right">

            <button
              type="button"
              className="lang-toggle font-mono"
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'rgba(26,92,56,0.08)', border: '1.5px solid #1A5C38', borderRadius: '8px', fontWeight: 'bold', color: '#1A5C38', fontSize: '13px' }}
              onClick={openLanguageModal}
              title="Select Language"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>translate</span>
              <span>{currentLangObj.nativeName}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_drop_down</span>
            </button>


          </div>
        </div>

      </header>

      <main className="consent-main">
        <div className="consent-content">

          {/* Top Bar */}
          <div className="registry-top-bar">

          </div>


          {/* Intro Section */}
          <div className="intro-section">
            <div className="intro-title-group">
              <h1 className="intro-title">
                {t('informedConsent.introTitle')}
              </h1>
            </div>

            <p className="intro-desc">
              {t('informedConsent.introDesc')}
            </p>


          </div>



          {/* Consent Items */}
          <div className="consent-items-list">

            {/* Item 1 */}
            <div className="consent-item">
              <label
                className="custom-checkbox-wrapper"
                htmlFor="consent-ehr"
              >
                <input
                  type="checkbox"
                  id="consent-ehr"
                  className="sr-only"
                  checked={consentEHR}
                  onChange={(e) =>
                    setConsentEHR(e.target.checked)
                  }
                />

                <div
                  className={`custom-checkbox ${consentEHR ? 'checked' : ''
                    } ${showValidationHint && !consentEHR
                      ? 'error-ring'
                      : ''
                    }`}
                >
                  <span className="material-symbols-outlined check-icon">
                    check
                  </span>
                </div>
              </label>

              <div className="consent-item-content">
                <div className="item-header">
                  <label
                    htmlFor="consent-ehr"
                    className="item-title-label"
                  >
                    <span className="item-title-en">
                      {t('informedConsent.ehrTitle')}
                    </span>
                  </label>


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


              </div>
            </div>

            <div className="divider my-xl"></div>

            {/* Item 2 */}
            <div className="consent-item">
              <label
                className="custom-checkbox-wrapper"
                htmlFor="consent-voice"
              >
                <div
                  className={`custom-checkbox ${consentVoice ? 'checked' : ''
                    } ${showValidationHint && !consentVoice
                      ? 'error-ring'
                      : ''
                    }`}
                >
                  <input
                    type="checkbox"
                    id="consent-voice"
                    className="sr-only"
                    checked={consentVoice}
                    onChange={(e) =>
                      setConsentVoice(e.target.checked)
                    }
                  />

                  <span className="material-symbols-outlined check-icon">
                    check
                  </span>
                </div>
              </label>

              <div className="consent-item-content">
                <div className="item-header">
                  <label
                    htmlFor="consent-voice"
                    className="item-title-label"
                  >
                    <span className="item-title-en">
                      {t('informedConsent.voiceTitle')}
                    </span>
                  </label>


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

            {apiError && (
              <div
                className="font-mono"
                style={{
                  color: '#c0392b',
                  marginBottom: '8px',
                  fontSize: '13px',
                }}
              >
                ⚠ {apiError}
              </div>
            )}

            <button
              className="submit-consent-btn"
              onClick={handleConsentSubmission}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined spin-icon">
                    progress_activity
                  </span>

                  <span>
                    {t('informedConsent.securingToken')}
                  </span>
                </>
              ) : (
                <>
                  <span>
                    {t('informedConsent.agreeContinue')}
                  </span>

                  <span className="arrow-icon font-mono">
                    &rarr;
                  </span>
                </>
              )}
            </button>

            <button
              className="paper-opt-out-btn"
              onClick={handlePaperOptOut}
            >
              {t('informedConsent.optOut')}
            </button>
          </div>

          {/* Telemetry Footer */}
          <div className="telemetry-footer">
            <div className="telemetry-left font-mono">
              <span className="material-symbols-outlined">
                verified
              </span>

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
            <span className="uppercase">
              {t('informedConsent.footerMeta1')}
            </span>

            <span className="dot-sep">•</span>

            <span>
              {t('informedConsent.footerMeta2')}
            </span>
          </div>

          <a
            href="tel:01126588500"
            className="emergency-call-btn"
          >
            <span className="material-symbols-outlined">
              emergency
            </span>

            <span className="em-text">
              {t('informedConsent.emText')}
            </span>

            <span className="em-num font-mono">
              {t('informedConsent.emNum')}
            </span>
          </a>
        </div>
      </footer>
    </div>
  );
}
