import { useEffect, useState } from 'react';
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

export default function DoctorSummary({ summary, patientId, onComplete }) {
  const [records, setRecords] = useState([]);
  const API_URL = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    if (patientId) {
      fetch(`${API_URL}/api/patients/${patientId}/records`)
        .then(res => res.json())
        .then(data => {
          if (data.records) setRecords(data.records);
        })
        .catch(err => console.error('Failed to fetch records:', err));
    }
  }, [patientId, API_URL]);

  const speak = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance('This patient-reported summary is now visible to the doctor.'));
    }
  };

  return (
    <main className="doctor-page">
      <header className="doctor-header-glass">
        <div className="doctor-header-inner">
          <div className="header-brand">
            <span className="material-symbols-outlined logo-icon">medical_services</span>
            <strong>AyuLekha</strong>
          </div>
          <span className="badge-session">PHYSICIAN VIEW · SECURE SESSION</span>
        </div>
      </header>
      
      <div className="doctor-layout">
        <section className="doctor-main-content">
          <div className="doctor-banner">
            <div className="banner-left">
              <span className="material-symbols-outlined banner-icon">verified_user</span>
              <span>PATIENT CONFIRMED</span>
            </div>
            <button onClick={speak} className="btn-privacy">
              <span className="material-symbols-outlined">volume_up</span> Read privacy notice
            </button>
          </div>
          
          <div className="title-area">
            <h1>Clinical Intake Summary</h1>
            <p className="disclaimer">
              <span className="material-symbols-outlined icon-small">info</span>
              Patient-reported information. Clinical assessment remains the physician’s responsibility.
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
              <p>{summary.clinicalNote}</p>
            </div>
          </div>

          <div className="summary-grid">
            <article className="summary-card highlight-card">
              <div className="card-header">
                <span className="material-symbols-outlined">emergency</span>
                <h2>Chief Complaint</h2>
              </div>
              <p>{summary.chiefComplaint}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">timeline</span>
                <h2>History of Present Illness (SOCRATES)</h2>
              </div>
              <p>{summary.hpi}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">history</span>
                <h2>Past Medical History</h2>
              </div>
              <p>{summary.pastMedicalHistory}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">family_history</span>
                <h2>Family History</h2>
              </div>
              <p>{summary.familyHistory}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">group</span>
                <h2>Social History</h2>
              </div>
              <p>{summary.socialHistory}</p>
            </article>
            <article className="summary-card">
              <div className="card-header">
                <span className="material-symbols-outlined">body_system</span>
                <h2>Review of Systems</h2>
              </div>
              <p>{summary.reviewOfSystems}</p>
            </article>
          </div>
        </section>

        {records.length > 0 && (
          <aside className="doctor-sidebar">
            <div className="sidebar-header">
              <span className="material-symbols-outlined">folder_shared</span>
              <h2>Parsed Documents & Histories</h2>
            </div>
            <div className="records-list">
              {records.map((doc, idx) => (
                <div key={idx} className="digitized-doc-card">
                  <div className="doc-card-header">
                    <span className="material-symbols-outlined doc-icon">description</span>
                    <h3>{doc.filename}</h3>
                    <span className="page-badge">{doc.page_count} pages</span>
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

      <footer className="doctor-footer">
        <button className="new-session-btn focus-ring" onClick={onComplete}>
          <span className="material-symbols-outlined">check_circle</span>
          Complete & Erase Session
        </button>
        <p className="erase-note">This action clears the in-memory summary and begins a new blank interview. No patient data is permanently stored on this device.</p>
      </footer>
    </main>
  );
}
