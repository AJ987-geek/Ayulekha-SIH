import { useState } from 'react';
import './InformedConsent.css';

export default function InformedConsent({ onNavigate }) {
  const [consentEHR, setConsentEHR] = useState(false);
  const [consentVoice, setConsentVoice] = useState(false);
  const [showValidationHint, setShowValidationHint] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
const [patientId, setPatientId] = useState('P001');
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
  setIsSubmitting(true);

  try {
    const response = await fetch(
      'http://localhost:5000/api/patients/consent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: patientId,
          consent: true,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Consent submission failed');
    }

    console.log('Consent saved:', data);

    // Move to Your Story only after backend confirms consent
    if (onNavigate) {
      onNavigate('story');
    }

  } catch (error) {
    console.error('Consent backend error:', error);
    alert('Unable to save clinical consent. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const handlePaperOptOut = () => {
    if (window.confirm('Do you wish to opt out of the digital locker intake and proceed with a physical paper stamp slip at the triage counter?')) {
      alert('Physical Slip Token issued: ROOM-104-SLIP-88. Please present this at Counter 03.');
    }
  };

  return (
    <div className="consent-container">
      <header className="consent-header-wrapper">
        <div className="consent-header">
          <div className="header-left">
            <span className="material-symbols-outlined brand-icon-small">add</span>
            <div className="header-brand-text">
              <span className="brand-title">AyuLeakha</span>
              <span className="brand-sub font-mono">AIIMS OPD • BLOCK B • ROOM 104</span>
            </div>
          </div>
          <div className="header-right">
            <button className="listen-assist-btn font-mono">
              <span className="material-symbols-outlined">volume_up</span>
              Listen Assist / सुनें
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
              <a href="#" className="nav-item">01 YOU</a>
              <a href="#" className="nav-item active">02 CONSENT</a>
              <a href="#" className="nav-item">03 YOUR STORY</a>
              <a href="#" className="nav-item">04 DOCTOR</a>
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
              Stage 02 of 04 • Informed Authorization
            </div>
            <div className="registry-ref font-mono">
              Registry Ref: ABDM-2025-DL-AIIMS-0982
            </div>
          </div>

          <div className="divider"></div>

          {/* Intro Section */}
          <div className="intro-section">
            <div className="intro-title-group">
              <h1 className="intro-title">Patient Data &amp; Clinical Consent</h1>
              <span className="intro-subtitle">मरीज डिजिटल सहमति पत्र</span>
            </div>
            <p className="intro-desc">
              Under the Digital Personal Data Protection (DPDP) Act 2023 and Ayushman Bharat Digital Mission (ABDM), your consent is explicitly requested and can be revoked at any time.
            </p>
            <div className="admin-stamp font-mono">
              <span className="stamp-badge">
                <span className="material-symbols-outlined">verified_user</span>
                DPDP 2023 PROTOCOL S.6(1)
              </span>
              <span className="stamp-text">Session validity: Room 104 • AIIMS New Delhi</span>
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
                    <span className="item-title-en">EHR &amp; Digital Health Locker Access</span>
                    <span className="item-title-hi"> / पुरानी जांच पर्ची व स्वास्थ्य लॉकर</span>
                  </label>
                  <button className={`audio-btn font-mono ${playingAudio1 ? 'playing' : ''}`} onClick={toggleAudio1}>
                    {playingAudio1 ? (
                      <>
                        <span className="material-symbols-outlined spin-icon">sync</span>
                        Playing audio guidance (18s) • रोकें
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">play_circle</span>
                        Listen to this / इसे सुनें (18s)
                      </>
                    )}
                  </button>
                </div>
                <ul className="item-desc-list">
                  <li>
                    <span className="list-num font-mono">01.</span>
                    <span>Allows your consulting doctor in Room 104 to review previous AIIMS blood tests, X-rays, and prescription records.</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">02.</span>
                    <span>Data is time-fenced strictly to today's outpatient encounter and auto-locks once consultation completes.</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">03.</span>
                    <span>You maintain unconditional ownership and can revoke access anytime via the ABDM national portal.</span>
                  </li>
                </ul>
                <div className="item-footer font-mono">
                  <span className="material-symbols-outlined">lock</span>
                  SCOPE: Read-only • Fast Healthcare Interoperability Resources (FHIR R4)
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
                    <span className="item-title-en">Voice Recording &amp; Clinical Symptom Transcription</span>
                    <span className="item-title-hi"> / आवाज रिकॉर्डिंग व लक्षण सारांश</span>
                  </label>
                  <button className={`audio-btn font-mono ${playingAudio2 ? 'playing' : ''}`} onClick={toggleAudio2}>
                    {playingAudio2 ? (
                      <>
                        <span className="material-symbols-outlined spin-icon">sync</span>
                        Playing audio guidance (14s) • रोकें
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined">play_circle</span>
                        Listen to this / इसे सुनें (14s)
                      </>
                    )}
                  </button>
                </div>
                <ul className="item-desc-list">
                  <li>
                    <span className="list-num font-mono">01.</span>
                    <span>Transcribes your spoken symptoms in Hindi, English, or vernacular dialect into a standardized clinical note.</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">02.</span>
                    <span>Raw audio is processed on secure AIIMS local infrastructure and permanently purged after clinical sign-off.</span>
                  </li>
                  <li>
                    <span className="list-num font-mono">03.</span>
                    <span>Your voice recordings are never sold, shared with insurers, or used for commercial AI model training.</span>
                  </li>
                </ul>
                <div className="item-footer font-mono">
                  <span className="material-symbols-outlined">shield</span>
                  PRIVACY: Edge computing transcription • Zero external model transmission
                </div>
              </div>
            </div>

          </div>

          <div className="divider"></div>

          {/* Action Area */}
          <div className="action-area">
            {showValidationHint && (
              <div className="validation-hint font-mono">
                Please review and tick both authorizations to proceed digitally.
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
                  <span>Securing Token • रिकॉर्ड अधिकृत किया जा रहा है...</span>
                </>
              ) : (
                <>
                  <span>I agree — continue / सहमति दें — आगे बढ़ें</span>
                  <span className="arrow-icon font-mono">&rarr;</span>
                </>
              )}
            </button>

            <button className="paper-opt-out-btn" onClick={handlePaperOptOut}>
              Opt out and use physical paper OPD slip instead (कागजी पर्ची पर जारी रखें)
            </button>
          </div>

          {/* Telemetry Footer */}
          <div className="telemetry-footer">
            <div className="telemetry-left font-mono">
              <span className="material-symbols-outlined">verified</span>
              ABDM M1, M2 &amp; M3 Certified • 256-bit Hardware-Enclave Encryption
            </div>
            <div className="telemetry-right font-mono">
              Consent Auto-Purge: 24h Post-Encounter
            </div>
          </div>

        </div>
      </main>

      <footer className="fixed-bottom-footer">
        <div className="divider"></div>
        <div className="bottom-footer-content">
          <div className="footer-meta font-mono">
            <span className="uppercase">Hospital Triage Registry</span>
            <span className="dot-sep">•</span>
            <span>SWISS CLINICAL INTERFACE STANDARDS</span>
          </div>
          <a href="tel:01126588500" className="emergency-call-btn">
            <span className="material-symbols-outlined">emergency</span>
            <span className="em-text">Emergency — get help now</span>
            <span className="em-num font-mono">011-26588500</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
