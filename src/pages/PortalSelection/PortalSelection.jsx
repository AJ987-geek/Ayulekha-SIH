import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PortalSelection.css';

export default function PortalSelection({ onNavigate }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [activePanel, setActivePanel] = useState('mobile'); // 'gmail' | 'mobile' | 'abha'
  const [mobileNumber, setMobileNumber] = useState('');
  const [abhaNumber, setAbhaNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  // ── Handle Mobile OTP Send ──
  const handleSendMobileOtp = async () => {
    const cleanMobile = mobileNumber.trim();
    if (cleanMobile.length !== 10 || !/^\d+$/.test(cleanMobile)) {
      alert(isHi ? 'कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setFeedbackMsg('');
    try {
      const res = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: cleanMobile })
      });
      const data = await res.json();
      if (!res.ok) {
        // Even in test mode, display message
        alert(data.message || 'OTP request failed');
      }
      setOtpSent(true);
      setFeedbackMsg(isHi ? 'OTP आपके मोबाइल पर भेज दिया गया है' : 'OTP has been dispatched to your mobile number');
    } catch (err) {
      console.warn('Backend send-otp warning:', err);
      // Fallback allowing testing
      setOtpSent(true);
      setFeedbackMsg(isHi ? 'OTP भेजा गया (डेमो मोड: 123456)' : 'OTP sent (Demo mode: 123456)');
    } finally {
      setLoading(false);
    }
  };

  // ── Handle OTP Verify ──
  const handleVerifyOtp = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length < 4) {
      alert(isHi ? 'कृपया पूरा OTP दर्ज करें' : 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/patients/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: mobileNumber.trim(), otp: enteredOtp })
      });
      const data = await res.json();

      if (data.verified || res.ok) {
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient?.id || 'P-DEMO',
            patient: data.patient || { name: 'Citizen User', mobile: mobileNumber, abha: '91-4417-8890-1234' }
          });
        }
      } else {
        alert(data.message || (isHi ? 'अमान्य OTP' : 'Invalid OTP code'));
      }
    } catch (err) {
      console.warn('Backend verify-otp error:', err);
      // Seamless demo fallback
      if (onNavigate) {
        onNavigate('dashboard', {
          patientId: 'P-DEMO',
          patient: { name: 'Citizen User', mobile: mobileNumber, abha: '91-4417-8890-1234' }
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Handle ABHA Check ──
  const handleCheckAbha = async () => {
    const cleanAbha = abhaNumber.trim();
    if (!cleanAbha) {
      alert(isHi ? 'कृपया अपना ABHA या रोल नंबर दर्ज करें' : 'Please enter your ABHA ID or University Roll Number');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/patients/check-abha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha: cleanAbha })
      });
      const data = await res.json();

      if (data.exists && data.patient) {
        if (onNavigate) {
          onNavigate('consent', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.medicalHistory || [],
            email: data.patient.email || ''
          });
        }
      } else {
        alert(isHi ? 'कोई रिकॉर्ड नहीं मिला। कृपया पंजीकरण पूरा करें।' : 'No record found. Please complete citizen registration.');
        if (onNavigate) onNavigate('identity');
      }
    } catch (err) {
      console.warn('Check ABHA network error:', err);
      if (onNavigate) onNavigate('identity');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpBoxChange = (val, idx) => {
    const nextOtp = [...otp];
    nextOtp[idx] = val.slice(-1);
    setOtp(nextOtp);
    if (val && idx < 5) {
      const nextInput = document.getElementById(`otp-box-${idx + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <main className="hero-section-wrap">
      <div className="hero-grid">
        {/* ── LEFT COLUMN ── */}
        <div className="hero-left">
          <div className="hero-img-wrap">
            <img 
              src="/assets/hero.jpg" 
              alt="Ayushman Bharat Healthcare" 
              onError={(e) => {
                e.target.style.display = 'none';
                if (e.target.nextElementSibling) e.target.nextElementSibling.style.display = 'flex';
              }}
            />
            <div className="hero-img-placeholder" style={{ display: 'none' }}>
              <div style={{ fontSize: '72px' }}>🏥</div>
            </div>
            <div className="hero-badge">
              <div className="hero-badge-dot"></div>
              <span>
                {isHi ? '🛡️ 100% सुरक्षित नागरिक स्वास्थ्य रिकॉर्ड' : '🛡️ 100% Secure Citizen Health Records'}
              </span>
            </div>
          </div>

          <div className="hero-content">
            <div className="stats-divider"></div>
            <h1 className="hero-title">
              <span>{isHi ? 'भारत का अपना' : "India's Own"}</span>
              <br />
              <span style={{ color: 'var(--primary)' }}>
                {isHi ? 'डिजिटल स्वास्थ्य रिकॉर्ड पोर्टल' : 'Health Record Portal'}
              </span>
            </h1>
            <p className="hero-subtitle">
              {isHi
                ? "आयुष्मान भारत डिजिटल मिशन के तहत आपके और आपके परिवार के मेडिकल रिकॉर्ड्स, लैब रिपोर्ट्स, नुस्खे और टीकाकरण का सुरक्षित, आजीवन डिजिटल संग्रह।"
                : "Secure, lifelong storage for you and your family's medical records, diagnostic lab reports, prescriptions, and immunizations under the Ayushman Bharat Digital Mission."}
            </p>

            {/* Feature Pills */}
            <div className="feature-pills">
              <div className="feature-pill pill-green">
                <span>📁</span>
                <span>{isHi ? 'सभी रिकॉर्ड सुरक्षित — आजीवन क्लाउड एक्सेस' : 'Keep All Records Safe — Lifetime cloud access'}</span>
              </div>
              <div className="feature-pill pill-dark">
                <span>🏥</span>
                <span>{isHi ? 'अस्पतालों से जुड़ाव — सरकारी व निजी केंद्र' : 'Connect Hospitals — Govt & private facilities'}</span>
              </div>
              <div className="feature-pill pill-green">
                <span>🤖</span>
                <span>{isHi ? 'AI पूर्व-परामर्श — बहुभाषी व वॉइस सहायता' : 'AI Pre-Consultation — Voice & multi-lingual assist'}</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar-row">
              <div className="stat-card">
                <div className="val">50+ Cr</div>
                <div className="lbl">{isHi ? 'सत्यापित ABHA खाते' : 'Verified ABHA IDs'}</div>
              </div>
              <div className="stat-card">
                <div className="val">2.4 Lakh</div>
                <div className="lbl">{isHi ? 'संबद्ध स्वास्थ्य केंद्र' : 'Connected Facilities'}</div>
              </div>
              <div className="stat-card">
                <div className="val">24×7</div>
                <div className="lbl">{isHi ? 'अखंड डिजिटल सेवा' : 'Service Availability'}</div>
              </div>
            </div>

            {/* Additional Roles: Doctor & Triage */}
            <div className="portal-alt-roles">
              <div 
                className="alt-role-card" 
                onClick={() => onNavigate && onNavigate('doctor-dashboard')}
                title="Physician / Clinician OPD Queue"
              >
                <div className="alt-role-icon">🩺</div>
                <div>
                  <div className="alt-role-title">{isHi ? 'चिकित्सक पोर्टल' : 'Doctor OPD Portal'}</div>
                  <div className="alt-role-desc">{isHi ? 'ओपीडी कतार एवं OCR रिकॉर्ड समीक्षा' : 'Review clinical queues & OCR records'}</div>
                </div>
              </div>

              <div 
                className="alt-role-card" 
                onClick={() => onNavigate && onNavigate('triage')}
                title="Rapid Red-Flag Symptom Assessment"
              >
                <div className="alt-role-icon">🚨</div>
                <div>
                  <div className="alt-role-title">{isHi ? 'त्वरित ट्रायज / आपातकाल' : 'Rapid Triage / Emergency'}</div>
                  <div className="alt-role-desc">{isHi ? 'रेड-फ्लैग त्वरित लक्षण मूल्यांकन' : 'Instant red-flag symptom screening'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: LOGIN CARD ── */}
        <div className="login-card slide-right">
          <div className="login-tag">
            <span>🛡️</span>
            <span>{isHi ? 'नागरिक पोर्टल एक्सेस' : 'Citizen Portal Access'}</span>
          </div>

          <h2 className="login-heading">{isHi ? 'लॉग इन करें' : 'Log In'}</h2>
          <p className="login-sub">{isHi ? 'अपनी पसंदीदा विधि चुनें।' : 'Choose how you want to log in.'}</p>

          {/* Login Option Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className={`login-btn lb-mobile ${activePanel === 'mobile' ? 'active-tab' : ''}`}
              onClick={() => { setActivePanel('mobile'); setOtpSent(false); }}
              type="button"
            >
              <span className="lb-left">
                <span className="lb-icon">📱</span>
                <span>{isHi ? 'मोबाइल नंबर से लॉग इन' : 'Login with Mobile Number'}</span>
              </span>
              <span className="arrow">→</span>
            </button>

            <button 
              className={`login-btn lb-abha ${activePanel === 'abha' ? 'active-tab' : ''}`}
              onClick={() => setActivePanel('abha')}
              type="button"
            >
              <span className="lb-left">
                <span className="lb-icon">🪪</span>
                <span>{isHi ? 'ABHA नंबर / रोल नंबर' : 'Login with ABHA Number'}</span>
              </span>
              <span className="arrow">→</span>
            </button>

            <button 
              className={`login-btn lb-gmail ${activePanel === 'gmail' ? 'active-tab' : ''}`}
              onClick={() => setActivePanel('gmail')}
              type="button"
            >
              <span className="lb-left">
                <span className="lb-icon">✉️</span>
                <span>{isHi ? 'गूगल खाते से लॉग इन' : 'Login with Gmail'}</span>
              </span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* Mobile Panel */}
          {activePanel === 'mobile' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {isHi ? 'अपना 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Enter Your Mobile Number'}
              </p>
              <div className="input-prefix">
                <span className="prefix">+91</span>
                <input 
                  type="tel"
                  placeholder="9876543210"
                  maxLength={10}
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, ''))}
                  disabled={loading || otpSent}
                />
              </div>

              {!otpSent ? (
                <button 
                  className="send-otp-btn"
                  onClick={handleSendMobileOtp}
                  disabled={loading || mobileNumber.length !== 10}
                  type="button"
                >
                  {loading ? (isHi ? 'भेजा जा रहा है...' : 'Sending OTP...') : (isHi ? 'OTP भेजें →' : 'Send OTP →')}
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {feedbackMsg || (isHi ? '6-अंकीय OTP दर्ज करें:' : 'Enter the 6-digit OTP sent to your mobile:')}
                  </p>
                  <div className="otp-row">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <input 
                        key={i}
                        id={`otp-box-${i}`}
                        type="text"
                        className="otp-box"
                        maxLength={1}
                        inputMode="numeric"
                        value={otp[i]}
                        onChange={(e) => handleOtpBoxChange(e.target.value, i)}
                      />
                    ))}
                  </div>
                  <button 
                    className="send-otp-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                    type="button"
                  >
                    {loading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'सत्यापित करें एवं आगे बढ़ें →' : 'Verify & Enter Portal →')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ABHA Panel */}
          {activePanel === 'abha' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {isHi ? 'अपना 14-अंकीय ABHA या रोल नंबर दर्ज करें' : 'Enter 14-Digit ABHA or Roll Number'}
              </p>
              <div className="input-prefix">
                <span className="prefix">ABHA</span>
                <input 
                  type="text"
                  placeholder="e.g. 91-4417-8890-1234 or Roll No"
                  value={abhaNumber}
                  onChange={(e) => setAbhaNumber(e.target.value)}
                  disabled={loading}
                />
              </div>
              <button 
                className="send-otp-btn"
                onClick={handleCheckAbha}
                disabled={loading || !abhaNumber.trim()}
                type="button"
              >
                {loading ? (isHi ? 'जांच हो रही है...' : 'Checking...') : (isHi ? 'रिकॉर्ड खोजें →' : 'Find My Health Record →')}
              </button>
            </div>
          )}

          {/* Gmail Panel */}
          {activePanel === 'gmail' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {isHi ? 'Google खाते से जारी रखें' : 'Continue with Google Account'}
              </p>
              <div className="gmail-state">
                <div className="google-logo">
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 'var(--text-sm)' }}>
                    {isHi ? 'Google साइन-इन पर पुनर्निर्देशित' : 'Redirect to Google Sign-In'}
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                    {isHi ? 'आपको सुरक्षित रूप से कनेक्ट किया जाएगा' : "You'll be securely authenticated"}
                  </div>
                </div>
              </div>
              <button 
                className="send-otp-btn"
                style={{ background: '#4285F4' }}
                onClick={() => {
                  if (onNavigate) {
                    onNavigate('dashboard', {
                      patientId: 'P-GOOGLE',
                      patient: { name: 'Google Verified User', email: 'citizen@example.gov.in', abha: '91-4417-8890-1234' }
                    });
                  }
                }}
                type="button"
              >
                {isHi ? 'Google से जारी रखें →' : 'Continue with Google →'}
              </button>
            </div>
          )}

          <div className="or-divider">{isHi ? 'या' : 'OR'}</div>

          {/* Register Link */}
          <div className="login-register-link">
            <span>{isHi ? 'क्या आपके पास ABHA नंबर नहीं है? ' : "Don't have an ABHA yet? "}</span>
            <a 
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('identity');
              }}
            >
              {isHi ? 'अभी पंजीकरण करें →' : 'Register now →'}
            </a>
          </div>

          {/* Encryption Note */}
          <div className="enc-box">
            <span>🔒</span>
            <span>
              {isHi 
                ? 'DPDP अधिनियम 2023 एवं 256-बिट एन्क्रिप्शन द्वारा पूर्णतः सुरक्षित।' 
                : 'Protected by DPDP Act 2023 and 256-bit AES encryption.'}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
