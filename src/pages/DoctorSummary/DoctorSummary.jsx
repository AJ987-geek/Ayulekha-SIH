import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import './DoctorSummary.css';

const parseMarkdown = (text) => {
  if (!text) return { __html: '' };
  let html = text
    .replace(/^### (.*$)/gim, '<h4>$1</h4>')
    .replace(/^## (.*$)/gim, '<h3>$1</h3>')
    .replace(/^# (.*$)/gim, '<h2>$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^- (.*$)/gim, '<li>$1</li>');
  return { __html: html };
};

export default function DoctorSummary({ summary: initialSummary, patientId, patient: initialPatient, abha: initialAbha, onNavigate, onComplete }) {
  const API_URL = import.meta.env.VITE_API_URL || '';

  const [activeAbha, setActiveAbha] = useState(initialAbha || initialPatient?.abha || '2510991327');
  const [searchAbha, setSearchAbha] = useState(initialAbha || initialPatient?.abha || '2510991327');
  const [patientData, setPatientData] = useState(initialPatient || null);
  const [activeSummary, setActiveSummary] = useState(initialSummary || null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
const [qrDataUrl, setQrDataUrl] = useState('');
const [shareLoading, setShareLoading] = useState(false);
const [shareError, setShareError] = useState('');

  const fetchAbhaSummary = async (targetId) => {
    const id = (targetId || searchAbha || '').trim();
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/patients/${encodeURIComponent(id)}/summary`);
      if (!res.ok) throw new Error('Patient summary not found');
      const data = await res.json();
      setPatientData(data.patient);
      setActiveSummary(data.summary);
      setActiveAbha(id);
      setSearchAbha(id);
      if (data.records) setRecords(data.records);
    } catch (err) {
      console.error('Failed to load ABHA summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialSummary || !initialPatient) {
      fetchAbhaSummary(initialAbha || patientId || '2510991327');
    } else {
      if (initialAbha || patientId) {
        fetch(`${API_URL}/api/patients/${encodeURIComponent(initialAbha || patientId)}/records`)
          .then(res => res.json())
          .then(data => {
            if (data.records) setRecords(data.records);
          })
          .catch(err => console.error('Failed to fetch records:', err));
      }
    }
  }, [initialAbha, patientId, initialSummary]);

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance('This patient-reported summary is now visible to the doctor.'));
    }
  };
const handleGenerateQR = async () => {
  setShareLoading(true);
  setShareError('');
  setShareUrl('');
  setQrDataUrl('');

  try {
    const identifier =
      patientData?.abha ||
      activeAbha ||
      patientData?.id ||
      patientId;

    if (!identifier) {
      throw new Error('Please load a patient summary first.');
    }

    const response = await fetch(
      `${API_URL}/api/patients/${encodeURIComponent(identifier)}/share`,
      { method: 'POST' }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Unable to create share link.');
    }

    const qrImage = await QRCode.toDataURL(result.shareUrl);

    setShareUrl(result.shareUrl);
    setQrDataUrl(qrImage);
  } catch (error) {
    setShareError(error.message || 'Unable to generate QR code.');
  } finally {
    setShareLoading(false);
  }
};
  const summary = activeSummary || initialSummary || {};

  return (
    <main className="doctor-page">
      <header className="doctor-header-glass">
        <div className="doctor-header-inner">
          <div className="header-brand">
            <span className="material-symbols-outlined logo-icon">medical_services</span>
            <strong>AyuLekha</strong>
          </div>

          <div className="doctor-header-actions">
            <button
              type="button"
              className="btn-back-dashboard"
              onClick={() => onNavigate ? onNavigate('doctor-dashboard') : onComplete?.()}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Doctor Dashboard
            </button>

            <form
              className="doc-sum-search-wrap"
              onSubmit={(e) => {
                e.preventDefault();
                fetchAbhaSummary(searchAbha);
              }}
            >
              <span className="material-symbols-outlined doc-sum-search-icon">badge</span>
              <input
                type="text"
                className="doc-sum-input"
                placeholder="Lookup ABHA ID..."
                value={searchAbha}
                onChange={(e) => setSearchAbha(e.target.value)}
              />
              <button type="submit" disabled={loading} className="doc-sum-btn">
                {loading ? '...' : 'Load'}
              </button>
            </form>

            <span className="badge-session">PHYSICIAN VIEW · SECURE SESSION</span>
          </div>
        </div>
      </header>
      
      <div className="doctor-layout">
        <section className="doctor-main-content">
          {/* Patient Demographics Strip */}
          <div className="doctor-patient-strip">
            <div className="patient-strip-left">
              <span className="patient-strip-name">
                {patientData?.name || initialPatient?.name || 'Aayush Jain'}
              </span>
              <span className="patient-strip-badge">
                <span className="material-symbols-outlined icon-small">verified</span>
                ABHA: {patientData?.abha || activeAbha}
              </span>
            </div>
            <div className="patient-strip-right">
              <span className="patient-meta-pill">
                Age: {patientData?.age || initialPatient?.age || 32} · {patientData?.gender || initialPatient?.gender || 'Male'}
              </span>
              {(patientData?.allergies || initialPatient?.allergies) && (
                <span className="patient-allergy-alert">
                  Allergies: {patientData?.allergies || initialPatient?.allergies}
                </span>
              )}
            </div>
          </div>

          <div className="doctor-banner">
            <div className="banner-left">
              <span className="material-symbols-outlined banner-icon">verified_user</span>
              <span>PATIENT CONFIRMED · ABHA {patientData?.abha || activeAbha}</span>
            </div>
            <button onClick={speak} className="btn-privacy">
              <span className="material-symbols-outlined">volume_up</span> Read privacy notice
            </button>
          </div>
          
          <div className="title-area">
            <h1>Clinical Ready Intake Summary</h1>
            <p className="disclaimer">
              <span className="material-symbols-outlined icon-small">info</span>
              AI Intake &amp; Longitudinal Health Records compiled for attending physician review.
            </p>
          </div>
          
          <div className="triage-section">
            {summary.triageIndicators?.length > 0 && (
              <div className="triage-flags">
                {summary.triageIndicators.map((item) => (
                  <span className="triage-pill" key={item}>
                    <span className="material-symbols-outlined">warning</span> {item}
                  </span>
                ))}
              </div>
            )}
            <div className="clinical-note-card">
              <h2>Clinical AI Note</h2>
              <p>{summary.clinicalNote || 'Patient reported acute respiratory discomfort with insidious onset.'}</p>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card highlight-card">
              <div className="card-header">
                <span className="material-symbols-outlined">emergency</span>
                <h2>Chief Complaint</h2>
              </div>
              <p>{summary.chiefComplaint || 'Not reported'}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">timeline</span>
                <h2>History of Present Illness (SOCRATES)</h2>
              </div>
              <p>{summary.hpi || 'Not reported'}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">history</span>
                <h2>Past Medical History</h2>
              </div>
              <p>{summary.pastMedicalHistory || 'Not reported'}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">family_history</span>
                <h2>Family History</h2>
              </div>
              <p>{summary.familyHistory || 'Not reported'}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">group</span>
                <h2>Social History</h2>
              </div>
              <p>{summary.socialHistory || 'Not reported'}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">body_system</span>
                <h2>Review of Systems</h2>
              </div>
              <p>{summary.reviewOfSystems || 'Not reported'}</p>
            </article>
          </div>
        </section>

        {records.length > 0 && (
          <aside className="doctor-sidebar">
            <div className="sidebar-header">
              <span className="material-symbols-outlined">folder_shared</span>
              <h2>Parsed Documents &amp; Histories</h2>
            </div>
            <div className="records-list">
              {records.map((doc, idx) => (
                <div key={idx} className="digitized-doc-card">
                  <div className="doc-card-header">
                    <span className="material-symbols-outlined doc-icon">description</span>
                    <h3>{doc.filename}</h3>
                    <span className="page-badge">{doc.page_count || 1} pages</span>
                  </div>
                  {doc.summary && (
                    <div className="doc-summary-markdown">
                      <div dangerouslySetInnerHTML={parseMarkdown(doc.summary)} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>
<div className="summary-share-section">
  <h2>Share Clinical Summary</h2>
  <p>
    Generate a temporary link and QR code to share this summary.
  </p>

  <button
    type="button"
    className="generate-qr-btn"
    onClick={handleGenerateQR}
    disabled={shareLoading}
  >
    {shareLoading ? 'Generating...' : 'Generate QR Code'}
  </button>

  {shareError && (
    <p className="share-error" role="alert">
      {shareError}
    </p>
  )}

  {qrDataUrl && (
    <div className="summary-qr-result">
      <img
        src={qrDataUrl}
        alt="QR code for shared clinical summary"
        width="220"
        height="220"
      />

      <p>Scan this QR code to view the shared summary.</p>

      <p className="share-expiry-note">
        This share link expires after 15 minutes.
      </p>

      <a href={shareUrl} target="_blank" rel="noreferrer">
        Open shared summary
      </a>

      <button
        type="button"
        className="copy-share-link-btn"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(shareUrl);
          } catch {
            setShareError('Could not copy the link. Please copy it from the address manually.');
          }
        }}
      >
        Copy Share Link
      </button>
    </div>
  )}
</div>
      <footer className="doctor-footer">
        <button
          className="new-session-btn focus-ring"
          onClick={() => onNavigate ? onNavigate('doctor-dashboard') : onComplete?.()}
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Return to Doctor Dashboard
        </button>
        <p className="erase-note">Clinical ready summary generated by AI Intake. Linked to verified ABHA ID.</p>
      </footer>
    </main>
  );
}
