import React, { useState, useEffect, useRef } from 'react';
import './DoctorDashboard.css';

const QUEUE = [
  { token: 'B-40', name: 'Maya Devi',          age: '62y F', condition: 'Follow-up Thyroid',         status: 'done'        },
  { token: 'B-41', name: 'Gurpreet Singh',      age: '39y M', condition: 'Lumbar Sprain',             status: 'done'        },
  { token: 'B-42', name: 'Ananya Sengupta',     age: '28y F', condition: 'Acute Migraine',            status: 'in-progress' },
  { token: 'B-43', name: 'Rameshwar Sharma',    age: '54y M', condition: 'Exertional Chest Pain',     status: 'waiting', redFlag: true },
  { token: 'B-44', name: 'Sunita Rao',          age: '47y F', condition: 'Hypertension Review',       status: 'waiting'     },
  { token: 'B-45', name: 'Amitav Roy',          age: '33y M', condition: 'Seasonal Bronchitis',       status: 'waiting'     },
  { token: 'B-46', name: 'Farhana Khatun',      age: '29y F', condition: 'Routine Antenatal 28w',     status: 'waiting'     },
  { token: 'B-47', name: 'Vikramaditya Joshi',  age: '68y M', condition: 'Post-Op Knee Assessment',  status: 'waiting'     },
  { token: 'B-48', name: 'Kavita Narang',       age: '41y F', condition: 'Dermatitis Rash',           status: 'waiting'     },
];

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function DoctorDashboard({ onNavigate }) {
  const [elapsed, setElapsed] = useState(252); // 04:12 start
  const [toast, setToast] = useState({ visible: false, message: '' });
  const toastTimerRef = useRef(null);

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
            <div className="dd-giant-token">B-42</div>

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
              <h2 className="dd-headline-lg">Rameshwar Sharma, 54y M</h2>
              <div className="dd-patient-meta">
                <span className="dd-mono-token dd-primary-container-text dd-fw-semi">TOKEN #B-43</span>
                <span className="dd-outline">·</span>
                <span className="dd-mono-token dd-outline">NDHM-8849-B2</span>
                <span className="dd-outline">·</span>
                <span className="dd-mono-label dd-tertiary-text">Consent: Signed</span>
              </div>
            </div>

            {/* Triage summary */}
            <div className="dd-triage-block">
              <span className="dd-mono-label dd-outline dd-block dd-mb-2xs">Triage Clinical Summary</span>
              <p className="dd-body-lg dd-on-surface">
                4-day retrosternal tightness with exertional dyspnea. Known T2D (8 yrs) on
                Metformin. Reported allergy to Penicillin.
              </p>
            </div>

            {/* Clinical tags */}
            <div className="dd-tags-row">
              <span className="dd-tag dd-tag-red">
                <span className="dd-tag-dot dd-error-bg" />
                RED FLAG: CHEST TIGHTNESS
              </span>
              <span className="dd-tag dd-tag-amber">
                <span className="material-symbols-outlined dd-icon-xs">schedule</span>
                QUEUE WAIT: 38 MIN
              </span>
              <span className="dd-tag dd-tag-surface">INTAKE: CORE</span>
              <span className="dd-tag dd-tag-green">ABHA VERIFIED</span>
            </div>

            {/* Vitals table */}
            <div className="dd-vitals-block">
              <div className="dd-vitals-header">
                <span className="dd-mono-label dd-outline">Preliminary Vitals Taken 14:10</span>
                <span className="dd-mono-token dd-on-surface-variant">Nurse: S. Joseph</span>
              </div>
              <div className="dd-vitals-grid">
                <div className="dd-vital-cell">
                  <span className="dd-mono-label dd-outline">BP SYS/DIA</span>
                  <span className="dd-mono-token dd-error-text dd-fw-semi dd-vital-val">148/92 mmHg</span>
                </div>
                <div className="dd-vital-cell">
                  <span className="dd-mono-label dd-outline">SpO2</span>
                  <span className="dd-mono-token dd-primary-container-text dd-fw-semi dd-vital-val">97% Room Air</span>
                </div>
                <div className="dd-vital-cell">
                  <span className="dd-mono-label dd-outline">TEMP</span>
                  <span className="dd-mono-token dd-on-surface dd-fw-semi dd-vital-val">98.4°F</span>
                </div>
                <div className="dd-vital-cell">
                  <span className="dd-mono-label dd-outline">RANDOM GLUC</span>
                  <span className="dd-mono-token dd-secondary-text dd-fw-semi dd-vital-val">184 mg/dL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary CTA */}
          <div className="dd-cta-block">
            <button
              className="dd-open-brief-btn"
              onClick={() => showToast('Initializing Encounter Record for Rameshwar Sharma (NDHM-8849-B2)...')}
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

          <div className="dd-col-hairline" />
        </div>

        {/* RIGHT — TODAY'S QUEUE */}
        <div className="dd-col dd-col-right">
          <div className="dd-queue-header">
            <div className="dd-queue-title-row">
              <span className="dd-mono-label dd-outline">Today's Queue</span>
              <span className="dd-mono-token dd-on-surface-variant dd-fw-medium">(18 patients waiting)</span>
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
            {QUEUE.map((p) => (
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
