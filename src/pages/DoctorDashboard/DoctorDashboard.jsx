import React, { useState, useEffect } from 'react';
import './DoctorDashboard.css';
import { PATIENTS } from '../../data/doctorMockData';

export default function DoctorDashboard({ onNavigate }) {
  const [patients, setPatients] = useState(PATIENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Patients');
  const [todayDate, setTodayDate] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    setTodayDate('📅 ' + new Date().toLocaleDateString('en-IN', opts));
  }, []);

  useEffect(() => {
    const lq = searchQuery.toLowerCase().trim();
    if (!lq) {
      setPatients(PATIENTS);
    } else {
      setPatients(
        PATIENTS.filter(
          (p) =>
            p.name.toLowerCase().includes(lq) ||
            p.token.toLowerCase().includes(lq) ||
            p.statusLabel.toLowerCase().includes(lq) ||
            (p.age + '').includes(lq)
        )
      );
    }
  }, [searchQuery]);

  const showToast = (msg, type = 'green') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleNavClick = (label) => {
    setActiveNav(label);
    if (label !== 'Patients' && label !== "Today's Patients") {
      showToast(`🚧 ${label} coming soon`, 'green');
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

  const openSummary = (id) => {
    const p = PATIENTS.find((x) => x.id === id);
    if (p) {
      setSelectedPatient(p);
      setIsOverlayOpen(true);
    }
  };

  const closeSheet = () => {
    setIsOverlayOpen(false);
    setTimeout(() => setSelectedPatient(null), 300);
  };

  return (
    <div className="doc-app">
      {/* MAIN */}
      <main className="doc-main">
        <div className="doc-date-bar">
          <div className="doc-date-bar-left">Good Morning, Dr. Sharma 👋</div>
          <div className="doc-date-bar-right">
            <div className="doc-date-pill">{todayDate}</div>
            <div className="doc-opd-pill">OPD 3 &nbsp;•&nbsp; {PATIENTS.length} Patients</div>
          </div>
        </div>

        <div className="doc-content">
          {/* Stat cards */}
          <div className="doc-cards-grid">
            <div className="doc-stat-card" onClick={() => showToast('14 patients scheduled today', 'green')}>
              <div className="doc-stat-num">14</div>
              <div className="doc-stat-label">Total Patients Today</div>
              <div className="doc-stat-sub">10 seen &middot; 4 remaining</div>
            </div>
            <div className="doc-stat-card saffron" onClick={() => showToast('4 patients in waiting area', 'green')}>
              <div className="doc-stat-num">4</div>
              <div className="doc-stat-label">Waiting Right Now</div>
              <div className="doc-stat-sub">Avg wait &sim;18 min</div>
            </div>
            <div className="doc-stat-card navy" onClick={() => showToast('12 AI summaries ready to review', 'green')}>
              <div className="doc-stat-num">12</div>
              <div className="doc-stat-label">AI Summaries Ready</div>
              <div className="doc-stat-sub">2 still processing</div>
            </div>
            <div className="doc-stat-card red" onClick={() => showToast('⚠ 2 urgent cases need immediate attention!', 'red')}>
              <div className="doc-stat-num">2</div>
              <div className="doc-stat-label">Urgent Cases</div>
              <div className="doc-stat-sub">Flagged by AI</div>
            </div>
          </div>

          {/* Patient List */}
          <div className="doc-panel">
            <div className="doc-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="doc-panel-title">Today's Patients</span>
                <span className="doc-panel-count">{patients.length} patients</span>
              </div>
              <div className="doc-search-wrap">
                <span className="doc-search-icon">🔍</span>
                <input
                  className="doc-search-input"
                  type="search"
                  placeholder="Search patients…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="doc-patient-list">
              {patients.length > 0 ? (
                patients.map((p) => (
                  <div className="doc-patient-row" key={p.id}>
                    <div className="doc-p-avatar" style={{ background: p.color }}>
                      {p.initials}
                    </div>
                    <div className="doc-p-info">
                      <div className="doc-p-name">{p.name}</div>
                      <div className="doc-p-meta">
                        {p.age}yr, {p.gender}
                        <span className="doc-p-token">{p.token}</span>
                      </div>
                    </div>
                    <span className={`doc-status-badge ${statusClass(p.status)}`}>{p.statusLabel}</span>
                    <button
                      className="doc-view-btn"
                      onClick={() => onNavigate('patient-summary', { patientId: p.id })}
                    >
                      View Summary →
                    </button>
                    {/* Hidden AI quick view button for now, can be added if needed */}
                  </div>
                ))
              ) : (
                <div className="doc-no-results">No patients found matching your search.</div>
              )}
            </div>
          </div>
        </div>
      </main>

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

      {/* OVERLAY AI Summary (Currently replaced by routing to Patient Summary directly as per reference logic, but keeping the component ready) */}
      
      {/* Toast container */}
      {toast && (
        <div id="doc-toast-container">
          <div className={`doc-toast doc-toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
