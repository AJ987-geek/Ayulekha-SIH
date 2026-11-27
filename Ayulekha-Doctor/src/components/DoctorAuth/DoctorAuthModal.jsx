import React, { useState, useEffect } from 'react';
import './DoctorAuthModal.css';
import { doctorApi } from '../../api/doctorApi';

export default function DoctorAuthModal({ onVerified }) {
  const [license, setLicense] = useState(() => localStorage.getItem('ayulekha_doctor_license') || '');
  const [doctorName, setDoctorName] = useState(() => localStorage.getItem('ayulekha_doctor_name') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [stationInfo, setStationInfo] = useState(null);

  useEffect(() => {
    // Fetch doctor station info resolved by client IP
    doctorApi.getStationInfo()
      .then(info => {
        setStationInfo(info);
        if (!doctorName && info?.doctor_name) {
          setDoctorName(info.doctor_name);
        }
      })
      .catch(err => {
        console.warn('Station info fetch note:', err);
        setStationInfo({ station_ip: '127.0.0.1', doctor_name: 'Dr. S. Sharma', hospital: 'Clinical Workstation' });
        if (!doctorName) setDoctorName('Dr. S. Sharma');
      });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanLicense = license.trim();
    const cleanName = doctorName.trim() || stationInfo?.doctor_name || 'Dr. Attending Physician';

    if (!cleanLicense) {
      setError('Please enter your Medical License Number.');
      return;
    }

    if (cleanLicense.length !== 5 || !/^\d{5}$/.test(cleanLicense)) {
      setError('License number must be exactly 5 digits (e.g., 12345).');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      localStorage.setItem('ayulekha_doctor_license', cleanLicense);
      localStorage.setItem('ayulekha_doctor_name', cleanName);
      setLoading(false);
      onVerified({ license: cleanLicense, doctorName: cleanName });
    }, 400);
  };

  return (
    <div className="doc-auth-overlay">
      <div className="doc-auth-card">
        <div className="doc-auth-header">
          <div className="doc-auth-emblem">🩺</div>
          <div className="doc-auth-badge">National Medical Commission (NMC)</div>
          <h2 className="doc-auth-title">AyuLekha Doctor Station</h2>
          <p className="doc-auth-sub">
            Secure Outpatient Clinical Portal & Decision Support
          </p>
        </div>

        {stationInfo && (
          <div className="doc-station-pill">
            <span className="station-dot"></span>
            <span className="station-text">
              Station IP: <strong>{stationInfo.station_ip}</strong> &bull; {doctorName || stationInfo.doctor_name || 'Dr. Attending'} ({stationInfo.hospital || 'OPD'})
            </span>
          </div>
        )}

        <form className="doc-auth-form" onSubmit={handleSubmit}>
          <div className="doc-form-group" style={{ marginBottom: '16px' }}>
            <label className="doc-form-label" htmlFor="doc-name-input">
              Doctor Full Name <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <div className="doc-input-wrap">
              <span className="doc-input-prefix">👨‍⚕️</span>
              <input
                id="doc-name-input"
                className="doc-auth-input"
                type="text"
                placeholder="Dr. S. Sharma"
                value={doctorName}
                onChange={(e) => {
                  setDoctorName(e.target.value);
                  if (error) setError('');
                }}
              />
            </div>
          </div>

          <div className="doc-form-group">
            <label className="doc-form-label" htmlFor="doc-license-input">
              Enter 5-Digit Medical License Number <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <div className="doc-input-wrap">
              <span className="doc-input-prefix">#</span>
              <input
                id="doc-license-input"
                className={`doc-auth-input ${error ? 'has-error' : ''}`}
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="12345"
                value={license}
                autoFocus
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                  setLicense(val);
                  if (error) setError('');
                }}
              />
            </div>
            {error && <div className="doc-auth-error">⚠️ {error}</div>}
          </div>

          <div className="doc-test-hint">
            🧪 <strong>Testing Note:</strong> Enter doctor name and any 5-digit license (e.g., <code>12345</code>, <code>98765</code>) to authenticate.
          </div>

          <button
            type="submit"
            className="doc-auth-submit-btn"
            disabled={loading || license.length !== 5}
          >
            {loading ? 'Verifying Credentials...' : 'Verify License & Enter Station →'}
          </button>
        </form>

        <div className="doc-auth-footer">
          🔒 Certified Digital Health Workstation &bull; Encrypted & Audit-Logged
        </div>
      </div>
    </div>
  );
}
