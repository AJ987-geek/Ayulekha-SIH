import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './DoctorRegistration.css';

export default function DoctorRegistration({ onNavigate }) {
  const { language, toggleLanguage } = useLanguage();

  const [formData, setFormData] = useState({
    mobileNumber: '98110 44725',
    email: 'doctor.vikram.sharma@aiims.gov.in',
    identifierSystem: 'National Medical Commission (NMC UID)',
    uid: 'NMC-UID-2024-88492',
    stateMedicalCouncil: 'Delhi Medical Council',
    yearOfRegistration: '2008',
    password: '••••••••••••••••',
    confirmPassword: '••••••••••••••••',
    termsAccepted: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Registration complete:', formData);
    onNavigate('doctor-onboarding');
  };

  return (
    <div className="doc-reg-container">
      <header className="doc-reg-header">
        <div className="doc-reg-logo">
          <h1>AyuLeakha <span>CLINICAL CORE</span></h1>
          <p className="font-mono">DOCTOR REGISTRATION • चिकित्सक पंजीकरण</p>
        </div>
        <div className="doc-reg-header-actions">
          <button type="button" className="lang-toggle font-mono" onClick={() => toggleLanguage(language === 'en' ? 'hi' : 'en')}>{language === 'en' ? 'EN' : 'हिन्दी'}</button>
          <span className="support-phone font-mono"><span className="material-symbols-outlined icon-small">headset_mic</span> 1800-11-4471</span>
        </div>
      </header>

      <main className="doc-reg-main">
        <div className="doc-reg-content">
          <div className="doc-reg-title-section">
            <div className="doc-reg-tag font-mono">
              <span className="tag-dot"></span> NMC / ABDM INTEGRATED ONBOARDING
            </div>
            <h2>Register as a Medical Practitioner</h2>
            <h3 className="hindi-title">चिकित्सक के रूप में पंजीकरण करें</h3>
            <p className="doc-reg-desc">
              Create your verified clinical account. AyuLeakha connects you
              directly to OPD patient queues, digital case files, and unified ABHA
              healthcare professional records.
            </p>
          </div>

          <div className="doc-reg-steps">
            <div className="step">
              <div className="step-num font-mono">01 - MOBILE</div>
              <div className="step-title">Phone Number</div>
              <div className="step-subtitle">सत्यापित मोबाइल</div>
            </div>
            <div className="step">
              <div className="step-num font-mono">02 - WORK EMAIL</div>
              <div className="step-title">Institutional ID</div>
              <div className="step-subtitle">कार्य ईमेल</div>
            </div>
            <div className="step active">
              <div className="step-num font-mono">03 - CREDENTIALS</div>
              <div className="step-title">U-ID Verification</div>
              <div className="step-subtitle">विशिष्ट पहचान संख्या</div>
            </div>
            <div className="step">
              <div className="step-num font-mono">04 - SECURITY</div>
              <div className="step-title">Set Password</div>
              <div className="step-subtitle">पासवर्ड सुरक्षित करें</div>
            </div>
          </div>

          <form className="doc-reg-form" onSubmit={handleSubmit}>
            
            {/* Section 01 */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-num font-mono">SECTION 01</span>
                <h4>Phone Verification <span className="hindi-label">/ फोन नंबर</span></h4>
                <div className="verified-badge font-mono">
                  <span className="material-symbols-outlined icon-small">verified</span> Verified / सत्यापित
                </div>
              </div>
              
              <div className="input-group">
                <label className="font-mono">REGISTERED MOBILE NUMBER / पंजीकृत मोबाइल नंबर <span className="required">*</span></label>
                <div className="input-wrapper read-only">
                  <span className="prefix font-mono">+91</span>
                  <input type="text" name="mobileNumber" value={formData.mobileNumber} readOnly />
                  <span className="material-symbols-outlined success-icon">check_circle</span>
                </div>
              </div>
            </section>

            {/* Section 02 */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-num font-mono">SECTION 02</span>
                <h4>Work Email Address <span className="hindi-label">/ कार्य ईमेल</span></h4>
              </div>

              <div className="input-group">
                <label className="font-mono">OFFICIAL / INSTITUTIONAL EMAIL / आधिकारिक ईमेल <span className="required">*</span></label>
                <div className="input-wrapper">
                  <span className="material-symbols-outlined input-icon">mail</span>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} />
                </div>
                <div className="input-help">
                  <span className="material-symbols-outlined icon-small">info</span>
                  <p>We send registration link and daily OPD schedule summary directly to this institutional address.</p>
                </div>
              </div>
            </section>

            {/* Section 03 */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-num font-mono">SECTION 03</span>
                <h4>Practitioner Unique Identifier <span className="hindi-label">/ विशिष्ट पहचान संख्या</span></h4>
              </div>

              <div className="auto-verify-box">
                <div className="auto-verify-left">
                  <span className="material-symbols-outlined flash-icon">bolt</span>
                  <span className="font-mono auto-verify-text">AUTO-VERIFYING AGAINST NATIONAL HEALTH REGISTER (NHR / ABDM)</span>
                </div>
                <div className="auto-verify-right font-mono">
                  API<br/>CONNECTED
                </div>
              </div>

              <div className="input-group">
                <label className="font-mono">IDENTIFIER SYSTEM / पहचान का प्रकार <span className="required">*</span></label>
                <div className="input-wrapper select-wrapper">
                  <select name="identifierSystem" value={formData.identifierSystem} onChange={handleChange}>
                    <option value="National Medical Commission (NMC UID)">National Medical Commission (NMC UID)</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label className="font-mono">U-ID / REGISTRATION NUMBER / विशिष्ट पहचान क्रमांक <span className="required">*</span></label>
                <div className="input-wrapper valid-wrapper">
                  <input type="text" name="uid" value={formData.uid} onChange={handleChange} />
                  <span className="valid-format font-mono">VALID<br/>FORMAT</span>
                </div>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="font-mono">STATE MEDICAL COUNCIL / राज्य चिकित्सा परिषद</label>
                  <div className="input-wrapper">
                    <input type="text" name="stateMedicalCouncil" value={formData.stateMedicalCouncil} onChange={handleChange} />
                  </div>
                </div>
                <div className="input-group">
                  <label className="font-mono">YEAR OF REGISTRATION / पंजीकरण का वर्ष</label>
                  <div className="input-wrapper">
                    <input type="text" name="yearOfRegistration" value={formData.yearOfRegistration} onChange={handleChange} />
                  </div>
                </div>
              </div>
            </section>

            {/* Section 04 */}
            <section className="form-section">
              <div className="section-header">
                <span className="section-num font-mono">SECTION 04</span>
                <h4>Set Account Password <span className="hindi-label">/ पासवर्ड सुरक्षित करें</span></h4>
              </div>

              <div className="input-row">
                <div className="input-group">
                  <label className="font-mono">CREATE SECURE PASSWORD / पासवर्ड बनाएं <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <input type="password" name="password" value={formData.password} onChange={handleChange} />
                    <span className="material-symbols-outlined visibility-icon">visibility</span>
                  </div>
                </div>
                <div className="input-group">
                  <label className="font-mono">CONFIRM PASSWORD / पासवर्ड की पुष्टि करें <span className="required">*</span></label>
                  <div className="input-wrapper valid-wrapper-pwd">
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} />
                    <span className="material-symbols-outlined success-icon">check</span>
                  </div>
                </div>
              </div>

              <div className="security-matrix">
                <div className="matrix-header">
                  <span className="font-mono matrix-title">SECURITY MATRIX ASSESSMENT</span>
                  <span className="font-mono matrix-status">STRONG / सुरक्षित</span>
                </div>
                <div className="matrix-items font-mono">
                  <span className="matrix-item"><span className="material-symbols-outlined icon-micro">check</span> MIN 10 CHARS</span>
                  <span className="matrix-item"><span className="material-symbols-outlined icon-micro">check</span> 1 UPPERCASE</span>
                  <span className="matrix-item"><span className="material-symbols-outlined icon-micro">check</span> 1 NUMERAL</span>
                  <span className="matrix-item"><span className="material-symbols-outlined icon-micro">check</span> 1 SPECIAL CHAR</span>
                </div>
              </div>
            </section>

            <div className="terms-section">
              <label className="checkbox-label">
                <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} />
                <div className="checkbox-text">
                  <p className="terms-en">I declare that I am a licensed medical practitioner under NMC / State Medical Council guidelines.</p>
                  <p className="terms-hi">मैं पुष्टि करता/करती हूँ कि मैं राष्ट्रीय चिकित्सा आयोग अथवा राज्य चिकित्सा परिषद के अंतर्गत एक पंजीकृत चिकित्सक हूँ।</p>
                </div>
              </label>
            </div>

            <button type="submit" className="submit-btn">
              <div className="btn-content">
                <span className="btn-main-text">Complete Registration & Continue to Verification</span>
                <span className="btn-hi-text">/ पंजीकरण पूरा करें</span>
              </div>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            
            <div className="footer-links">
              <button type="button" className="link-btn" onClick={() => onNavigate('portal')}>
                <span className="material-symbols-outlined icon-small">arrow_back</span>
                Already registered? Sign in / पहले से खाता है? साइन इन करें
              </button>
              <span className="step-info font-mono">STEP 4 OF 4 COMPLETED</span>
            </div>

            <div className="compliance-note">
              <span className="material-symbols-outlined icon-small">verified_user</span>
              <p>All practitioner identifiers are verified in real time via NDHM / ABDM Healthcare Professional Registry (HPR). Sensitive credentials are masked and encrypted according to DISHA and Indian digital health compliance frameworks.</p>
            </div>
            
          </form>
        </div>
      </main>
    </div>
  );
}
