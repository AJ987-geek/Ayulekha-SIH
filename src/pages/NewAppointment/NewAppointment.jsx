import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePatient } from '../../contexts/PatientContext';
import { saveStory } from '../../api';
import './NewAppointment.css';

export default function NewAppointment({ onNavigate }) {
  const { t } = useLanguage();
  const { patient } = usePatient();
  const [isTextMode, setIsTextMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [symptomsText, setSymptomsText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const handleMicMouseDown = () => {
    setIsRecording(true);
  };

  const handleMicMouseUp = () => {
    setIsRecording(false);
    setShowTranscript(true);
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setSaveError('');
    setIsSaving(true);
    try {
      const patientId = patient?.id || 'GUEST';
      const story = symptomsText || t('yourStory.transcriptEn') || 'Voice narrative recorded';
      const symptoms = [];
      await saveStory(patientId, story, symptoms);
      if (onNavigate) onNavigate('dashboard');
    } catch (err) {
      setSaveError(err.message || 'Failed to save story. Please try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="story-container">
      {/* Top Global Header */}
      <header className="story-header">
        <div className="story-header-inner">
          <div className="story-header-left">
            <img
              src="https://lh3.googleusercontent.com/aida/AEtjO1WsmWm1b7dSIe0kmK-rc-_LIXyDScv_VWCU3xv3WQuNLdpL6-gjkhlrbb44rh9lvIozRSFtDSd_OCrjR6_C6RbXNWGIFLv2mqcZkO_eDqJhE4gnQh8AIKIKYuXOkncgudqzoPzHLtcEsAVcBq9xEz66WgMK58JBTyL3Y3wcOMDaCYR2ynibKHZD-8yROJZdYRR_2IXRuwPn1sZgeWt_sQvCLgw5CsyaS7fWfVeh6NfpTkAZ9pqEdJkIZQ"
              alt="AyuLeakha"
              className="story-brand-logo"
            />
            <div className="story-header-divider"></div>
            <div className="story-header-context">
              {t('yourStory.brandSub')}
            </div>
          </div>

          <div className="story-header-right">
            <div className="story-lang-switcher">
              <span className="lang-en">EN</span>
              <span className="lang-sep">|</span>
              <button className="lang-btn focus-ring">हिन्दी</button>
              <span className="lang-sep">|</span>
              <button className="lang-btn focus-ring">বাংলা</button>
            </div>

            <button className="listen-btn focus-ring">
              <svg className="listen-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
              </svg>
              <span>{t('yourStory.listenAssist')}</span>
            </button>

            <div className="user-badge">
              <span className="status-dot"></span>
              <span>
                {t('yourStory.tokenPrefix')}{' '}
                <strong className="token-strong">
                  {patient ? `#${patient.id}` : '#B-42'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav Rail */}
      <nav className="story-nav-rail" aria-label="Clinical Intake Progress">
        <div className="nav-rail-inner">
          <div className="nav-rail-meta">
            <div>{t('yourStory.stageInfo')}</div>
            <div>{t('yourStory.registryRef')}</div>
          </div>

          <div className="nav-rail-track-container">
            <div className="track-bg"></div>
            <div className="track-fill"></div>

            <div className="stage-completed">
              <svg className="stage-completed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>{t('yourStory.nav1')}</span>
            </div>

            <div className="stage-completed">
              <svg className="stage-completed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>{t('yourStory.nav2')}</span>
            </div>

            <div className="stage-active">
              <div className="stage-active-dot"></div>
              <div className="stage-active-content">
                <svg className="stage-active-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <span>{t('yourStory.nav3')}</span>
              </div>
            </div>

            <div className="stage-upcoming">
              <svg className="stage-upcoming-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>{t('yourStory.nav4')}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="story-main">

        <div className="story-hero">
          <div className="hero-meta">
            <span>NEW APPOINTMENT</span>
            <span className="meta-dot">•</span>
            <span className="meta-highlight">
              {isTextMode ? t('yourStory.textNarrativeMode') : t('yourStory.voiceNarrativeMode')}
            </span>
          </div>
          <h1 className="hero-title">
            What brings you here today?
          </h1>
          <p className="hero-subtitle">
            {isTextMode ? 'Please type your symptoms below.' : 'Hold the microphone and describe your symptoms.'}
          </p>
        </div>

        {isTextMode ? (
          <div className="story-text-section">
            <textarea
              className="symptoms-textarea focus-ring"
              placeholder={t('yourStory.textareaPlaceholder')}
              value={symptomsText}
              onChange={(e) => setSymptomsText(e.target.value)}
            ></textarea>
          </div>
        ) : (
          <>
            <div className="story-mic-section">
              <div className="mic-wrapper">
                {isRecording && <div className="mic-pulse-ring pulse-ring"></div>}

                <button
                  type="button"
                  className="mic-btn focus-ring"
                  aria-label="Hold to speak your medical history"
                  onMouseDown={handleMicMouseDown}
                  onMouseUp={handleMicMouseUp}
                  onMouseLeave={handleMicMouseUp}
                  onTouchStart={handleMicMouseDown}
                  onTouchEnd={handleMicMouseUp}
                >
                  <svg className="mic-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                  </svg>
                  <span className="mic-label">{t('yourStory.micLabel')}</span>
                </button>
              </div>

              <div className="mic-instructions">
                <span className="instructions-primary">{t('yourStory.instructionsPrimary')}</span>
                <span className="instructions-secondary">{t('yourStory.instructionsSecondary')}</span>
              </div>

              <div className="waveform" aria-hidden="true" style={{ opacity: isRecording ? 1 : 0.3 }}>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.1s', height: '12px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.3s', height: '20px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.15s', height: '32px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.45s', height: '16px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.2s', height: '36px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.5s', height: '24px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.25s', height: '40px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.05s', height: '28px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.4s', height: '36px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.6s', height: '20px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.35s', height: '32px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.1s', height: '16px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.55s', height: '24px' }}></span>
                <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.2s', height: '12px' }}></span>
              </div>
            </div>

            {(showTranscript || isRecording) && <div className="divider"></div>}

            {(showTranscript || isRecording) && (
              <div className="story-transcript">
                <div className="transcript-status">
                  <span className="status-pulse-dot"></span>
                  <span>{t('yourStory.listening')}</span>
                  <span className="meta-dot">•</span>
                  <span>{t('yourStory.dialect')}</span>
                </div>

                <div className="transcript-text-container">
                  <p className="transcript-text-hi">
                    {t('yourStory.transcriptHi')}
                  </p>
                  <p className="transcript-text-en">
                    {t('yourStory.transcriptEn')}
                  </p>
                </div>

                <div className="transcript-tags">
                  <span className="tags-label">{t('yourStory.tagsLabel')}</span>
                  <span className="tag-item">#DryCough (5d)</span>
                  <span className="tag-item">#NocturnalDyspnea</span>
                  <span className="tag-item">#ChestTightness</span>
                  <span className="tag-item">#LowGradePyrexia</span>
                </div>
              </div>
            )}
          </>
        )}

        <div className="story-actions">
          {saveError && (
            <div className="font-mono" style={{ color: '#c0392b', marginBottom: '8px', fontSize: '13px' }}>
              ⚠ {saveError}
            </div>
          )}

          <div className="action-links">
            <button
              type="button"
              className="action-link focus-ring"
              onClick={() => setIsTextMode(!isTextMode)}
            >
              {isTextMode ? t('yourStory.voiceInstead') : t('yourStory.typeInstead')}
            </button>
          </div>

          <button
            type="button"
            className="action-continue-btn focus-ring"
            onClick={handleContinue}
            disabled={isSaving}
          >
            {isSaving ? 'Scheduling…' : 'Schedule Appointment'}
          </button>
        </div>
      </main>

      {/* Bottom Global Sticky Emergency Bar */}
      <footer className="story-footer">
        <div className="footer-inner">
          <div className="footer-compliance">
            <svg className="compliance-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>{t('yourStory.footerCompliance')}</span>
          </div>

          <a href="#" className="footer-emergency-btn focus-ring">
            <svg className="emergency-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>{t('yourStory.footerEmergency')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
