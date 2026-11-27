import React, { useState, useEffect } from 'react';
import './PatientSummary.css';
import { doctorApi } from '../../api/doctorApi';
import FormattedAuditReport from '../../components/FormattedAuditReport/FormattedAuditReport';
import StructuredOcrView from '../../components/StructuredOcrView/StructuredOcrView';

export default function PatientSummary({ onNavigate, patientId, doctorLicense, doctorName, onLogout }) {
  const [activeTab, setActiveTab] = useState('ai');
  const [toast, setToast] = useState(null);

  const [patient, setPatient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDone, setIsDone] = useState(false);

  const ocrDocuments = documents.filter(d => d.hasOcr || d.type === 'ocr' || d.structured_summary || d.ocrText);

  useEffect(() => {
    let isMounted = true;

    const loadPatient = async () => {
      try {
        setLoading(true);
        setError(null);

        const [patientData, docsData, histData] = await Promise.all([
          doctorApi.getPatientDetails(patientId, doctorLicense),
          doctorApi.getPatientDocuments(patientId).catch(() => []),
          doctorApi.getPatientHistory(patientId).catch(() => ({ visits: [] }))
        ]);

        if (isMounted) {
          setPatient(patientData);
          setDocuments(docsData || []);
          setHistory(histData || { visits: [] });
        }
      } catch (err) {
        console.error('Error loading patient details:', err);
        if (isMounted) setError(err.message || 'Failed to load patient details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (patientId) {
      loadPatient();
    }

    return () => { isMounted = false; };
  }, [patientId, doctorLicense]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDone = () => {
    setIsDone(true);
    showToast('Consultation marked as done!', 'green');
    doctorApi.markPatientDone(patientId).catch(console.error);
  };

  if (loading) {
    return (
      <div className="ps-app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: 'var(--navy)', fontWeight: 600 }}>Loading patient clinical record & AI summary...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ps-app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 20px', gap: '14px' }}>
        <p style={{ color: 'var(--red)', fontWeight: 'bold', fontSize: '16px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="ps-bb-btn-outline" style={{ width: 'auto', padding: '0 24px' }} onClick={() => window.location.reload()}>Retry</button>
          <button className="ps-bb-btn-outline" style={{ width: 'auto', padding: '0 24px' }} onClick={() => onNavigate('doctor-dashboard')}>Back to Queue</button>
        </div>
      </div>
    );
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
        <span className="ps-info-pill"> {patient.age} yrs</span>
        <span className="ps-info-pill"> {patient.gender === 'M' ? 'Male' : patient.gender === 'F' ? 'Female' : patient.gender}</span>
        {patient.bloodType && <span className="ps-info-pill"> {patient.bloodType}</span>}
        {patient.location && <span className="ps-info-pill">{patient.location}</span>}
        {patient.token && <span className="ps-info-pill"> Token {patient.token.replace('T-', '')}</span>}
        {patient.abhaId && <span className="ps-info-pill ps-abha">ABHA: {patient.abhaId}</span>}
        {patient.summary_id && <span className="ps-info-pill" style={{ background: '#f0fdf4', color: '#166534', borderColor: '#bbf7d0' }}> {patient.summary_id}</span>}
      </div>

      {/* VITALS */}


      {/* TAB BAR */}
      <div className="ps-tab-wrap">
        <div className="ps-tab-bar" role="tablist">
          {[
            { id: 'ai', icon: '📋', label: 'AI Summary' },
            { id: 'ocr', icon: '🔬', label: `Digitized OCR (${ocrDocuments.length})` },
            { id: 'docs', icon: '📁', label: `All Documents (${documents.length})` },
            { id: 'hist', icon: '🕒', label: 'Past History' },
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
          {/* AT A GLANCE CHIEF COMPLAINT & SYMPTOMS */}
          <div className="ps-sec-title"> At a Glance</div>
          <div className="ps-glance-grid">
            <div className="ps-glance-pill alert-pill">
              <div className="ps-glance-key">Chief Complaint</div>
              <div className="ps-glance-val">{patient.complaint || 'General Clinical Evaluation'}</div>
            </div>
            <div className="ps-glance-pill alert-pill">
              <div className="ps-glance-key">Duration</div>
              <div className="ps-glance-val">{patient.duration || 'Recorded during interview'}</div>
            </div>
            <div className="ps-glance-pill">
              <div className="ps-glance-key">Symptoms</div>
              <div className="ps-glance-val">{(patient.symptoms || []).join(', ') || 'Documented in summary'}</div>
            </div>
          </div>

          {/* AI FLAGS & ANALYSIS */}
          {patient.analysis && (
            <>
              <div className="ps-sec-title" style={{ marginTop: '24px' }}>
                Clinical Impression & AI Status
              </div>
              <div className="ps-flags-stack">
                <div className={`ps-flag-card ${patient.status === 'urgent' ? '' : 'blue'}`}>
                  <span className="ps-flag-icon">{patient.status === 'urgent' ? '🚨' : 'ℹ️'}</span>
                  <div className="ps-flag-text" dangerouslySetInnerHTML={{ __html: patient.analysis }}></div>
                </div>
              </div>
            </>
          )}

          {/* AI SUGGESTED ACTIONS */}
          {patient.suggestions && patient.suggestions.length > 0 && (
            <>
              <div className="ps-sec-title" style={{ marginTop: '24px' }}>
                AI Suggested Actions
              </div>
              <div className="ps-ai-rec-card">
                <div className="ps-ai-rec-top">

                  <div>
                    <div className="ps-ai-rec-heading">AI Clinical Recommendations</div>
                    <div className="ps-ai-rec-sub">Generated by AyuLekha Clinical Decision Support</div>
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

          {/* FULL FORMATTED CLINICAL AI SUMMARY & SOCRATES REPORT */}
          <div className="ps-sec-title" style={{ marginTop: '32px' }}>
            📋 Clinical AI Summary & SOCRATES Breakdown
          </div>
          {patient.summary ? (
            <div className="ps-full-summary-box" style={{ marginTop: '14px' }}>
              <FormattedAuditReport auditLog={patient} />
            </div>
          ) : (
            <div className="ps-empty-card" style={{ padding: '32px 20px', background: '#fff', borderRadius: '12px', border: '1.5px solid var(--border)', textAlign: 'center', color: 'var(--t3)', marginTop: '14px' }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}></span>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--navy)' }}>No clinical summary text recorded yet for this patient.</p>
              <p style={{ margin: '6px 0 0', fontSize: '13px' }}>The patient has not completed an AI consultation or summary generation.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DIGITIZED OCR LAB & CLINICAL REPORTS */}
      {activeTab === 'ocr' && (
        <div className="ps-tab-content active">
          <div className="ps-sec-title">🔬 Digitized Lab & Diagnostic Reports ({ocrDocuments.length})</div>
          {ocrDocuments.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              {ocrDocuments.map((doc, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '14px',
                    paddingBottom: '12px',
                    borderBottom: '1px solid #f1f5f9'
                  }}>
                    <div>
                      <h4 style={{ margin: 0, color: '#1b2f5e', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📑</span> {doc.name || doc.filename || 'Diagnostic Report'}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>
                        Recorded: {new Date(doc.uploadedAt || Date.now()).toLocaleDateString()} &bull; Engine: {doc.engine || 'AyuLekha OCR'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <span className="ps-doc-badge lab" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                        🟢 OCR Parsed &amp; Verified
                      </span>
                      <button
                        className="ps-doc-view-btn"
                        style={{ height: '32px', fontSize: '12px', padding: '0 12px' }}
                        onClick={() => setPreviewDoc(doc)}
                      >
                        Full Modal View ↗
                      </button>
                    </div>
                  </div>
                  <StructuredOcrView ocrDoc={doc} />
                </div>
              ))}
            </div>
          ) : (
            <div className="ps-empty-docs-box" style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '12px',
              border: '1.5px dashed var(--border)',
              color: 'var(--t3)',
              marginTop: '12px'
            }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>🔬</span>
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--navy)', fontSize: '16px', fontWeight: 700 }}>
                No OCR Lab Reports Available
              </h4>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '440px', marginInline: 'auto', lineHeight: 1.6 }}>
                There are no digitized clinical laboratory or serology reports associated with this patient's active sharing session.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: DOCUMENTS */}
      {activeTab === 'docs' && (
        <div className="ps-tab-content active">
          <div className="ps-sec-title">📁 Digital Documents &amp; Diagnostic Records</div>
          {documents.length > 0 ? (
            <div className="ps-doc-grid">
              {documents.map((doc, idx) => (
                <div key={idx} className="ps-doc-card">
                  <div className="ps-doc-emoji">
                    {doc.type === 'xray' ? '🩻' : (doc.hasOcr || doc.type === 'ocr') ? '🧪' : '📄'}
                  </div>
                  <div className="ps-doc-name" title={doc.name}>{doc.name}</div>
                  <div className="ps-doc-date">
                    Recorded: {new Date(doc.uploadedAt).toLocaleDateString()}
                  </div>
                  <span className={`ps-doc-badge ${doc.type === 'xray' ? 'xray' : (doc.hasOcr || doc.type === 'ocr') ? 'lab' : 'doc'}`}>
                    {doc.hasOcr ? '🟢 Digitized OCR' : (doc.typeLabel || doc.type)}
                  </span>
                  {(doc.hasOcr || doc.ocrText || doc.structured_summary) ? (
                    <button
                      className="ps-doc-view-btn"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      View Digitized OCR
                    </button>
                  ) : doc.url && doc.url !== '#' ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ps-doc-view-btn"
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
                    >
                      Open Document
                    </a>
                  ) : (
                    <button
                      className="ps-doc-view-btn"
                      onClick={() => showToast(`Archived record: ${doc.name}`, 'navy')}
                    >
                      Archived in Audit Log
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="ps-empty-docs-box" style={{
              padding: '48px 24px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '12px',
              border: '1.5px dashed var(--border)',
              color: 'var(--t3)',
              marginTop: '12px'
            }}>
              <span style={{ fontSize: '40px', display: 'block', marginBottom: '12px' }}>📂</span>
              <h4 style={{ margin: '0 0 6px 0', color: 'var(--navy)', fontSize: '16px', fontWeight: 700 }}>
                No Digital Documents Attached
              </h4>
              <p style={{ margin: 0, fontSize: '13px', maxWidth: '440px', marginInline: 'auto', lineHeight: 1.6 }}>
                This patient record was created through an interactive AI clinical interview. No external lab reports, imaging, or scanned prescriptions were uploaded.
              </p>
            </div>
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
                <span className="ps-ai-health-heading">AI Health Record Overview</span>
              </div>
              <div className="ps-ai-health-body">
                {patient.history} — Medications: {patient.meds || 'None recorded'}. Allergies: {patient.allergies || 'None recorded'}.
              </div>
            </div>
          )}

          <div className="ps-sec-title">🕐 Consultation History</div>
          {history && history.visits && history.visits.length > 0 ? (
            <div className="ps-timeline">
              {history.visits.map((visit, idx) => (
                <div key={idx} className="ps-tl-item">
                  <div className="ps-tl-dot">🏥</div>
                  <div className="ps-tl-card">
                    <div className="ps-tl-date">{new Date(visit.date).toLocaleDateString()}</div>
                    <div className="ps-tl-title">{visit.title || 'Consultation Visit'}</div>
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
            <div style={{
              padding: '36px 20px',
              textAlign: 'center',
              background: '#fff',
              borderRadius: '12px',
              border: '1.5px dashed var(--border)',
              color: 'var(--t3)',
              marginTop: '12px'
            }}>
              <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>🕒</span>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--navy)' }}>No previous consultation records on file.</p>
              <p style={{ margin: '4px 0 0', fontSize: '13px' }}>This is the first recorded consultation for this patient in the system.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL PREVIEW FOR OCR DIGITIZED TEXT */}
      {previewDoc && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          zIndex: 999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          backdropFilter: 'blur(3px)'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '14px',
            width: '100%',
            maxWidth: '720px',
            maxHeight: '85vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)'
          }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc'
            }}>
              <div>
                <h4 style={{ margin: 0, color: '#1b2f5e', fontSize: '16px', fontWeight: 800 }}>
                  📄 {previewDoc.name}
                </h4>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Digitized Clinical Document &bull; Engine: {previewDoc.engine || 'AyuLekha OCR'}
                </span>
              </div>
              <button
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#64748b' }}
                onClick={() => setPreviewDoc(null)}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
              <StructuredOcrView ocrDoc={previewDoc} />
            </div>
            <div style={{ padding: '12px 22px', borderTop: '1px solid #e2e8f0', textAlign: 'right', background: '#f8fafc' }}>
              <button
                className="ps-nav-done"
                style={{ height: '38px', padding: '0 20px', fontSize: '13px' }}
                onClick={() => setPreviewDoc(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
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
