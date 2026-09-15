import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { usePatient } from '../../contexts/PatientContext';
import { verifyPatient, sendOtp, verifyOtp } from '../../api';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  const [activeMethod, setActiveMethod] = useState('abha');
  const [step, setStep] = useState('input');
  const [inputValue, setInputValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const { t } = useLanguage();
  const { setPatient } = usePatient();

  const formCopy = {
    abha: {
      titleEn: t('patientIdentity.formAbhaTitle'),
      titleHi: '',
      label: t('patientIdentity.formAbhaLabel'),
      placeholder: t('patientIdentity.formAbhaPlaceholder'),
      badge: t('patientIdentity.formAbhaBadge'),
      footerText: t('patientIdentity.formAbhaFooter'),
      showForgot: true
    },
    mobile: {
      titleEn: t('patientIdentity.formMobileTitle'),
      titleHi: '',
      label: t('patientIdentity.formMobileLabel'),
      placeholder: t('patientIdentity.formMobilePlaceholder'),
      badge: t('patientIdentity.formMobileBadge'),
      footerText: t('patientIdentity.formMobileFooter'),
      showForgot: false
    }
  };

  const currentCopy = formCopy[activeMethod] || formCopy.abha;

  /** Step 1 → Step 2: verify patient exists, then send OTP */
  const handleConfirm = async () => {
    if (!inputValue.trim()) {
      setError('Please enter your ABHA ID or mobile number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await verifyPatient(inputValue.trim());
      await sendOtp(inputValue.trim());
      // Show confirmation popup, then slide to OTP step
      setShowOtpPopup(true);
      setTimeout(() => {
        setShowOtpPopup(false);
        setStep('otp');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Step 2 → consent: verify OTP, store patient */
  const handleVerifyOtp = async () => {
    if (!otpValue.trim()) {
      setError('Please enter the OTP sent to your mobile.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await verifyOtp(inputValue.trim(), otpValue.trim());
      setPatient(data.patient);
      if (onNavigate) onNavigate('consent');
    } catch (err) {
      setError(err.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /** Resend OTP */
  const handleResendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendOtp(inputValue.trim());
      setError(''); // clear any old errors
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="identity-container">

      {/* OTP Sent Confirmation Popup */}
      {showOtpPopup && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.55)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            background: '#fff', borderRadius: '16px', padding: '36px 44px',
            maxWidth: '420px', width: '90%', textAlign: 'center',
            boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
            animation: 'slideUp 0.3s ease'
          }}>
            {/* Green checkmark circle */}
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px', boxShadow: '0 4px 20px rgba(34,197,94,0.35)'
            }}>
              <span className="material-symbols-outlined" style={{ color: '#fff', fontSize: '36px' }}>
                mark_email_read
              </span>
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '22px', fontWeight: 700, color: '#111' }}>
              OTP Sent!
            </h2>
            <p style={{ margin: '0 0 16px', color: '#555', fontSize: '15px', lineHeight: 1.5 }}>
              A 6-digit code has been sent to your registered mobile number.
            </p>

            {/* Masked number badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: '8px', padding: '8px 16px',
              fontFamily: 'monospace', fontSize: '15px', color: '#166534',
              marginBottom: '20px'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smartphone</span>
              +91 ••••••{inputValue.trim().slice(-4)}
            </div>

            {/* Progress bar auto-dismiss */}
            <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                borderRadius: '4px', animation: 'shrink 2.5s linear forwards'
              }} />
            </div>
            <p style={{ marginTop: '8px', fontSize: '12px', color: '#9ca3af', fontFamily: 'monospace' }}>
              Redirecting to OTP entry…
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="identity-header">
        <div className="id-header-left">
          <div className="brand-logo">
            <span className="material-symbols-outlined">add</span>
            <div className="brand-text">
              <span className="brand-title">{t('patientIdentity.brandTitle')}</span>
              <span className="brand-sub font-mono">{t('patientIdentity.brandSub')}</span>
            </div>
          </div>
        </div>
        <div className="id-header-right">
          <div className="lang-toggle font-mono">
            <span className="active">EN</span> | <span>हिन्दी</span> | <span>বাংলা</span>
          </div>
          <button className="listen-assist-btn font-mono">
            <span className="material-symbols-outlined">volume_up</span>
            {t('patientIdentity.listenAssist')}
          </button>
          <div className="triage-priority font-mono">
            {t('patientIdentity.priority')}
          </div>
          <div className="user-icon">
            <span className="material-symbols-outlined">person</span>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="identity-progress font-mono">
        <div className="prog-step active">
          <span className="step-dot"></span>
          {t('patientIdentity.stage')}
        </div>
        <div className="prog-step-links">
          <span className="active">{t('patientIdentity.navYou')}</span>
          <span>{t('patientIdentity.navConsent')}</span>
          <span>{t('patientIdentity.navStory')}</span>
          <span>{t('patientIdentity.navDoctor')}</span>
        </div>
      </div>

      <main className="identity-main">
        <div className="identity-intro">
          <h1 className="intro-title">
            {t('patientIdentity.introTitle')}
          </h1>
          <p className="intro-desc">
            {t('patientIdentity.introDesc')}
          </p>
        </div>

        <div className="methods-grid">
          {/* Card 1: ABHA */}
          <button 
            className={`method-card ${activeMethod === 'abha' ? 'active' : ''}`}
            onClick={() => { setActiveMethod('abha'); setError(''); }}
          >
            <div className="method-icon">
              <span className="material-symbols-outlined">badge</span>
            </div>
            <div className="method-content">
              <div className="method-title">
                <strong>{t('patientIdentity.methodAbhaTitle')}</strong>
              </div>
              <div className="method-desc">
                {t('patientIdentity.methodAbhaDesc')}
              </div>
            </div>
            <div className="method-badge font-mono">{t('patientIdentity.methodAbhaBadge')}</div>
          </button>

          {/* Card 2: Mobile */}
          <button 
            className={`method-card ${activeMethod === 'mobile' ? 'active' : ''}`}
            onClick={() => { setActiveMethod('mobile'); setError(''); }}
          >
            <div className="method-icon">
              <span className="material-symbols-outlined">smartphone</span>
            </div>
            <div className="method-content">
              <div className="method-title">
                <strong>{t('patientIdentity.methodMobileTitle')}</strong>
              </div>
              <div className="method-desc">
                {t('patientIdentity.methodMobileDesc')}
              </div>
            </div>
            <div className="method-badge font-mono">{t('patientIdentity.methodMobileBadge')}</div>
          </button>
        </div>

        <div className="assurance-banner">
          <span className="material-symbols-outlined assurance-icon">verified_user</span>
          <span className="assurance-text">
            <strong>{t('patientIdentity.assurance')}</strong>
          </span>
        </div>

        {/* Input Form Section */}
        <div className="input-section">
          <div className="input-header">
            <div className="input-title">
              <strong>{currentCopy.titleEn}</strong>
            </div>
            <div className="gateway-badge font-mono">{currentCopy.badge}</div>
          </div>

          {/* Error message */}
          {error && (
            <div className="font-mono" style={{ color: '#c0392b', marginBottom: '8px', fontSize: '13px' }}>
              ⚠ {error}
            </div>
          )}
          
          {step === 'input' ? (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">{currentCopy.label}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder={currentCopy.placeholder}
                    className="identity-input"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="input-footer">
                  <span className="help-text">{currentCopy.footerText}</span>
                  {currentCopy.showForgot && <a href="#" className="forgot-link">{t('patientIdentity.forgotAbha')}</a>}
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={handleConfirm} disabled={loading}>
                  {loading ? 'Sending OTP…' : t('patientIdentity.confirmBtn')}
                  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
                <button className="cancel-btn" onClick={() => onNavigate && onNavigate('portal')} disabled={loading}>
                  {t('patientIdentity.cancelBtn')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">{t('patientIdentity.otpLabel')}</label>
                <div className="input-wrapper">
                  <input
                    type="text"
                    placeholder="• • • • • •"
                    className="identity-input font-mono"
                    style={{ letterSpacing: '0.2em', fontSize: '24px' }}
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value)}
                    maxLength={6}
                    disabled={loading}
                  />
                </div>
                <div className="input-footer">
                  <span className="help-text">{t('patientIdentity.otpHelp')}</span>
                  <a href="#" className="forgot-link" onClick={handleResendOtp}>
                    {loading ? 'Resending…' : t('patientIdentity.resendCode')}
                  </a>
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={handleVerifyOtp} disabled={loading}>
                  {loading ? 'Verifying…' : t('patientIdentity.verifyBtn')}
                  {!loading && <span className="material-symbols-outlined">check_circle</span>}
                </button>
                <button className="cancel-btn" onClick={() => { setStep('input'); setError(''); }} disabled={loading}>
                  {t('patientIdentity.backBtn')}
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="identity-footer">
        <div className="footer-top">
          <div className="compliance-badge font-mono">
            <span className="material-symbols-outlined">shield</span>
            {t('patientIdentity.compliance')}
          </div>
          <div className="terminal-info font-mono">
            <strong>{t('patientIdentity.terminal')}</strong> <span style={{ marginLeft: '16px' }}><strong>{t('patientIdentity.session')}</strong></span>
          </div>
        </div>

        <div className="emergency-triage-banner">
          <div className="emergency-content">
            <div className="emergency-icon-wrap">
              <span className="material-symbols-outlined">emergency</span>
            </div>
            <div>
              <div className="em-title">{t('patientIdentity.emTitle')}</div>
            </div>
          </div>
          <button className="em-triage-btn" onClick={() => onNavigate && onNavigate('triage')}>
            <span className="material-symbols-outlined">call</span>
            {t('patientIdentity.emBtn')}
          </button>
        </div>

        <div className="footer-bottom">
          <div className="footer-brand">
            <strong>{t('patientIdentity.brandTitle')}</strong>
            <div className="brand-tagline">{t('patientIdentity.brandTagline')}</div>
            <div className="brand-compliance font-mono">
              {t('patientIdentity.brandCompliance')}
            </div>
          </div>
          <div className="footer-contact text-right">
            <div className="helpline-text font-mono">
              <strong>{t('patientIdentity.helpline')}</strong>
            </div>
            <div className="address-text">
              {t('patientIdentity.address')}
            </div>
            <div className="copyright-text font-mono">
              {t('patientIdentity.copyright')}
            </div>
          </div>
        </div>
      </footer>

      {/* Persistent Emergency Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-outline-variant px-6 lg:px-12 py-3 z-30 shadow-md" data-purpose="persistent-emergency-footer" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'rgba(255, 247, 252, 0.95)', borderTop: '1px solid #e2d1d9', padding: '12px 24px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ba1a1a', display: 'inline-block' }}></span>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#ba1a1a' }}>
            <span>Feeling worse? Get urgent help now</span>
            <span style={{ color: '#4d444c', marginLeft: '8px' }}>/ आपातकालीन सहायता केंद्र</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4d444c' }}>AIIMS Trauma / Emergency Desk:</span>
          <a href="tel:01126588500" style={{ display: 'inline-flex', alignItems: 'center', padding: '6px 16px', fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold', color: '#ba1a1a', border: '1px solid rgba(186, 26, 26, 0.4)', borderRadius: '4px', background: 'rgba(255, 218, 214, 0.4)', textDecoration: 'none' }}>
            011-26588500 / 102
          </a>
        </div>
      </footer>
    </div>
  );
}
