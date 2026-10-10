import React, { useState, useEffect } from 'react';
import './DoctorDashboard.css';
import { doctorApi } from '../../api/doctorApi';

export default function DoctorDashboard({ onNavigate }) {
  const [patients, setPatients] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState('Patients');
  const [todayDate, setTodayDate] = useState('');
  const [greeting, setGreeting] = useState('Good Morning');
  const [toast, setToast] = useState(null);

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
      
      // Fetch profile if we don't have it yet
      let currentProfile = profile;
      if (!currentProfile) {
        currentProfile = await doctorApi.getDoctorProfile();
        setProfile(currentProfile);
      }

      const patientsData = await doctorApi.getPatientsQueue();
      setPatients(patientsData);
    } catch (err) {
      console.error(err);
      setError('Failed to load data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Polling every 5 seconds
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        doctorApi.getPatientsQueue()
          .then(setPatients)
          .catch(console.error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

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

  if (loading) {
    return (
      <div className="doc-app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
        <p>Loading dashboard...</p>
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
  const totalPatients = patients ? patients.length : 0;
  const waitingPatients = patients ? patients.filter(p => p.status === 'waiting').length : 0;
  const urgentPatients = patients ? patients.filter(p => p.status === 'urgent').length : 0;
  const donePatients = patients ? patients.filter(p => p.status === 'done').length : 0;
  const aiReady = patients ? patients.filter(p => p.analysis).length : 0;

  // Filter patients
  const lq = searchQuery.toLowerCase().trim();
  const filteredPatients = !lq ? (patients || []) : (patients || []).filter(
    (p) =>
      p.name.toLowerCase().includes(lq) ||
      p.token.toLowerCase().includes(lq) ||
      (p.statusLabel && p.statusLabel.toLowerCase().includes(lq)) ||
      (p.age + '').includes(lq)
  );

  return (
    <div className="doc-app">
      {/* MAIN */}
      <main className="doc-main">
        <div className="doc-date-bar">
          <div className="doc-date-bar-left">{greeting}, Dr. {profile?.lastName || 'Doctor'} 👋</div>
          <div className="doc-date-bar-right">
            <div className="doc-date-pill">{todayDate}</div>
            <div className="doc-opd-pill">{profile?.department || 'OPD'} &nbsp;•&nbsp; {totalPatients} Patients</div>
          </div>
        </div>

        <div className="doc-content">
          {/* Stat cards */}
          <div className="doc-cards-grid">
            <div className="doc-stat-card" onClick={() => showToast(`${totalPatients} patients scheduled today`, 'green')}>
              <div className="doc-stat-num">{totalPatients}</div>
              <div className="doc-stat-label">Total Patients Today</div>
              <div className="doc-stat-sub">{donePatients} seen &middot; {totalPatients - donePatients} remaining</div>
            </div>
            <div className="doc-stat-card saffron" onClick={() => showToast(`${waitingPatients} patients in waiting area`, 'green')}>
              <div className="doc-stat-num">{waitingPatients}</div>
              <div className="doc-stat-label">Waiting Right Now</div>
              <div className="doc-stat-sub">Tracking live</div>
            </div>
            <div className="doc-stat-card navy" onClick={() => showToast(`${aiReady} AI summaries ready to review`, 'green')}>
              <div className="doc-stat-num">{aiReady}</div>
              <div className="doc-stat-label">AI Summaries Ready</div>
              <div className="doc-stat-sub">Processed</div>
            </div>
            <div className="doc-stat-card red" onClick={() => showToast(`⚠ ${urgentPatients} urgent cases!`, 'red')}>
              <div className="doc-stat-num">{urgentPatients}</div>
              <div className="doc-stat-label">Urgent Cases</div>
              <div className="doc-stat-sub">Flagged by AI</div>
            </div>
          </div>

          {/* Patient List */}
          <div className="doc-panel">
            <div className="doc-panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="doc-panel-title">Today's Patients</span>
                <span className="doc-panel-count">{filteredPatients.length} patients</span>
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
              {filteredPatients.length > 0 ? (
                filteredPatients.map((p) => (
                  <div className="doc-patient-row" key={p.id}>
                    <div className="doc-p-avatar" style={{ background: p.color || '#1b2f5e' }}>
                      {p.initials || p.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="doc-p-info">
                      <div className="doc-p-name">{p.name}</div>
                      <div className="doc-p-meta">
                        {p.age}yr, {p.gender}
                        <span className="doc-p-token">{p.token}</span>
                      </div>
                    </div>
                    <span className={`doc-status-badge ${statusClass(p.status)}`}>{p.statusLabel || p.status}</span>
                    <button
                      className="doc-view-btn"
                      onClick={() => onNavigate('patient-summary', { patientId: p.id })}
                    >
                      View Summary →
                    </button>
                  </div>
                ))
              ) : (
                <div className="doc-no-results">
                  {patients && patients.length === 0 ? "No patients in queue today." : "No patients found matching your search."}
                </div>
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
      
      {/* Toast container */}
      {toast && (
        <div id="doc-toast-container">
          <div className={`doc-toast doc-toast-${toast.type}`}>{toast.msg}</div>
        </div>
      )}
    </div>
  );
}
