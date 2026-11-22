import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientIdentity.css';

export default function PatientIdentity({
  onNavigate,
  initialMode = 'login',
  initialPhone = '',
  initialAbha = '',
  phoneVerified = false,
}) {
  const { language, openLanguageModal, currentLangObj, t } = useLanguage();
  const isHi = language === 'hi';

  // Mode: 'login' | 'register'
  const [authMode, setAuthMode] = useState(initialMode || 'login');

  // Login state: 'phone' | 'abha'
  const [loginMethod, setLoginMethod] = useState('phone');
  const [loginPhone, setLoginPhone] = useState(initialPhone || '');
  const [loginPhoneStep, setLoginPhoneStep] = useState('input'); // 'input' | 'otp'
  const [loginOtp, setLoginOtp] = useState('');
  const [loginAbha, setLoginAbha] = useState(initialAbha || '');

  // Registration state: 'phone' | 'otp' | 'details'
  const [regStep, setRegStep] = useState(phoneVerified ? 'details' : 'phone');
  const [regPhone, setRegPhone] = useState(initialPhone || '');
  const [regOtp, setRegOtp] = useState('');
  const [regAbha, setRegAbha] = useState(initialAbha || '');

  // ABHA validation & availability state
  const [abhaStatus, setAbhaStatus] = useState(null); // null | 'checking' | 'available' | 'already_available'
  const [abhaMessage, setAbhaMessage] = useState('');

  // Patient registration details
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [email, setEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState('');

  // If initial props change, reflect them
  useEffect(() => {
    if (initialMode) setAuthMode(initialMode);
    if (initialPhone) {
      setLoginPhone(initialPhone);
      setRegPhone(initialPhone);
    }
    if (initialAbha) {
      setLoginAbha(initialAbha);
      setRegAbha(initialAbha);
    }
    if (phoneVerified) {
      setRegStep('details');
    }
  }, [initialMode, initialPhone, initialAbha, phoneVerified]);

  // Check ABHA availability when entered during registration
  const handleCheckAbhaAvailability = async (valueToCheck) => {
    const cleanAbha = (valueToCheck || regAbha).trim();
    if (!cleanAbha) {
      setAbhaStatus(null);
      setAbhaMessage('');
      return;
    }

    setAbhaStatus('checking');
    try {
      const res = await fetch('/api/patients/check-abha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha: cleanAbha }),
      });
      const data = await res.json();

      if (data.exists) {
        // Requirement: "and if it is already available then it will say already available"
        setAbhaStatus('already_available');
        setAbhaMessage(
          isHi
            ? `⚠️ यह ABHA ID (${cleanAbha}) पहले से ही उपलब्ध / पंजीकृत है। कृपया लॉग इन करें।`
            : `⚠️ ABHA ID (${cleanAbha}) is already available / registered to an existing patient. Please log in instead.`
        );
      } else {
        setAbhaStatus('available');
        setAbhaMessage(
          isHi
            ? `✓ यह ABHA ID (${cleanAbha}) नए पंजीकरण के लिए उपलब्ध है।`
            : `✓ ABHA ID (${cleanAbha}) is available for new registration.`
        );
      }
    } catch (err) {
      console.warn('ABHA check error:', err);
      setAbhaStatus(null);
    }
  };

  // =========================================================================
  // LOGIN FLOW: OPTION 1 — PHONE NUMBER (OTP)
  // =========================================================================
  const handleSendLoginOtp = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert(isHi ? 'कृपया 10-अंकीय वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile phone number');
      return;
    }

    setLoading(true);
    setMessage('');
    setDevOtpNotice('');

    try {
      const res = await fetch('/api/patients/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.message || 'Failed to send OTP.');
        return;
      }

      setLoginPhoneStep('otp');
      if (data.dev_otp) {
        setDevOtpNotice(`OTP generated for +91 ${cleanPhone}: ${data.dev_otp} (Test bypass: 123456)`);
        setLoginOtp(data.dev_otp);
      } else {
        setMessage(isHi ? `OTP +91 ******${cleanPhone.slice(-4)} पर भेजा गया` : `OTP sent to +91 ******${cleanPhone.slice(-4)}`);
      }
    } catch (err) {
      console.error(err);
      alert(isHi ? 'OTP भेजने में असमर्थ' : 'Unable to send OTP. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyLoginOtp = async () => {
    const cleanPhone = loginPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = loginOtp.trim();

    if (cleanOtp.length !== 6) {
      alert(isHi ? 'कृपया 6-अंकीय OTP दर्ज करें' : 'Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/patients/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.message || 'Invalid OTP code');
        return;
      }

      // Existing patient logged in
      if (data.patient) {
        localStorage.setItem('abhaId', data.patient.abha);
        try {
          localStorage.setItem('ayulekha_current_patient', JSON.stringify(data.patient));
        } catch (_) {}
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.patient.medicalHistory || [],
            email: data.patient.email || '',
          });
        }
      } else if (data.isNewPatient) {
        // No existing record with this phone -> route to registration
        alert(
          isHi
            ? 'इस मोबाइल नंबर के लिए कोई पूर्व रोगी रिकॉर्ड नहीं मिला। कृपया ABHA ID के साथ नया पंजीकरण करें।'
            : 'No existing patient record found for this mobile number. Redirecting to complete first-time registration.'
        );
        setAuthMode('register');
        setRegPhone(cleanPhone);
        setRegStep('details');
      }
    } catch (err) {
      console.error(err);
      alert(isHi ? 'सत्यापन विफल' : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // LOGIN FLOW: OPTION 2 — ABHA ID
  // =========================================================================
  const handleLoginAbha = async () => {
    const cleanAbha = loginAbha.trim();
    if (!cleanAbha) {
      alert(isHi ? 'कृपया अपना ABHA ID दर्ज करें' : 'Please enter your ABHA ID');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/patients/check-abha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ abha: cleanAbha }),
      });
      const data = await res.json();

      if (data.exists && data.patient) {
        localStorage.setItem('abhaId', data.patient.abha);
        try {
          localStorage.setItem('ayulekha_current_patient', JSON.stringify(data.patient));
        } catch (_) {}
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.patient.medicalHistory || [],
            email: data.patient.email || '',
          });
        }
      } else {
        alert(
          isHi
            ? 'इस ABHA ID के लिए कोई रोगी रिकॉर्ड नहीं मिला। कृपया पहले पंजीकरण करें।'
            : 'No patient record found for this ABHA ID. Please complete first-time registration.'
        );
        setAuthMode('register');
        setRegAbha(cleanAbha);
        setRegStep('phone');
      }
    } catch (err) {
      console.error(err);
      alert(isHi ? 'रिकॉर्ड जांचने में असमर्थ' : 'Unable to check ABHA ID record');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // REGISTRATION FLOW: STEP 1 — SEND PHONE OTP
  // =========================================================================
  const handleSendRegOtp = async () => {
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
    if (cleanPhone.length !== 10) {
      alert(isHi ? 'कृपया 10-अंकीय वैध मोबाइल नंबर दर्ज करें' : 'Please enter a valid 10-digit mobile phone number');
      return;
    }

    setLoading(true);
    setMessage('');
    setDevOtpNotice('');

    try {
      const res = await fetch('/api/patients/send-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.message || 'Failed to dispatch phone OTP');
        return;
      }

      setRegStep('otp');
      if (data.dev_otp) {
        setDevOtpNotice(`OTP generated for +91 ${cleanPhone}: ${data.dev_otp} (Test bypass: 123456)`);
        setRegOtp(data.dev_otp);
      } else {
        setMessage(isHi ? `OTP +91 ******${cleanPhone.slice(-4)} पर भेजा गया` : `Verification OTP sent to +91 ******${cleanPhone.slice(-4)}`);
      }
    } catch (err) {
      console.error(err);
      alert(isHi ? 'OTP भेजने में असमर्थ' : 'Unable to send OTP');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // REGISTRATION FLOW: STEP 2 — VERIFY PHONE OTP
  // =========================================================================
  const handleVerifyRegOtp = async () => {
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);
    const cleanOtp = regOtp.trim();

    if (cleanOtp.length !== 6) {
      alert(isHi ? 'कृपया 6-अंकीय OTP दर्ज करें' : 'Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/patients/verify-phone-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: cleanOtp }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.detail || data.message || 'Invalid or expired OTP');
        return;
      }

      // If user already exists with this phone, offer direct login
      if (data.patient) {
        alert(
          isHi
            ? `आपका रिकॉर्ड पहले से मौजूद है (${data.patient.name})। लॉग इन किया जा रहा है...`
            : `A patient record already exists for this mobile number (${data.patient.name}). Logging in...`
        );
        localStorage.setItem('abhaId', data.patient.abha);
        try {
          localStorage.setItem('ayulekha_current_patient', JSON.stringify(data.patient));
        } catch (_) {}
        if (onNavigate) {
          onNavigate('dashboard', {
            patientId: data.patient.id,
            patient: data.patient,
            medicalHistory: data.patient.medicalHistory || [],
            email: data.patient.email || '',
          });
        }
        return;
      }

      // Step 2 completed: Move to Step 3 (Ask ABHA ID)
      setRegStep('details');
      setMessage(
        isHi
          ? 'मोबाइल नंबर सफलतापूर्वक सत्यापित हुआ! अब अपना ABHA ID दर्ज करें।'
          : 'Mobile phone verified! Now please enter your ABHA ID to link your health records.'
      );
    } catch (err) {
      console.error(err);
      alert(isHi ? 'सत्यापन विफल' : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // REGISTRATION FLOW: STEP 3 — SUBMIT NEW PATIENT REGISTRATION
  // =========================================================================
  const handleRegisterPatient = async () => {
    const cleanAbha = regAbha.trim();
    const cleanPhone = regPhone.replace(/\D/g, '').slice(-10);

    if (!cleanAbha) {
      alert(isHi ? 'कृपया अपना ABHA ID दर्ज करें' : 'ABHA ID is compulsory for registration');
      return;
    }

    // Check if already marked unavailable
    if (abhaStatus === 'already_available') {
      alert(
        isHi
          ? 'यह ABHA ID पहले से ही उपलब्ध / पंजीकृत है। कृपया लॉग इन विकल्प का उपयोग करें।'
          : 'ABHA ID is already available / registered to an existing patient. Please log in instead.'
      );
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const res = await fetch('/api/patients/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          abha: cleanAbha,
          phone: cleanPhone,
          name: name.trim() || 'New Patient',
          age: age ? parseInt(age, 10) : 25,
          gender: gender || 'Male',
          bloodGroup: bloodGroup || 'O+',
          allergies: allergies.trim() || 'None',
          email: email.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // Requirement: "and if it is already available then it will say already available"
        if (res.status === 400 && (data.detail || '').includes('already available')) {
          setAbhaStatus('already_available');
          setAbhaMessage(data.detail);
        }
        alert(data.detail || data.message || 'Registration failed');
        return;
      }

      alert(isHi ? 'रोगी सफलतापूर्वक पंजीकृत हुआ!' : 'Patient registered successfully!');
      localStorage.setItem('abhaId', data.patient.abha);
      try {
        localStorage.setItem('ayulekha_current_patient', JSON.stringify(data.patient));
      } catch (_) {}
      if (onNavigate) {
        onNavigate('dashboard', {
          patientId: data.patient.id,
          patient: data.patient,
          medicalHistory: [],
          email: data.patient.email || '',
        });
      }
    } catch (err) {
      console.error(err);
      alert(isHi ? 'पंजीकरण में त्रुटि' : 'Unable to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Listen Assist text-to-speech
  const handleListenAssist = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = isHi
        ? authMode === 'login'
          ? 'कृपया अपने 10-अंकीय मोबाइल नंबर या ABHA ID से लॉग इन करें।'
          : 'कृपया अपना मोबाइल नंबर सत्यापित करें, फिर अपना ABHA ID दर्ज करें।'
        : authMode === 'login'
        ? 'Please enter your 10-digit mobile number for SMS OTP or enter your ABHA ID to log in.'
        : 'Please verify your 10-digit mobile number, then provide your ABHA ID for citizen registration.';
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
            <div
              className="logo-icon"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--primary)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
              }}
            >
              +
            </div>
            <div className="brand-text">
              <span className="brand-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>
                AyuLekha
              </span>
              <span className="brand-sub font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {t('patientIdentity.brandSub', 'ABDM Citizen Identity & OTP Gateway')}
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
            ← {t('common.back', 'Portal')}
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
            <span>{t('patientIdentity.listenAssist', 'Listen Assist')}</span>
          </button>

          <div
            style={{
              background: '#E8F5E9',
              color: 'var(--success)',
              border: '1px solid rgba(46,125,50,0.2)',
              padding: '3px 10px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            {t('patientIdentity.priority', 'PRIORITY: OPD QUEUE')}
          </div>
        </div>
      </header>

      {/* ── CLINICAL TIMELINE PROGRESS ── */}
      <div
        className="identity-progress font-mono"
        style={{
          background: 'var(--bg-muted)',
          borderBottom: '1px solid var(--border)',
          padding: '10px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700 }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-block' }}></span>
          <span>STEP 01: CITIZEN IDENTIFICATION</span>
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
          {authMode === 'login' ? 'Existing Patient Access' : 'First-Time Registration'}
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="identity-main" style={{ maxWidth: '720px', margin: '32px auto', padding: '0 20px', width: '100%' }}>
        {/* Intro */}
        <div className="identity-intro" style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {authMode === 'login' ? 'Patient Portal Log In' : 'First-Time Patient Registration'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '580px', margin: '0 auto', lineHeight: 1.6 }}>
            {authMode === 'login'
              ? 'Log in using your 10-digit mobile number with SMS OTP, or look up with your ABHA ID.'
              : 'Verify your mobile number via SMS OTP, then link your ABHA ID to create your clinical record.'}
          </p>
        </div>

        {/* ── MODE SWITCHER (LOGIN vs REGISTER) ── */}
        <div
          style={{
            display: 'flex',
            background: '#F1F5F9',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid #E2E8F0',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setAuthMode('login');
              setMessage('');
              setDevOtpNotice('');
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: authMode === 'login' ? '#fff' : 'transparent',
              color: authMode === 'login' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'login' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            🔑 {isHi ? 'लॉग इन (मौजूदा रोगी)' : 'Log In (Existing Patient)'}
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthMode('register');
              setMessage('');
              setDevOtpNotice('');
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: authMode === 'register' ? '#fff' : 'transparent',
              color: authMode === 'register' ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: authMode === 'register' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
            }}
          >
            📝 {isHi ? 'नया पंजीकरण (पहली बार)' : 'Register (First Time)'}
          </button>
        </div>

        {/* Status / Dev Notices */}
        {devOtpNotice && (
          <div
            style={{
              background: '#E8F5E9',
              border: '1.5px solid #81C784',
              color: '#1B5E20',
              padding: '12px 16px',
              borderRadius: '10px',
              fontSize: '13px',
              marginBottom: '20px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '18px' }}>📱</span>
            <span>{devOtpNotice}</span>
          </div>
        )}

        {message && (
          <div
            style={{
              background: '#FFF8E1',
              border: '1px solid #FFE082',
              color: '#8D6E63',
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              fontWeight: 600,
            }}
          >
            ℹ️ {message}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW A: LOGIN MODE */}
        {/* ================================================================= */}
        {authMode === 'login' && (
          <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
            {/* Login method pills */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: loginMethod === 'phone' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: loginMethod === 'phone' ? 'rgba(26,92,56,0.06)' : '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: loginMethod === 'phone' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                📱 {isHi ? 'मोबाइल नंबर (OTP)' : 'Phone Number (OTP)'}
              </button>

              <button
                type="button"
                onClick={() => setLoginMethod('abha')}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: '8px',
                  border: loginMethod === 'abha' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: loginMethod === 'abha' ? 'rgba(26,92,56,0.06)' : '#fff',
                  fontWeight: 700,
                  fontSize: '13px',
                  color: loginMethod === 'abha' ? 'var(--primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                🪪 {isHi ? 'ABHA ID' : 'ABHA ID'}
              </button>
            </div>

            {/* Option 1: Login with Phone Number */}
            {loginMethod === 'phone' && (
              <div>
                {loginPhoneStep === 'input' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      REGISTERED MOBILE NUMBER / पंजीकृत मोबाइल नंबर
                    </label>
                    <div className="input-prefix" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="prefix" style={{ padding: '0 14px', fontWeight: 700, color: 'var(--text-muted)' }}>+91</span>
                      <input
                        type="tel"
                        className="fi"
                        placeholder="e.g. 9876543210"
                        maxLength={10}
                        value={loginPhone}
                        onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendLoginOtp(); }}
                        disabled={loading}
                        autoFocus
                      />
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '20px' }}>
                      A 6-digit OTP will be dispatched via SMS to your phone.
                    </span>

                    <button
                      type="button"
                      className="btn-primary"
                      style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                      onClick={handleSendLoginOtp}
                      disabled={loading || loginPhone.replace(/\D/g, '').length !== 10}
                    >
                      {loading ? (isHi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...') : (isHi ? 'OTP प्राप्त करें →' : 'Get OTP via SMS →')}
                    </button>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      ENTER 6-DIGIT OTP / 6-अंकीय ओटीपी दर्ज करें
                    </label>
                    <input
                      type="text"
                      className="fi font-mono"
                      placeholder="• • • • • •"
                      maxLength={6}
                      inputMode="numeric"
                      value={loginOtp}
                      onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyLoginOtp(); }}
                      disabled={loading}
                      style={{ fontSize: '24px', letterSpacing: '0.25em', textAlign: 'center', marginBottom: '8px' }}
                      autoFocus
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Sent to +91 {loginPhone}</span>
                      <button
                        type="button"
                        onClick={handleSendLoginOtp}
                        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                        disabled={loading}
                      >
                        {isHi ? 'पुनः भेजें' : 'Resend Code'}
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => { setLoginPhoneStep('input'); setLoginOtp(''); }}
                        disabled={loading}
                      >
                        ← {isHi ? 'वापस' : 'Back'}
                      </button>
                      <button
                        type="button"
                        className="btn-primary"
                        style={{ flex: 1, padding: '14px', fontSize: '15px' }}
                        onClick={handleVerifyLoginOtp}
                        disabled={loading || loginOtp.length !== 6}
                      >
                        {loading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'सत्यापित करें एवं लॉग इन करें →' : 'Verify & Log In →')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Option 2: Login with ABHA ID */}
            {loginMethod === 'abha' && (
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  14-DIGIT ABHA NUMBER / ABHA ID
                </label>
                <input
                  type="text"
                  className="fi"
                  placeholder="e.g. 91-4820-9921-3041 or 2510991000"
                  value={loginAbha}
                  onChange={(e) => setLoginAbha(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleLoginAbha(); }}
                  disabled={loading}
                  autoFocus
                  style={{ marginBottom: '8px' }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '20px' }}>
                  Enter your Ayushman Bharat Health Account number or registered UHID.
                </span>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                  onClick={handleLoginAbha}
                  disabled={loading || !loginAbha.trim()}
                >
                  {loading ? (isHi ? 'जांच हो रही है...' : 'Checking Record...') : (isHi ? 'रिकॉर्ड खोजें एवं लॉग इन करें →' : 'Find Health Record & Log In →')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW B: REGISTRATION MODE (FIRST TIME PATIENT) */}
        {/* ================================================================= */}
        {authMode === 'register' && (
          <div>
            {/* Registration Step Progress */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span style={{ color: regStep === 'phone' ? 'var(--primary)' : 'var(--text-muted)' }}>
                1. Mobile Phone
              </span>
              <span>→</span>
              <span style={{ color: regStep === 'otp' ? 'var(--primary)' : 'var(--text-muted)' }}>
                2. Verify OTP
              </span>
              <span>→</span>
              <span style={{ color: regStep === 'details' ? 'var(--primary)' : 'var(--text-muted)' }}>
                3. Enter ABHA ID & Details
              </span>
            </div>

            {/* Step 1: Mobile Phone Input */}
            {regStep === 'phone' && (
              <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  ENTER 10-DIGIT MOBILE NUMBER / मोबाइल नंबर *
                </label>
                <div className="input-prefix" style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="prefix" style={{ padding: '0 14px', fontWeight: 700, color: 'var(--text-muted)' }}>+91</span>
                  <input
                    type="tel"
                    className="fi"
                    placeholder="e.g. 9876543210"
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendRegOtp(); }}
                    disabled={loading}
                    autoFocus
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '20px' }}>
                  First, verify your mobile number to establish a secure clinical record link.
                </span>

                <button
                  type="button"
                  className="btn-primary"
                  style={{ width: '100%', padding: '14px', fontSize: '15px' }}
                  onClick={handleSendRegOtp}
                  disabled={loading || regPhone.replace(/\D/g, '').length !== 10}
                >
                  {loading ? (isHi ? 'OTP भेजा जा रहा है...' : 'Sending OTP...') : (isHi ? 'सत्यापन OTP भेजें →' : 'Send Verification OTP via SMS →')}
                </button>
              </div>
            )}

            {/* Step 2: Verify Phone OTP */}
            {regStep === 'otp' && (
              <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  ENTER 6-DIGIT VERIFICATION CODE / 6-अंकीय ओटीपी
                </label>
                <input
                  type="text"
                  className="fi font-mono"
                  placeholder="• • • • • •"
                  maxLength={6}
                  inputMode="numeric"
                  value={regOtp}
                  onChange={(e) => setRegOtp(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyRegOtp(); }}
                  disabled={loading}
                  style={{ fontSize: '24px', letterSpacing: '0.25em', textAlign: 'center', marginBottom: '8px' }}
                  autoFocus
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Sent to +91 {regPhone}</span>
                  <button
                    type="button"
                    onClick={handleSendRegOtp}
                    style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                    disabled={loading}
                  >
                    {isHi ? 'पुनः कोड भेजें' : 'Resend Code'}
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => { setRegStep('phone'); setRegOtp(''); }}
                    disabled={loading}
                  >
                    ← {isHi ? 'वापस' : 'Back'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ flex: 1, padding: '14px', fontSize: '15px' }}
                    onClick={handleVerifyRegOtp}
                    disabled={loading || regOtp.length !== 6}
                  >
                    {loading ? (isHi ? 'सत्यापित हो रहा है...' : 'Verifying...') : (isHi ? 'फोन सत्यापित करें एवं आगे बढ़ें →' : 'Verify Phone & Continue →')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Compulsory ABHA ID & Patient Details */}
            {regStep === 'details' && (
              <div className="card" style={{ padding: '32px', border: '1.5px solid var(--border)', borderRadius: '16px', background: '#fff' }}>
                <div style={{ background: '#E8F5E9', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '13px', color: '#1B5E20', fontWeight: 600 }}>
                  ✓ Phone Verified: +91 {regPhone}
                </div>

                {/* Requirement: "after entering if patient is registering first time then it should ask ABHA ID and if it is already available then it will say already available" */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    PATIENT ABHA ID / आयुष्मान भारत स्वास्थ्य खाता ID *
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      className="fi"
                      placeholder="e.g. 91-4820-9921-3041 or 2510991147"
                      value={regAbha}
                      onChange={(e) => {
                        setRegAbha(e.target.value);
                        setAbhaStatus(null);
                        setAbhaMessage('');
                      }}
                      onBlur={() => handleCheckAbhaAvailability(regAbha)}
                      disabled={loading}
                      autoFocus
                    />
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '0 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      onClick={() => handleCheckAbhaAvailability(regAbha)}
                      disabled={loading || !regAbha.trim()}
                    >
                      {abhaStatus === 'checking' ? 'Checking...' : 'Check Availability'}
                    </button>
                  </div>

                  {/* Already Available Warning Banner */}
                  {abhaStatus === 'already_available' && (
                    <div
                      style={{
                        background: '#FFF3E0',
                        border: '1.5px solid #FF9800',
                        borderRadius: '10px',
                        padding: '12px 16px',
                        marginTop: '10px',
                        color: '#E65100',
                        fontSize: '13px',
                        fontWeight: 600,
                      }}
                    >
                      <div>{abhaMessage}</div>
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setLoginMethod('abha');
                          setLoginAbha(regAbha);
                        }}
                        style={{
                          marginTop: '8px',
                          background: '#E65100',
                          color: '#fff',
                          border: 'none',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        ← {isHi ? 'लॉग इन पर स्विच करें' : 'Switch to Log In with this ABHA ID →'}
                      </button>
                    </div>
                  )}

                  {/* Available Badge */}
                  {abhaStatus === 'available' && (
                    <div style={{ color: '#2E7D32', fontSize: '12px', fontWeight: 700, marginTop: '6px' }}>
                      {abhaMessage}
                    </div>
                  )}
                </div>

                {/* Additional Clinical Demographics */}
                <div className="id-registration-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
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
                      placeholder="e.g. 28"
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

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      EMAIL (OPTIONAL) / ईमेल
                    </label>
                    <input
                      type="email"
                      className="fi"
                      placeholder="citizen@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      KNOWN ALLERGIES / ज्ञात एलर्जी
                    </label>
                    <input
                      type="text"
                      className="fi"
                      placeholder="e.g. Penicillin, Pollen, None"
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
                    onClick={() => setRegStep('phone')}
                    disabled={loading}
                  >
                    ← {isHi ? 'वापस' : 'Back'}
                  </button>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: '14px 28px', fontSize: '15px' }}
                    onClick={handleRegisterPatient}
                    disabled={loading || !regAbha.trim() || abhaStatus === 'already_available'}
                  >
                    {loading
                      ? (isHi ? 'पंजीकृत हो रहा है...' : 'Registering...')
                      : (isHi ? 'पंजीकरण पूर्ण करें एवं आगे बढ़ें →' : 'Complete Registration & Proceed →')}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ marginTop: 'auto', borderTop: '1px solid var(--border)', background: 'var(--bg-muted)', padding: '24px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <strong>AyuLekha Healthcare Gateway</strong> • DPDP Act 2023 & ABDM Compliant
          </div>
          <div>
            Emergency 108 / 1075 Toll-Free
          </div>
        </div>
      </footer>
    </div>
  );
}
