import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  const [activeMethod, setActiveMethod] = useState('abha');
  const [step, setStep] = useState('input');
  const { t } = useLanguage();

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

  return (
    <div className="identity-container">
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
            onClick={() => setActiveMethod('abha')}
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
            onClick={() => setActiveMethod('mobile')}
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
          
          {step === 'input' ? (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">{currentCopy.label}</label>
                <div className="input-wrapper">
                  <input type="text" placeholder={currentCopy.placeholder} className="identity-input" />
                  <button className="scan-qr-btn">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    {t('patientIdentity.scanQr')}
                  </button>
                </div>
                <div className="input-footer">
                  <span className="help-text">{currentCopy.footerText}</span>
                  {currentCopy.showForgot && <a href="#" className="forgot-link">{t('patientIdentity.forgotAbha')}</a>}
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={() => setStep('otp')}>
                  {t('patientIdentity.confirmBtn')}
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button className="cancel-btn" onClick={() => onNavigate && onNavigate('portal')}>
                  {t('patientIdentity.cancelBtn')}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">{t('patientIdentity.otpLabel')}</label>
                <div className="input-wrapper">
                  <input type="text" placeholder="• • • • • •" className="identity-input font-mono" style={{letterSpacing: '0.2em', fontSize: '24px'}} />
                </div>
                <div className="input-footer">
                  <span className="help-text">{t('patientIdentity.otpHelp')}</span>
                  <a href="#" className="forgot-link">{t('patientIdentity.resendCode')}</a>
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={() => onNavigate && onNavigate('consent')}>
                  {t('patientIdentity.verifyBtn')}
                  <span className="material-symbols-outlined">check_circle</span>
                </button>
                <button className="cancel-btn" onClick={() => setStep('input')}>
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
            <strong>{t('patientIdentity.terminal')}</strong> <span style={{marginLeft: '16px'}}><strong>{t('patientIdentity.session')}</strong></span>
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
    </div>
  );
}
