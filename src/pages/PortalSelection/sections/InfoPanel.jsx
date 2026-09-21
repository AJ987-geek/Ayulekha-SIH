import { useState } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import './InfoPanel.css';

function PatientForm() {
  const [otpSent, setOtpSent] = useState(false);
  const { language, toggleLanguage, t } = useLanguage();

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
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
          </select>
        </div>
      </div>

      <div className="patient-path returning-patient">
        <div className="path-header">
          <h4 className="path-title">{t('infoPanel.patient.returningTitle')}</h4>
          <p className="path-desc">{t('infoPanel.patient.returningDesc')}</p>
        </div>
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); onNavigate && onNavigate('dashboard'); }}>
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

          <div className="consent-row">
            <input defaultChecked className="consent-check" id="consent-check" type="checkbox" />
            <label className="consent-label" htmlFor="consent-check">
              {t('infoPanel.patient.consent')}
            </label>
          </div>

          <button className="form-submit-btn" type="submit">
            <span className="material-symbols-outlined">login</span>
            <span>{t('infoPanel.patient.verifyBtn')}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function DoctorForm() {
  const { t } = useLanguage();
  return (
    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-header simple">
        <span className="form-supertitle font-mono">{t('infoPanel.doctor.gateway')}</span>
        <h3 className="form-title">{t('infoPanel.doctor.title')}</h3>
      </div>

      <div className="field-row-2">
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="doctor-id">{t('infoPanel.doctor.idLabel')}</label>
          <input className="swiss-field" id="doctor-id" placeholder="AIIMS-DOC-8821" required type="text" />
        </div>
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="room-select">{t('infoPanel.doctor.roomLabel')}</label>
          <select className="swiss-field" id="room-select">
            <option>Room 101 - General Medicine</option>
            <option>Room 102 - Cardiology OPD</option>
            <option>Room 105 - Endocrinology &amp; Diabetes</option>
            <option>Room 108 - Orthopaedics Trauma</option>
            <option>Room 112 - Pulmonology &amp; Chest</option>
            <option>Room 118 - Paediatric Care</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label font-mono" htmlFor="doctor-password">{t('infoPanel.doctor.passLabel')}</label>
        <input className="swiss-field" id="doctor-password" placeholder="••••••••••••" required type="password" />
      </div>

      <div className="form-footer-row">
        <label className="checkbox-label">
          <input defaultChecked type="checkbox" />
          <span>{t('infoPanel.doctor.keepActive')}</span>
        </label>
        <a className="field-link" href="#">{t('infoPanel.doctor.reset')}</a>
      </div>

      <button className="form-submit-btn" type="submit">
        <span className="material-symbols-outlined">medical_services</span>
        <span>{t('infoPanel.doctor.authBtn')}</span>
      </button>
    </form>
  );
}

function AdminForm() {
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

export default function InfoPanel({ activeRole, onRoleSwitch }) {
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

        {localRole === 'patient' && <PatientForm />}
        {localRole === 'doctor' && <DoctorForm />}
        {localRole === 'admin' && <AdminForm />}
      </div>
    </div>
  );
}
