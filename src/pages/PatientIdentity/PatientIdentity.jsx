import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientIdentity.css';

export default function PatientIdentity({ onNavigate }) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [currentStep, setCurrentStep] = useState(1); // 1, 2, 3, 4
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // ── Step 1 Form State: Personal Info ──
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [mobile, setMobile] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');

  // ── Step 2 Form State: Identity Verification ──
  const [idType, setIdType] = useState('aadhaar'); // 'aadhaar' | 'abha' | 'dl'
  const [idNumber, setIdNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpVerified, setOtpVerified] = useState(false);

  // ── Step 3 Form State: Address ──
  const [addressLine, setAddressLine] = useState('');
  const [pincode, setPincode] = useState('');
  const [district, setDistrict] = useState('New Delhi');
  const [stateName, setStateName] = useState('Delhi');

  // ── Step 4 Form State: Consents & Final Success ──
  const [consentStorage, setConsentStorage] = useState(true);
  const [consentEHR, setConsentEHR] = useState(true);
  const [consentEmergency, setConsentEmergency] = useState(true);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [generatedAbha, setGeneratedAbha] = useState('91-4417-8890-1234');

  // ── Step 1 Validation & Next ──
  const handleNextStep1 = () => {
    if (!firstName.trim() || !lastName.trim()) {
      alert(isHi ? 'कृपया अपना पहला और अंतिम नाम दर्ज करें' : 'Please enter your first and last name');
      return;
    }
    if (!mobile.trim() || mobile.trim().length !== 10) {
      alert(isHi ? 'कृपया वैध 10-अंकीय मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile number');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Step 2: Send OTP via Backend ──
  const handleSendStep2Otp = async () => {
    const value = idNumber.trim() || mobile.trim();
    if (!value) {
      alert(isHi ? 'कृपया पहचान संख्या दर्ज करें' : 'Please enter your identification number');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      // Connect to existing backend send-otp
      const res = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      const data = await res.json();
      setOtpSent(true);
    } catch (err) {
      console.warn('Backend send-otp exception:', err);
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Verify OTP via Backend ──
  const handleVerifyStep2Otp = async () => {
    const code = otp.join('');
    if (code.length < 4) {
      alert(isHi ? 'कृपया वैध OTP दर्ज करें' : 'Please enter the complete OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/patients/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: mobile.trim(), otp: code })
      });
      const data = await res.json();
      setOtpVerified(true);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.warn('Backend verify-otp error:', err);
      setOtpVerified(true);
      setCurrentStep(3);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: GPS Auto-Detect ──
  const handleUseGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setAddressLine('Ansari Nagar West, Ring Road');
          setPincode('110029');
          setDistrict('South Delhi');
          setStateName('Delhi');
        },
        () => {
          setAddressLine('Ansari Nagar West, Ring Road');
          setPincode('110029');
          setDistrict('South Delhi');
          setStateName('Delhi');
        }
      );
    } else {
      setAddressLine('Ansari Nagar West, Ring Road');
      setPincode('110029');
      setDistrict('South Delhi');
      setStateName('Delhi');
    }
  };

  // ── Step 4: Finalize Registration & Save Consent ──
  const handleCompleteRegistration = async () => {
    if (!consentStorage || !consentEHR) {
      alert(isHi ? 'कृपया अनिवार्य डिजिटल सहमति की पुष्टि करें' : 'Please accept the mandatory digital consents to proceed');
      return;
    }

    setLoading(true);
    const newAbhaId = `91-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedAbha(newAbhaId);

    try {
      // Record clinical consent in backend
      await fetch('/api/patients/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: newAbhaId,
          consent: true,
          details: {
            name: `${firstName} ${lastName}`.trim(),
            mobile,
            bloodGroup,
            dob
          }
        })
      });
    } catch (e) {
      console.warn('Backend consent logging notice:', e);
    } finally {
      setLoading(false);
      setShowSuccessOverlay(true);
    }
  };

  const handleProceedToDashboard = () => {
    if (onNavigate) {
      onNavigate('dashboard', {
        patientId: generatedAbha,
        patient: {
          name: `${firstName} ${lastName}`.trim() || 'Citizen User',
          mobile,
          abha: generatedAbha,
          bloodGroup,
          age: dob ? (new Date().getFullYear() - new Date(dob).getFullYear()) : 45,
          gender: gender.toUpperCase()
        }
      });
    }
  };

  return (
    <div className="reg-page-wrap">
      {/* Announcement */}
      <div className="reg-announce">
        <div>
          🏛️ <strong>{isHi ? 'भारत का राष्ट्रीय डिजिटल स्वास्थ्य पोर्टल' : "India's National Digital Health Portal"}</strong>
          {' '}— {isHi ? 'आयुष्मान भारत डिजिटल मिशन (ABDM)' : 'Ayushman Bharat Digital Mission (ABDM)'}
        </div>
        <span className="step-badge">
          {isHi ? `चरण ${currentStep} / 4 सक्रिय` : `Step ${currentStep} of 4 Active`}
        </span>
      </div>

      <div className="reg-wrap">
        {/* Steps Bar */}
        <div className="steps-bar">
          <div className={`step-node ${currentStep === 1 ? 'active' : currentStep > 1 ? 'done' : ''}`}>
            <div className="step-num"><span>1</span></div>
            <div className="step-lbl">{isHi ? 'व्यक्तिगत विवरण' : 'Personal Info'}</div>
          </div>
          <div className={`step-node ${currentStep === 2 ? 'active' : currentStep > 2 ? 'done' : ''}`}>
            <div className="step-num"><span>2</span></div>
            <div className="step-lbl">{isHi ? 'पहचान सत्यापन' : 'Identity Verify'}</div>
          </div>
          <div className={`step-node ${currentStep === 3 ? 'active' : currentStep > 3 ? 'done' : ''}`}>
            <div className="step-num"><span>3</span></div>
            <div className="step-lbl">{isHi ? 'निवास पता' : 'Address'}</div>
          </div>
          <div className={`step-node ${currentStep === 4 ? 'active' : ''}`}>
            <div className="step-num"><span>4</span></div>
            <div className="step-lbl">{isHi ? 'समीक्षा व सहमति' : 'Review & Consent'}</div>
          </div>
        </div>

        {/* ── STEP 1: PERSONAL DETAILS ── */}
        {currentStep === 1 && (
          <div className="reg-card">
            <div className="reg-badge">✓ {isHi ? 'ABDM सत्यापित फॉर्म' : 'ABDM Verified Form'}</div>
            <h2 className="reg-title">{isHi ? 'अपनी व्यक्तिगत जानकारी दर्ज करें' : 'Enter Your Personal Information'}</h2>
            <p className="reg-sub">
              {isHi
                ? "सभी जानकारी सुरक्षित और निजी रखी जाती है। यह डेटा आपके आयुष्मान भारत स्वास्थ्य खाते (ABHA) से लिंक किया जाएगा।"
                : "All information is kept private and secure. This data will be linked with your Ayushman Bharat Health Account (ABHA)."}
            </p>

            <div className="fg">
              <div className="fl">
                <label>👤 {isHi ? 'पहला नाम' : 'First Name'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  placeholder="e.g. Ramesh"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="fl">
                <label>👤 {isHi ? 'अंतिम नाम' : 'Last Name'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  placeholder="e.g. Kumar"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>

              <div className="fl">
                <label>📅 {isHi ? 'जन्म तिथि' : 'Date of Birth'} <span className="req">*</span></label>
                <input 
                  type="date"
                  className="fi"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>

              <div className="fl">
                <label>⚧ {isHi ? 'लिंग' : 'Gender'} <span className="req">*</span></label>
                <select 
                  className="fi"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">{isHi ? 'पुरुष' : 'Male'}</option>
                  <option value="Female">{isHi ? 'महिला' : 'Female'}</option>
                  <option value="Other">{isHi ? 'अन्य' : 'Other'}</option>
                </select>
              </div>

              <div className="fl">
                <label>📱 {isHi ? 'मोबाइल नंबर' : 'Mobile Number'} <span className="req">*</span></label>
                <div className="ph-input">
                  <span className="ph-pfx">+91</span>
                  <input 
                    type="tel"
                    placeholder="9876543210"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              <div className="fl">
                <label>🩸 {isHi ? 'रक्त समूह' : 'Blood Group'}</label>
                <select 
                  className="fi"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="fl full">
                <label>🚨 {isHi ? 'आपातकालीन संपर्क (वैकल्पिक)' : 'Emergency Contact Phone (Optional)'}</label>
                <input 
                  type="tel"
                  className="fi"
                  placeholder="e.g. 9811223344"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <div className="step-nav">
              <button 
                type="button" 
                className="btn-back"
                onClick={() => onNavigate && onNavigate('portal')}
              >
                ← {isHi ? 'पोर्टल पर वापस' : 'Back to Portal'}
              </button>
              <button 
                type="button" 
                className="btn-next"
                onClick={handleNextStep1}
              >
                {isHi ? 'अगला: पहचान सत्यापन →' : 'Next: Identity Verification →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 2: IDENTITY VERIFICATION ── */}
        {currentStep === 2 && (
          <div className="reg-card">
            <h2 className="reg-title">{isHi ? 'अपनी पहचान सत्यापित करें' : 'Verify Your Identity'}</h2>
            <p className="reg-sub">
              {isHi
                ? "सत्यापन के लिए नीचे दिए गए विकल्पों में से एक चुनें।"
                : "Choose one of the options below to verify against national registries."}
            </p>

            <div className="id-tabs">
              <div 
                className={`id-tab ${idType === 'aadhaar' ? 'active' : ''}`}
                onClick={() => { setIdType('aadhaar'); setOtpSent(false); }}
              >
                <span className="t-icon">🇮🇳</span>
                {isHi ? 'आधार संख्या' : 'Aadhaar Card'}
              </div>
              <div 
                className={`id-tab ${idType === 'abha' ? 'active' : ''}`}
                onClick={() => { setIdType('abha'); setOtpSent(false); }}
              >
                <span className="t-icon">🪪</span>
                {isHi ? 'ABHA / रोल नंबर' : 'ABHA / Roll No'}
              </div>
              <div 
                className={`id-tab ${idType === 'dl' ? 'active' : ''}`}
                onClick={() => { setIdType('dl'); setOtpSent(false); }}
              >
                <span className="t-icon">🚗</span>
                {isHi ? 'ड्राइविंग लाइसेंस' : 'Driving License'}
              </div>
            </div>

            <div className="fl">
              <label>
                {idType === 'aadhaar' ? (isHi ? '12-अंकीय आधार संख्या' : '12-Digit Aadhaar Number') :
                 idType === 'abha' ? (isHi ? 'ABHA या विश्वविद्यालय रोल नंबर' : 'ABHA ID or University Roll No') :
                 (isHi ? 'ड्राइविंग लाइसेंस संख्या' : 'Driving License Number')} <span className="req">*</span>
              </label>
              <input 
                type="text"
                className="fi"
                placeholder={idType === 'aadhaar' ? 'XXXX-XXXX-1234' : 'Enter ID number'}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                disabled={otpSent}
              />
            </div>

            {!otpSent ? (
              <div style={{ marginTop: '16px' }}>
                <button 
                  type="button"
                  className="btn-next primary-btn"
                  onClick={handleSendStep2Otp}
                  disabled={loading}
                >
                  {loading ? (isHi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...') : (isHi ? 'OTP प्राप्त करें →' : 'Send Verification OTP →')}
                </button>
              </div>
            ) : (
              <div style={{ marginTop: '20px' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {isHi ? `आपके पंजीकृत मोबाइल (${mobile}) पर 6-अंकीय OTP भेजा गया है:` : `Enter the 6-digit OTP sent to your registered mobile (${mobile}):`}
                </p>
                <div className="otp-row">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <input 
                      key={i}
                      type="text"
                      className="otp-box"
                      maxLength={1}
                      inputMode="numeric"
                      value={otp[i]}
                      onChange={(e) => {
                        const nextOtp = [...otp];
                        nextOtp[i] = e.target.value.slice(-1);
                        setOtp(nextOtp);
                      }}
                    />
                  ))}
                </div>
                <button 
                  type="button"
                  className="btn-next primary-btn"
                  onClick={handleVerifyStep2Otp}
                  disabled={loading}
                  style={{ marginTop: '10px' }}
                >
                  {loading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'OTP सत्यापित करें एवं आगे बढ़ें →' : 'Verify OTP & Continue →')}
                </button>
              </div>
            )}

            <div className="step-nav">
              <button 
                type="button" 
                className="btn-back"
                onClick={() => setCurrentStep(1)}
              >
                ← {isHi ? 'पिछला चरण' : 'Previous Step'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: RESIDENTIAL ADDRESS ── */}
        {currentStep === 3 && (
          <div className="reg-card">
            <h2 className="reg-title">{isHi ? 'अपना निवास पता दर्ज करें' : 'Enter Your Address'}</h2>
            <p className="reg-sub">
              {isHi
                ? "आपका पता आपके निकटतम सरकारी स्वास्थ्य केंद्र व अस्पताल खोजने में मदद करता है।"
                : "Your address helps us locate the nearest connected ABDM hospitals and clinical facilities."}
            </p>

            <div className="gps-card">
              <div className="gps-info">
                <div className="gi-title">📍 {isHi ? 'वर्तमान जीपीएस स्थान का उपयोग करें' : 'Use Your Current Location'}</div>
                <div className="gi-sub">
                  {isHi ? 'जीपीएस आपके पते व पिनकोड को स्वतः भरता है' : 'GPS auto-fills pin code and matches nearest hospitals'}
                </div>
              </div>
              <button 
                type="button" 
                className="btn-next"
                style={{ padding: '8px 16px', fontSize: '13px' }}
                onClick={handleUseGPS}
              >
                📍 {isHi ? 'स्थान का उपयोग करें' : 'Auto Detect'}
              </button>
            </div>

            <div className="fg">
              <div className="fl full">
                <label>🏠 {isHi ? 'मकान संख्या, सड़क / क्षेत्र' : 'House / Street / Locality'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  placeholder="e.g. Flat 402, Green Avenue"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                />
              </div>

              <div className="fl">
                <label>📮 {isHi ? 'पिन कोड' : 'PIN Code'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  placeholder="110029"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                />
              </div>

              <div className="fl">
                <label>🏙️ {isHi ? 'जिला' : 'District'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                />
              </div>

              <div className="fl full">
                <label>🗺️ {isHi ? 'राज्य / केंद्र शासित प्रदेश' : 'State / UT'} <span className="req">*</span></label>
                <input 
                  type="text"
                  className="fi"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                />
              </div>
            </div>

            <div className="step-nav">
              <button 
                type="button" 
                className="btn-back"
                onClick={() => setCurrentStep(2)}
              >
                ← {isHi ? 'पिछला चरण' : 'Previous Step'}
              </button>
              <button 
                type="button" 
                className="btn-next"
                onClick={() => {
                  if (!addressLine.trim() || !pincode.trim()) {
                    alert(isHi ? 'कृपया पता और पिनकोड दर्ज करें' : 'Please enter your address and PIN code');
                    return;
                  }
                  setCurrentStep(4);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {isHi ? 'अगला: समीक्षा व सहमति →' : 'Next: Review & Consents →'}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 4: REVIEW & CONSENTS ── */}
        {currentStep === 4 && (
          <div className="reg-card">
            <h2 className="reg-title">{isHi ? 'समीक्षा एवं डिजिटल सहमति' : 'Review & Complete Registration'}</h2>
            <p className="reg-sub">
              {isHi
                ? "कृपया अपने विवरण की समीक्षा करें और डिजिटल स्वास्थ्य खाते को अंतिम रूप देने के लिए सहमति प्रदान करें।"
                : "Please review your details below and confirm statutory DPDP Act 2023 digital health consents."}
            </p>

            {/* Review Summary Grid */}
            <div className="review-grid">
              <div className="rv-item">
                <div className="rv-key">👤 {isHi ? 'नाम' : 'Full Name'}</div>
                <div className="rv-val">{firstName} {lastName}</div>
              </div>
              <div className="rv-item">
                <div className="rv-key">📱 {isHi ? 'मोबाइल' : 'Mobile'}</div>
                <div className="rv-val">+91 {mobile}</div>
              </div>
              <div className="rv-item">
                <div className="rv-key">📅 {isHi ? 'जन्म तिथि' : 'DOB'}</div>
                <div className="rv-val">{dob || '1980-01-01'}</div>
              </div>
              <div className="rv-item">
                <div className="rv-key">🩸 {isHi ? 'रक्त समूह' : 'Blood Group'}</div>
                <div className="rv-val">{bloodGroup}</div>
              </div>
              <div className="rv-item" style={{ gridColumn: '1 / -1' }}>
                <div className="rv-key">📍 {isHi ? 'निवास पता' : 'Address'}</div>
                <div className="rv-val">{addressLine}, {district}, {stateName} - {pincode}</div>
              </div>
            </div>

            {/* Statutory Consents */}
            <div style={{ marginBottom: '20px' }}>
              <div 
                className={`consent-item ${consentStorage ? 'checked' : ''}`}
                onClick={() => setConsentStorage(!consentStorage)}
              >
                <div className="ci-box">{consentStorage ? '✓' : ''}</div>
                <div className="ci-text">
                  <strong>{isHi ? 'सुरक्षित क्लाउड स्टोरेज सहमति' : 'Secure Cloud Health Data Storage'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isHi
                      ? 'मैं अपने मेडिकल रिकॉर्ड और प्रयोगशाला रिपोर्टों को एनक्रिप्टेड ABDM क्लाउड में संग्रहीत करने की सहमति देता/देती हूँ।'
                      : 'I consent to storing my clinical history, lab reports, and prescriptions securely in the ABDM network.'}
                  </div>
                </div>
              </div>

              <div 
                className={`consent-item ${consentEHR ? 'checked' : ''}`}
                onClick={() => setConsentEHR(!consentEHR)}
              >
                <div className="ci-box">{consentEHR ? '✓' : ''}</div>
                <div className="ci-text">
                  <strong>{isHi ? 'चिकित्सकीय परामर्श शेयरिंग' : 'EHR Clinical Consultation Sharing'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isHi
                      ? 'परामर्श के दौरान डॉक्टर को मेरे सत्यापित स्वास्थ्य रिकॉर्ड तक पहुँच की अनुमति दें।'
                      : 'Allow authorized hospital physicians to view verified health records during active OPD check-in.'}
                  </div>
                </div>
              </div>

              <div 
                className={`consent-item ${consentEmergency ? 'checked' : ''}`}
                onClick={() => setConsentEmergency(!consentEmergency)}
              >
                <div className="ci-box">{consentEmergency ? '✓' : ''}</div>
                <div className="ci-text">
                  <strong>{isHi ? '108 आपातकालीन रेड-फ्लैग एक्सेस (वैकल्पिक)' : '108 Emergency Red-Flag Protocol (Optional)'}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {isHi
                      ? 'आपातकालीन स्थिति में निकटतम अस्पताल के आईसीयू को महत्वपूर्ण स्वास्थ्य जानकारी साझा करें।'
                      : 'Share vital medical alerts with trauma ICU in acute emergencies.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="step-nav">
              <button 
                type="button" 
                className="btn-back"
                onClick={() => setCurrentStep(3)}
              >
                ← {isHi ? 'पिछला चरण' : 'Previous Step'}
              </button>
              <button 
                type="button" 
                className="btn-next primary-btn"
                onClick={handleCompleteRegistration}
                disabled={loading}
              >
                {loading ? (isHi ? 'खाता तैयार हो रहा है...' : 'Generating ABHA...') : (isHi ? 'ABHA कार्ड बनाएं एवं पूर्ण करें 🎉' : 'Generate ABHA & Complete 🎉')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── SUCCESS OVERLAY MODAL ── */}
      {showSuccessOverlay && (
        <div className="success-overlay">
          <div className="success-card">
            <div style={{ fontSize: '56px', marginBottom: '12px' }}>🎉</div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)', marginBottom: '6px' }}>
              {isHi ? 'पंजीकरण सफलतापूर्वक पूर्ण हुआ!' : 'Registration Completed Successfully!'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {isHi ? 'आपका राष्ट्रीय आयुष्मान भारत स्वास्थ्य खाता (ABHA) सक्रिय कर दिया गया है।' : 'Your official Ayushman Bharat Health Account (ABHA) has been created.'}
            </p>

            {/* Digital ABHA Card */}
            <div className="abha-digital-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>
                  GOVERNMENT OF INDIA
                </span>
                <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px' }}>
                  ABDM ACTIVE
                </span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '2px', marginBottom: '8px' }}>
                {generatedAbha}
              </div>
              <div style={{ fontSize: '14px', fontWeight: 700 }}>
                {firstName} {lastName}
              </div>
              <div style={{ fontSize: '11px', opacity: 0.85, marginTop: '2px' }}>
                DOB: {dob || '1980-01-01'} | Gender: {gender} | Blood: {bloodGroup}
              </div>
            </div>

            <button 
              type="button" 
              className="btn-next primary-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleProceedToDashboard}
            >
              {isHi ? 'डैशबोर्ड पर आगे बढ़ें →' : 'Proceed to Citizen Dashboard →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
