import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PortalSelection.css';

export default function PortalSelection({ onNavigate }) {
  const { t } = useLanguage();

  const [activePanel, setActivePanel] = useState('abha'); // 'abha' | 'mobile'
  const [abhaNumber, setAbhaNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneStep, setPhoneStep] = useState('input'); // 'input' | 'otp'
  const [phoneOtp, setPhoneOtp] = useState('');
  const [otpNotice, setOtpNotice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedAbha = localStorage.getItem('abhaId');
    if (savedAbha) {
      const autoLogin = async () => {
        setLoading(true);
        try {
          const res = await fetch('/api/patients/check-abha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ abha: savedAbha })
          });
          const data = await res.json();
          if (data.exists && data.patient) {
            if (onNavigate) {
              onNavigate('dashboard', {
                patientId: data.patient.id,
                patient: data.patient,
                medicalHistory: data.medicalHistory || [],
                email: data.patient.email || ''
              });
            }
          } else {
            localStorage.removeItem('abhaId');
          }
        } catch (err) {
          console.warn('Auto-login error:', err);
        } finally {
          setLoading(false);
        }
      };
      autoLogin();
    }
  }, []);

  // ── Handle ABHA Check ──
  const handleCheckAbha = async () => {
    const cleanAbha = abhaNumber.trim();
    if (!cleanAbha) {
      alert(t('portal.enterAbhaPrompt', 'Please enter your ABHA ID or University Roll Number'));
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
        localStorage.setItem('abhaId', data.patient.abha);
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.medicalHistory || [],
            email: data.patient.email || ''
          });
        }
      } else {
        alert(t('portal.noRecordFound', 'No record found. Please complete citizen registration.'));
        if (onNavigate) onNavigate('identity', { initialMode: 'register', initialAbha: cleanAbha });
      }
    } catch (err) {
      console.warn('Check ABHA network error:', err);
      alert(t('portal.networkError', 'Unable to connect. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Mobile Phone OTP Dispatch ──
  const handlePhoneContinue = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setLoading(true);
    setOtpNotice('');
    try {
      const response = await fetch('/api/patients/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || data.message || 'Unable to dispatch phone OTP.');
        return;
      }
      setPhoneStep('otp');
      if (data.dev_otp) {
        setOtpNotice(`Code dispatched to +91 ${cleanPhone}. (Trial code: ${data.dev_otp} or bypass 123456)`);
      } else {
        setOtpNotice(`OTP sent successfully to +91 ******${cleanPhone.slice(-4)}`);
      }
    } catch (err) {
      console.error(err);
      alert('Network error while requesting phone OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify Mobile Phone OTP ──
  const handleVerifyPhoneOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);
    const cleanOtp = phoneOtp.trim();
    if (cleanOtp.length !== 6) {
      alert('Please enter the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patients/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.detail || data.message || 'Invalid OTP code.');
        return;
      }

      // Existing patient found
      if (data.patient) {
        localStorage.setItem('abhaId', data.patient.abha);
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.patient.medicalHistory || [],
            email: data.patient.email || ''
          });
        }
      } else if (data.isNewPatient) {
        // Phone verified, route to register ABHA ID
        alert('Phone verified! Please enter your ABHA ID to complete first-time registration.');
        if (onNavigate) {
          onNavigate('identity', {
            initialMode: 'register',
            initialPhone: cleanPhone,
            phoneVerified: true,
          });
        }
      }
    } catch (err) {
      console.error(err);
      alert('Verification network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Bypass Backend Services & Go Directly to Patient Dashboard ──
  const handleBypassToDashboard = () => {
    const defaultPatient = {
      id: 'P001',
      name: 'Rahul Sharma',
      abha: '2510991147',
      age: 32,
      gender: 'Male',
      mobile: '9876543210',
      bloodGroup: 'B+',
      allergies: 'Peanuts',
      email: email.trim() || 'rahul.sharma@example.com',
      medicalHistory: ['Mild asthma diagnosed in 2022', 'Seasonal pollen allergy']
    };
    localStorage.setItem('abhaId', defaultPatient.abha);
    if (onNavigate) {
      onNavigate('dashboard', {
        patientId: defaultPatient.id,
        patient: defaultPatient,
        medicalHistory: defaultPatient.medicalHistory,
        email: defaultPatient.email
      });
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
                {t('portal.secureRecords', '🛡️ 100% Secure Citizen Health Records')}
              </span>
            </div>
          </div>

          <div className="hero-content">
            <div className="stats-divider"></div>
            <h1 className="hero-title">
              <span>{t('portal.indiaOwn', "India's Own")}</span>
              <br />
              <span style={{ color: 'var(--primary)' }}>
                {t('portal.healthPortal', 'Health Record Portal')}
              </span>
            </h1>
            <p className="hero-subtitle">
              {t('portal.heroDesc', "Secure, lifelong storage for you and your family's medical records, diagnostic lab reports, prescriptions, and immunizations under the Ayushman Bharat Digital Mission.")}
            </p>

            {/* Feature Pills */}
            <div className="feature-pills">
              <div className="feature-pill pill-green">

                <span>{t('portal.pill1', 'Keep All Records Safe — Lifetime cloud access')}</span>
              </div>
              <div className="feature-pill pill-dark">

                <span>{t('portal.pill2', 'Connect Hospitals — Govt & private facilities')}</span>
              </div>
              <div className="feature-pill pill-green">

                <span>{t('portal.pill3', 'AI Pre-Consultation — Voice & multi-lingual assist')}</span>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="stats-bar-row">
              <div className="stat-card">
                <div className="val">50+ Cr</div>
                <div className="lbl">{t('portal.stat1Lbl', 'Verified ABHA IDs')}</div>
              </div>
              <div className="stat-card">
                <div className="val">2.4 Lakh</div>
                <div className="lbl">{t('portal.stat2Lbl', 'Connected Facilities')}</div>
              </div>
              <div className="stat-card">
                <div className="val">24×7</div>
                <div className="lbl">{t('portal.stat3Lbl', 'Service Availability')}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: LOGIN CARD ── */}
        <div className="login-card slide-right">
          <div className="login-tag">
            <span>{t('portal.loginTag', 'Citizen Portal Access')}</span>
          </div>

          <h2 className="login-heading">{t('portal.loginHeading', 'Log In')}</h2>
          <p className="login-sub">{t('portal.loginSub', 'Choose how you want to log in.')}</p>

          {/* Login Option Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className={`login-btn lb-abha ${activePanel === 'abha' ? 'active-tab' : ''}`}
              onClick={() => setActivePanel('abha')}
              type="button"
            >
              <span className="lb-left">
                <span>{t('portal.tabAbha', 'Login with ABHA Number')}</span>
              </span>
              <span className="arrow">→</span>
            </button>

            <button
              className={`login-btn lb-gmail ${activePanel === 'mobile' ? 'active-tab' : ''}`}
              onClick={() => { setActivePanel('mobile'); setPhoneStep('input'); setPhoneOtp(''); setOtpNotice(''); }}
              type="button"
            >
              <span className="lb-left">
                <span>{t('portal.tabMobile', 'Login with Mobile Number (OTP)')}</span>
              </span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* ABHA Panel */}
          {activePanel === 'abha' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {t('portal.enterAbhaPrompt', 'Enter 14-Digit ABHA ID')}
              </p>
              <div className="input-prefix">
                <span className="prefix">ABHA</span>
                <input
                  type="text"
                  placeholder="e.g. 91-4820-9921-3041 or 2510991000"
                  value={abhaNumber}
                  onChange={(e) => setAbhaNumber(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCheckAbha(); }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                className="send-otp-btn"
                onClick={handleCheckAbha}
                disabled={loading || !abhaNumber.trim()}
                type="button"
              >
                {loading ? t('portal.checking', 'Checking...') : t('portal.checkRecord', 'Find My Health Record →')}
              </button>
            </div>
          )}

          {/* Mobile Number Panel */}
          {activePanel === 'mobile' && phoneStep === 'input' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                Enter 10-Digit Mobile Number / मोबाइल नंबर
              </p>
              <div className="input-prefix">
                <span className="prefix">+91</span>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handlePhoneContinue(); }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <button
                className="send-otp-btn"
                onClick={handlePhoneContinue}
                disabled={phone.length !== 10 || loading}
                type="button"
              >
                {loading ? 'Sending OTP via SMS...' : 'Get OTP via SMS →'}
              </button>
            </div>
          )}

          {/* Mobile OTP Panel */}
          {activePanel === 'mobile' && phoneStep === 'otp' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                Enter 6-Digit Phone OTP / 6-अंकीय ओटीपी
              </p>
              {otpNotice && (
                <div style={{ background: '#E8F5E9', border: '1px solid #C8E6C9', color: '#1B5E20', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px', fontWeight: 600 }}>
                  📱 {otpNotice}
                </div>
              )}
              <div className="input-prefix">
                <span className="prefix">🔑</span>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={phoneOtp}
                  onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyPhoneOtp(); }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Sent to +91 {phone}</span>
                 <button type="button" onClick={handlePhoneContinue} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }} disabled={loading}>Resend OTP</button>
              </div>
              <button
                className="send-otp-btn"
                onClick={handleVerifyPhoneOtp}
                disabled={loading || phoneOtp.length !== 6}
                type="button"
                style={{ marginTop: '12px' }}
              >
                {loading ? 'Verifying OTP...' : 'Verify & Log In →'}
              </button>
              <button
                className="btn-outline"
                onClick={() => { setPhoneStep('input'); setPhoneOtp(''); setOtpNotice(''); }}
                type="button"
                style={{ width: '100%', marginTop: '8px', padding: '12px' }}
                disabled={loading}
              >
                ← Back
              </button>
              
              {/* Direct Bypass in OTP Screen */}
              <button
                type="button"
                onClick={handleBypassToDashboard}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px',
                  background: 'rgba(26,92,56,0.08)',
                  border: '1.5px dashed #1A5C38',
                  borderRadius: '10px',
                  color: '#1A5C38',
                  fontSize: '13px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡ Test Bypass (123456) →</span>
              </button>
            </div>
          )}

          {/* Quick Bypass Button on Main Login Card */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleBypassToDashboard}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#F0FDF4',
                border: '1.5px solid #16A34A',
                borderRadius: '10px',
                color: '#166534',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              title="Click to directly enter Patient Dashboard without waiting for backend email/OTP services"
            >
              <span>⚡ Next / Skip Backend Login →</span>
            </button>
          </div>

          <div className="or-divider">{t('portal.orDivider', 'OR')}</div>

          {/* Register Link */}
          <div className="login-register-link">
            <span>{t('portal.noAbhaPrompt', "Don't have an ABHA yet? ")}</span>
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('identity', { initialMode: 'register' });
              }}
            >
              {t('portal.registerNow', 'Register now →')}
            </a>
          </div>

          {/* Encryption Note */}
          <div className="enc-box">
            <span>
              {t('portal.securityNote', 'Protected by DPDP Act 2023 and 256-bit AES encryption.')}
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}