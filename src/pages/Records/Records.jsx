import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Records.css';

export default function Records({ onNavigate, email, patientId, patient, medicalHistory }) {
  const { currentLangObj, openLanguageModal, t } = useLanguage();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('auto');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const removeFile = (indexToRemove) => {
    setFiles((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSkip = (e) => {
    if (e) e.preventDefault();
    if (onNavigate) {
      onNavigate('story', { email, patientId, patient, medicalHistory });
    }
  };

  const handleNext = async (e) => {
    if (e) e.preventDefault();

    if (files.length === 0) {
      return handleSkip(e);
    }

    setIsUploading(true);
    const formData = new FormData();
    files.forEach((file) => {
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
        onNavigate('story', { email, patientId, patient, medicalHistory });
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
      {/* Header matching InformedConsent */}
      <header className="records-header">
        <div className="records-header-inner">
          <div className="records-header-left">
            <div className="brand-logo-wrap" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src="/assets/logo.svg" 
                alt="AyuLekha" 
                className="records-brand-logo" 
                style={{ height: '40px', width: 'auto' }}
              />
              <div className="records-header-context-box">
                <span className="records-brand-title">
                  {t('informedConsent.brandTitle') || 'AyuLekha'}
                </span>
                <span className="records-brand-sub font-mono" style={{ fontSize: '11px', color: '#5C6172', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {t('records.brandSub') || 'AIIMS OPD • BLOCK B • ROOM 104'}
                </span>
              </div>
            </div>
          </div>

          <div className="records-header-right">
            <button
              type="button"
              className="lang-toggle font-mono"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(26,92,56,0.08)',
                border: '1.5px solid #1A5C38',
                borderRadius: '8px',
                fontWeight: 'bold',
                color: '#1A5C38',
                fontSize: '13px',
              }}
              onClick={openLanguageModal}
              title={t('selectLanguage') || 'Select Language'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                translate
              </span>
              <span>{currentLangObj?.nativeName || 'Language'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_drop_down
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="records-main">
        <div className="records-content-wrapper">
          <div className="records-inner-flex">
            {/* Page Header Hierarchy */}
            <header className="records-page-header">
              <h1 className="records-hero-title">{t('records.heroTitle')}</h1>
              <p className="records-hero-desc">{t('records.heroDesc')}</p>
            </header>

            {/* Section Divider */}
            <div className="records-divider"></div>

            {/* Upload Capture Panel */}
            <section className="upload-panel">
              {/* Header inside panel */}
              <div className="upload-header-row">
                <div className="upload-info-block">
                  <div className="upload-icon-box">
                    <span className="material-symbols-outlined upload-camera-icon">
                      photo_camera
                    </span>
                  </div>
                  <div className="upload-text-box">
                    <h2 className="upload-title">{t('records.uploadTitle')}</h2>
                    <div className="upload-note-box">
                      <span className="material-symbols-outlined note-shield-icon">
                        verified_user
                      </span>
                      <span>{t('records.uploadNote')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* OCR Engine / Document Type Selector */}
              <div className="ocr-engine-selector-wrap">
                <span className="ocr-label font-mono">Select Document Type:</span>
                <div className="ocr-engine-selector">
                  <button
                    type="button"
                    className={`ocr-type-btn ${documentType === 'auto' ? 'active' : ''}`}
                    onClick={() => setDocumentType('auto')}
                  >
                    <span className="material-symbols-outlined">auto_awesome</span>
                    <span>Auto (Mixed)</span>
                  </button>
                  <button
                    type="button"
                    className={`ocr-type-btn ${documentType === 'lab_report' ? 'active' : ''}`}
                    onClick={() => setDocumentType('lab_report')}
                  >
                    <span className="material-symbols-outlined">description</span>
                    <span>Printed / PDF (PaddleOCR)</span>
                  </button>
                  <button
                    type="button"
                    className={`ocr-type-btn ${documentType === 'prescription' ? 'active' : ''}`}
                    onClick={() => setDocumentType('prescription')}
                  >
                    <span className="material-symbols-outlined">draw</span>
                    <span>Handwritten (TrOCR)</span>
                  </button>
                </div>
              </div>

              {/* Dedicated Upload Dropzone (guarantees buttons stay firmly inside the box) */}
              <div
                className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  id="camera-input"
                  className="hidden-input"
                  accept="image/*,application/pdf"
                  multiple
                  onChange={handleFileChange}
                />
                <div className="dropzone-content">
                  <div className="dropzone-icon-circle">
                    <span className="material-symbols-outlined dropzone-icon">
                      cloud_upload
                    </span>
                  </div>
                  <p className="dropzone-instruction">
                    Drag and drop your prescriptions or reports here, or choose an option below
                  </p>
                  <div className="upload-action-buttons">
                    <label htmlFor="camera-input" className="btn-take-photo focus-ring">
                      <span className="material-symbols-outlined btn-photo-icon">
                        add_a_photo
                      </span>
                      <span>{t('records.btnPhoto')}</span>
                    </label>
                    <button
                      type="button"
                      className="btn-browse-files focus-ring"
                      onClick={() => document.getElementById('camera-input').click()}
                    >
                      <span className="material-symbols-outlined btn-browse-icon">
                        folder_open
                      </span>
                      <span>{t('records.btnBrowse')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Uploaded Files Preview */}
              {files.length > 0 && (
                <div className="records-preview-container">
                  <div className="preview-heading font-mono">
                    Ready to Upload ({files.length} {files.length === 1 ? 'file' : 'files'}):
                  </div>
                  <div className="preview-cards-list">
                    {files.map((file, i) => (
                      <div key={i} className="file-preview-card">
                        <span className="material-symbols-outlined file-type-icon">
                          {file.type.includes('pdf') ? 'picture_as_pdf' : 'image'}
                        </span>
                        <div className="file-info-col">
                          <span className="file-name" title={file.name}>
                            {file.name}
                          </span>
                          <span className="file-size font-mono">
                            {(file.size / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <button
                          type="button"
                          className="file-remove-btn"
                          onClick={() => removeFile(i)}
                          title="Remove file"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security and ABDM Vault Assurance Banner */}

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
              <button
                type="button"
                className="btn-skip-records focus-ring"
                onClick={handleSkip}
              >
                <span className="skip-arrow">←</span>
                <span>{t('records.btnSkip')}</span>
              </button>
              <button
                type="button"
                className="btn-continue-records focus-ring"
                onClick={handleNext}
                disabled={isUploading}
              >
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
            <span className="material-symbols-outlined emergency-icon-records">
              emergency
            </span>
            <span className="emergency-text-records">{t('records.emergencyText')}</span>
            <span className="emergency-number-records">{t('records.emergencyNumber')}</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
