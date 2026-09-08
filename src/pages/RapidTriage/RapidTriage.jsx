import { useState } from 'react';
import './RapidTriage.css';

const symptoms = [
  {
    id: 'chest-pain',
    icon: 'cardiology',
    en: 'Chest pain',
    hi: 'सीने में तेज़ दर्द या भारी दबाव',
    desc: 'Acute heaviness, radiating arm/jaw pressure, or choking tightness',
  },
  {
    id: 'breathing',
    icon: 'pulmonology',
    en: 'Difficulty breathing',
    hi: 'सांस लेने में भारी तकलीफ़ या दम घुटना',
    desc: 'Severe breathlessness, gasping, or inability to articulate full sentences',
  },
  {
    id: 'bleeding',
    icon: 'bloodtype',
    en: 'Heavy bleeding',
    hi: 'अत्यधिक रक्तस्राव या लगातार खून बहना',
    desc: 'Uncontrolled active bleeding from trauma, recent surgical site, or coughing blood',
  },
  {
    id: 'unconscious',
    icon: 'neurology',
    en: 'Unconsciousness',
    hi: 'बेहोशी या अचेत अवस्था',
    desc: 'Fainting, sudden collapse, acute disorientation, or unresponsiveness',
  },
  {
    id: 'injury',
    icon: 'personal_injury',
    en: 'Severe injury',
    hi: 'गंभीर चोट, हड्डी टूटना या गहरा घाव',
    desc: 'Major roadside accident, acute limb fracture, direct head impact, or severe burns',
  },
];

export default function RapidTriage({ onNavigate }) {
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const toggleSymptom = (id) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleEmergencyClick = () => {
    setShowModal(true);
  };

  const proceedToIntake = () => {
    setToastMessage('Triage clear. Transferring to Step 01: Patient Identity...');
    setTimeout(() => {
      setToastMessage('');
      if (onNavigate) onNavigate('identity');
    }, 2400);
  };

  return (
    <div className="triage-container relative">
      {/* Top Header */}
      <header className="triage-header">
        <div className="triage-header-left font-mono">
          <span className="dot">•</span> GATE ZERO · RAPID CLINICAL TRIAGE / त्वरित आपातकालीन जांच
        </div>
        <div className="triage-header-right font-mono">
          ESTIMATED TIME: 15 SECONDS
        </div>
      </header>

      {/* Progress Bar */}
      <div className="triage-progress font-mono">
        <div className="progress-step active">00 TRIAGE</div>
        <div className="progress-step">01 YOU</div>
        <div className="progress-step">02 CONSENT</div>
        <div className="progress-step">03 DOCTOR</div>
      </div>

      {/* Main Content */}
      <main className="triage-main">
        <div className="critical-badge font-mono">
          <span className="material-symbols-outlined">warning</span>
          CRITICAL ASSESSMENT / आपातकालीन सुरक्षा जांच
        </div>

        <h1 className="triage-title">
          Do you have any of these right now?<br />
          <span className="triage-title-hindi">क्या आपको अभी इनमें से कोई गंभीर समस्या या आपात स्थिति है?</span>
        </h1>

        <p className="triage-desc">
          Just a quick safety check before we begin. Most people don't have any of these — if that's you, tap Continue.
          <span className="triage-desc-hindi">शुरू करने से पहले बस एक त्वरित सुरक्षा जांच। अधिकांश लोगों में इनमें से कोई लक्षण नहीं होता — यदि आपके साथ भी ऐसा है, तो 'आगे बढ़ें' पर टैप करें।</span>
        </p>

        <div className="symptoms-list">
          {symptoms.map((item) => {
            const isSelected = selectedSymptoms.includes(item.id);
            return (
              <button 
                key={item.id} 
                className={`symptom-card ${isSelected ? 'selected' : ''}`} 
                type="button"
                onClick={() => toggleSymptom(item.id)}
              >
                <div className="symptom-checkbox">
                  <div className={`checkbox-square ${isSelected ? 'checked' : ''}`}>
                    {isSelected && <span className="material-symbols-outlined">check</span>}
                  </div>
                </div>
                <div className="symptom-icon">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="symptom-content">
                  <div className={`symptom-name ${isSelected ? 'selected-text' : ''}`}>
                    <strong>{item.en}</strong> / {item.hi}
                  </div>
                  <div className="symptom-detail">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        <div className="triage-bottom-buttons">
          <button className="emergency-btn" type="button" onClick={handleEmergencyClick}>
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>emergency</span>
            Emergency — get help now / आपातकालीन सहायता प्राप्त करें
          </button>

          <button 
            className="continue-btn" 
            type="button"
            onClick={proceedToIntake}
          >
            <span>None of these — Continue / इनमें से कोई नहीं — आगे बढ़ें</span>
            <span className="continue-arrow">&rarr;</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="triage-footer">
        <div className="footer-left">
          <div className="footer-directorate font-mono">
            <span className="dot">•</span> CASUALTY &amp; TRAUMA DIRECTORATE · आपातकालीन विभाग
          </div>
          <div className="footer-address">
            AIIMS Casualty Gate 1 · Ground Floor · Direct Triage Counter 104-A
          </div>
          <div className="footer-note">
            No pre-booked appointment or Aadhaar card is required for Level 1/2 acute emergency attention. Direct stretcher access at Porch 1.
          </div>
        </div>
        <div className="footer-right font-mono">
          <div className="redline-label">RAPID REDLINE DIRECT</div>
          <div className="redline-number">Dial 102 / 011-26588500</div>
          <div className="rev-info">REV: 2024.11-CLINICAL</div>
        </div>
      </footer>

      {/* Emergency Modal */}
      {showModal && (
        <div className="emergency-modal-overlay">
          <div className="emergency-modal-content">
            <div className="modal-header">
              <div className="modal-title-group">
                <span className="material-symbols-outlined modal-alert-icon" style={{fontVariationSettings: "'FILL' 1"}}>crisis_alert</span>
                <div>
                  <span className="modal-supertitle font-mono">CRITICAL CLINICAL OVERRIDE</span>
                  <h2 className="modal-title">Emergency Attention Initiated</h2>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)} type="button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-divider"></div>
            
            <div className="modal-body">
              <p className="modal-symptom-tag">
                Flagged: {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : 'Immediate clinical evaluation requested'}
              </p>
              <p>
                Please move immediately to <strong>Casualty Gate 1 (आपातकालीन वार्ड 1)</strong> located on the Ground Floor directly behind this kiosk station.
              </p>
              
              <div className="modal-info-box">
                <div className="modal-info-row">
                  <span className="info-label">Triage Station Counter:</span>
                  <span className="info-value font-mono">Desk 104-A (Direct Entry)</span>
                </div>
                <div className="modal-info-row">
                  <span className="info-label">Attending Resident on Duty:</span>
                  <span className="info-value font-mono">Dr. V. Sharma (Trauma Lead)</span>
                </div>
              </div>
            </div>
            
            <div className="modal-footer-actions">
              <button 
                className="notify-ward-btn" 
                type="button"
                onClick={() => {
                  setShowModal(false);
                  if (onNavigate) onNavigate('emergency', { symptoms: selectedSymptoms });
                }}
              >
                <span className="material-symbols-outlined">notifications_active</span>
                Notify Casualty Ward Staff
              </button>
              <button className="cancel-return-btn" onClick={() => setShowModal(false)} type="button">
                Cancel &amp; Return
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span className="material-symbols-outlined">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
