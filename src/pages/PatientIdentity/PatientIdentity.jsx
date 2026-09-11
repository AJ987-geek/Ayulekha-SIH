import { useState } from 'react';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  const [activeMethod, setActiveMethod] = useState('abha');
const [step, setStep] = useState('input');
const [identifier, setIdentifier] = useState('');
const [otp, setOtp] = useState('');
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState('');

  const formCopy = {
    abha: {
      titleEn: 'Enter ABHA Address or 12-Digit Aadhaar',
      titleHi: 'आभा पता या 12-अंकों का आधार नंबर दर्ज करें',
      label: 'ABHA ID / AADHAAR NUMBER',
      placeholder: 'e.g. 91-4582-7719-2041 or patient@abdm',
      badge: 'SECURE ABDM GATEWAY',
      footerText: 'OTP will be sent to the Aadhaar-linked mobile phone',
      showForgot: true
    },
    mobile: {
      titleEn: 'Enter Registered Mobile Number',
      titleHi: 'पंजीकृत मोबाइल नंबर दर्ज करें',
      label: '10-DIGIT PHONE NUMBER',
      placeholder: 'e.g. 98765 43210',
      badge: 'SECURE SMS GATEWAY',
      footerText: 'OTP will be sent to this mobile number',
      showForgot: false
    }
  };

  const currentCopy = formCopy[activeMethod] || formCopy.abha;

const handleVerify = async () => {
  const value = identifier.trim();

  if (!value) {
    alert('Please enter your ABHA ID or mobile number');
    return;
  }

  setLoading(true);

  try {
    // STEP 1: Verify patient
    const verifyResponse = await fetch(
      'http://localhost:5000/api/patients/verify',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      }
    );

    const verifyData = await verifyResponse.json();

    console.log('VERIFY RESPONSE:', verifyData);

    if (!verifyResponse.ok) {
      alert(verifyData.message);
      return;
    }

    console.log('Verified Patient:', verifyData.patient);

    // STEP 2: Generate OTP
    const otpResponse = await fetch(
      'http://localhost:5000/api/patients/send-otp',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value }),
      }
    );

    const otpData = await otpResponse.json();

    console.log('OTP RESPONSE:', otpData);

    if (!otpResponse.ok) {
      alert(otpData.message || 'Unable to generate OTP');
      return;
    }

    // STEP 3: Show OTP for demo/testing
    // STEP 3: Twilio has sent the OTP to the patient's registered phone
alert('OTP sent successfully to your registered mobile number.');

// STEP 4: Move to OTP screen
setStep('otp');

  } catch (error) {
    console.error('Backend error:', error);
    alert('Unable to connect to AyuLekha backend');
  } finally {
    setLoading(false);
  }
};
const handleVerifyOtp = async () => {
  const otpInput = otp.trim();

  if (!otpInput) {
    alert('Please enter the OTP');
    return;
  }

  try {
    const response = await fetch(
      'http://localhost:5000/api/patients/verify-otp',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: identifier,
          otp: otpInput,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }

    alert('OTP verified successfully!');

   if (onNavigate) {
  onNavigate('consent', {
    patientId: data.patient.id
  });
}

  } catch (error) {
    console.error('OTP verification error:', error);
    alert('Unable to connect to AyuLekha backend');
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
              <span className="brand-sub font-mono">AIIMS OPD • BLOCK B • ROOM 104</span>
            </div>
          </div>
        </div>
        <div className="id-header-right">
          <div className="lang-toggle font-mono">
            <span className="active">EN</span> | <span>हिन्दी</span> | <span>বাংলা</span>
          </div>
          <button className="listen-assist-btn font-mono">
            <span className="material-symbols-outlined">volume_up</span>
            Listen Assist / सुनें
          </button>
          <div className="triage-priority font-mono">
            OPD TRIAGE PRIORITY-2
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
            How would you like to identify yourself?<br/>
            <span className="intro-hi">आप अपनी पहचान किस माध्यम से दर्ज करना चाहेंगे?</span>
          </h1>
          <p className="intro-desc">
            Select any method to link or create your OPD consultation docket. Your digital health records will be safely fetched from the Ayushman Bharat Digital Mission (ABDM).
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
                <strong>ABHA / Aadhaar</strong> आभा / आधार
              </div>
              <div className="method-desc">
                Instant pull via linked 14-digit ABHA or 12-digit Aadhaar OTP.
              </div>
            </div>
            <div className="method-badge font-mono">ABDM</div>
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
                <strong>Mobile Number</strong> मोबाइल नंबर
              </div>
              <div className="method-desc">
                Verify using 10-digit mobile number with quick SMS passcode.
              </div>
            </div>
            <div className="method-badge font-mono">SMS OTP</div>
          </button>
        </div>

        <div className="assurance-banner">
          <span className="material-symbols-outlined assurance-icon">verified_user</span>
          <span className="assurance-text">
            <strong>You will be seen either way.</strong> किसी भी स्थिति में आपको डॉक्टर द्वारा देखा जाएगा।
          </span>
        </div>

        {/* Input Form Section */}
        <div className="input-section">
          <div className="input-header">
            <div className="input-title">
              <strong>{currentCopy.titleEn}</strong><br/>
              <span className="input-hi">{currentCopy.titleHi}</span>
            </div>
            <div className="gateway-badge font-mono">{currentCopy.badge}</div>
          </div>
          
          {step === 'input' ? (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">{currentCopy.label}</label>
                <div className="input-wrapper">
                <input
  className="identity-input"
  type="text"
  value={identifier}
  onChange={(e) => setIdentifier(e.target.value)}
  placeholder="Enter ABHA ID or mobile number"
/>
                  <button className="scan-qr-btn">
                    <span className="material-symbols-outlined">qr_code_scanner</span>
                    SCAN QR
                  </button>
                </div>
                <div className="input-footer">
                  <span className="help-text">{currentCopy.footerText}</span>
                  {currentCopy.showForgot && <a href="#" className="forgot-link">Forgot ABHA?</a>}
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={handleVerify}>
  Confirm &amp; Continue <span className="btn-hi">/ पुष्टि करें और आगे बढ़ें</span>
  <span className="material-symbols-outlined">arrow_forward</span>
</button>
                <button className="cancel-btn" onClick={() => onNavigate && onNavigate('portal')}>
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="input-field-group">
                <label className="input-label font-mono">6-DIGIT OTP / 6-अंकीय ओटीपी</label>
                <div className="input-wrapper">
                 <input
  type="text"
  placeholder="• • • • • •"
  className="identity-input font-mono"
  maxLength={6}
  inputMode="numeric"
  value={otp}
  onChange={(e) => setOtp(e.target.value)}
  style={{ letterSpacing: '0.2em', fontSize: '24px' }}
/>
                </div>
                <div className="input-footer">
                  <span className="help-text">Please enter the code sent to your device.</span>
                  <a href="#" className="forgot-link">Resend Code</a>
                </div>
              </div>

              <div className="form-actions">
                <button className="confirm-btn" onClick={handleVerifyOtp}>
  Verify &amp; Proceed <span className="btn-hi">/ सत्यापित करें</span>
  <span className="material-symbols-outlined">check_circle</span>
</button>
                <button className="cancel-btn" onClick={() => setStep('input')}>
                  Back
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
            ABDM M1, M2 &amp; M3 COMPLIANT • END-TO-END 256-BIT ENCRYPTED
          </div>
          <div className="terminal-info font-mono">
            DESK TERMINAL: <strong>ND-AIIMS-104</strong> <span style={{marginLeft: '16px'}}>SESSION: <strong>#OPD-8849</strong></span>
          </div>
        </div>

        <div className="emergency-triage-banner">
          <div className="emergency-content">
            <div className="emergency-icon-wrap">
              <span className="material-symbols-outlined">emergency</span>
            </div>
            <div>
              <div className="em-title">Feeling severe pain, shortness of breath, or bleeding?</div>
              <div className="em-sub">अत्यधिक दर्द, सांस लेने में कठिनाई या रक्तस्राव होने पर तत्काल सूचित करें</div>
            </div>
          </div>
          <button className="em-triage-btn" onClick={() => onNavigate && onNavigate('triage')}>
            <span className="material-symbols-outlined">call</span>
            Emergency Triage (011-26588500)
          </button>
        </div>

        <div className="footer-bottom">
          <div className="footer-brand">
            <strong>AyuLeakha Clinical Handover System</strong>
            <div className="brand-tagline">Your Health Story, Clearly Understood.</div>
            <div className="brand-compliance font-mono">
              ABDM &amp; NDHM COMPLIANCE CERTIFIED • ARCHIVAL REF: AIIMS-OPD-B104-ARCHIVE
            </div>
          </div>
          <div className="footer-contact text-right">
            <div className="helpline-text font-mono">
              <strong>EMERGENCY TRIAGE HELPLINE: 011-26588500</strong>
            </div>
            <div className="address-text">
              AIIMS New Delhi Central OPD Desk, Ansari Nagar, New Delhi 110029
            </div>
            <div className="copyright-text font-mono">
              © 2024 AyuLeakha Health Services. Non-Commercial Public Health License.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
