import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './RapidTriage.css';

export default function RapidTriage({ onNavigate }) {
  const { t } = useLanguage();

  const symptoms = [
    {
      id: 'chest-pain',
      icon: 'cardiology',
      name: t('rapidTriage.symptoms.chestPainName'),
      desc: t('rapidTriage.symptoms.chestPainDesc'),
    },
    {
      id: 'breathing',
      icon: 'pulmonology',
      name: t('rapidTriage.symptoms.breathingName'),
      desc: t('rapidTriage.symptoms.breathingDesc'),
    },
    {
      id: 'bleeding',
      icon: 'bloodtype',
      name: t('rapidTriage.symptoms.bleedingName'),
      desc: t('rapidTriage.symptoms.bleedingDesc'),
    },
    {
      id: 'unconscious',
      icon: 'neurology',
      name: t('rapidTriage.symptoms.unconsciousName'),
      desc: t('rapidTriage.symptoms.unconsciousDesc'),
    },
    {
      id: 'injury',
      icon: 'personal_injury',
      name: t('rapidTriage.symptoms.injuryName'),
      desc: t('rapidTriage.symptoms.injuryDesc'),
    },
  ];

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
          <span className="dot">•</span> {t('rapidTriage.headerLeft')}
        </div>
        <div className="triage-header-right font-mono">
          {t('rapidTriage.headerRight')}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="triage-progress font-mono">
        <div className="progress-step active">{t('rapidTriage.progress00')}</div>
        <div className="progress-step">{t('rapidTriage.progress01')}</div>
        <div className="progress-step">{t('rapidTriage.progress02')}</div>
        <div className="progress-step">{t('rapidTriage.progress03')}</div>
      </div>

      {/* Main Content */}
      <main className="triage-main">
        <div className="critical-badge font-mono">
          <span className="material-symbols-outlined">warning</span>
          {t('rapidTriage.criticalBadge')}
        </div>

        <h1 className="triage-title">
          {t('rapidTriage.title')}
        </h1>

        <p className="triage-desc">
          {t('rapidTriage.desc')}
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
                    <strong>{item.name}</strong>
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
            {t('rapidTriage.emergencyBtn')}
          </button>

          <button 
            className="continue-btn" 
            type="button"
            onClick={proceedToIntake}
          >
            <span>{t('rapidTriage.continueBtn')}</span>
            <span className="continue-arrow">&rarr;</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="triage-footer">
        <div className="footer-left">
          <div className="footer-directorate font-mono">
            <span className="dot">•</span> {t('rapidTriage.footerDirectorate')}
          </div>
          <div className="footer-address">
            {t('rapidTriage.footerAddress')}
          </div>
          <div className="footer-note">
            {t('rapidTriage.footerNote')}
          </div>
        </div>
        <div className="footer-right font-mono">
          <div className="redline-label">{t('rapidTriage.redlineLabel')}</div>
          <div className="redline-number">{t('rapidTriage.redlineNumber')}</div>
          <div className="rev-info">{t('rapidTriage.revInfo')}</div>
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
                  <span className="modal-supertitle font-mono">{t('rapidTriage.modalSupertitle')}</span>
                  <h2 className="modal-title">{t('rapidTriage.modalTitle')}</h2>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)} type="button">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <div className="modal-divider"></div>
            
            <div className="modal-body">
              <p className="modal-symptom-tag">
                {t('rapidTriage.modalFlagged')} {selectedSymptoms.length > 0 ? selectedSymptoms.join(', ') : ''}
              </p>
              <p>
                {t('rapidTriage.modalDesc')}
              </p>
              
              <div className="modal-info-box">
                <div className="modal-info-row">
                  <span className="info-label">{t('rapidTriage.modalCounterLabel')}</span>
                  <span className="info-value font-mono">{t('rapidTriage.modalCounterValue')}</span>
                </div>
                <div className="modal-info-row">
                  <span className="info-label">{t('rapidTriage.modalDoctorLabel')}</span>
                  <span className="info-value font-mono">{t('rapidTriage.modalDoctorValue')}</span>
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
                {t('rapidTriage.modalNotifyBtn')}
              </button>
              <button className="cancel-return-btn" onClick={() => setShowModal(false)} type="button">
                {t('rapidTriage.modalCancelBtn')}
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
