import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PortalSelection.css';

export default function PortalSelection({ onNavigate }) {
  const { t } = useLanguage();

  const [activePanel, setActivePanel] = useState('abha'); // 'abha' | 'gmail'
  const [abhaNumber, setAbhaNumber] = useState('');
  const [email, setEmail] = useState('');
  const [emailStep, setEmailStep] = useState('input'); // 'input' | 'otp'
  const [emailOtp, setEmailOtp] = useState('');
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
        if (onNavigate) onNavigate('identity');
      }
    } catch (err) {
      console.warn('Check ABHA network error:', err);
      alert(t('portal.networkError', 'Unable to connect. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // ── Handle Email Login ──
  const handleEmailContinue = async () => {
    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      alert(t('portal.invalidEmail', 'Please enter a valid email address'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || t('portal.otpError', 'Unable to send OTP'));
        return;
      }
      setEmailStep('otp');
    } catch (err) {
      console.error(err);
      alert(t('portal.networkError', 'Unable to connect. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    const cleanOtp = emailOtp.trim();
    if (cleanOtp.length !== 6) {
      alert(t('portal.invalidOtp', 'Please enter a valid 6-digit OTP'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/patients/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: cleanOtp })
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.message || t('portal.otpInvalid', 'Invalid OTP'));
        return;
      }

      if (data.exists && data.patient) {
        localStorage.setItem('abhaId', data.patient.abha);
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.patient.medicalHistory || [],
            email: data.patient.email || ''
          });
        }
      } else {
        alert(t('portal.noRecordFound', 'No record found. Please complete citizen registration.'));
        if (onNavigate) onNavigate('identity');
      }
    } catch (err) {
      console.error(err);
      alert(t('portal.networkError', 'Unable to connect. Please try again.'));
    } finally {
      setLoading(false);
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
              className={`login-btn lb-gmail ${activePanel === 'gmail' ? 'active-tab' : ''}`}
              onClick={() => { setActivePanel('gmail'); setEmailStep('input'); setEmailOtp(''); }}
              type="button"
            >
              <span className="lb-left">
                <span>{t('portal.tabEmail', 'Login with Email')}</span>
              </span>
              <span className="arrow">→</span>
            </button>
          </div>

          {/* ABHA Panel (default) */}
          {activePanel === 'abha' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {t('portal.enterAbhaPrompt', 'Enter 10-Digit ABHA ID')}
              </p>
              <div className="input-prefix">
                <span className="prefix">ABHA</span>
                <input
                  type="text"
                  placeholder="e.g. 2510991000"
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

          {/* Email Panel */}
          {activePanel === 'gmail' && emailStep === 'input' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {t('portal.enterEmail', 'Enter Your Email ID')}
              </p>
              <div className="input-prefix">
                <span className="prefix">✉️</span>
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleEmailContinue(); }}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <button
                className="send-otp-btn"
                onClick={handleEmailContinue}
                disabled={!email.trim() || loading}
                type="button"
              >
                {loading ? t('portal.sending', 'Sending...') : t('portal.continueEmail', 'Continue →')}
              </button>
            </div>
          )}

          {/* Email OTP Panel */}
          {activePanel === 'gmail' && emailStep === 'otp' && (
            <div className="inline-panel">
              <p className="inline-panel-title">
                {t('portal.enterOtp', 'Enter 6-Digit OTP')}
              </p>
              <div className="input-prefix">
                <span className="prefix">🔑</span>
                <input
                  type="text"
                  placeholder="• • • • • •"
                  maxLength={6}
                  value={emailOtp}
                  onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyEmailOtp(); }}
                  disabled={loading}
                  autoFocus
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '12px' }}>
                 <span style={{ color: 'var(--text-muted)' }}>Sent to {email}</span>
                 <button type="button" onClick={handleEmailContinue} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }} disabled={loading}>Resend</button>
              </div>
              <button
                className="send-otp-btn"
                onClick={handleVerifyEmailOtp}
                disabled={loading || emailOtp.length !== 6}
                type="button"
                style={{ marginTop: '12px' }}
              >
                {loading ? t('portal.verifying', 'Verifying...') : t('portal.verifyProceed', 'Verify & Proceed →')}
              </button>
              <button
                className="btn-outline"
                onClick={() => { setEmailStep('input'); setEmailOtp(''); }}
                type="button"
                style={{ width: '100%', marginTop: '8px', padding: '12px' }}
                disabled={loading}
              >
                ← Back
              </button>
            </div>
          )}

          <div className="or-divider">{t('portal.orDivider', 'OR')}</div>

          {/* Register Link */}
          <div className="login-register-link">
            <span>{t('portal.noAbhaPrompt', "Don't have an ABHA yet? ")}</span>
            <a
              href="#register"
              onClick={(e) => {
                e.preventDefault();
                if (onNavigate) onNavigate('identity');
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