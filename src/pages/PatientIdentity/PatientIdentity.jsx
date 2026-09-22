import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  // input = choice screen
  // abha = roll number check
  // email = email input
  // otp = OTP input
  // rollNumber = roll number after email verification

  const [step, setStep] = useState('input');

  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { language, toggleLanguage, t } = useLanguage();

  // =====================================================
  // ABHA / ROLL NUMBER CHECK
  // =====================================================

  const handleCheckAbha = async () => {
    const value = identifier.trim();

    if (!value) {
      alert('Please enter your university roll number');
      return;
    }

    if (!/^\d+$/.test(value)) {
      alert('Please enter a valid roll number');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/patients/check-abha',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            abha: value
          })
        }
      );

      const data = await response.json();

      console.log('CHECK PATIENT RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || 'Unable to check patient record');
        return;
      }

      // ==========================================
      // EXISTING PATIENT
      // ==========================================

      if (data.exists) {
        alert('Patient record found!');

        if (onNavigate) {
          onNavigate('consent', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.medicalHistory || [],
            email: data.patient.email || ''
          });
        }

        return;
      }

      // ==========================================
      // PATIENT NOT FOUND
      // ==========================================

      setMessage(
        'No patient record found. Please verify your email to continue.'
      );

      // Keep the entered roll number
      setRollNumber(value);

      // Automatically move to email verification
      setStep('email');

    } catch (error) {
      console.error('Patient check error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // SEND EMAIL OTP
  // =====================================================

  const handleVerify = async () => {
    const email = identifier.trim();

    if (!email) {
      alert('Please enter your email address');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/patients/send-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email
          })
        }
      );

      const data = await response.json();

      console.log('SEND OTP RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || 'Unable to send OTP');
        return;
      }

      setMessage('OTP sent successfully to your email.');
      setStep('otp');

    } catch (error) {
      console.error('Email OTP error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // VERIFY EMAIL OTP
  // =====================================================

  const handleVerifyOtp = async () => {
    const email = identifier.trim();
    const otpInput = otp.trim();

    if (!otpInput) {
      alert('Please enter the OTP');
      return;
    }

    if (otpInput.length !== 6) {
      alert('Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/patients/verify-email-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            otp: otpInput
          })
        }
      );

      const data = await response.json();

      console.log('VERIFY OTP RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || 'OTP verification failed');
        return;
      }

      alert('Email verified successfully!');

      /*
       * IMPORTANT:
       * We do NOT register the patient yet.
       *
       * After email verification we ask for
       * the university roll number.
       */

      setMessage(
        'Email verified successfully. Now enter your university roll number.'
      );

      setRollNumber('');

      setStep('rollNumber');

    } catch (error) {
      console.error('OTP verification error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // REGISTER NEW PATIENT
  // =====================================================

  const handleRegisterPatient = async () => {
    const value = rollNumber.trim();
    const email = identifier.trim();

    if (!value) {
      alert('Please enter your university roll number');
      return;
    }

    if (!/^\d+$/.test(value)) {
      alert('Please enter a valid roll number');
      return;
    }

    if (!email) {
      alert('Email verification is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/patients/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            abha: value,
            name: 'New Patient',
            email
          })
        }
      );

      const data = await response.json();

      console.log('REGISTER PATIENT RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || 'Unable to register patient');
        return;
      }

      alert('Patient registered successfully!');

      if (onNavigate) {
        onNavigate('consent', {
          patientId: data.patient.id,
          patient: data.patient,
          medicalHistory: data.patient.medicalHistory || [],
          email: data.patient.email
        });
      }

    } catch (error) {
      console.error('Patient registration error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOtp = async (e) => {
    e.preventDefault();

    if (!identifier.trim()) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch(
        '/api/patients/send-otp',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: identifier.trim()
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || 'Unable to resend OTP');
        return;
      }

      setMessage('A new OTP has been sent to your email.');

    } catch (error) {
      console.error('Resend OTP error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // RETURN TO CHOICE
  // =====================================================

  const handleBackToChoice = () => {
    setStep('input');
    setIdentifier('');
    setOtp('');
    setRollNumber('');
    setMessage('');
  };


  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="identity-container">

      {/* Header */}
      <header className="identity-header">

        <div className="id-header-left">

          <div className="brand-logo">

            <span className="material-symbols-outlined">
              add
            </span>

            <div className="brand-text">

              <span className="brand-title">
                {t('patientIdentity.brandTitle')}
              </span>

              <span className="brand-sub font-mono">
                {t('patientIdentity.brandSub')}
              </span>

            </div>

          </div>

        </div>


        <div className="id-header-right">

          <div className="lang-toggle font-mono">

            <button
              type="button"
              className={language === 'en' ? 'active' : ''}
              onClick={() => toggleLanguage('en')}
            >
              EN
            </button>

            {' | '}

            <button
              type="button"
              className={language === 'hi' ? 'active' : ''}
              onClick={() => toggleLanguage('hi')}
            >
              हिन्दी
            </button>

          </div>


          <button className="listen-assist-btn font-mono">

            <span className="material-symbols-outlined">
              volume_up
            </span>

            {t('patientIdentity.listenAssist')}

          </button>


          <div className="triage-priority font-mono">
            {t('patientIdentity.priority')}
          </div>


          <div className="user-icon">

            <span className="material-symbols-outlined">
              person
            </span>

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

          <span className="active">
            {t('patientIdentity.navYou')}
          </span>

          <span>
            {t('patientIdentity.navConsent')}
          </span>

          <span>
            {t('patientIdentity.navStory')}
          </span>

          <span>
            {t('patientIdentity.navDoctor')}
          </span>

        </div>


        <div className="prog-step-hi">
          पहचान सत्यापन चरण
        </div>

      </div>


      <main className="identity-main">

        {/* Intro */}
        <div className="identity-intro">

          <h1 className="intro-title">

            {step === 'input' && (
              <>
                Patient Identity
                <br />

                <span className="intro-hi">
                  रोगी की पहचान
                </span>
              </>
            )}

            {step === 'abha' && (
              <>
                Verify your patient identity
                <br />

                <span className="intro-hi">
                  अपनी रोगी पहचान सत्यापित करें
                </span>
              </>
            )}

            {step === 'email' && (
              <>
                Verify your email address
                <br />

                <span className="intro-hi">
                  अपना ईमेल पता सत्यापित करें
                </span>
              </>
            )}

            {step === 'otp' && (
              <>
                Enter verification code
                <br />

                <span className="intro-hi">
                  सत्यापन कोड दर्ज करें
                </span>
              </>
            )}

            {step === 'rollNumber' && (
              <>
                Complete patient registration
                <br />

                <span className="intro-hi">
                  रोगी पंजीकरण पूरा करें
                </span>
              </>
            )}

          </h1>


          <p className="intro-desc">

            {step === 'input' && (
              <>
                Use your university roll number to find an existing
                patient record, or continue directly with email verification.
                <br />
                <span className="intro-hi">
                  आगे बढ़ने का तरीका चुनें
                </span>
              </>
            )}

            {step === 'abha' && (
              <>
                Enter your university roll number to find your existing
                patient record.
              </>
            )}

            {step === 'email' && (
              <>
                Enter your email address to receive a one-time
                verification code.
              </>
            )}

            {step === 'otp' && (
              <>
                Enter the 6-digit verification code sent to your email.
              </>
            )}

            {step === 'rollNumber' && (
              <>
                Your email has been verified. Enter your university
                roll number to create your patient record.
              </>
            )}

          </p>

        </div>


        {/* =====================================================
            METHOD CARDS
            ===================================================== */}

        {step === 'input' && (

          <div className="methods-grid">


            {/* ABHA / ROLL NUMBER */}

            <div
              className="method-card"
              onClick={() => {
                setStep('abha');
                setMessage('');
              }}
            >

              <div className="method-icon">

                <span className="material-symbols-outlined">
                  badge
                </span>

              </div>


              <div className="method-content">

                <div className="method-title">

                  <strong>
                    ABHA / Roll Number
                  </strong>{' '}

                  रोल नंबर

                </div>


                <div className="method-desc">

                  Use your university roll number to find an
                  existing patient record.

                </div>

              </div>


              <div className="method-badge font-mono">
                PATIENT ID
              </div>

            </div>


            {/* EMAIL */}

            <div
              className="method-card active"
              onClick={() => {
                setStep('email');
                setIdentifier('');
                setMessage('');
              }}
            >

              <div className="method-icon">

                <span className="material-symbols-outlined">
                  mail
                </span>

              </div>


              <div className="method-content">

                <div className="method-title">

                  <strong>
                    Email Verification
                  </strong>{' '}

                  ईमेल सत्यापन

                </div>


                <div className="method-desc">

                  Receive a 6-digit OTP directly in your email.

                </div>

              </div>


              <div className="method-badge font-mono">
                EMAIL OTP
              </div>

            </div>


          </div>

        )}


        {/* Assurance */}

        <div className="assurance-banner">

          <span className="material-symbols-outlined assurance-icon">
            verified_user
          </span>

          <span className="assurance-text">

            <strong>
              {step === 'input'
                ? 'Choose a secure verification method.'
                : step === 'abha'
                  ? 'Your patient record is securely checked.'
                  : 'Verify your email to continue.'}
            </strong>{' '}

            {step === 'input'
              ? 'सुरक्षित सत्यापन का तरीका चुनें।'
              : step === 'abha'
                ? 'आपका रोगी रिकॉर्ड सुरक्षित रूप से जांचा जाता है।'
                : 'आगे बढ़ने के लिए अपना ईमेल सत्यापित करें।'}

          </span>

        </div>


        {/* =====================================================
            INPUT SECTION
            ===================================================== */}

        {step !== 'input' && (

          <div className="input-section">


            <div className="input-header">

              <div className="input-title">


                {/* ABHA */}

                {step === 'abha' && (
                  <>
                    <strong>
                      Enter Your University Roll Number
                    </strong>

                    <br />

                    <span className="input-hi">
                      अपना यूनिवर्सिटी रोल नंबर दर्ज करें
                    </span>
                  </>
                )}


                {/* EMAIL */}

                {step === 'email' && (
                  <>
                    <strong>
                      Enter Your Email Address
                    </strong>

                    <br />

                    <span className="input-hi">
                      अपना ईमेल पता दर्ज करें
                    </span>
                  </>
                )}


                {/* OTP */}

                {step === 'otp' && (
                  <>
                    <strong>
                      Enter Verification OTP
                    </strong>

                    <br />

                    <span className="input-hi">
                      सत्यापन ओटीपी दर्ज करें
                    </span>
                  </>
                )}


                {/* ROLL NUMBER AFTER EMAIL */}

                {step === 'rollNumber' && (
                  <>
                    <strong>
                      Enter Your University Roll Number
                    </strong>

                    <br />

                    <span className="input-hi">
                      अपना यूनिवर्सिटी रोल नंबर दर्ज करें
                    </span>
                  </>
                )}

              </div>


              <div className="gateway-badge font-mono">

                {step === 'abha'
                  ? 'PATIENT ID CHECK'
                  : step === 'email'
                    ? 'EMAIL OTP GATEWAY'
                    : step === 'otp'
                      ? 'OTP VERIFICATION'
                      : 'PATIENT REGISTRATION'}

              </div>

            </div>


            {/* Message */}

            {message && (

              <div
                className="font-mono"
                style={{
                  marginBottom: '8px',
                  fontSize: '13px'
                }}
              >
                {message}
              </div>

            )}


            {/* =================================================
                ABHA / ROLL NUMBER INPUT
                ================================================= */}

            {step === 'abha' && (

              <>

                <div className="input-field-group">

                  <label className="input-label font-mono">
                    UNIVERSITY ROLL NUMBER
                  </label>


                  <div className="input-wrapper">

                    <input
                      type="text"
                      placeholder="e.g. 2510991147"
                      className="identity-input"
                      value={identifier}
                      onChange={(e) =>
                        setIdentifier(e.target.value)
                      }
                      disabled={loading}
                    />

                  </div>


                  <div className="input-footer">

                    <span className="help-text">
                      Enter your university roll number
                    </span>

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    className="confirm-btn"
                    onClick={handleCheckAbha}
                    disabled={loading}
                  >

                    {loading
                      ? 'Checking…'
                      : 'Find Patient Record'}

                    {!loading && (
                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    )}

                  </button>


                  <button
                    className="cancel-btn"
                    onClick={handleBackToChoice}
                    disabled={loading}
                  >
                    Back
                  </button>

                </div>

              </>

            )}


            {/* =================================================
                EMAIL INPUT
                ================================================= */}

            {step === 'email' && (

              <>

                <div className="input-field-group">

                  <label className="input-label font-mono">
                    EMAIL ADDRESS
                  </label>


                  <div className="input-wrapper">

                    <input
                      type="email"
                      placeholder="e.g. patient@example.com"
                      className="identity-input"
                      value={identifier}
                      onChange={(e) =>
                        setIdentifier(e.target.value)
                      }
                      disabled={loading}
                      autoComplete="email"
                    />

                  </div>


                  <div className="input-footer">

                    <span className="help-text">
                      OTP will be sent to this email address
                    </span>

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    className="confirm-btn"
                    onClick={handleVerify}
                    disabled={loading}
                  >

                    {loading
                      ? 'Sending OTP…'
                      : 'Send OTP'}

                    {!loading && (
                      <span className="material-symbols-outlined">
                        arrow_forward
                      </span>
                    )}

                  </button>


                  <button
                    className="cancel-btn"
                    onClick={handleBackToChoice}
                    disabled={loading}
                  >
                    Back
                  </button>

                </div>

              </>

            )}


            {/* =================================================
                OTP INPUT
                ================================================= */}

            {step === 'otp' && (

              <>

                <div className="input-field-group">

                  <label className="input-label font-mono">
                    6-DIGIT OTP / 6-अंकीय ओटीपी
                  </label>


                  <div className="input-wrapper">

                    <input
                      type="text"
                      placeholder="• • • • • •"
                      className="identity-input font-mono"
                      maxLength={6}
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => {

                        const value =
                          e.target.value.replace(/\D/g, '');

                        setOtp(value);

                      }}
                      disabled={loading}
                      style={{
                        letterSpacing: '0.2em',
                        fontSize: '24px'
                      }}
                    />

                  </div>


                  <div className="input-footer">

                    <span className="help-text">
                      OTP sent to {identifier}
                    </span>


                    <button
                      type="button"
                      className="forgot-link"
                      onClick={handleResendOtp}
                      disabled={loading}
                    >

                      {loading
                        ? 'Resending…'
                        : 'Resend Code'}

                    </button>

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    className="confirm-btn"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >

                    {loading
                      ? 'Verifying…'
                      : 'Verify & Proceed'}

                    {!loading && (
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                    )}

                  </button>


                  <button
                    className="cancel-btn"
                    onClick={() => {

                      setStep('email');
                      setOtp('');
                      setMessage('');

                    }}
                    disabled={loading}
                  >
                    Back
                  </button>

                </div>

              </>

            )}


            {/* =================================================
                ROLL NUMBER AFTER EMAIL VERIFICATION
                ================================================= */}

            {step === 'rollNumber' && (

              <>

                <div className="input-field-group">

                  <label className="input-label font-mono">
                    UNIVERSITY ROLL NUMBER
                  </label>


                  <div className="input-wrapper">

                    <input
                      type="text"
                      placeholder="e.g. 2510991147"
                      className="identity-input"
                      value={rollNumber}
                      onChange={(e) =>
                        setRollNumber(e.target.value)
                      }
                      disabled={loading}
                    />

                  </div>


                  <div className="input-footer">

                    <span className="help-text">
                      Your verified email will be linked to this record
                    </span>

                  </div>

                </div>


                <div className="form-actions">

                  <button
                    className="confirm-btn"
                    onClick={handleRegisterPatient}
                    disabled={loading}
                  >

                    {loading
                      ? 'Registering…'
                      : 'Register & Proceed'}

                    {!loading && (
                      <span className="material-symbols-outlined">
                        check_circle
                      </span>
                    )}

                  </button>


                  <button
                    className="cancel-btn"
                    onClick={() => {

                      setStep('email');
                      setRollNumber('');
                      setMessage('');

                    }}
                    disabled={loading}
                  >
                    Back
                  </button>

                </div>

              </>

            )}

          </div>

        )}

      </main>


      {/* Footer */}

      <footer className="identity-footer">

        <div className="footer-top">

          <div className="compliance-badge font-mono">

            <span className="material-symbols-outlined">
              shield
            </span>

            {t('patientIdentity.compliance')}

          </div>


          <div className="terminal-info font-mono">
            {t('patientIdentity.terminal')}
          </div>

        </div>


        <div className="emergency-triage-banner">

          <div className="emergency-content">

            <div className="emergency-icon-wrap">

              <span className="material-symbols-outlined">
                emergency
              </span>

            </div>


            <div>

              <div className="em-title">
                {t('patientIdentity.emTitle')}
              </div>

              <div className="em-sub">
                अत्यधिक दर्द, सांस लेने में कठिनाई या
                रक्तस्राव होने पर तत्काल सूचित करें
              </div>

            </div>

          </div>


          <button
            className="em-triage-btn"
            onClick={() =>
              onNavigate &&
              onNavigate('triage')
            }
          >

            <span className="material-symbols-outlined">
              call
            </span>

            {t('patientIdentity.emBtn')}

          </button>

        </div>


        <div className="footer-bottom">

          <div className="footer-brand">

            <strong>
              {t('patientIdentity.brandTitle')}
            </strong>

            <div className="brand-tagline">
              {t('patientIdentity.brandTagline')}
            </div>

            <div className="brand-compliance font-mono">
              {t('patientIdentity.brandCompliance')}
            </div>

          </div>


          <div className="footer-contact text-right">

            <div className="helpline-text font-mono">

              <strong>
                {t('patientIdentity.helpline')}
              </strong>

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
