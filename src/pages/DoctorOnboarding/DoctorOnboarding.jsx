import React, { useState } from 'react';
import './DoctorOnboarding.css';

export default function DoctorOnboarding({ onNavigate }) {
  const [formData, setFormData] = useState({
    fullName: 'Dr. Arvind Menon',
    medicalCouncil: 'National Medical Commission (NMC)',
    regNumber: 'DMC/R/12489',
    designation: 'Consultant',
    experience: '18',
    aboutDept: "General Medicine looks after everyday illnesses, long-term conditions like diabetes and blood pressure, and problems that don't fit one specialty.",
    password: '••••••••••••',
    confirmPassword: '••••••••••••',
    termsAccepted: true
  });

  const [selectedLanguages, setSelectedLanguages] = useState(['Hindi', 'English', 'Malayalam']);
  const [selectedDays, setSelectedDays] = useState(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']);

  const languages = ['Hindi', 'English', 'Malayalam', 'Punjabi', 'Bengali', 'Tamil'];
  const days = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const handleLanguageToggle = (lang) => {
    setSelectedLanguages(prev => 
      prev.includes(lang) ? prev.filter(l => l !== lang) : [...prev, lang]
    );
  };

  const handleDayToggle = (day) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Onboarding complete', formData, selectedLanguages, selectedDays);
    onNavigate('doctor-dashboard');
  };

  return (
    <div className="onb-container">
      {/* HEADER */}
      <header className="onb-header">
        <div className="onb-header-inner">
          <div className="onb-brand-group">
            <span className="onb-brand-name">AyuLeakha</span>
            <span className="onb-brand-hindi">आयु लेखा</span>
            <span className="onb-separator">|</span>
            <span className="onb-mono-label tracking-widest">DOCTOR ONBOARDING</span>
          </div>
          <div className="onb-header-actions">
            <button type="button" className="onb-lang-btn">
              <span>EN</span> <span className="onb-separator">/</span> <span className="onb-hindi-text">हिन्दी</span>
            </button>
            <span className="onb-helpline onb-mono-label hidden-sm">
              Need help? <span className="onb-helpline-number">1800-11-4471</span>
            </span>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="onb-main">
        <div className="onb-title-section">
          <h1>Complete your profile, Doctor</h1>
          <p className="onb-hindi-subtitle">अपनी प्रोफ़ाइल पूरी करें</p>
          <p className="onb-subtitle-desc">Your hospital has already registered you. This takes about three minutes.</p>
        </div>

        {/* VERIFIED INVITE PANEL */}
        <div className="onb-invite-panel">
          <div className="onb-invite-content">
            <div className="onb-invite-info">
              <div className="onb-verified-tag">
                <span className="material-symbols-outlined onb-icon-sm">check</span>
                <span>Invite verified</span>
              </div>
              <div className="onb-hospital-name">AIIMS New Delhi</div>
              <div className="onb-invite-meta onb-mono-label">
                INVITE CODE AIIMS-DR-4471 · ISSUED BY HOSPITAL ADMIN · DEPARTMENT OF GENERAL MEDICINE
              </div>
            </div>
            <button type="button" className="onb-not-you-btn">Not you? / आप नहीं हैं?</button>
          </div>
        </div>

        {/* FORM */}
        <form className="onb-form" onSubmit={handleSubmit}>
          
          {/* SECTION 1 */}
          <section className="onb-section">
            <div className="onb-section-header">
              <h2>1. YOUR IDENTITY & CREDENTIALS / आपका परिचय</h2>
            </div>
            
            <div className="onb-form-grid">
              <div className="onb-form-group">
                <label className="onb-mono-label">FULL NAME</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="onb-hairline-input font-medium" />
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">MEDICAL COUNCIL</label>
                <div className="onb-select-wrapper">
                  <select name="medicalCouncil" value={formData.medicalCouncil} onChange={handleChange} className="onb-hairline-input">
                    <option>National Medical Commission (NMC)</option>
                    <option>Delhi Medical Council (DMC)</option>
                    <option>Maharashtra Medical Council</option>
                    <option>Karnataka Medical Council</option>
                  </select>
                  <span className="material-symbols-outlined onb-select-icon">expand_more</span>
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">REGISTRATION NUMBER</label>
                <input type="text" name="regNumber" value={formData.regNumber} onChange={handleChange} className="onb-hairline-input font-mono font-medium tracking-wide" />
                <p className="onb-help-text">We check this against your council's register before your account goes live.</p>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">DESIGNATION</label>
                <div className="onb-select-wrapper">
                  <select name="designation" value={formData.designation} onChange={handleChange} className="onb-hairline-input">
                    <option>Consultant</option>
                    <option>Senior Resident</option>
                    <option>Assistant Professor</option>
                    <option>Professor & Head of Dept</option>
                  </select>
                  <span className="material-symbols-outlined onb-select-icon">expand_more</span>
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">DEPARTMENT</label>
                <div className="onb-locked-field">
                  <div className="onb-locked-content">
                    <span className="material-symbols-outlined onb-icon-md">domain</span>
                    <span>General Medicine</span>
                  </div>
                  <span className="onb-locked-badge onb-mono-label">LOCKED</span>
                </div>
                <p className="onb-help-text">Set by your hospital admin.</p>
              </div>
              
              {/* Note: Mobile Number and Work Email fields have been removed per user request */}
            </div>
          </section>

          {/* SECTION 2 */}
          <section className="onb-section">
            <div className="onb-section-header">
              <h2>2. HOW PATIENTS WILL SEE YOU / मरीज़ आपको कैसे देखेंगे</h2>
            </div>
            <p className="onb-section-desc">This appears on the patient's screen before their visit, so they know who they're meeting.</p>

            <div className="onb-form-grid">
              
              <div className="onb-photo-row">
                <div className="onb-photo-circle">
                  <img src="https://lh3.googleusercontent.com/aida/AEtjO1WKW89LG6c2kDzPkdEbF7vAv6djOeK89lA4qgWzfuwCX0l-LAiNsVMpasxuui6aiM6tszFybp4bEh51fZsDMaD3SCiLhMgj9ZFc-_geEQTIJdFqlotSlEDWvq4HYWm3J3m_7rSVmDtkldl6xGf0fNC6_cB3iFnMj4A2GchjmZiRZDzCK71jsJ-ZrcNWumQa9yzaE_q0h7mIMs4Qq3eusZBVmbjSGzOpTj6zXGg1K3NbxA2Dag48LkoJoMw" alt="Dr. Arvind Menon" />
                </div>
                <div className="onb-photo-actions">
                  <button type="button" className="onb-upload-btn">
                    <span className="material-symbols-outlined onb-icon-sm">upload</span>
                    <span>Upload a photo / फ़ोटो जोड़ें</span>
                  </button>
                  <p className="onb-help-text">A clear, front-facing photo. Optional.</p>
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">YEARS OF EXPERIENCE</label>
                <input type="number" name="experience" value={formData.experience} onChange={handleChange} className="onb-hairline-input font-medium" />
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label mb-3">LANGUAGES YOU SPEAK</label>
                <div className="onb-chip-group">
                  {languages.map(lang => (
                    <button 
                      key={lang} 
                      type="button" 
                      onClick={() => handleLanguageToggle(lang)}
                      className={`onb-chip ${selectedLanguages.includes(lang) ? 'selected' : ''}`}
                    >
                      {selectedLanguages.includes(lang) && <span className="material-symbols-outlined onb-icon-sm">check</span>}
                      <span>{lang}</span>
                    </button>
                  ))}
                  <button type="button" className="onb-chip add-another">
                    <span>+ Add another</span>
                  </button>
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label mb-3">OPD DAYS</label>
                <div className="onb-days-grid">
                  {days.map(day => (
                    <button 
                      key={day} 
                      type="button" 
                      onClick={() => handleDayToggle(day)}
                      className={`onb-day-btn ${selectedDays.includes(day) ? 'selected' : ''}`}
                    >
                      {selectedDays.includes(day) ? (
                        <span className="material-symbols-outlined onb-icon-sm">check</span>
                      ) : (
                        <span className="onb-empty-circle"></span>
                      )}
                      <span className="onb-mono-label day-label">{day}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label mb-1">OPD TIMINGS</label>
                <div className="onb-time-grid">
                  <div>
                    <span className="onb-mono-label tiny-label">FROM</span>
                    <input type="text" defaultValue="9:00 AM" className="onb-hairline-input font-mono font-medium" />
                  </div>
                  <div>
                    <span className="onb-mono-label tiny-label">TO</span>
                    <input type="text" defaultValue="12:00 PM" className="onb-hairline-input font-mono font-medium" />
                  </div>
                </div>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">ABOUT YOUR DEPARTMENT</label>
                <textarea 
                  name="aboutDept" 
                  value={formData.aboutDept} 
                  onChange={handleChange} 
                  rows="3" 
                  className="onb-hairline-textarea"
                />
                <p className="onb-help-text mt-2">Plain language, one or two lines. Patients read this.</p>
              </div>

            </div>
          </section>

          {/* SECTION 3 */}
          <section className="onb-section">
            <div className="onb-section-header">
              <h2>3. SECURE YOUR ACCOUNT / अपना खाता सुरक्षित करें</h2>
            </div>
            
            <div className="onb-form-grid">
              <div className="onb-form-group">
                <label className="onb-mono-label">CREATE PASSWORD</label>
                <div className="onb-password-wrapper">
                  <input type="password" name="password" value={formData.password} onChange={handleChange} className="onb-hairline-input font-mono password-input" />
                  <button type="button" className="onb-visibility-toggle">
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </div>
                <p className="onb-help-text">At least 10 characters.</p>
              </div>

              <div className="onb-form-group">
                <label className="onb-mono-label">CONFIRM PASSWORD</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="onb-hairline-input font-mono password-input" />
              </div>

              <div className="onb-declaration">
                <label className="onb-checkbox-label">
                  <div className="onb-custom-checkbox checked">
                    <span className="material-symbols-outlined onb-icon-sm">check</span>
                  </div>
                  <div className="onb-checkbox-text">
                    <div className="onb-checkbox-en">I confirm that the registration details above are mine and accurate.</div>
                    <div className="onb-checkbox-hi">मैं पुष्टि करता/करती हूँ कि ऊपर दिए गए पंजीकरण विवरण मेरे और सही हैं।</div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* FOOTER ACTIONS */}
          <div className="onb-footer-actions">
            <button type="submit" className="onb-submit-btn">
              <span>Create my account</span>
              <span className="onb-btn-separator">/</span>
              <span className="onb-btn-hindi">खाता बनाएं</span>
            </button>
            <div className="onb-save-later">
              <button type="button" className="onb-save-btn">Save and finish later / बाद में पूरा करें</button>
            </div>
          </div>

          <div className="onb-security-notice">
            <p className="onb-mono-label">YOUR REGISTRATION NUMBER IS STORED MASKED — SHOWN AS •••• 2489 AFTER VERIFICATION.</p>
          </div>

        </form>
      </main>
    </div>
  );
}
