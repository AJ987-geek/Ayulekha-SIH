import { useState, useEffect } from 'react';
import './EmergencyActive.css';

// Reusing symptoms definition to lookup the labels
const symptomsConfig = {
  'chest-pain': { en: 'Chest pain or pressure', hi: 'सीने में दर्द या भारीपन' },
  'breathing': { en: 'Difficulty breathing', hi: 'सांस लेने में अत्यधिक कठिनाई' },
  'bleeding': { en: 'Heavy bleeding', hi: 'अत्यधिक रक्तस्राव या लगातार खून बहना' },
  'unconscious': { en: 'Unconsciousness', hi: 'बेहोशी या अचेत अवस्था' },
  'injury': { en: 'Severe injury', hi: 'गंभीर चोट, हड्डी टूटना या गहरा घाव' }
};

export default function EmergencyActive({ symptoms = [] }) {
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
                <span className="brand-badge font-mono">AIIMS Emergency Dispatch</span>
              </div>
              <span className="brand-subtitle">आयुर्लेखा · आपातकालीन सहायता सेवा</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="status-badge font-mono">
              <span className="pulse-dot"></span>
              <span>DISPATCH SENT · {time}</span>
            </div>
            <div className="code-red-badge font-mono">
              <span className="material-symbols-outlined">notifications_active</span>
              <span>CODE RED ACTIVE</span>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <section className="hero-banner">
          <h1 className="hero-title">Help is on the way</h1>
          <p className="hero-subtitle">मदद आ रही है</p>
          <p className="hero-desc-en">
            We have alerted the medical staff. Please stay where you are — someone is coming to you.
          </p>
          <p className="hero-desc-hi">
            हमने मेडिकल स्टाफ को सूचित कर दिया है। कृपया आप जहां हैं वहीं रहें — कोई आपके पास आ रहा है।
          </p>
        </section>

        {/* Grid Layout */}
        <div className="emergency-grid">
          {/* Left Column */}
          <div className="grid-left">
            {/* Reported Symptoms */}
            <div className="symptoms-section">
              <div className="section-header font-mono">
                <span>You told us / आपने बताया</span>
                <span className="tag-id">EMR TAG #089 · TRIAGE SEC 2</span>
              </div>
              
              <div className="symptoms-list-active">
                {reportedSymptoms.map(id => {
                  const data = symptomsConfig[id] || { en: 'Immediate clinical evaluation', hi: 'त्वरित नैदानिक ​​मूल्यांकन' };
                  return (
                    <div key={id} className="symptom-item">
                      <div>
                        <span className="symptom-en">{data.en}</span>
                        <span className="symptom-hi">{data.hi}</span>
                      </div>
                      <span className="priority-badge font-mono">Priority 1</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinical Guidance */}
            <div className="guidance-section">
              <div className="section-header font-mono">
                <span>While you wait / प्रतीक्षा करते समय</span>
              </div>
              
              <div className="guidance-list">
                <div className="guidance-item">
                  <span className="guidance-num font-mono">01</span>
                  <div>
                    <p className="guidance-en">Sit or lie down in a comfortable position.</p>
                    <p className="guidance-hi">आरामदायक स्थिति में बैठें या लेट जाएं।</p>
                  </div>
                </div>
                <div className="guidance-item">
                  <span className="guidance-num font-mono">02</span>
                  <div>
                    <p className="guidance-en">Do not walk or exert yourself.</p>
                    <p className="guidance-hi">चलने या खुद पर ज़ोर डालने से बचें।</p>
                  </div>
                </div>
                <div className="guidance-item">
                  <span className="guidance-num font-mono">03</span>
                  <div>
                    <p className="guidance-en">Keep your mobile phone nearby and audible.</p>
                    <p className="guidance-hi">अपना फोन पास रखें और आवाज़ खुली रखें।</p>
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
                  <span className="location-label font-mono">Your Registered Location / स्थान</span>
                  <span className="location-val-en">OPD Waiting Hall 2 · Bay 4</span>
                  <span className="location-val-hi">ओपीडी प्रतीक्षालय 2 · बे 4</span>
                </div>
                <div className="queue-info">
                  <span className="location-label font-mono">Queue PIN</span>
                  <span className="queue-pin font-mono">T-104</span>
                </div>
              </div>
              
              <div className="response-unit">
                <span className="pulse-dot"></span>
                <div>
                  <span className="unit-title">Rapid Response Team Alpha Dispatched</span>
                  <span className="unit-desc font-mono">Attending: Casualty Nurse + Triage Lead</span>
                </div>
              </div>
            </div>

            {/* Direct Call Trigger */}
            <a href="tel:01126588500" className="call-trigger">
              <svg fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <div className="call-text">
                <span className="call-en">Call Casualty Desk directly: 011-26588500 / 102</span>
                <span className="call-hi">सीधे इमरजेंसी डेस्क को कॉल करें</span>
              </div>
            </a>

            {/* Escalate Card */}
            <div className="escalate-card font-mono">
              <div className="escalate-row">
                <span>EMERGENCY DISPATCH ID</span>
                <strong>#AIIMS-RED-8094</strong>
              </div>
              <div className="escalate-row">
                <span>ESCORT PROTOCOL</span>
                <span className="highlight-primary">WHEELCHAIR + STRETCHER</span>
              </div>
              <div className="escalate-row">
                <span>ESTIMATED REACH</span>
                <span className="highlight-brick">UNDER 2 MINUTES</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="emergency-footer font-mono">
          <p>AIIMS Central Triage Dispatch · Automated Code Red Notification Active · Terminal #D-04</p>
          <p>System Synchronized · Security &amp; Medical Personnel Notified</p>
        </footer>
      </main>
    </div>
  );
}
