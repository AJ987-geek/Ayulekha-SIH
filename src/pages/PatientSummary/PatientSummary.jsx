import React, { useState, useEffect } from 'react';
import './PatientSummary.css';
import { doctorApi } from '../../api/doctorApi';

export default function PatientSummary({ onNavigate, patientId }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [toast, setToast] = useState(null);
  
  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let isMounted = true;
    
    const loadPatient = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [patientData, docsData, histData] = await Promise.all([
          doctorApi.getPatientDetails(patientId),
          doctorApi.getPatientDocuments(patientId).catch(() => []), // Fallback to empty array if endpoint missing
          doctorApi.getPatientHistory(patientId).catch(() => null) // Fallback to null if missing
        ]);
        
        if (isMounted) {
          setPatient(patientData);
          setDocuments(docsData || []);
          setHistory(histData);
        }
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Failed to load patient details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    if (patientId) {
      loadPatient();
    }
    
    return () => { isMounted = false; };
  }, [patientId]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDone = () => {
    setIsDone(true);
    showToast('✅ Consultation marked as done!', 'green');
    // Ideally call API to mark as done here
  };

  if (loading) {
    return <div className="ps-app" style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><p>Loading patient summary...</p></div>;
  }
  
  if (error) {
    return <div className="ps-app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px', gap: '10px' }}>
      <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>{error}</p>
      <button className="ps-bb-btn-outline" style={{width:'auto', padding:'0 20px'}} onClick={() => window.location.reload()}>Retry</button>
      <button className="ps-bb-btn-outline" style={{width:'auto', padding:'0 20px'}} onClick={() => onNavigate('doctor-dashboard')}>Back</button>
    </div>;
  }

  if (!patient) return null;

  return (
    <div className="ps-app">
      {/* TOP NAV */}
      <nav className="ps-top-nav">
        <button className="ps-nav-back" onClick={() => onNavigate('doctor-dashboard')}>
          <span className="ps-nav-back-arrow">←</span>
          <span className="ps-nav-back-label">Back to Patients</span>
        </button>

        <div className="ps-nav-title">{patient.name}</div>

        <button className={`ps-nav-done ${isDone ? 'done-active' : ''}`} onClick={handleDone}>
          <span className="ps-nav-done-icon">✓</span>
          <span className="ps-nav-done-label">{isDone ? 'Done' : 'Mark Done'}</span>
        </button>
      </nav>

      {/* INFO STRIP */}
      <div className="ps-info-strip">
        <span className="ps-info-pill">🎂 {patient.age} yrs</span>
        <span className="ps-info-pill">⚥ {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}</span>
        {patient.bloodType && <span className="ps-info-pill">🩸 {patient.bloodType}</span>}
        {patient.location && <span className="ps-info-pill">📍 {patient.location}</span>}
        {patient.token && <span className="ps-info-pill">🏥 Token {patient.token.replace('T-', '')}</span>}
        {patient.abhaId && <span className="ps-info-pill ps-abha">{patient.abhaId}</span>}
      </div>

      {/* VITALS */}
      {patient.vitals && patient.vitals.length > 0 && (
        <div className="ps-vitals-wrap">
          {patient.vitals.map((v, idx) => (
            <div key={idx} className={`ps-vital-box ${v.alert ? 'alert' : ''}`}>
              <div className="ps-vital-val">{v.num}</div>
              <div className="ps-vital-lbl">{v.lbl}</div>
              {v.alert && <span className="ps-vital-tag">HIGH ↑</span>}
            </div>
          ))}
        </div>
      )}

      {/* TAB BAR */}
      <div className="ps-tab-wrap">
        <div className="ps-tab-bar" role="tablist">
          {[
            { id: 'ai', icon: '🤖', label: 'AI Summary' },
            { id: 'docs', icon: '📁', label: 'Documents' },
            { id: 'hist', icon: '🕐', label: 'Past History' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`ps-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              role="tab"
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="ps-tab-icon">{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT: AI SUMMARY */}
      {activeTab === 'ai' && (
        <div className="ps-tab-content active">
          <div className="ps-sec-title">📋 At a Glance</div>
          <div className="ps-glance-grid">
            <div className="ps-glance-pill alert-pill">
              <div className="ps-glance-key">Chief Complaint</div>
              <div className="ps-glance-val">{patient.complaint || 'N/A'}</div>
            </div>
            <div className="ps-glance-pill alert-pill">
              <div className="ps-glance-key">Duration</div>
              <div className="ps-glance-val">{patient.duration || 'N/A'}</div>
            </div>
            <div className="ps-glance-pill">
              <div className="ps-glance-key">Symptoms</div>
              <div className="ps-glance-val">{(patient.symptoms || []).join(', ') || 'N/A'}</div>
            </div>
          </div>

          {patient.analysis && (
            <>
              <div className="ps-sec-title" style={{ marginTop: '24px' }}>
                🚩 AI Flags & Analysis
              </div>
              <div className="ps-flags-stack">
                <div className={`ps-flag-card ${patient.status === 'urgent' ? '' : 'blue'}`}>
                  <span className="ps-flag-icon">{patient.status === 'urgent' ? '🚨' : 'ℹ️'}</span>
                  <div className="ps-flag-text" dangerouslySetInnerHTML={{ __html: patient.analysis }}></div>
                </div>
              </div>
            </>
          )}

          {patient.suggestions && patient.suggestions.length > 0 && (
            <>
              <div className="ps-sec-title" style={{ marginTop: '24px' }}>
                🤖 AI Suggested Actions
              </div>
              <div className="ps-ai-rec-card">
                <div className="ps-ai-rec-top">
                  <span className="ps-ai-rec-icon">🤖</span>
                  <div>
                    <div className="ps-ai-rec-heading">AI Recommendations</div>
                    <div className="ps-ai-rec-sub">Generated by AyuLekha Clinical AI</div>
                  </div>
                </div>
                <div className="ps-ai-rec-body">
                  <ul style={{ paddingLeft: '20px', margin: 0 }}>
                    {patient.suggestions.map((s, i) => (
                      <li key={i} style={{ marginBottom: '8px' }}>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'docs' && (
        <div className="ps-tab-content active">
          <div className="ps-sec-title">📂 Uploaded by Patient</div>
          {documents.length > 0 ? (
            <div className="ps-doc-grid">
              {documents.map((doc, idx) => (
                <div key={idx} className="ps-doc-card">
                  <div className="ps-doc-emoji">{doc.type === 'xray' ? '🩻' : '🧪'}</div>
                  <div className="ps-doc-name">{doc.name}</div>
                  <div className="ps-doc-date">Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}</div>
                  <span className={`ps-doc-badge ${doc.type === 'xray' ? 'xray' : 'lab'}`}>{doc.typeLabel || doc.type}</span>
                  <button className="ps-doc-view-btn" onClick={() => showToast(`Opening ${doc.name}...`, 'navy')}>
                    View
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--t3)', fontSize: '14px' }}>No documents uploaded yet.</p>
          )}
        </div>
      )}

      {/* TAB CONTENT: PAST HISTORY */}
      {activeTab === 'hist' && (
        <div className="ps-tab-content active">
          {patient.history && (
            <div className="ps-ai-health-card">
              <div className="ps-ai-health-top">
                <span className="ps-ai-health-icon">🤖</span>
                <span className="ps-ai-health-heading">AI Health Overview</span>
              </div>
              <div className="ps-ai-health-body">
                {patient.history} — Current Medications: {patient.meds || 'None'}. Allergies: {patient.allergies || 'None'}.
              </div>
            </div>
          )}
          
          <div className="ps-sec-title">🕐 Visit History</div>
          {history && history.visits && history.visits.length > 0 ? (
            <div className="ps-timeline">
              {history.visits.map((visit, idx) => (
                <div key={idx} className="ps-tl-item">
                  <div className="ps-tl-dot">🏥</div>
                  <div className="ps-tl-card">
                    <div className="ps-tl-date">{new Date(visit.date).toLocaleDateString()}</div>
                    <div className="ps-tl-title">{visit.title || 'Visit'}</div>
                    <div className="ps-tl-desc">{visit.description}</div>
                    {visit.chips && visit.chips.length > 0 && (
                      <div className="ps-tl-chips">
                        {visit.chips.map((chip, cIdx) => (
                          <span key={cIdx} className={`ps-tl-chip ${chip.type || ''}`}>{chip.label}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--t3)', fontSize: '14px' }}>No past visit history available.</p>
          )}
        </div>
      )}

      {/* BOTTOM STICKY BAR */}
      <div className="ps-bottom-bar">
        <button
          className="ps-bb-btn-fill"
          onClick={handleDone}
          disabled={isDone}
          style={{ opacity: isDone ? 0.6 : 1 }}
        >
          {isDone ? '✅ Consultation Complete' : '✅ Mark Consultation Done'}
        </button>
      </div>

      {/* Toast container */}
      {toast && (
        <div id="ps-toast-container">
          <div className={`ps-toast ps-t-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
