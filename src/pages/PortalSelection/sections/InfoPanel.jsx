import { useState } from 'react';
import './InfoPanel.css';

function PatientForm({ onNavigate }) {
  const [otpSent, setOtpSent] = useState(false);

  return (
    <div className="patient-form-container">
      <div className="form-header">
        <div>
          <span className="form-supertitle font-mono">Direct OTP Gateway · सीधा ओटीपी पोर्टल</span>
          <h3 className="form-title">Patient check-in</h3>
        </div>
        <div className="lang-selector font-mono">
          <span className="lang-label">LANG:</span>
          <select className="lang-select">
            <option>English / हिन्दी</option>
            <option>हिन्दी (Hindi)</option>
            <option>English</option>
            <option>বাংলা (Bengali)</option>
            <option>தமிழ் (Tamil)</option>
          </select>
        </div>
      </div>

      <div className="patient-path returning-patient">
        <div className="path-header">
          <h4 className="path-title">Returning patient</h4>
          <p className="path-desc">You've visited us before</p>
        </div>
        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <div className="field-group">
            <label className="field-label font-mono" htmlFor="patient-id-input">
              14-digit ABHA Number or Registered Mobile / 14-अंकीय आभा संख्या या पंजीकृत मोबाइल
            </label>
            <div className="field-with-action">
              <span className="field-icon material-symbols-outlined">badge</span>
              <input
                className="swiss-field with-icon with-action"
                id="patient-id-input"
                placeholder="e.g. 9876543210 or 91-XXXX-XXXX-XXXX"
                type="text"
              />
              <button
                className="field-action-btn font-mono"
                onClick={() => setOtpSent(true)}
                type="button"
              >
                {otpSent ? 'OTP Sent ✓' : 'Get OTP'}
              </button>
            </div>
            <div className="field-meta">
              <span>Format: ABHA Number without hyphens / बिना हाइफ़न के</span>
              <a className="field-link" href="#">Forgot ABHA? / आभा भूल गए?</a>
            </div>
          </div>

          <div className="field-group">
            <label className="field-label font-mono" htmlFor="patient-otp-input">
              6-Digit Aadhaar / ABDM Secure OTP / 6-अंकीय आधार ओटीपी
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
                ? 'OTP sent via SMS · Expires in 04:59'
                : 'Enter the OTP sent via SMS to your registered Aadhaar mobile. / पंजीकृत आधार मोबाइल पर भेजा गया ओटीपी दर्ज करें।'}
            </span>
          </div>

          <div className="consent-row">
            <input defaultChecked className="consent-check" id="consent-check" type="checkbox" />
            <label className="consent-label" htmlFor="consent-check">
              I hereby grant consent to AIIMS OPD to fetch my linked demographic data and register my visit token under the ABDM sandbox framework. / मैं एम्स ओपीडी को मेरा डेटा प्राप्त करने एवं आबीडीएम टोकन पंजीकृत करने की अनुमति देता/देती हूँ।
            </label>
          </div>

          <button className="form-submit-btn" type="submit">
            <span className="material-symbols-outlined">login</span>
            <span>Verify &amp; Proceed to Consultation Queue / सत्यापित करें</span>
          </button>
        </form>
      </div>
    </div>
  );
}

function DoctorForm() {
  return (
    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-header simple">
        <span className="form-supertitle font-mono">Clinical Faculty Access</span>
        <h3 className="form-title">Doctor &amp; Consultant Login</h3>
      </div>

      <div className="field-row-2">
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="doctor-id">NMC / AIIMS Staff ID</label>
          <input className="swiss-field" id="doctor-id" placeholder="AIIMS-DOC-8821" required type="text" />
        </div>
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="room-select">Assigned OPD Room / Clinic</label>
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
        <label className="field-label font-mono" htmlFor="doctor-password">Institutional Passkey or Kerberos Password</label>
        <input className="swiss-field" id="doctor-password" placeholder="••••••••••••" required type="password" />
      </div>

      <div className="form-footer-row">
        <label className="checkbox-label">
          <input defaultChecked type="checkbox" />
          <span>Keep hardware token active for 8-hour shift</span>
        </label>
        <a className="field-link" href="#">Reset Passkey</a>
      </div>

      <button className="form-submit-btn" type="submit">
        <span className="material-symbols-outlined">medical_services</span>
        <span>Authenticate &amp; Open Consultation EHR</span>
      </button>
    </form>
  );
}

function AdminForm() {
  return (
    <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
      <div className="form-header simple">
        <span className="form-supertitle font-mono">Counter Operations</span>
        <h3 className="form-title">Terminal &amp; Dispatch Desk Sign In</h3>
      </div>

      <div className="field-row-2">
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="terminal-id">Counter Terminal ID</label>
          <input className="swiss-field font-mono" id="terminal-id" readOnly type="text" defaultValue="CTR-04B-GROUND" />
        </div>
        <div className="field-group">
          <label className="field-label font-mono" htmlFor="shift-select">Duty Shift Roster</label>
          <select className="swiss-field" id="shift-select">
            <option>Morning Shift (07:30 - 14:00)</option>
            <option>Afternoon Shift (13:30 - 20:00)</option>
            <option>Night / Emergency Shift</option>
          </select>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label font-mono" htmlFor="operator-pin">Operator Employee PIN (6 Digits)</label>
        <input className="swiss-field font-mono otp-field" id="operator-pin" maxLength={6} placeholder="Enter PIN" required type="password" />
      </div>

      <div className="printer-status font-mono">
        <span className="material-symbols-outlined">print</span>
        <span>Thermal Receipt Printer: Online (Citizen PR-80)</span>
      </div>

      <button className="form-submit-btn" type="submit">
        <span className="material-symbols-outlined">desk</span>
        <span>Open Desk Queue Manager</span>
      </button>
    </form>
  );
}

export default function InfoPanel({ activeRole, onRoleSwitch, onNavigate }) {
  const localRole = activeRole || 'patient';

  return (
    <div className="info-panel-section">
      {/* Left: Guidance */}
      <div className="guidance-column">
        <div className="guidance-card">
          <div className="guidance-card-header font-mono">
            <span className="material-symbols-outlined">info</span>
            <span>Authentication Guidance</span>
          </div>
          <div className="guidance-body">
            <p className="guidance-headline">
              Single sign-on architecture powered by the Ayushman Bharat Digital Mission.
            </p>
            <p className="guidance-text">
              Patients who already possess an ABHA address (<span className="font-mono" style={{ color: 'var(--primary)', fontSize: '13px' }}>user@abdm</span>) can instantly connect their longitudinal health history without filling physical forms at the registry desk.
            </p>
          </div>
          <div className="guidance-stats">
            <div className="stat-item">
              <span className="stat-label font-mono">Daily Patient Footfall</span>
              <span className="stat-value">12,480+</span>
            </div>
            <div className="stat-item">
              <span className="stat-label font-mono">Average Wait Time</span>
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
              <span className="help-title">Need sign-in assistance?</span>
              <span className="help-sub font-mono">Desk 01, Ground Floor Helpdesk</span>
            </div>
          </div>
          <a className="help-link font-mono" href="#">
            View Guide
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
              {role === 'patient' ? 'Patient Check-in' : role === 'doctor' ? 'Doctor Console' : 'Desk Terminal'}
            </button>
          ))}
        </div>

        {localRole === 'patient' && <PatientForm onNavigate={onNavigate} />}
        {localRole === 'doctor' && <DoctorForm />}
        {localRole === 'admin' && <AdminForm />}
      </div>
    </div>
  );
}
