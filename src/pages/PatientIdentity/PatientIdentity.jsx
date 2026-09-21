import { useState } from 'react';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  const [step, setStep] = useState('input');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleVerify = async () => {
    const email = identifier.trim();

    if (!email) {
      alert('Please enter your email address');
      return;
    }

    // Basic email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // Send OTP directly to the entered email
      const response = await fetch(
        'http://localhost:5000/api/patients/send-otp',
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

      // Move to OTP screen
      setStep('otp');

    } catch (error) {
      console.error('Email OTP error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };

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
        'http://localhost:5000/api/patients/verify-otp',
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
       * We no longer receive a patient object here because
       * email verification works even for an unregistered email.
       *
       * For now, pass the verified email to the consent page.
       */
      if (onNavigate) {
        onNavigate('consent', {
          email: data.email
        });
      }

    } catch (error) {
      console.error('OTP verification error:', error);
      alert('Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="identity-container">

      {/* Header */}
      <header className="identity-header">
        <div className="id-header-left">
          <div className="brand-logo">
            <span className="material-symbols-outlined">add</span>

            <div className="brand-text">
              <span className="brand-title">AyuLeakha</span>

              <span className="sub font-mono">
                AIIMS OPD • BLOCK B • ROOM 104
              </span>
            </div>
          </div>
        </div>

        <div className="id-header-right">

          <div className="lang-toggle font-mono">
            <span className="active">EN</span> |{' '}
            <span>हिन्दी</span> | <span>বাংলা</span>
          </div>

          <button className="listen-assist-btn font-mono">
            <span className="material-symbols-outlined">
              volume_up
            </span>

            Listen Assist / सुनें
          </button>

          <div className="triage-priority font-mono">
            OPD TRIAGE PRIORITY-2
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
          STAGE 01 OF 04 • INITIAL VERIFICATION
        </div>

        <div className="prog-step-links">
          <span className="active">YOU</span>
          <span>CONSENT</span>
          <span>YOUR STORY</span>
          <span>DOCTOR</span>
        </div>

        <div className="prog-step-hi">
          पहचान सत्यापन चरण
        </div>

      </div>

      <main className="identity-main">

        <div className="identity-intro">

          <h1 className="intro-title">
            Verify your email address
            <br />

            <span className="intro-hi">
              अपना ईमेल पता सत्यापित करें
            </span>
          </h1>

          <p className="intro-desc">
            Enter your email address to receive a one-time
            verification code. You can use any valid email
            address to continue with your AyuLekha consultation.
          </p>

        </div>

        {/* Email Verification Card */}
        <div className="methods-grid">

          <div className="method-card active">

            <div className="method-icon">
              <span className="material-symbols-outlined">
                mail
              </span>
            </div>

            <div className="method-content">

              <div className="method-title">
                <strong>Email Verification</strong>{' '}
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

        <div className="assurance-banner">

          <span className="material-symbols-outlined assurance-icon">
            verified_user
          </span>

          <span className="assurance-text">
            <strong>Verify your email to continue.</strong>{' '}
            आगे बढ़ने के लिए अपना ईमेल सत्यापित करें।
          </span>

        </div>

        {/* Input Form Section */}
        <div className="input-section">

          <div className="input-header">

            <div className="input-title">

              {step === 'input' ? (
                <>
                  <strong>Enter Your Email Address</strong>
                  <br />

                  <span className="input-hi">
                    अपना ईमेल पता दर्ज करें
                  </span>
                </>
              ) : (
                <>
                  <strong>Enter Verification OTP</strong>
                  <br />

                  <span className="input-hi">
                    सत्यापन ओटीपी दर्ज करें
                  </span>
                </>
              )}

            </div>

            <div className="gateway-badge font-mono">
              {step === 'input'
                ? 'EMAIL OTP GATEWAY'
                : 'OTP VERIFICATION'}
            </div>

          </div>

          {step === 'input' ? (
            <>
              <div className="input-field-group">

                <label className="input-label font-mono">
                  EMAIL ADDRESS
                </label>

                <div className="input-wrapper">

                  <input
                    className="identity-input"
                    type="email"
                    value={identifier}
                    onChange={(e) =>
                      setIdentifier(e.target.value)
                    }
                    placeholder="e.g. patient@example.com"
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
                    ? 'Sending OTP...'
                    : 'Send OTP'}

                  <span className="btn-hi">
                    {' '}
                    / ओटीपी भेजें
                  </span>

                  <span className="material-symbols-outlined">
                    arrow_forward
                  </span>

                </button>

                <button
                  className="cancel-btn"
                  onClick={() =>
                    onNavigate && onNavigate('portal')
                  }
                  disabled={loading}
                >
                  Cancel
                </button>

              </div>
            </>
          ) : (
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
                      const value = e.target.value
                        .replace(/\D/g, '');

                      setOtp(value);
                    }}
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
                    onClick={handleVerify}
                    disabled={loading}
                  >
                    Resend Code
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
                    ? 'Verifying...'
                    : 'Verify & Proceed'}

                  <span className="btn-hi">
                    {' '}
                    / सत्यापित करें
                  </span>

                  <span className="material-symbols-outlined">
                    check_circle
                  </span>

                </button>

                <button
                  className="cancel-btn"
                  onClick={() => {
                    setStep('input');
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

          {message && (
            <div
              style={{
                marginTop: '12px',
                textAlign: 'center'
              }}
            >
              {message}
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="identity-footer">

        <div className="footer-top">

          <div className="compliance-badge font-mono">
            <span className="material-symbols-outlined">
              shield
            </span>

            ABDM M1, M2 &amp; M3 COMPLIANT •
            END-TO-END 256-BIT ENCRYPTED
          </div>

          <div className="terminal-info font-mono">
            DESK TERMINAL:{' '}
            <strong>ND-AIIMS-104</strong>

            <span style={{ marginLeft: '16px' }}>
              SESSION: <strong>#OPD-8849</strong>
            </span>
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
                Feeling severe pain, shortness of breath,
                or bleeding?
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
              onNavigate && onNavigate('triage')
            }
          >
            <span className="material-symbols-outlined">
              call
            </span>

            Emergency Triage (011-26588500)
          </button>

        </div>

        <div className="footer-bottom">

          <div className="footer-brand">

            <strong>
              AyuLeakha Clinical Handover System
            </strong>

            <div className="brand-tagline">
              Your Health Story, Clearly Understood.
            </div>

            <div className="brand-compliance font-mono">
              ABDM &amp; NDHM COMPLIANCE CERTIFIED •
              ARCHIVAL REF: AIIMS-OPD-B104-ARCHIVE
            </div>

          </div>

          <div className="footer-contact text-right">

            <div className="helpline-text font-mono">
              <strong>
                EMERGENCY TRIAGE HELPLINE: 011-26588500
              </strong>
            </div>

            <div className="address-text">
              AIIMS New Delhi Central OPD Desk,
              Ansari Nagar, New Delhi 110029
            </div>

            <div className="copyright-text font-mono">
              © 2024 AyuLeakha Health Services.
              Non-Commercial Public Health License.
            </div>

          </div>

        </div>

      </footer>

    </div>
  );
}