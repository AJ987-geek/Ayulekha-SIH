import { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './EmergencyActive.css';

export default function EmergencyActive({ symptoms = [] }) {
  const { t } = useLanguage();
  const [time, setTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTime(`${hours}:${minutes}:${seconds}`);
    };
    const timer = setInterval(updateClock, 1000);
    updateClock();
    return () => clearInterval(timer);
  }, []);

  const reportedSymptoms = symptoms.length > 0 ? symptoms : ['chest-pain']; // fallback if empty

  return (
    <div className="emergency-canvas">
      <main className="emergency-main">
        {/* Desktop Top Branding & Status Bar */}
        <header className="emergency-header">
          <div className="header-left">
            <div className="brand-icon" aria-hidden="true">
              <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="12" x2="12" y1="5" y2="19"></line>
                <line x1="5" x2="19" y1="12" y2="12"></line>
              </svg>
            </div>
            <div>
              <div className="brand-title-row">
                <span className="brand-name">AyuLekha</span>
                <span className="brand-badge font-mono">{t('emergencyActive.brandBadge')}</span>
              </div>
              <span className="brand-subtitle">{t('emergencyActive.brandSubtitle')}</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="status-badge font-mono">
              <span className="pulse-dot"></span>
              <span>{t('emergencyActive.dispatchSent')} · {time}</span>
            </div>
            <div className="code-red-badge font-mono">
              <span className="material-symbols-outlined">notifications_active</span>
              <span>{t('emergencyActive.codeRed')}</span>
            </div>
          </div>
        </header>

        <section className="hero-banner">
          <h1 className="hero-title">{t('emergencyActive.heroTitle')}</h1>
          <p className="hero-desc-en">
            {t('emergencyActive.heroDesc')}
          </p>
        </section>

        {/* Grid Layout */}
        <div className="emergency-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Reported Symptoms */}
            <div className="symptoms-section">
              <div className="section-header font-mono">
                <span>{t('emergencyActive.youToldUs')}</span>
                <span className="tag-id">{t('emergencyActive.emrTag')}</span>
              </div>
              
              <div className="symptoms-list-active">
                {reportedSymptoms.map(id => {
                  let symptomName = t('emergencyActive.immediateEval');
                  if (id === 'chest-pain') symptomName = t('rapidTriage.symptoms.chestPainName');
                  if (id === 'breathing') symptomName = t('rapidTriage.symptoms.breathingName');
                  if (id === 'bleeding') symptomName = t('rapidTriage.symptoms.bleedingName');
                  if (id === 'unconscious') symptomName = t('rapidTriage.symptoms.unconsciousName');
                  if (id === 'injury') symptomName = t('rapidTriage.symptoms.injuryName');
                  
                  return (
                    <div key={id} className="symptom-item">
                      <div>
                        <span className="symptom-en">{symptomName}</span>
                      </div>
                      <span className="priority-badge font-mono">{t('emergencyActive.priority')}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinical Guidance */}
            <div className="guidance-section">
              <div className="section-header font-mono">
                <span>{t('emergencyActive.whileYouWait')}</span>
              </div>
              
              <div className="guidance-list">
                <div className="guidance-item">
                  <span className="guidance-num font-mono">01</span>
                  <div>
                    <p className="guidance-en">{t('emergencyActive.guidance1')}</p>
                  </div>
                </div>
                <div className="guidance-item">
                  <span className="guidance-num font-mono">02</span>
                  <div>
                    <p className="guidance-en">{t('emergencyActive.guidance2')}</p>
                  </div>
                </div>
                <div className="guidance-item">
                  <span className="guidance-num font-mono">03</span>
                  <div>
                    <p className="guidance-en">{t('emergencyActive.guidance3')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="grid-right">
            {/* Location & Queue */}
            <div className="location-card">
              <div className="location-header">
                <div>
                  <span className="location-label font-mono">{t('emergencyActive.locationLabel')}</span>
                  <span className="location-val-en">{t('emergencyActive.locationVal')}</span>
                </div>
                <div className="queue-info">
                  <span className="location-label font-mono">{t('emergencyActive.queuePinLabel')}</span>
                  <span className="queue-pin font-mono">T-104</span>
                </div>
              </div>
              
              <div className="response-unit">
                <span className="pulse-dot"></span>
                <div>
                  <span className="unit-title">{t('emergencyActive.unitTitle')}</span>
                  <span className="unit-desc font-mono">{t('emergencyActive.unitDesc')}</span>
                </div>
              </div>
            </div>

            {/* Direct Call Trigger */}
            <a href="tel:01126588500" className="call-trigger">
              <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <div className="call-text">
                <span className="call-en">{t('emergencyActive.callText')}</span>
              </div>
            </a>

            {/* Escalate Card */}
            <div className="escalate-card font-mono">
              <div className="escalate-row">
                <span>{t('emergencyActive.escalate1')}</span>
                <strong>#AIIMS-RED-8094</strong>
              </div>
              <div className="escalate-row">
                <span>{t('emergencyActive.escalate2')}</span>
                <span className="highlight-primary">{t('emergencyActive.escalate2Val')}</span>
              </div>
              <div className="escalate-row">
                <span>{t('emergencyActive.escalate3')}</span>
                <span className="highlight-brick">{t('emergencyActive.escalate3Val')}</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="emergency-footer font-mono">
          <p>{t('emergencyActive.footer1')}</p>
          <p>{t('emergencyActive.footer2')}</p>
        </footer>
      </main>
    </div>
  );
}
