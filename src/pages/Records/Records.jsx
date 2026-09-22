import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import TimelineNav from '../../components/TimelineNav/TimelineNav';
import './Records.css';

export default function Records({ onNavigate, email, patientId }) {
  const { language, toggleLanguage, t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('auto');

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSkip = (e) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate('story', { email, patientId });
    }
  };

  const handleNext = async (e) => {
    e.preventDefault();
    
    if (files.length === 0) {
      return handleSkip(e);
    }

    setIsUploading(true);
    const formData = new FormData();
    files.forEach(file => {
      formData.append('records', file);
    });
    formData.append('document_type', documentType);

    try {
      const API_URL = import.meta.env.VITE_API_URL || '';
      const res = await fetch(`${API_URL}/api/patients/${patientId}/records`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }
      
      if (onNavigate) {
        onNavigate('story', { email, patientId });
      }
    } catch (err) {
      console.error(err);
      alert('Failed to upload records. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="records-container selection-primary">
      {/* Header */}
      <header className="records-header">
        <div className="records-header-inner">
          <div className="records-header-left">
            <img 
              src="https://lh3.googleusercontent.com/aida/AEtjO1XZ69-LGCVhZ83XHZZeJ82DIDbDEyAJn-bssTAgeeCQJe-NVhrm2iM8gXhDPUK5mFP3_uA00jwtBnwCYLPlhcdUb9IGffUq19O-ow7zHMUzLpHBduXH_ohhq0mVKTXScLgrPdPigtJgHsQbAUsv0jUqKZrIlVoO60-V7k6s87H-CXEu-0TSx88sApYX4XhYbx2-9M9lI3n2iNdFHd1PqRqGwTbvpLQn7RLX82v4BH8Xvl7PnF9EEvze7w" 
              alt="AyuLeakha" 
              className="records-brand-logo" 
            />
            <div className="records-header-context-box">
              <span className="records-brand-title">AyuLeakha</span>
              <span className="records-brand-sub">{t('records.brandSub')}</span>
            </div>
          </div>

          <div className="records-header-right">
            <button className="listen-btn-records focus-ring" type="button">
              <span className="material-symbols-outlined listen-icon-records">volume_up</span>
              <span className="listen-text-records">{t('records.listenAssist')}</span>
            </button>

            <div className="records-lang-switcher">
              <button className={`lang-btn-records focus-ring ${language === 'en' ? 'lang-active' : ''}`} type="button" onClick={() => toggleLanguage('en')}>EN</button>
              <span className="lang-sep-records">|</span>
              <button className={`lang-btn-records focus-ring ${language === 'hi' ? 'lang-active' : ''}`} type="button" onClick={() => toggleLanguage('hi')}>हिन्दी</button>
            </div>

            <div className="user-badge-records">
              <span className="material-symbols-outlined user-icon-records">person</span>
            </div>
          </div>
        </div>

        <TimelineNav currentStep="records" onNavigate={onNavigate} />
      </header>

      {/* Main Content */}
      <main className="records-main">
        <div className="records-content-wrapper">
          <div className="records-inner-flex">
            
            {/* Milestone Context Stamp */}
            <div className="records-milestone">
              <div className="milestone-left">
                <span className="milestone-dot"></span>
                <span className="milestone-text">{t('records.stageInfo')}</span>
              </div>
              <span className="engine-info">{t('records.engineInfo')}</span>
            </div>

            {/* Page Header Hierarchy */}
            <header className="records-page-header">
              <h1 className="records-hero-title">{t('records.heroTitle')}</h1>
              <p className="records-hero-subtitle-hi">{t('records.heroSubtitleHi')}</p>
              <p className="records-hero-desc">{t('records.heroDesc')}</p>
            </header>

            {/* Section Divider */}
            <div className="records-divider"></div>

            {/* Upload Capture Panel */}
            <section className="upload-panel">
              <div className="upload-panel-inner">
                <div className="upload-info-block">
                  <div className="upload-icon-box">
                    <span className="material-symbols-outlined upload-camera-icon">photo_camera</span>
                  </div>
                  <div className="upload-text-box">
                    <h2 className="upload-title">{t('records.uploadTitle')}</h2>
                    <p className="upload-subtitle-hi">{t('records.uploadSubtitleHi')}</p>
                    <div className="upload-note-box">
                      <span className="material-symbols-outlined note-shield-icon">verified_user</span>
                      <span>{t('records.uploadNote')}</span>
                    </div>
                  </div>
                </div>

                <div className="ocr-engine-selector" style={{ marginTop: '16px', marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => setDocumentType('auto')} style={{ padding: '8px 12px', border: '1px solid #d8d3c8', borderRadius: '4px', background: documentType === 'auto' ? '#17613f' : '#fff', color: documentType === 'auto' ? '#fff' : '#2b3a67', cursor: 'pointer', fontWeight: 'bold' }}>
                    Auto (Mixed)
                  </button>
                  <button type="button" onClick={() => setDocumentType('lab_report')} style={{ padding: '8px 12px', border: '1px solid #d8d3c8', borderRadius: '4px', background: documentType === 'lab_report' ? '#17613f' : '#fff', color: documentType === 'lab_report' ? '#fff' : '#2b3a67', cursor: 'pointer', fontWeight: 'bold' }}>
                    Printed / PDF (PaddleOCR)
                  </button>
                  <button type="button" onClick={() => setDocumentType('prescription')} style={{ padding: '8px 12px', border: '1px solid #d8d3c8', borderRadius: '4px', background: documentType === 'prescription' ? '#17613f' : '#fff', color: documentType === 'prescription' ? '#fff' : '#2b3a67', cursor: 'pointer', fontWeight: 'bold' }}>
                    Handwritten (TrOCR)
                  </button>
                </div>

                <div className="upload-action-box">
                  <input 
                    type="file" 
                    id="camera-input" 
                    className="hidden-input" 
                    accept="image/*,application/pdf" 
                    multiple
                    onChange={handleFileChange}
                  />
                  <label htmlFor="camera-input" className="btn-take-photo focus-ring">
                    <span className="material-symbols-outlined btn-photo-icon">add_a_photo</span>
                    <span>{t('records.btnPhoto')}</span>
                  </label>
                  <button type="button" className="btn-browse-files focus-ring" onClick={() => document.getElementById('camera-input').click()}>
                    <span className="material-symbols-outlined btn-browse-icon">folder_open</span>
                    <span>{t('records.btnBrowse')}</span>
                  </button>
                </div>
              </div>

              {files.length > 0 && (
                <div className="records-preview-container" style={{ marginTop: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {files.map((file, i) => (
                    <div key={i} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '8px', background: '#fff' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {file.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                      </span>
                      <span style={{ fontSize: '14px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </span>
                      <button type="button" onClick={() => removeFile(i)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'red' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="upload-assurance">
                <div className="assurance-left">
                  <span className="assurance-secure">{t('records.secureSync')}</span>
                  <span className="assurance-sep">•</span>
                  <span className="assurance-abdm">{t('records.abdmNote')}</span>
                </div>
                <span className="assurance-encryption">{t('records.encryption')}</span>
              </div>
            </section>

            <div className="records-divider"></div>

            {/* Clinical Verification Affirmation */}
            <div className="records-verification">
              <span className="material-symbols-outlined verification-icon">info</span>
              <p className="verification-text">
                <strong>{t('records.verificationNote')}</strong> {t('records.verificationDesc')}
              </p>
            </div>

            {/* Primary Bottom Step Flow Actions */}
            <section className="records-actions-bottom">
              <button type="button" className="btn-skip-records focus-ring" onClick={handleSkip}>
                <span className="skip-arrow">←</span>
                <span>{t('records.btnSkip')}</span>
              </button>
              <button type="button" className="btn-continue-records focus-ring" onClick={handleNext} disabled={isUploading}>
                <span>{isUploading ? 'Uploading...' : t('records.btnContinue')}</span>
              </button>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="records-footer">
        <div className="records-footer-border"></div>
        <div className="records-footer-inner">
          <div className="records-footer-left">
            <span className="footer-title-records">Hospital Triage Registry</span>
            <span className="footer-sep-records">•</span>
            <span className="footer-sub-records">SWISS CLINICAL INTERFACE STANDARDS</span>
          </div>
          <a href="tel:01126588500" className="btn-emergency-records focus-ring">
            <span className="material-symbols-outlined emergency-icon-records">emergency</span>
            <span className="emergency-text-records">{t('records.emergencyText')}</span>
            <span className="emergency-number-records">{t('records.emergencyNumber')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
