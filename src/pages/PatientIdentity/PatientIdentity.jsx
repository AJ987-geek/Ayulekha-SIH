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

  // Additional patient registration fields
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [gender, setGender] = useState('Male');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const { language, openLanguageModal, currentLangObj, t } = useLanguage();
  const isHi = language === 'hi';

  // =====================================================
  // ABHA / ROLL NUMBER CHECK
  // =====================================================
  const handleCheckAbha = async () => {
    const value = identifier.trim();

    if (!value) {
      alert(isHi ? 'कृपया अपना विश्वविद्यालय रोल नंबर / ABHA दर्ज करें' : 'Please enter your university roll number / ABHA');
      return;
    }

    if (!/^\d+$/.test(value)) {
      alert(isHi ? 'कृपया एक वैध संख्यात्मक रोल नंबर दर्ज करें' : 'Please enter a valid numeric roll number');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/patients/check-abha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha: value })
      });

      const data = await response.json();
      console.log('CHECK PATIENT RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || (isHi ? 'रोगी रिकॉर्ड जांचने में असमर्थ' : 'Unable to check patient record'));
        return;
      }

      // Existing Patient
      if (data.exists) {
        alert(isHi ? 'रोगी रिकॉर्ड मिल गया!' : 'Patient record found!');
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

      // Patient Not Found -> automatically route to email verification
      setMessage(isHi ? 'कोई मौजूदा रोगी रिकॉर्ड नहीं मिला। कृपया जारी रखने के लिए अपना ईमेल सत्यापित करें।' : 'No patient record found. Please verify your email to continue.');
      setRollNumber(value);
      setStep('email');
    } catch (error) {
      console.error('Patient check error:', error);
      alert(isHi ? 'AyuLekha बैकएंड से कनेक्ट करने में असमर्थ' : 'Unable to connect to AyuLekha backend');
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
      alert(isHi ? 'कृपया अपना ईमेल पता दर्ज करें' : 'Please enter your email address');
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      alert(isHi ? 'कृपया एक वैध ईमेल पता दर्ज करें' : 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      console.log('SEND OTP RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || (isHi ? 'OTP भेजने में असमर्थ' : 'Unable to send OTP'));
        return;
      }

      setMessage(isHi ? 'OTP आपके ईमेल पर सफलतापूर्वक भेजा गया।' : 'OTP sent successfully to your email.');
      setStep('otp');
    } catch (error) {
      console.error('Email OTP error:', error);
      alert(isHi ? 'AyuLekha बैकएंड से कनेक्ट करने में असमर्थ' : 'Unable to connect to AyuLekha backend');
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
      alert(isHi ? 'कृपया OTP दर्ज करें' : 'Please enter the OTP');
      return;
    }

    if (otpInput.length !== 6) {
      alert(isHi ? 'कृपया 6-अंकीय OTP दर्ज करें' : 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/patients/verify-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpInput })
      });

      const data = await response.json();
      console.log('VERIFY OTP RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || (isHi ? 'OTP सत्यापन विफल' : 'OTP verification failed'));
        return;
      }

      alert(isHi ? 'ईमेल सफलतापूर्वक सत्यापित हुआ!' : 'Email verified successfully!');
      setMessage(isHi ? 'ईमेल सत्यापित हो गया। अब पंजीकरण पूर्ण करने के लिए अपना रोल नंबर दर्ज करें।' : 'Email verified successfully. Now enter your university roll number to complete registration.');
      setStep('rollNumber');
    } catch (error) {
      console.error('OTP verification error:', error);
      alert(isHi ? 'AyuLekha बैकएंड से कनेक्ट करने में असमर्थ' : 'Unable to connect to AyuLekha backend');
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
      alert(isHi ? 'कृपया अपना रोल नंबर दर्ज करें' : 'Please enter your university roll number');
      return;
    }

    if (!/^\d+$/.test(value)) {
      alert(isHi ? 'कृपया एक वैध संख्यात्मक रोल नंबर दर्ज करें' : 'Please enter a valid numeric roll number');
      return;
    }

    if (!email) {
      alert(isHi ? 'ईमेल सत्यापन आवश्यक है' : 'Email verification is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abha: value,
          name: name.trim() || 'New Patient',
          age: age ? parseInt(age, 10) : 22,
          bloodGroup: bloodGroup || 'O+',
          allergies: allergies.trim() || 'None',
          gender: gender || 'Male',
          email
        })
      });

      const data = await response.json();
      console.log('REGISTER PATIENT RESPONSE:', data);

      if (!response.ok) {
        alert(data.message || (isHi ? 'रोगी को पंजीकृत करने में असमर्थ' : 'Unable to register patient'));
        return;
      }

      alert(isHi ? 'रोगी सफलतापूर्वक पंजीकृत हुआ!' : 'Patient registered successfully!');
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
      alert(isHi ? 'AyuLekha बैकएंड से कनेक्ट करने में असमर्थ' : 'Unable to connect to AyuLekha backend');
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================
  const handleResendOtp = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/patients/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: identifier.trim() })
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.message || (isHi ? 'OTP पुनः भेजने में असमर्थ' : 'Unable to resend OTP'));
        return;
      }
      setMessage(isHi ? 'आपके ईमेल पर एक नया OTP भेजा गया है।' : 'A new OTP has been sent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      alert(isHi ? 'AyuLekha बैकएंड से कनेक्ट करने में असमर्थ' : 'Unable to connect to AyuLekha backend');
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
  // AUDIO ASSISTANT
  // =====================================================
  const handleListenAssist = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = isHi
        ? 'कृपया अपने विश्वविद्यालय रोल नंबर से अपना रोगी रिकॉर्ड खोजें, या अपने ईमेल द्वारा 6-अंकीय सत्यापन कोड प्राप्त करें।'
        : 'Please enter your university roll number to find your clinical record, or proceed with verified email OTP authentication.';
      const u = new SpeechSynthesisUtterance(text);
      u.lang = isHi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="identity-container">
      {/* ── TOP HEADER ── */}
      <header className="identity-header">
        <div className="id-header-left">
          <div className="brand-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="logo-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
              +
            </div>
            <div className="brand-text">
              <span className="brand-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                AyuLekha
              </span>
              <span className="brand-sub font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {isHi ? 'राष्ट्रीय डिजिटल स्वास्थ्य मिशन • रोगी पहचान' : 'ABDM Clinical Patient Identity'}
              </span>
            </div>
          </div>
        </div>

        <div className="id-header-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="btn-outline"
            style={{ fontSize: '12px', padding: '5px 12px' }}
            onClick={() => onNavigate && onNavigate('portal')}
          >
            ← {isHi ? 'पोर्टल' : 'Portal'}
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={openLanguageModal}
          >
            <span>🌐</span>
            <span>{currentLangObj?.nativeName || 'English'} ▾</span>
          </button>

          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '12px', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
            onClick={handleListenAssist}
          >
            <span>🔊</span>
            <span>{isHi ? 'ऑडियो सहायता' : 'Listen Assist'}</span>
          </button>

          <div style={{ background: '#E8F5E9', color: 'var(--success)', border: '1px solid rgba(46,125,50,0.2)', padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>
            {isHi ? 'प्राथमिकता: OPD कतार' : 'PRIORITY: OPD QUEUE'}
          </div>
        </div>
      </header>

      {/* ── CLINICAL TIMELINE PROGRESS ── */}
      <div className="identity-progress font-mono" style={{ background: 'var(--bg-muted)', borderBottom: '1px solid var(--border)', padding: '10px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
          <span>STEP 01: PATIENT IDENTITY</span>
        </div>

        <div style={{ display: 'flex', gap: '18px', color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--primary)', fontWeight: 700 }}>01 IDENTIFY</span>
          <span>→</span>
          <span>02 CONSENT</span>
          <span>→</span>
          <span>03 YOUR STORY</span>
          <span>→</span>
          <span>04 DOCTOR NOTE</span>
          <span>→</span>
          <span>05 RECORDS</span>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {isHi ? 'पहचान सत्यापन चरण' : 'Identity Verification Stage'}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="identity-main" style={{ maxWidth: '780px', margin: '32px auto', padding: '0 20px', width: '100%' }}>
        {/* Intro */}
        <div className="identity-intro" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {step === 'input' && (isHi ? 'रोगी की पहचान' : 'Patient Identity')}
            {step === 'abha' && (isHi ? 'अपनी रोगी पहचान सत्यापित करें' : 'Verify Your Patient Identity')}
            {step === 'email' && (isHi ? 'अपना ईमेल पता सत्यापित करें' : 'Verify Your Email Address')}
            {step === 'otp' && (isHi ? 'सत्यापन कोड दर्ज करें' : 'Enter 6-Digit Verification Code')}
            {step === 'rollNumber' && (isHi ? 'रोगी पंजीकरण पूरा करें' : 'Complete Patient Registration')}
          </h1>

          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            {step === 'input' && (
              isHi 
                ? 'मौजूदा रोगी रिकॉर्ड खोजने के लिए अपने विश्वविद्यालय रोल नंबर का उपयोग करें, या ईमेल सत्यापन के साथ सीधे आगे बढ़ें।' 
                : 'Use your university roll number to find an existing patient record, or continue directly with verified email OTP authentication.'
            )}
            {step === 'abha' && (isHi ? 'अपना मौजूदा रोगी रिकॉर्ड खोजने के लिए अपना विश्वविद्यालय रोल नंबर दर्ज करें।' : 'Enter your university roll number to search verified clinical records in the database.')}
            {step === 'email' && (isHi ? 'एक बार का सत्यापन कोड (OTP) प्राप्त करने के लिए अपना ईमेल पता दर्ज करें।' : 'Enter your email address to receive an official verification code.')}
            {step === 'otp' && (isHi ? `आपके ईमेल (${identifier}) पर भेजा गया 6-अंकीय सत्यापन कोड दर्ज करें। (डेमो बाईपास: 123456)` : `Enter the 6-digit verification code sent to ${identifier} (Test bypass: 123456).`)}
            {step === 'rollNumber' && (isHi ? 'आपका ईमेल सत्यापित हो गया है। अपना स्थायी रोगी रिकॉर्ड बनाने के लिए अपना विश्वविद्यालय रोल नंबर दर्ज करें।' : 'Your email has been verified. Enter your university roll number to link and create your clinical patient record.')}
          </p>
        </div>

        {/* ── CHOICE METHOD CARDS (step === 'input') ── */}
        {step === 'input' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* Option 1: Roll Number Check */}
            <div
              className="card"
              style={{ padding: '24px', border: '2px solid var(--border)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', background: '#fff' }}
              onClick={() => { setStep('abha'); setMessage(''); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(26,92,56,0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  🪪
                </div>
                <span className="badge" style={{ background: 'rgba(26,92,56,0.1)', color: 'var(--primary)', fontSize: '11px', fontWeight: 700 }}>
                  PATIENT ID
                </span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>
                ABHA / Roll Number
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {isHi ? 'मौजूदा रिकॉर्ड खोजने के लिए अपने विश्वविद्यालय रोल नंबर का उपयोग करें।' : 'Use your university roll number to lookup an existing patient chart.'}
              </p>
            </div>

            {/* Option 2: Email OTP */}
            <div
              className="card"
              style={{ padding: '24px', border: '2px solid var(--primary)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', background: '#fff' }}
              onClick={() => { setStep('email'); setIdentifier(''); setMessage(''); }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#FFF0E8', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                  ✉️
                </div>
                <span className="badge" style={{ background: '#FFF0E8', color: 'var(--accent)', fontSize: '11px', fontWeight: 700 }}>
                  EMAIL OTP
                </span>
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px' }}>
                Email Verification
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                {isHi ? 'अपने ईमेल पते पर सीधे 6-अंकीय OTP प्राप्त करें और पंजीकरण करें।' : 'Receive a 6-digit OTP directly to your email address to register.'}
              </p>
            </div>
          </div>
        )}

        {/* ── ASSURANCE BANNER ── */}
        <div style={{ background: '#E8F5E9', border: '1.5px solid rgba(46,125,50,0.2)', borderRadius: '12px', padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', fontSize: '13px', color: 'var(--primary)' }}>
          <span style={{ fontSize: '18px' }}>🛡️</span>
          <span>
            <strong>
              {step === 'input' && (isHi ? 'सुरक्षित सत्यापन का तरीका चुनें।' : 'Choose a secure verification method.')}
              {step === 'abha' && (isHi ? 'आपका रोगी रिकॉर्ड सुरक्षित रूप से जांचा जाता है।' : 'Your patient record is securely checked in the database.')}
              {step === 'email' && (isHi ? 'आगे बढ़ने के लिए अपना ईमेल सत्यापित करें।' : 'Verify your email to continue registration.')}
              {step === 'otp' && (isHi ? 'सुरक्षित 6-अंकीय कोड सत्यापित करें।' : 'Enter the verification code sent to your email.')}
              {step === 'rollNumber' && (isHi ? 'विश्वविद्यालय रोल नंबर को रिकॉर्ड से जोड़ें।' : 'Link your verified email to your University Roll Number.')}
            </strong>
          </span>
        </div>

        {/* Status Message */}
        {message && (
          <div style={{ background: '#FFF8E1', border: '1px solid #FFE082', color: '#8D6E63', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', fontWeight: 600 }}>
            ℹ️ {message}
          </div>
        )}

        {/* ── STEP: ABHA / ROLL NUMBER INPUT ── */}
        {step === 'abha' && (
          <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                UNIVERSITY ROLL NUMBER / विश्वविद्यालय रोल नंबर
              </label>
              <input
                type="text"
                className="fi"
                placeholder="e.g. 2510991147"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Enter the roll number assigned by the university / hospital administration.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={handleBackToChoice}
                disabled={loading}
              >
                ← {isHi ? 'वापस' : 'Back'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleCheckAbha}
                disabled={loading}
              >
                {loading ? (isHi ? 'जांच हो रही है...' : 'Checking Record...') : (isHi ? 'रिकॉर्ड खोजें →' : 'Check Record →')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: EMAIL INPUT ── */}
        {step === 'email' && (
          <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                EMAIL ADDRESS / ईमेल पता
              </label>
              <input
                type="email"
                className="fi"
                placeholder="student@example.edu or citizen@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                autoFocus
              />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                A 6-digit OTP will be dispatched to this email address.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={handleBackToChoice}
                disabled={loading}
              >
                ← {isHi ? 'वापस' : 'Back'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading}
              >
                {loading ? (isHi ? 'भेजा जा रहा है...' : 'Sending OTP...') : (isHi ? 'OTP भेजें →' : 'Send OTP →')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: OTP INPUT ── */}
        {step === 'otp' && (
          <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                6-DIGIT OTP / 6-अंकीय ओटीपी
              </label>
              <input
                type="text"
                className="fi font-mono"
                placeholder="• • • • • •"
                maxLength={6}
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loading}
                style={{ fontSize: '24px', letterSpacing: '0.25em', textAlign: 'center' }}
                autoFocus
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  OTP sent to <strong>{identifier}</strong>
                </span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  disabled={loading}
                >
                  {isHi ? 'पुनः कोड भेजें' : 'Resend Code'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => { setStep('email'); setOtp(''); setMessage(''); }}
                disabled={loading}
              >
                ← {isHi ? 'वापस' : 'Back'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
              >
                {loading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'सत्यापित करें एवं आगे बढ़ें →' : 'Verify & Proceed →')}
              </button>
            </div>
          </div>
        )}

        {/* ── STEP: ROLL NUMBER & REGISTRATION (step === 'rollNumber') ── */}
        {step === 'rollNumber' && (
          <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  UNIVERSITY ROLL NUMBER / विश्वविद्यालय रोल नंबर *
                </label>
                <input
                  type="text"
                  className="fi"
                  placeholder="e.g. 2510991147"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  FULL NAME / पूरा नाम *
                </label>
                <input
                  type="text"
                  className="fi"
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  AGE (YEARS) / आयु
                </label>
                <input
                  type="number"
                  className="fi"
                  placeholder="e.g. 22"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  GENDER / लिंग
                </label>
                <select
                  className="fi"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={loading}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  BLOOD GROUP / रक्त समूह
                </label>
                <select
                  className="fi"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  disabled={loading}
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

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  KNOWN ALLERGIES (OPTIONAL) / ज्ञात एलर्जी
                </label>
                <input
                  type="text"
                  className="fi"
                  placeholder="e.g. Penicillin, Peanuts, None"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => { setStep('email'); setRollNumber(''); setMessage(''); }}
                disabled={loading}
              >
                ← {isHi ? 'वापस' : 'Back'}
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRegisterPatient}
                disabled={loading}
              >
                {loading ? (isHi ? 'पंजीकृत हो रहा है...' : 'Registering...') : (isHi ? 'पंजीकरण करें एवं सहमति पर जाएं →' : 'Register & Proceed to Consent →')}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', background: 'var(--bg-muted)', padding: '24px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>AyuLekha Healthcare Gateway</strong> • DPDP Act 2023 Compliant
          </div>
          <div>
            Emergency 108 / 1075 Toll-Free
          </div>
        </div>
      </footer>
    </div>
  );
}
