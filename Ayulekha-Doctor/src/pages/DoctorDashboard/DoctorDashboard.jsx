import React, { useState, useEffect, useMemo } from 'react';
import './DoctorDashboard.css';
import { doctorApi } from '../../api/doctorApi';
import FormattedAuditReport from '../../components/FormattedAuditReport/FormattedAuditReport';
import StructuredOcrView from '../../components/StructuredOcrView/StructuredOcrView';

export default function DoctorDashboard({ onNavigate, doctorLicense, doctorName, onLogout }) {
  const [patients, setPatients] = useState([]);
  const [profile, setProfile] = useState(null);
  const [stationInfo, setStationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('Patients');
  const [todayDate, setTodayDate] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');
  const [toast, setToast] = useState(null);

  // ── Persistent Storage for Records Shared by Patients ──
  const storageKey = 'ayulekha_doctor_shared_records_' + (doctorLicense || 'station');
  const [storedSharedRecords, setStoredSharedRecords] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  // ── Compulsory Patient Access States ──
  const [requestAbha, setRequestAbha] = useState('');
  const [requestSummaryId, setRequestSummaryId] = useState('');
  const [requestDoctorName, setRequestDoctorName] = useState(() => doctorName || localStorage.getItem('ayulekha_doctor_name') || '');
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [reviewedAuditLog, setReviewedAuditLog] = useState(null);
  const [auditModalTab, setAuditModalTab] = useState('summary'); // 'summary' | 'documents' | 'ocr'

  // Initialize date and greeting
  useEffect(() => {
    const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setTodayDate('📅 ' + new Date().toLocaleDateString('en-IN', opts));
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  const fetchData = async () => {
    try {
      setError(null);
      
      const [profileData, stationData, patientsData, activeSharedData] = await Promise.all([
        doctorApi.getDoctorProfile().catch(() => null),
        doctorApi.getStationInfo().catch(() => null),
        doctorApi.getPatientsQueue(doctorLicense).catch(() => []),
        doctorApi.getActiveSharedRecords(doctorLicense).catch(() => ({ active_records: [] }))
      ]);

      if (profileData) setProfile(profileData);
      if (stationData) setStationInfo(stationData);
      setPatients(patientsData || []);

      // Reconcile stored records with backend active list (remove any revoked by patient)
      if (activeSharedData && Array.isArray(activeSharedData.active_records)) {
        const activeMap = new Map(activeSharedData.active_records.map(r => [r.summary_id, r]));
        setStoredSharedRecords(prev => {
          const valid = prev.filter(r => activeMap.has(r.summary_id));
          // Also incorporate any active records retrieved from backend
          activeSharedData.active_records.forEach(ar => {
            if (!valid.some(v => v.summary_id === ar.summary_id)) {
              valid.push(ar);
            }
          });
          try {
            localStorage.setItem(storageKey, JSON.stringify(valid));
          } catch (_) {}
          return valid;
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Polling every 4 seconds to sync patient queue and auto-revoke if patient pressed "Stop Sharing"
    const interval = setInterval(async () => {
      if (document.visibilityState === 'visible') {
        try {
          // Check active records
          const activeRes = await doctorApi.getActiveSharedRecords(doctorLicense);
          if (activeRes && Array.isArray(activeRes.active_records)) {
            const activeIds = new Set(activeRes.active_records.map(r => r.summary_id));
            
            setStoredSharedRecords(prev => {
              const stillActive = prev.filter(r => activeIds.has(r.summary_id));
              if (stillActive.length !== prev.length) {
                const revoked = prev.filter(r => !activeIds.has(r.summary_id));
                revoked.forEach(rev => {
                  showToast(`⚠️ Access Revoked: Patient stopped sharing summary ${rev.summary_id}. Record removed.`, 'red');
                });

                // If currently viewing a revoked summary, close it immediately
                setReviewedAuditLog(current => {
                  if (current && !activeIds.has(current.summary_id)) {
                    return null;
                  }
                  return current;
                });

                try {
                  localStorage.setItem(storageKey, JSON.stringify(stillActive));
                } catch (_) {}
              }
              return stillActive;
            });
          }

          const pts = await doctorApi.getPatientsQueue(doctorLicense);
          setPatients(pts || []);
        } catch (syncErr) {
          console.warn('Sync note:', syncErr);
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [doctorLicense, storageKey]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleNavClick = (label) => {
    setActiveNav(label);
    if (label !== 'Patients' && label !== "Today's Patients") {
      showToast(`🚧 ${label} coming soon`, 'green');
    }
  };

  // ── Compulsory Dual-Key Data Request Handler ──
  const handleRequestPatientAccess = async (e) => {
    e.preventDefault();
    const abha = requestAbha.trim();
    const sumId = requestSummaryId.trim();

    if (!abha || !sumId) {
      setRequestError('Both Patient ABHA ID and Unique Audit Log Summary ID are compulsory.');
      return;
    }

    setRequestError('');
    setIsRequesting(true);

    try {
      const result = await doctorApi.requestPatientAccess({
        abhaId: abha,
        summaryId: sumId,
        licenseNumber: doctorLicense,
        doctorName: requestDoctorName.trim() || doctorName || stationInfo?.doctor_name || profile?.name || 'Dr. Attending Physician',
      });

      if (result.success && result.audit_log) {
        const newRecord = {
          ...result.audit_log,
          sharedByDoctor: result.doctor_name,
          doctorIp: result.doctor_ip,
          doctorLicense: result.doctor_license,
          patientAbha: abha,
          storedAt: new Date().toISOString(),
        };

        setReviewedAuditLog(newRecord);
        showToast(`✅ Record received! Shared with ${result.doctor_name}. Stored in your station.`, 'green');
        setRequestAbha('');
        setRequestSummaryId('');

        // Store record in Doctor Station persistent state
        setStoredSharedRecords(prev => {
          const updated = [newRecord, ...prev.filter(r => r.summary_id !== newRecord.summary_id)];
          try {
            localStorage.setItem(storageKey, JSON.stringify(updated));
          } catch (_) {}
          return updated;
        });

        // Refresh patient list
        doctorApi.getPatientsQueue(doctorLicense).then(setPatients).catch(console.error);
      } else {
        setRequestError('Unable to retrieve audit log. Please check your inputs.');
      }
    } catch (err) {
      console.error('Request access error:', err);
      setRequestError(err.message || 'Failed to retrieve patient record. Ensure both ABHA ID and Summary ID match.');
    } finally {
      setIsRequesting(false);
    }
  };

  const statusClass = (s) => {
    return (
      {
        consult: 'status-consult',
        waiting: 'status-waiting',
        urgent: 'status-urgent',
        done: 'status-done',
      }[s] || 'status-done'
    );
  };

  // Combine registered patients with active stored shared records (until patient presses stop sharing)
  const allQueuePatients = useMemo(() => {
    const list = [...(patients || [])];
    const seen = new Set(list.map(p => p.id));

    (storedSharedRecords || []).forEach(r => {
      if (!seen.has(r.summary_id)) {
        seen.add(r.summary_id);
        const summaryText = r.summary || '';
        let conditionSnippet = 'Shared Clinical Record';
        for (const line of summaryText.split('\n')) {
          const cl = line.trim();
          if (cl.includes('Chief Complaint') || (cl.length > 10 && !cl.startsWith('#'))) {
            conditionSnippet = cl.replace('## 1. Chief Complaint (CC)', '').replace('## 1.', '').trim();
            break;
          }
        }

        list.unshift({
          id: r.summary_id,
          token: `SH-${r.summary_id.slice(-4)}`,
          name: `Patient (${r.patientAbha || r.abha_id || 'Shared'})`,
          age: 38,
          gender: 'U',
          condition: conditionSnippet.slice(0, 50) + (conditionSnippet.length > 50 ? '...' : ''),
          status: 'waiting',
          statusLabel: 'Shared by Patient',
          initials: 'SH',
          color: '#059669',
          isSharedRecord: true,
          auditLogData: r,
        });
      }
    });

    return list;
  }, [patients, storedSharedRecords]);

  if (loading) {
    return (
      <div className="doc-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <p>Loading doctor workstation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="doc-app" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', gap: '16px' }}>
        <p style={{ color: 'var(--red)', fontWeight: 'bold' }}>{error}</p>
        <button className="doc-view-btn" onClick={() => { setLoading(true); fetchData(); }}>Retry</button>
      </div>
    );
  }

  // Derive stats
  const totalPatients = allQueuePatients.length;
  const waitingPatients = allQueuePatients.filter(p => p.status === 'waiting').length;
  const urgentPatients = allQueuePatients.filter(p => p.status === 'urgent').length;
  const donePatients = allQueuePatients.filter(p => p.status === 'done').length;
  const sharedPatientsCount = storedSharedRecords.length;

  // Filter patients
  const lq = searchQuery.toLowerCase().trim();
  const filteredPatients = !lq ? allQueuePatients : allQueuePatients.filter(
    (p) =>
      p.name.toLowerCase().includes(lq) ||
      p.token.toLowerCase().includes(lq) ||
      (p.statusLabel && p.statusLabel.toLowerCase().includes(lq)) ||
      (p.age + '').includes(lq)
  );

  const doctorDisplayName = doctorName || stationInfo?.doctor_name || profile?.name || 'Attending Physician';

  return (
    <div className="doc-app">
      {/* MAIN */}
      <main className="doc-main">
        {/* TOP STATUS & DOCTOR IDENTITY BAR */}
        <div className="doc-date-bar">
          <div className="doc-date-bar-left">
            <span style={{ fontSize: '18px', fontWeight: 800 }}>
              {greeting}, {doctorDisplayName} 👋
            </span>
            <span className="doc-license-tag" title="Verified Medical License">
              🩺 NMC Lic: #{doctorLicense}
            </span>
            {stationInfo?.station_ip && (
              <span className="doc-station-ip-tag" title="Connected Doctor Station IP">
                🌐 IP: {stationInfo.station_ip}
              </span>
            )}
          </div>
          <div className="doc-date-bar-right">
            <div className="doc-date-pill">{todayDate}</div>
            <div className="doc-opd-pill">
              {profile?.department || stationInfo?.department || 'OPD'} &nbsp;•&nbsp; {totalPatients} Patients
            </div>
            {onLogout && (
              <button
                className="doc-logout-btn"
                onClick={onLogout}
                title="Change Doctor License / Logout"
              >
                Change Doctor
              </button>
            )}
          </div>
        </div>

        <div className="doc-content">
          {/* COMPULSORY PATIENT DATA ACCESS SECTION */}
          <div className="doc-access-card">
            <div className="doc-access-header">
              <div className="doc-access-title-wrap">
                <span className="doc-access-icon">🔒</span>
                <div>
                  <h3 className="doc-access-title">Request Patient Data & Review Audit Log</h3>
                  <p className="doc-access-sub">
                    Compulsory Dual-Key Access: Enter both <strong>Patient ABHA ID</strong> and the dynamic <strong>Unique Sharing ID (SHARE-XXXXXXXX)</strong> generated on-demand by the patient. Permanent Summary IDs (SUM-*) are blocked.
                  </p>
                </div>
              </div>
              <div className="doc-access-station-badge">
                Station IP: <strong>{stationInfo?.station_ip || '127.0.0.1'}</strong> &bull; Attending: <strong>{doctorDisplayName}</strong>
              </div>
            </div>

            <form className="doc-access-form" onSubmit={handleRequestPatientAccess}>
              <div className="doc-access-fields">
                <div className="doc-field-wrap">
                  <label className="doc-access-label" htmlFor="input-docname">
                    Doctor Name (Attending)
                  </label>
                  <input
                    id="input-docname"
                    className="doc-access-input"
                    type="text"
                    placeholder="e.g., Dr. Rajesh Varma"
                    value={requestDoctorName}
                    onChange={(e) => setRequestDoctorName(e.target.value)}
                  />
                </div>

                <div className="doc-field-wrap">
                  <label className="doc-access-label" htmlFor="input-abha">
                    Patient ABHA ID / Identifier <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    id="input-abha"
                    className="doc-access-input"
                    type="text"
                    placeholder="e.g., 91-4820-9921-3041 or mobile"
                    value={requestAbha}
                    onChange={(e) => setRequestAbha(e.target.value)}
                    required
                  />
                </div>

                <div className="doc-field-wrap">
                  <label className="doc-access-label" htmlFor="input-sumid">
                    Patient Dynamic Sharing ID (SHARE-*) <span style={{ color: '#e53e3e' }}>*</span>
                  </label>
                  <input
                    id="input-sumid"
                    className="doc-access-input"
                    type="text"
                    placeholder="e.g., SHARE-XXXXXXXX (generated by patient in portal)"
                    value={requestSummaryId}
                    onChange={(e) => setRequestSummaryId(e.target.value)}
                    required
                  />
                </div>

                <div className="doc-btn-wrap">
                  <button
                    type="submit"
                    className="doc-request-btn"
                    disabled={isRequesting || !requestAbha.trim() || !requestSummaryId.trim()}
                  >
                    {isRequesting ? 'Requesting & Verifying...' : 'Request Patient Data →'}
                  </button>
                </div>
              </div>

              {requestError && (
                <div className="doc-access-error">
                  ⚠️ {requestError}
                </div>
              )}
            </form>
          </div>

          {/* Stat cards */}
          <div className="doc-cards-grid">
            <div className="doc-stat-card" onClick={() => showToast(`${totalPatients} patients in queue today`, 'green')}>
              <div className="doc-stat-num">{totalPatients}</div>
              <div className="doc-stat-label">Total Patients in Station</div>
              <div className="doc-stat-sub">{donePatients} seen &middot; {totalPatients - donePatients} remaining</div>
            </div>
            <div className="doc-stat-card saffron" onClick={() => showToast(`${waitingPatients} patients in waiting area`, 'green')}>
              <div className="doc-stat-num">{waitingPatients}</div>
              <div className="doc-stat-label">Waiting Right Now</div>
              <div className="doc-stat-sub">Live OPD queue</div>
            </div>
            <div className="doc-stat-card navy" onClick={() => showToast(`${sharedPatientsCount} records actively shared by patients`, 'green')}>
              <div className="doc-stat-num">{sharedPatientsCount}</div>
              <div className="doc-stat-label">Patient Shared Records</div>
              <div className="doc-stat-sub">Active consent</div>
            </div>
            <div className="doc-stat-card red" onClick={() => showToast(`⚠ ${urgentPatients} urgent cases flagged`, 'red')}>
              <div className="doc-stat-num">{urgentPatients}</div>
              <div className="doc-stat-label">Urgent Cases</div>
              <div className="doc-stat-sub">Flagged by AI</div>
            </div>
          </div>

          {/* Patient List */}
          <div className="doc-panel">
            <div className="doc-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="doc-panel-title">Active Station Patients</span>
                <span className="doc-panel-count">{filteredPatients.length} patients</span>
              </div>
              <div className="doc-search-wrap">
                <span className="doc-search-icon">🔍</span>
                <input
                  className="doc-search-input"
                  type="search"
                  placeholder="Search patients by name, token, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="doc-patient-list">
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div className="doc-patient-row" key={p.id}>
                    <div className="doc-p-avatar" style={{ background: p.color || '#1b2f5e' }}>
                      {p.initials || p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="doc-p-info">
                      <div className="doc-p-name">{p.name}</div>
                      <div className="doc-p-meta">
                        {p.condition}
                        <span className="doc-p-token">{p.token}</span>
                      </div>
                    </div>
                    <span className={`doc-status-badge ${statusClass(p.status)}`}>{p.statusLabel || p.status}</span>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {p.isSharedRecord && p.auditLogData && (
                        <button
                          type="button"
                          className="doc-view-btn"
                          style={{
                            background: '#f1f5f9',
                            color: '#1b2f5e',
                            border: '1.5px solid #cbd5e1',
                            padding: '0 12px',
                            height: '36px',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                          title="Quick Modal Audit Review"
                          onClick={() => setReviewedAuditLog(p.auditLogData)}
                        >
                          Quick Modal
                        </button>
                      )}
                      <button
                        type="button"
                        className="doc-view-btn"
                        onClick={() => onNavigate('patient-summary', { patientId: p.id })}
                      >
                        View Summary →
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="doc-no-results">
                  {allQueuePatients.length === 0
                    ? "No patients in queue yet. Request records above using Patient ABHA ID & Audit Log Summary ID."
                    : "No patients found matching your search."}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* WHOLE AUDIT LOG REVIEW MODAL WITH FORMATTED CLINICAL VIEW */}
      {reviewedAuditLog && (
        <div className="doc-audit-modal-overlay">
          <div className="doc-audit-modal-box">
            <div className="doc-audit-modal-header">
              <div>
                <span className="doc-audit-badge">Whole SQLite Audit Log Review</span>
                <h3 className="doc-audit-title">Patient Audit Log: {reviewedAuditLog.summary_id}</h3>
                <div className="doc-audit-meta">
                  <span>🆔 Docs ID: {reviewedAuditLog.documents_id || 'NONE'}</span> &bull; 
                  <span>🕒 Recorded: {new Date(reviewedAuditLog.time_created).toLocaleString()}</span>
                </div>
              </div>
              <button className="doc-audit-close-btn" onClick={() => setReviewedAuditLog(null)}>✕</button>
            </div>

            <div className="doc-audit-shared-banner">
              ✅ <strong>Active Data Sharing Consent:</strong> Shared with <strong>{reviewedAuditLog.sharedByDoctor || doctorDisplayName}</strong> (Medical License: #{reviewedAuditLog.doctorLicense || doctorLicense}, Station IP: {reviewedAuditLog.doctorIp || '127.0.0.1'}). Stored in this workstation until the patient presses &quot;Stop Sharing&quot;.
            </div>

            <div className="doc-audit-tabs">
              <button
                className={`doc-audit-tab-btn ${auditModalTab === 'summary' ? 'active' : ''}`}
                onClick={() => setAuditModalTab('summary')}
              >
                📋 Formatted Clinical Summary
              </button>
              <button
                className={`doc-audit-tab-btn ${auditModalTab === 'documents' ? 'active' : ''}`}
                onClick={() => setAuditModalTab('documents')}
              >
                📂 Attached Documents ({reviewedAuditLog.original_documents?.length || 0})
              </button>
              <button
                className={`doc-audit-tab-btn ${auditModalTab === 'ocr' ? 'active' : ''}`}
                onClick={() => setAuditModalTab('ocr')}
              >
                🧪 Digitized OCR Text & Tables ({reviewedAuditLog.ocr_documents?.length || 0})
              </button>
            </div>

            <div className="doc-audit-modal-body">
              {auditModalTab === 'summary' && (
                <FormattedAuditReport auditLog={reviewedAuditLog} />
              )}

              {auditModalTab === 'documents' && (
                <div className="doc-audit-docs-view">
                  {reviewedAuditLog.original_documents && reviewedAuditLog.original_documents.length > 0 ? (
                    <div className="doc-audit-docs-grid">
                      {reviewedAuditLog.original_documents.map((doc, idx) => (
                        <div key={idx} className="doc-audit-doc-card">
                          <span className="doc-audit-doc-icon">📄</span>
                          <div className="doc-audit-doc-info">
                            <div className="doc-audit-doc-name">{doc.filename || doc.name || `Document #${idx + 1}`}</div>
                            <div className="doc-audit-doc-size">{doc.size_bytes ? `${Math.round(doc.size_bytes / 1024)} KB` : 'Archived Document'}</div>
                          </div>
                          {doc.url && (
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="doc-audit-dl-btn">
                              Open File
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ color: '#64748b' }}>No original documents attached to this audit log.</p>
                  )}
                </div>
              )}

              {auditModalTab === 'ocr' && (
                <div className="doc-audit-ocr-view">
                  {reviewedAuditLog.ocr_documents && reviewedAuditLog.ocr_documents.length > 0 ? (
                    reviewedAuditLog.ocr_documents.map((ocrDoc, idx) => (
                      <StructuredOcrView key={idx} ocrDoc={ocrDoc} />
                    ))
                  ) : (
                    <p style={{ color: '#64748b' }}>No digitized OCR records found in this audit log.</p>
                  )}
                </div>
              )}
            </div>

            <div className="doc-audit-modal-footer">
              <button
                className="doc-view-btn"
                style={{ padding: '8px 24px' }}
                onClick={() => setReviewedAuditLog(null)}
              >
                Close Audit Review
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="doc-bottom-nav">
        {[
          { icon: '🏥', label: 'Patients' },
          { icon: '📅', label: 'Appts' },
          { icon: '📋', label: 'Records' },
          { icon: '📄', label: 'Rx' },
        ].map((item) => (
          <button
            key={item.label}
            className={`doc-bn-item ${activeNav === item.label || (activeNav === "Today's Patients" && item.label === 'Patients') ? 'active' : ''}`}
            onClick={() => handleNavClick(item.label)}
          >
            <span className="doc-bn-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      
      {/* Toast container */}
      {toast && (
        <div id="doc-toast-container">
          <div className={`doc-toast doc-toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
