import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './InfoPanel.css';

function PatientForm({ onNavigate }) {
  const [otpSent, setOtpSent] = useState(false);
  const [abhaId, setAbhaId] = useState('');
  
  // Registration states
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState(''); // Need email for registration

  const { language, toggleLanguage, LANGUAGES, t } = useLanguage();

  return (
    <div className="patient-form-container">
      <div className="form-header">
        <div>
          <span className="form-supertitle font-mono">{t('infoPanel.patient.gateway')}</span>
          <h3 className="form-title">{t('infoPanel.patient.title')}</h3>
        </div>
        <div className="lang-selector font-mono">
          <span className="lang-label">LANG:</span>
          <select className="lang-select" value={language} onChange={(event) => toggleLanguage(event.target.value)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="patient-path returning-patient">
        <div className="path-header">
          <h4 className="path-title">{t('infoPanel.patient.returningTitle')}</h4>
          <p className="path-desc">{t('infoPanel.patient.returningDesc')}</p>
        </div>
        <form className="auth-form" onSubmit={async (e) => { 
          e.preventDefault(); 
          if (!abhaId) return;
          const API_URL = import.meta.env.VITE_API_URL || '';

          if (isRegistering) {
            try {
              const registerRes = await fetch(`${API_URL}/api/patients/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  abha: abhaId,
                  name: name || 'New Patient',
                  email: email || `${abhaId}@example.com`,
                  age: age ? parseInt(age, 10) : null,
                  bloodGroup: bloodGroup,
                  allergies: allergies,
                  gender: gender
                })
              });
              const regData = await registerRes.json();
              if (regData.patient) {
                onNavigate && onNavigate('dashboard', { patient: regData.patient, patientId: regData.patient.id });
              } else {
                alert(regData.detail || regData.message || 'Registration failed');
              }
            } catch (err) {
              console.error(err);
              alert('Error registering');
            }
            return;
          }

          try {
            const response = await fetch(`${API_URL}/api/patients/find`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ abhaNumber: abhaId })
            });
            const data = await response.json();
            if (data.exists && data.patient) {
              onNavigate && onNavigate('dashboard', { patient: data.patient, patientId: data.patient.id });
            } else {
              setIsRegistering(true);
            }
          } catch (err) {
            console.error(err);
            alert('Error logging in.');
          }
        }}>
          <div className="field-group">
            <label className="field-label font-mono" htmlFor="patient-id-input">
              {t('infoPanel.patient.abhaLabel')}
            </label>
            <div className="field-with-action">
              <span className="field-icon material-symbols-outlined">badge</span>
              <input
                className="swiss-field with-icon with-action"
                id="patient-id-input"
                placeholder={t('infoPanel.patient.abhaPlaceholder')}
                type="text"
                value={abhaId}
                onChange={(e) => setAbhaId(e.target.value)}
              />
              <button
                className="field-action-btn font-mono"
                onClick={() => setOtpSent(true)}
                type="button"
              >
                {otpSent ? t('infoPanel.patient.otpSentBtn') : t('infoPanel.patient.getOtp')}
              </button>
            </div>
            <div className="field-meta">
              <span>{t('infoPanel.patient.formatLabel')}</span>
              <a className="field-link" href="#">{t('infoPanel.patient.forgotAbha')}</a>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label font-mono" htmlFor="patient-otp-input">
              {t('infoPanel.patient.otpLabel')}
            </label>
            <div className="field-with-action">
              <span className="field-icon material-symbols-outlined">password</span>
              <input
                className="swiss-field with-icon otp-field font-mono"
                id="patient-otp-input"
                maxLength={6}
                placeholder="• • • • • •"
                type="text"
              />
            </div>
            <span className="field-hint font-mono">
              {otpSent
                ? t('infoPanel.patient.otpHintSent')
                : t('infoPanel.patient.otpHint')}
            </span>
          </div>

          {isRegistering && (
            <div className="registration-fields" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px', padding: '15px', background: 'var(--surface-container-low)', borderRadius: '8px', border: '1px solid var(--outline-variant)' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '5px' }}>NEW PATIENT REGISTRATION</div>
              
              <div className="field-group">
                <label className="field-label font-mono">NAME</label>
                <input className="swiss-field" placeholder="Full Name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              
              <div className="field-group">
                <label className="field-label font-mono">EMAIL</label>
                <input className="swiss-field" placeholder="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label font-mono">AGE</label>
                  <input className="swiss-field" placeholder="Age" type="number" value={age} onChange={(e) => setAge(e.target.value)} required />
                </div>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label font-mono">GENDER</label>
                  <select className="swiss-field" value={gender} onChange={(e) => setGender(e.target.value)} required>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="field-group" style={{ flex: 1 }}>
                  <label className="field-label font-mono">BLOOD GROUP</label>
                  <input className="swiss-field" placeholder="e.g. O+" type="text" value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} />
                </div>
              </div>

              <div className="field-group">
                <label className="field-label font-mono">ALLERGIES (Optional)</label>
                <input className="swiss-field" placeholder="Any allergies?" type="text" value={allergies} onChange={(e) => setAllergies(e.target.value)} />
              </div>
            </div>
          )}

          <div className="consent-row">
            <input defaultChecked className="consent-check" id="consent-check" type="checkbox" />
            <label className="consent-label" htmlFor="consent-check">
              {t('infoPanel.patient.consent')}
            </label>
          </div>

          <button className="form-submit-btn" type="submit">
            <span className="material-symbols-outlined">{isRegistering ? 'person_add' : 'login'}</span>
            <span>{isRegistering ? 'Register & Login' : t('infoPanel.patient.verifyBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function DoctorForm({ onNavigate }) {
  const { t } = useLanguage();
  return (
    <div className="auth-form doctor-direct">
      <div className="form-header simple">
        <span className="form-supertitle font-mono">{t('infoPanel.doctor.gateway')}</span>
        <h3 className="form-title">{t('infoPanel.doctor.title')}</h3>
      </div>

      <div className="form-info-block" style={{ marginBottom: '2rem' }}>
        <p style={{ color: 'var(--color-on-surface-variant)', lineHeight: 1.5 }}>
          Bypass authentication is enabled for this terminal. You can directly access the Live Clinical Dashboard.
        </p>
      </div>

      <button 
        className="form-submit-btn" 
        onClick={() => onNavigate && onNavigate('doctor-dashboard')}
        type="button"
      >
        <span className="material-symbols-outlined">dashboard</span>
        <span>Open Clinical Dashboard</span>
      </button>
    </div>
  );
}

function AdminForm({ onNavigate }) {
  const { t } = useLanguage();
  return (
    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-header simple">
        <span className="form-supertitle font-mono">{t('infoPanel.admin.gateway')}</span>
        <h3 className="form-title">{t('infoPanel.admin.title')}</h3>
      </div>

      <div className="field-row-2">
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="terminal-id">{t('infoPanel.admin.terminalLabel')}</label>
          <input className="swiss-field font-mono" id="terminal-id" readOnly type="text" defaultValue="CTR-04B-GROUND" />
        </div>
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="shift-select">{t('infoPanel.admin.shiftLabel')}</label>
          <select className="swiss-field" id="shift-select">
            <option>Morning Shift (07:30 - 14:00)</option>
            <option>Afternoon Shift (13:30 - 20:00)</option>
            <option>Night / Emergency Shift</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label font-mono" htmlFor="operator-pin">{t('infoPanel.admin.pinLabel')}</label>
        <input className="swiss-field font-mono otp-field" id="operator-pin" maxLength={6} placeholder={t('infoPanel.admin.pinPlaceholder')} required type="password" />
      </div>

      <div className="printer-status font-mono">
        <span className="material-symbols-outlined">print</span>
        <span>{t('infoPanel.admin.printerStatus')}</span>
      </div>

      <button className="form-submit-btn" type="submit">
        <span className="material-symbols-outlined">desk</span>
        <span>{t('infoPanel.admin.openBtn')}</span>
      </button>
    </form>
  );
}

export default function InfoPanel({ activeRole, onRoleSwitch, onNavigate }) {
  const localRole = activeRole || 'patient';
  const { t } = useLanguage();

  return (
    <div className="info-panel-section">
      {/* Left: Guidance */}
      <div className="guidance-column">
        <div className="guidance-card">
          <div className="guidance-card-header font-mono">
            <span className="material-symbols-outlined">info</span>
            <span>{t('infoPanel.guidance.title')}</span>
          </div>
          <div className="guidance-body">
            <p className="guidance-headline">
              {t('infoPanel.guidance.headline')}
            </p>
            <p className="guidance-text">
              {t('infoPanel.guidance.text')}
            </p>
          </div>
          <div className="guidance-stats">
            <div className="stat-item">
              <span className="stat-label font-mono">{t('infoPanel.guidance.dailyLabel')}</span>
              <span className="stat-value">12,480+</span>
            </div>
            <div className="stat-item">
              <span className="stat-label font-mono">{t('infoPanel.guidance.waitLabel')}</span>
              <span className="stat-value secondary">18 Mins</span>
            </div>
          </div>
        </div>

        <div className="help-card">
          <div className="help-card-left">
            <div className="help-icon">
              <span className="material-symbols-outlined">support_agent</span>
            </div>
            <div>
              <span className="help-title">{t('infoPanel.help.title')}</span>
              <span className="help-sub font-mono">{t('infoPanel.help.sub')}</span>
            </div>
          </div>
          <a className="help-link font-mono" href="#">
            {t('infoPanel.help.link')}
            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>open_in_new</span>
          </a>
        </div>
      </div>

      {/* Right: Form Panel */}
      <div className="form-panel">
        <div className="form-tabs font-mono">
          {['patient', 'doctor', 'admin'].map((role) => (
            <button
              key={role}
              className={`tab-btn ${localRole === role ? 'active' : ''}`}
              onClick={() => onRoleSwitch ? onRoleSwitch(role) : null}
              type="button"
            >
              {role === 'patient' ? t('infoPanel.tabs.patient') : role === 'doctor' ? t('infoPanel.tabs.doctor') : t('infoPanel.tabs.admin')}
            </button>
          ))}
        </div>

        {localRole === 'patient' && <PatientForm onNavigate={onNavigate} />}
        {localRole === 'doctor' && <DoctorForm onNavigate={onNavigate} />}
        {localRole === 'admin' && <AdminForm onNavigate={onNavigate} />}
      </div>
    </div>
  );
}
