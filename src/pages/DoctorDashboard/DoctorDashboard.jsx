import React, { useState, useEffect, useRef } from 'react';
import './DoctorDashboard.css';

// Remove static QUEUE

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DoctorDashboard({ onNavigate }) {
  const [queue, setQueue] = useState([]);
  const [nextPatientRecords, setNextPatientRecords] = useState([]);
  const [elapsed, setElapsed] = useState(252); // 04:12 start
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

  // Fetch queue
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await fetch('/api/patients/queue');
        const data = await res.json();
        if (data.queue) {
          setQueue(data.queue);
        }
      } catch (err) {
        console.error('Failed to fetch queue:', err);
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const nowServing = queue.length > 0 ? queue[0] : null;
  const nextPatient = queue.length > 1 ? queue[1] : null;

  // Fetch nextPatient OCR records
  useEffect(() => {
    if (nextPatient && nextPatient.id) {
      fetch(`/api/patients/${nextPatient.id}/records`)
        .then(res => res.json())
        .then(data => {
          if (data.records) setNextPatientRecords(data.records);
        })
        .catch(err => console.error('Failed to fetch records:', err));
    } else {
      setNextPatientRecords([]);
    }
  }, [nextPatient?.id]);

  // Extract medicines from nextPatientRecords
  const allTables = nextPatientRecords.flatMap(record => record.tables || []);
  const medicineTable = allTables.find(t => 
    t.title.toLowerCase().includes('medication') || 
    t.title.toLowerCase().includes('medicine') ||
    t.title.toLowerCase().includes('prescription') ||
    t.columns.some(c => c.toLowerCase().includes('medication') || c.toLowerCase().includes('drug') || c.toLowerCase().includes('medicine'))
  );
  const medicines = medicineTable ? medicineTable.rows : [];

  // Stopwatch
  useEffect(() => {
    const id = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcut: Enter => open encounter
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        showToast('Entering Clinical Narrative View for Token B-43');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  function showToast(message) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ visible: true, message });
    toastTimerRef.current = setTimeout(() => setToast({ visible: false, message: '' }), 2600);
  }

  return (
    <div className="dd-root">
      {/* ── TOP BREADCRUMB BAR ─────────────────────────────── */}
      <div className="dd-breadcrumb">
        <div className="dd-breadcrumb-left">
          <button 
            type="button" 
            onClick={() => onNavigate && onNavigate('portal')}
            style={{ background: 'var(--dd-primary)', color: '#fff', border: 'none', borderRadius: '4px', padding: '3px 10px', fontSize: '11px', cursor: 'pointer', marginRight: '10px', fontWeight: 600 }}
          >
            ← Portal
          </button>
          <span className="dd-mono-label dd-outline">AyuLeakha Live Clinical Engine</span>
          <span className="dd-dot dd-secondary-bg" />
          <span className="dd-mono-label dd-on-surface-variant">Station OPD-04B · Room 104</span>
        </div>
        <div className="dd-breadcrumb-right">
          <div className="dd-sync-item">
            <span className="material-symbols-outlined dd-icon-sm dd-outline">sync</span>
            <span className="dd-mono-token dd-on-surface-variant">Live Dispatch: Polling active</span>
          </div>
          <div className="dd-sync-item">
            <span className="dd-mono-label dd-outline">Network Sync</span>
            <span className="dd-mono-token dd-tertiary-text">100% Verified</span>
          </div>
        </div>
      </div>

      {/* ── THREE-COLUMN GRID ──────────────────────────────── */}
      <div className="dd-grid">

        {/* LEFT — NOW SERVING */}
        <div className="dd-col dd-col-left">
          <div className="dd-col-left-inner">
            {/* Section label */}
            <div className="dd-section-label-row">
              <span className="dd-dot dd-primary-container-bg" />
              <span className="dd-mono-label dd-outline">Now Serving</span>
            </div>

            {/* Giant Token */}
            <div className="dd-giant-token">{nowServing ? nowServing.token : '--'}</div>

            <p className="dd-body-md dd-on-surface dd-fw-medium">Room 104 · Dr. R. K. Mukherjee</p>
            <p className="dd-caption dd-on-surface-variant dd-mb-xl">Internal Medicine · Senior Attending</p>

            {/* Timer */}
            <div className="dd-timer-block">
              <div className="dd-timer-left">
                <span className="material-symbols-outlined dd-icon-sm dd-outline">timer</span>
                <span className="dd-mono-token dd-on-surface-variant">Consult Elapsed</span>
              </div>
              <span className="dd-mono-token dd-primary-container-text dd-fw-bold">
                {formatTime(elapsed)}
              </span>
            </div>

            {/* Pulse Rhythm */}
            <div className="dd-pulse-block">
              <div className="dd-pulse-header">
                <span className="dd-mono-label dd-outline">Patient Pulse Rhythm</span>
                <span className="dd-mono-token dd-tertiary-text dd-fw-semi">78 BPM · Regular</span>
              </div>
              <svg className="dd-ecg-svg" viewBox="0 0 240 36" preserveAspectRatio="none" fill="none">
                <path
                  d="M0,18 L30,18 L38,18 L44,7 L48,29 L54,12 L58,22 L62,18
                     L100,18 L108,18 L114,6 L118,30 L124,11 L128,23 L132,18
                     L170,18 L178,18 L184,8 L188,28 L194,13 L198,22 L202,18 L240,18"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dd-action-list">
            <button
              className="dd-action-btn dd-action-primary"
              onClick={() => showToast('Advancing roster: Closing Token B-42 and calling Token B-43')}
            >
              <span className="dd-action-label">Call next token →</span>
              <span className="dd-mono-label dd-outline">Alt+N</span>
            </button>
            <button
              className="dd-action-btn"
              onClick={() => showToast('Token B-42 placed on hold for STAT ECG & Troponin Lab result')}
            >
              <span className="dd-action-label dd-muted">Hold token</span>
              <span className="dd-mono-label dd-outline">Queue to Lab</span>
            </button>
            <button
              className="dd-action-btn"
              onClick={() => showToast('Chime & Digital Display broadcast: B-42 summoned to Room 104')}
            >
              <span className="dd-action-label dd-muted">
                Recall chime{' '}
                <span className="material-symbols-outlined dd-icon-xs dd-secondary-text">notifications_active</span>
              </span>
              <span className="dd-mono-token dd-secondary-text dd-fw-medium">Broadcast Desk 4</span>
            </button>
          </div>

          {/* Vertical hairline separator */}
          <div className="dd-col-hairline" />
        </div>

        {/* CENTRE — NEXT PATIENT */}
        <div className="dd-col dd-col-centre">
          <div className="dd-centre-inner">
            {/* Header */}
            <div className="dd-centre-header">
              <div className="dd-section-label-row">
                <span className="dd-dot dd-secondary-bg" />
                <span className="dd-mono-label dd-outline">Next Patient in Chamber Queue</span>
              </div>
              <span className="dd-mono-token dd-on-surface-variant dd-fw-medium">Position #1</span>
            </div>

            {/* Patient identity */}
            <div className="dd-patient-block">
              {nextPatient ? (
                <>
                  <h2 className="dd-headline-lg">{nextPatient.name}, {nextPatient.age}</h2>
                  <div className="dd-patient-meta">
                    <span className="dd-mono-token dd-primary-container-text dd-fw-semi">TOKEN #{nextPatient.token}</span>
                    <span className="dd-outline">·</span>
                    <span className="dd-mono-token dd-outline">{nextPatient.abha || 'NDHM-XXXX'}</span>
                    <span className="dd-outline">·</span>
                    <span className="dd-mono-label dd-tertiary-text">Consent: Signed</span>
                  </div>
                </>
              ) : (
                <h2 className="dd-headline-lg">No Patients Waiting</h2>
              )}
            </div>

            {nextPatient && (
              <>
                {/* Triage summary */}
                <div className="dd-triage-block">
                  <span className="dd-mono-label dd-outline dd-block dd-mb-2xs">Triage Clinical Summary (Symptoms & HPI)</span>
                  <p className="dd-body-lg dd-on-surface">
                    {nextPatient.story || "Patient has completed triage via AyuLekha Intake. Review clinical narrative for details."}
                  </p>
                  
                  {nextPatient.symptoms && nextPatient.symptoms.conditions && nextPatient.symptoms.conditions.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <span className="dd-mono-label dd-outline dd-block dd-mb-2xs">Reported Conditions</span>
                      <div className="dd-tags-row">
                        {nextPatient.symptoms.conditions.map((cond, i) => (
                          <span key={i} className="dd-tag dd-tag-amber">{cond.condition}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* OCR Medicines */}
                {medicines.length > 0 && (
                  <div className="dd-vitals-block" style={{ marginTop: '1rem', border: '1px solid var(--color-outline-variant)' }}>
                    <div className="dd-vitals-header" style={{ backgroundColor: 'var(--color-surface-container)' }}>
                      <span className="dd-mono-label dd-outline">OCR Extracted Medications</span>
                      <span className="dd-mono-token dd-on-surface-variant">From Uploaded Records</span>
                    </div>
                    <div style={{ padding: '0.75rem 1rem' }}>
                      <ul style={{ listStyleType: 'disc', paddingLeft: '1.25rem', color: 'var(--color-on-surface)', fontSize: '0.875rem' }}>
                        {medicines.slice(0, 4).map((row, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>
                            <span style={{ fontWeight: 600 }}>{row.medication || row.medicine || Object.values(row)[0]}</span>
                            {(row.dosage || row.dose || row.frequency) ? ` - ${row.dosage || row.dose || ''} ${row.frequency || ''}` : ''}
                          </li>
                        ))}
                        {medicines.length > 4 && <li><span className="dd-mono-token dd-outline">+{medicines.length - 4} more medications</span></li>}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Vitals table */}
                <div className="dd-vitals-block" style={{ marginTop: '1rem' }}>
                  <div className="dd-vitals-header">
                    <span className="dd-mono-label dd-outline">Preliminary Vitals Taken</span>
                    <span className="dd-mono-token dd-on-surface-variant">Self-Reported / Kiosk</span>
                  </div>
                  <div className="dd-vitals-grid">
                    <div className="dd-vital-cell">
                      <span className="dd-mono-label dd-outline">BP SYS/DIA</span>
                      <span className="dd-mono-token dd-on-surface dd-fw-semi dd-vital-val">--</span>
                    </div>
                    <div className="dd-vital-cell">
                      <span className="dd-mono-label dd-outline">SpO2</span>
                      <span className="dd-mono-token dd-on-surface dd-fw-semi dd-vital-val">--</span>
                    </div>
                    <div className="dd-vital-cell">
                      <span className="dd-mono-label dd-outline">TEMP</span>
                      <span className="dd-mono-token dd-on-surface dd-fw-semi dd-vital-val">--</span>
                    </div>
                    <div className="dd-vital-cell">
                      <span className="dd-mono-label dd-outline">WEIGHT</span>
                      <span className="dd-mono-token dd-on-surface dd-fw-semi dd-vital-val">--</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Primary CTA */}
          {nextPatient && (
            <div className="dd-cta-block">
              <button
                className="dd-open-brief-btn"
                onClick={() => showToast(`Initializing Encounter Record for ${nextPatient.name}...`)}
              >
                <div className="dd-cta-left">
                  <span className="material-symbols-outlined dd-icon-md">clinical_notes</span>
                  <span className="dd-body-md dd-fw-medium">Open full brief &amp; encounter record</span>
                </div>
                <span className="dd-cta-arrow">→</span>
              </button>
              <div className="dd-cta-hint">
                <span className="dd-mono-label dd-outline">Press Enter to Launch Encounter</span>
                <span className="dd-mono-label dd-outline">Includes EHR &amp; Past 6 Prescriptions</span>
              </div>
            </div>
          )}

          <div className="dd-col-hairline" />
        </div>

        {/* RIGHT — TODAY'S QUEUE */}
        <div className="dd-col dd-col-right">
          <div className="dd-queue-header">
            <div className="dd-queue-title-row">
              <span className="dd-mono-label dd-outline">Today's Queue</span>
              <span className="dd-mono-token dd-on-surface-variant dd-fw-medium">({queue.length} patients in queue)</span>
            </div>
            <span className="dd-mono-label dd-primary-container-text dd-fw-semi">Desk 04</span>
          </div>

          {/* Column labels */}
          <div className="dd-queue-col-labels">
            <span className="dd-mono-label dd-outline">Token &amp; Name</span>
            <span className="dd-mono-label dd-outline">Status / Stage</span>
          </div>

          {/* Row list */}
          <div className="dd-queue-list">
            {queue.map((p) => (
              <div
                key={p.token}
                className={`dd-queue-row${p.status === 'in-progress' ? ' dd-row-active' : ''}`}
              >
                <div className="dd-row-left">
                  <span className={`dd-mono-token dd-queue-token${p.status === 'in-progress' ? ' dd-primary-container-text dd-fw-bold' : p.status === 'waiting' && p.redFlag ? ' dd-on-surface dd-fw-semi' : ' dd-outline'}`}>
                    {p.token}
                  </span>
                  <div className="dd-row-info">
                    <div className="dd-row-name-line">
                      <span className={`dd-body-md dd-row-name${p.status === 'in-progress' ? ' dd-primary-container-text dd-fw-semi' : p.status === 'done' ? ' dd-on-surface-variant' : ' dd-on-surface dd-fw-medium'}`}>
                        {p.name}
                      </span>
                      {p.redFlag && <span className="dd-red-dot" />}
                    </div>
                    <span className={`dd-caption dd-row-sub${p.status === 'in-progress' ? ' dd-primary-container-text' : p.status === 'done' ? ' dd-outline' : ' dd-on-surface-variant'}`}>
                      {p.age} · {p.condition}
                    </span>
                  </div>
                </div>
                <div className="dd-row-right">
                  {p.status === 'done' && (
                    <>
                      <span className="dd-mono-token dd-outline dd-fw-medium">Done</span>
                      <span className="material-symbols-outlined dd-icon-xs dd-outline">check</span>
                    </>
                  )}
                  {p.status === 'in-progress' && (
                    <>
                      <span className="dd-pulse-dot" />
                      <span className="dd-mono-token dd-primary-container-text dd-fw-bold">In progress</span>
                    </>
                  )}
                  {p.status === 'waiting' && (
                    <span className="dd-mono-token dd-secondary-text dd-fw-medium">Waiting</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Queue footer */}
          <div className="dd-queue-footer">
            <span className="dd-mono-label dd-outline">Est. Clearance Time</span>
            <span className="dd-mono-token dd-on-surface dd-fw-semi">16:45 IST (~2h 15m)</span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM STATUS STRIP ────────────────────────────── */}
      <div className="dd-status-strip">
        <div className="dd-status-left">
          <div className="dd-status-item">
            <span className="dd-mono-label dd-outline">AyuLeakha Engine</span>
            <span className="dd-mono-token dd-on-surface-variant dd-fw-medium">Version 2.4.8-build</span>
          </div>
          <div className="dd-status-item">
            <span className="dd-mono-label dd-outline">Prescription Dispatch</span>
            <span className="dd-mono-token dd-tertiary-text dd-fw-semi">Pharmacy Counter 2 Active</span>
          </div>
          <div className="dd-status-item">
            <span className="dd-mono-label dd-outline">ICD-11 Coding Assist</span>
            <span className="dd-mono-token dd-primary-container-text dd-fw-semi">Standby (Auto-Detect)</span>
          </div>
        </div>
        <div className="dd-shortcuts">
          <span className="dd-mono-label dd-outline">Clinical Shortcut Guide:</span>
          <kbd className="dd-kbd">Space : Advance</kbd>
          <kbd className="dd-kbd">Cmd + P : Rx Print</kbd>
          <kbd className="dd-kbd">Esc : Pause Desk</kbd>
        </div>
      </div>

      {/* ── TOAST ─────────────────────────────────────────── */}
      <div className={`dd-toast${toast.visible ? ' dd-toast-visible' : ''}`}>
        <span className="material-symbols-outlined dd-icon-md dd-secondary-container-text">notifications_active</span>
        <span className="dd-mono-token dd-fw-medium">{toast.message}</span>
      </div>
    </div>
  );
}
