import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientDashboard.css';

export default function PatientDashboard({ onNavigate }) {
  const { language, toggleLanguage } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'AIIMS New Delhi',
    address: 'Ansari Nagar · 2.4 km',
    dept: 'General Medicine Dept'
  });

  const [appointment, setAppointment] = useState({
    status: 'CONFIRMED',
    date: 'Today, 15 Sept',
    time: 'Morning OPD 9:00–12:00'
  });

  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newRescheduleDate, setNewRescheduleDate] = useState(new Date().toISOString().split('T')[0]);

  const [selectedHospitalData, setSelectedHospitalData] = useState({
    name: 'AIIMS New Delhi',
    address: 'Ansari Nagar · 2.4 km away',
    dept: 'General Medicine Dept'
  });

  const hospitals = [
    {
      id: 1,
      name: 'AIIMS New Delhi',
      address: 'Ansari Nagar · 2.4 km away',
      dept: 'General Medicine Dept',
      tags: 'GEN. MEDICINE · CARDIOLOGY · PULMONOLOGY',
      status: 'Busy OPD / भीड़ अधिक · ~40m wait',
      statusColor: 'bg-secondary',
      searchStr: 'aiims new delhi ansari nagar 2.4 km cardiology pulmonology delhi ncr'
    },
    {
      id: 2,
      name: 'Safdarjung Hospital',
      address: 'Ring Road, Opposite AIIMS',
      distance: '3.1 km away',
      dept: 'General Medicine & OPD',
      tags: 'GEN. MEDICINE · ORTHOPEDICS · DERMATOLOGY',
      status: 'Moderate wait / सामान्य प्रतीक्षा · ~25m wait',
      statusColor: 'bg-on-tertiary-fixed-variant',
      searchStr: 'safdarjung hospital ring road opposite aiims 3.1 km orthopedics dermatology'
    },
    {
      id: 3,
      name: 'Dr. Ram Manohar Lohia Hospital (RML)',
      address: 'Baba Kharak Singh Marg, Connaught Place',
      distance: '5.8 km away',
      dept: 'Internal Medicine Dept',
      tags: 'GEN. MEDICINE · CARDIOLOGY · ENT',
      status: 'Light OPD / कम प्रतीक्षा · ~10m wait',
      statusColor: 'bg-on-tertiary-fixed-variant',
      searchStr: 'dr ram manohar lohia hospital rml baba kharak singh marg connaught place 5.8 km cardiology ent'
    },
    {
      id: 4,
      name: 'Lady Hardinge Medical College & Smt. S.K. Hospital',
      address: 'Connaught Place, New Delhi',
      distance: '6.4 km away',
      dept: 'Medicine & Clinical Services',
      tags: 'OB-GYN · PEDIATRICS · MEDICINE',
      status: 'Moderate wait / सामान्य प्रतीक्षा · ~20m wait',
      statusColor: 'bg-on-tertiary-fixed-variant',
      searchStr: 'lady hardinge medical college smt sk hospital connaught place new delhi 6.4 km ob-gyn pediatrics medicine'
    },
    {
      id: 5,
      name: 'Guru Teg Bahadur Hospital (GTB)',
      address: 'Dilshad Garden, Shahdara',
      distance: '12.2 km away',
      dept: 'General Medicine Unit',
      tags: 'GEN. MEDICINE · SURGERY · ORTHO',
      status: 'Light OPD / कम प्रतीक्षा · ~15m wait',
      statusColor: 'bg-on-tertiary-fixed-variant',
      searchStr: 'guru teg bahadur hospital gtb dilshad garden shahdara 12.2 km surgery ortho medicine'
    }
  ];

  const filteredHospitals = hospitals.filter(h => 
    h.searchStr.toLowerCase().includes(searchQuery.toLowerCase()) || 
    h.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleHospitalSelect = (h) => {
    setSelectedHospitalData(h);
  };

  const confirmHospital = () => {
    setHospitalInfo({
      name: selectedHospitalData.name,
      address: selectedHospitalData.address.replace(' away', ''),
      dept: selectedHospitalData.dept
    });
    setIsModalOpen(false);
  };

  // Close modal on escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="bg-surface text-on-surface flex flex-col min-h-screen relative pb-20 antialiased overflow-x-hidden">
      {/* BEGIN: MainHeader */}
      <header className="sticky top-0 z-30 bg-surface/95 backdrop-blur-sm border-b border-outline-variant px-6 lg:px-12 py-3.5" data-purpose="app-navigation-header">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
              <span className="text-primary font-bold text-2xl tracking-tight leading-none font-sans">AyuLeakha</span>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant hidden sm:block"></div>
            <button 
              className="flex items-center gap-1.5 text-xs text-primary font-mono hover:opacity-80 transition-opacity bg-surface-container border border-outline-variant/80 px-3 py-1.5 rounded-full" 
              onClick={() => setIsModalOpen(true)}
              type="button"
            >
              <span className="font-medium">{hospitalInfo.name}</span>
              <svg aria-hidden="true" className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button aria-label="Language Toggle" className="text-xs font-mono text-on-surface-variant px-2.5 py-1.5 rounded hover:bg-surface-container transition-colors border border-transparent hover:border-outline-variant" type="button" onClick={() => toggleLanguage(language === 'en' ? 'hi' : 'en')}>
              <span className="font-bold text-primary">{language === 'en' ? 'EN' : 'हिन्दी'}</span>
            </button>
            <button aria-label="Listen in audio" className="flex items-center gap-1.5 text-xs font-mono bg-surface-container px-3 py-1.5 rounded-full text-primary hover:bg-surface-container-highest transition-colors border border-outline-variant" type="button">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
              </svg>
              <span className="font-medium text-xs">सुनें / Listen</span>
            </button>
            <div className="w-9 h-9 rounded-full bg-surface-container text-primary border border-outline-variant flex items-center justify-center font-mono font-semibold text-xs tracking-wider shadow-sm">
              SD
            </div>
          </div>
        </div>
      </header>

      {/* BEGIN: MainContent */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        <section className="pb-6 border-b border-outline-variant flex flex-col md:flex-row md:items-end justify-between gap-4" data-purpose="patient-details-block">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs uppercase tracking-mono-label text-on-surface-variant font-semibold">
                YOUR DETAILS / आपकी जानकारी
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/80 text-on-tertiary-fixed-variant text-xs font-medium">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                </svg>
                <span>Registered / पंजीकृत</span>
              </span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-semibold text-primary-container tracking-tight">
              Namaste, Sunita
            </h1>
            <p className="font-mono text-xs md:text-sm text-on-surface-variant leading-relaxed">
              ABHA •••• 4417 &nbsp;·&nbsp; 54 YRS &nbsp;·&nbsp; FEMALE &nbsp;·&nbsp; +91 ••••• 82310 &nbsp;·&nbsp; AYL-8849
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-outline-variant rounded text-primary text-xs font-mono font-medium hover:bg-surface-container transition-colors inline-flex items-center gap-1.5" type="button">
              <span>Edit Profile / विवरण बदलें</span>
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <section className="p-5 bg-surface-container-low border border-outline-variant rounded space-y-3" data-purpose="hospital-facility-block">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-mono-label text-on-surface-variant font-medium">
                    HOSPITAL / अस्पताल
                  </p>
                  <button 
                    className="text-xs font-mono text-primary hover:underline" 
                    onClick={() => setIsModalOpen(true)}
                    type="button"
                  >
                    Change / बदलें
                  </button>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-primary leading-tight">
                    {hospitalInfo.name}
                  </h2>
                  <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                    {hospitalInfo.address}<br/><span className="text-on-surface font-medium">{hospitalInfo.dept}</span>
                  </p>
                </div>
              </section>

              <section className="p-5 bg-surface-container-low border border-outline-variant rounded space-y-3" data-purpose="presenting-complaint-block">
                <div className="flex items-center justify-between">
                  <p className="font-mono text-[11px] uppercase tracking-mono-label text-on-surface-variant font-medium">
                    COMPLAINT / समस्या
                  </p>
                  <span className="inline-flex items-center gap-1 text-on-tertiary-fixed-variant text-xs font-mono font-medium">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    </svg>
                    Done
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-on-surface leading-snug">
                    Chest heaviness for 3 days
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    तीन दिन से सीने में भारीपन
                  </p>
                </div>
                <button className="text-xs font-mono text-primary hover:underline pt-1 block" type="button">
                  Review details / देखें →
                </button>
              </section>
            </div>

            <section className={`p-5 bg-surface-container-lowest border border-outline-variant rounded space-y-4 ${appointment.status === 'CANCELLED' ? 'opacity-70' : ''}`} data-purpose="appointment-booking-block">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
                <p className="font-mono text-xs uppercase tracking-mono-label text-on-surface-variant font-medium">
                  APPOINTMENT DETAILS / अपॉइंटमेंट तय
                </p>
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 bg-surface-container rounded border border-outline-variant/60 ${appointment.status === 'CANCELLED' ? 'text-error' : 'text-primary'}`}>
                  {appointment.status === 'CONFIRMED' ? 'TODAY CONFIRMED' : appointment.status}
                </span>
              </div>
              <div className="divide-y divide-outline-variant/60">
                <div className="py-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-mono text-xs uppercase text-on-surface-variant w-32 shrink-0">DEPARTMENT</span>
                  <span className="font-medium text-primary text-right">General Medicine</span>
                </div>
                <div className="py-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-mono text-xs uppercase text-on-surface-variant w-32 shrink-0">DOCTOR</span>
                  <span className="font-medium text-primary text-right">Dr. Arvind Menon (Room 104)</span>
                </div>
                <div className="py-2 flex items-center justify-between gap-4 text-sm">
                  <span className="font-mono text-xs uppercase text-on-surface-variant w-32 shrink-0">SLOT &amp; TIME</span>
                  <span className="font-medium text-primary text-right">{appointment.date} · {appointment.time}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 pt-2">
                <button 
                  className="px-4 py-2 text-primary font-medium text-xs font-mono border border-primary/30 bg-primary-container/20 rounded hover:bg-primary-container/40 transition-colors" 
                  type="button"
                  onClick={() => onNavigate && onNavigate('new-appointment')}
                >
                  Schedule New Appointment
                </button>
              </div>

              {appointment.status !== 'CANCELLED' && (
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button 
                    className="px-4 py-2 text-primary font-medium text-xs font-mono border border-outline-variant bg-surface-container/70 rounded hover:bg-surface-container transition-colors" 
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(true)}
                  >
                    Reschedule / बदलें
                  </button>
                  <button 
                    className="px-4 py-2 text-error font-medium text-xs font-mono border border-error/30 bg-error-container/30 rounded hover:bg-error-container/60 transition-colors" 
                    type="button"
                    onClick={() => {
                      if (window.confirm("Are you sure you want to cancel this appointment?")) {
                        setAppointment({...appointment, status: 'CANCELLED'});
                      }
                    }}
                  >
                    Cancel / रद्द करें
                  </button>
                </div>
              )}
            </section>

            <section className="p-5 bg-surface-container-lowest border border-outline-variant rounded space-y-5" data-purpose="medicine-history-block">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2.5">
                <p className="font-mono text-xs uppercase tracking-mono-label text-on-surface-variant font-medium">
                  MEDICINE &amp; HISTORY / दवाइयां और पुराना इलाज
                </p>
                <div className="flex items-center gap-3">
                  <button className="text-xs font-mono text-primary hover:underline" type="button">
                    + Add report / जोड़ें
                  </button>
                  <span className="text-outline-variant">|</span>
                  <button className="text-xs font-mono text-primary hover:underline" type="button">
                    View all / सब देखें
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-3">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                    CURRENT MEDICINES / वर्तमान दवाइयां
                  </p>
                  <div className="space-y-3 pl-2 border-l-2 border-primary-container">
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Metformin 500mg</p>
                      <p className="text-xs text-on-surface-variant">twice a day · after food / दिन में दो बार</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-on-surface">Amlodipine 5mg</p>
                      <p className="text-xs text-on-surface-variant">once a day · morning / दिन में एक बार · सुबह</p>
                    </div>
                  </div>
                </div>
                <div className="bg-surface-container-low p-4 rounded space-y-2 text-xs border border-outline-variant/60 flex flex-col justify-center">
                  <div>
                    <span className="font-mono uppercase text-on-surface-variant block text-[10px] font-semibold">Known conditions:</span>
                    <span className="font-medium text-on-surface text-xs">Type 2 diabetes, High blood pressure / टाइप 2 डायबिटीज़, हाई बीपी</span>
                  </div>
                  <div className="pt-1 border-t border-outline-variant/40">
                    <span className="font-mono uppercase text-on-surface-variant block text-[10px] font-semibold">Allergies / एलर्जी:</span>
                    <span className="text-on-surface-variant text-xs">None known / कोई ज्ञात एलर्जी नहीं</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-outline-variant/60">
                <p className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant font-medium">
                  PAST RECORDS / पुराने रिकॉर्ड
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3 bg-surface-container/50 border border-outline-variant/60 rounded flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">AIIMS Pulmonology</p>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">FROM AIIMS</span>
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant mt-2 block">14 OCT 2024</span>
                  </div>
                  <div className="p-3 bg-surface-container/50 border border-outline-variant/60 rounded flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">Chest X-Ray PA view</p>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">UPLOADED BY YOU</span>
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant mt-2 block">28 AUG 2024</span>
                  </div>
                  <div className="p-3 bg-surface-container/50 border border-outline-variant/60 rounded flex flex-col justify-between">
                    <div>
                      <p className="text-xs font-semibold text-on-surface">CBC &amp; Lipid profile</p>
                      <span className="font-mono text-[10px] uppercase text-on-surface-variant">UPLOADED BY YOU</span>
                    </div>
                    <span className="font-mono text-[11px] text-on-surface-variant mt-2 block">12 JAN 2024</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="p-5 bg-surface-container-low/70 border border-outline-variant rounded space-y-4" data-purpose="doctor-profile-block">
              <div className="flex items-center justify-between border-b border-outline-variant/60 pb-2">
                <p className="font-mono text-xs uppercase tracking-mono-label text-on-surface-variant font-medium">
                  KNOW YOUR DOCTOR / अपने डॉक्टर को जानिए
                </p>
                <span className="font-mono text-[11px] text-on-surface-variant">OPD Mon–Sat · 9:00–12:00</span>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img alt="Dr. Arvind Menon" className="w-20 h-20 rounded-full object-cover border border-outline-variant shrink-0 shadow-sm" src="https://lh3.googleusercontent.com/aida/AEtjO1WBtyMtlh2ZohQIjKV_0Vatsyi4WayJtGh-H3xdhlzsiHW39kBbD4_jfOXxM3_h6TfXos-6fSrflVWarp-Ncl7hQ2m0054DaJ1TC7JZd0YnPijIHktk1XskSYssewJOe91OAIdzZV7AXCBJ0Ve65F-P8DST5jii3srP2Fx93FCG1ARFbAxZR8akbbccSRhAe4zbIG_E6Qeot34EiS7JlaG4ThjvMnLDsnqYY9I1F562u1-oTEZ_0BJNlR4" />
                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-primary leading-tight">Dr. Arvind Menon</h4>
                  <p className="text-sm text-on-surface font-medium">General Medicine · 18 years clinical experience</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-secondary font-medium">
                    SPEAKS HINDI · ENGLISH · MALAYALAM
                  </p>
                </div>
              </div>
              <div className="bg-surface-container-lowest/90 p-3.5 rounded text-xs text-on-surface border border-outline-variant/60 leading-relaxed">
                <p className="font-medium text-on-surface">
                  General Medicine looks after everyday illnesses, long-term conditions like diabetes and blood pressure, and problems that don't fit one specialty.
                </p>
                <p className="text-on-surface-variant text-[11px] mt-1">
                  सामान्य चिकित्सा रोज़मर्रा की बीमारियों, मधुमेह और बीपी जैसी दीर्घकालिक समस्याओं की देखभाल करती है।
                </p>
              </div>
            </section>
          </div>

          <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
            <section className="space-y-3" data-purpose="token-waiting-hero-block">
              <div className="flex items-center justify-between px-1">
                <p className="font-mono text-xs uppercase tracking-mono-label text-on-surface-variant font-medium">
                  LIVE QUEUE STATUS / प्रतीक्षा स्थिति
                </p>
                <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-on-tertiary-fixed-variant animate-pulse"></span>
                  UPDATED 10:14 AM
                </span>
              </div>
              <div className="bg-surface-container border border-outline-variant rounded p-6 shadow-sm space-y-6">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wider text-on-surface-variant block font-medium">
                      YOUR TOKEN NUMBER / आपका टोकन
                    </span>
                    <div className="text-6xl md:text-7xl font-bold text-primary leading-none mt-2 tracking-tight">
                      B-42
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-primary text-on-primary font-mono text-xs font-semibold rounded">
                      ROOM 104
                    </span>
                    <span className="block text-xs font-mono text-on-surface-variant mt-1">Ground Floor</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/80">
                  <div className="bg-surface-container-lowest/80 p-3.5 rounded border border-outline-variant/50">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block">NOW SERVING</span>
                    <span className="text-3xl font-bold text-primary block mt-0.5">B-37</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">5 tokens away</span>
                  </div>
                  <div className="bg-surface-container-lowest/80 p-3.5 rounded border border-outline-variant/50">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant block">PEOPLE AHEAD</span>
                    <span className="text-3xl font-bold text-primary block mt-0.5">5</span>
                    <span className="text-[11px] text-on-surface-variant font-mono">patients waiting</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-outline-variant/80 space-y-2.5">
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-on-surface-variant font-medium">ESTIMATED WAIT TIME</span>
                    <span className="font-mono text-xs text-on-surface-variant">~5 min/patient</span>
                  </div>
                  <div className="text-xl font-medium text-on-surface">
                    about 25 minutes / लगभग 25 मिनट
                  </div>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container-highest border border-outline-variant text-xs font-medium text-on-surface-variant">
                    <svg className="w-4 h-4 text-on-surface-variant shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                    </svg>
                    <span>Moderate wait / सामान्य प्रतीक्षा दर</span>
                  </div>
                </div>
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant/80 rounded p-4 text-xs space-y-2 text-on-surface-variant">
                <p className="font-medium text-on-surface flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                  Important OPD Instructions
                </p>
                <p className="leading-relaxed">
                  Please remain in waiting corridor 1-A near OPD 104 when token reaches B-40. Keep your ABHA number and previous records handy.
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Persistent Emergency Bar */}
      <footer className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-sm border-t border-outline-variant px-6 lg:px-12 py-3 z-30 shadow-md" data-purpose="persistent-emergency-footer">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-error shrink-0"></span>
            <div className="text-xs md:text-sm font-medium text-error flex items-center gap-2">
              <span>Feeling worse? Get urgent help now</span>
              <span className="text-xs text-on-surface-variant hidden sm:inline">/ आपातकालीन सहायता केंद्र</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-on-surface-variant hidden md:inline">AIIMS Trauma / Emergency Desk:</span>
            <a className="inline-flex items-center px-4 py-1.5 font-mono text-xs md:text-sm font-bold text-error border border-error/40 rounded bg-error-container/40 hover:bg-error-container/70 transition-colors shadow-sm" href="tel:01126588500">
              011-26588500 / 102
            </a>
          </div>
        </div>
      </footer>

      {/* Hospital Selector Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-primary/40 transition-opacity duration-200" style={{backgroundColor: 'rgba(32, 25, 35, 0.45)'}}>
          <div className="relative w-full max-w-[580px] max-h-[90vh] flex flex-col bg-surface rounded border border-outline-variant shadow-xl overflow-hidden transform transition-all duration-200 scale-100 opacity-100" style={{backgroundColor: 'rgb(255, 247, 252)', opacity: 1, boxShadow: 'rgba(32, 25, 35, 0.25) 0px 25px 50px -12px'}}>
            <div className="p-6 pb-4 border-b border-outline-variant bg-surface-container-lowest flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block"></span>
                  <span className="font-mono text-[11px] uppercase tracking-mono-label text-on-surface-variant font-medium">HOSPITAL SELECTOR / अस्पताल चयन</span>
                </div>
                <h2 className="text-2xl font-semibold text-primary leading-tight">Where are you being seen today?</h2>
                <p className="text-xs text-on-surface-variant">आज आप किस अस्पताल में दिखा रहे हैं?</p>
              </div>
              <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors border border-transparent hover:border-outline-variant shrink-0" onClick={() => setIsModalOpen(false)} type="button">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 pb-3 space-y-3 bg-surface-container-low/40 border-b border-outline-variant/60">
              <div className="relative flex items-center">
                <div className="absolute left-3.5 flex items-center pointer-events-none text-on-surface-variant">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                  </svg>
                </div>
                <input 
                  className="w-full pl-10 pr-28 h-12 text-sm bg-surface-container-lowest border border-outline-variant rounded text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary font-sans" 
                  placeholder="Search hospital, city or pin / अस्पताल या शहर खोजें" 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-2 px-2.5 py-1 bg-surface-container rounded border border-outline-variant/60 font-mono text-[10px] text-on-surface-variant pointer-events-none flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-on-tertiary-fixed-variant"></span>Near you · Delhi NCR
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 px-1">
                <span className="font-mono text-[10px] uppercase tracking-mono-label text-on-surface-variant font-medium">GOVERNMENT &amp; EMPANELLED HOSPITALS / सरकारी एवं पैनलबद्ध</span>
                <span className="font-mono text-[10px] text-on-surface-variant">{filteredHospitals.length} Available</span>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/60 bg-surface-container-lowest px-6">
              {filteredHospitals.map((h) => {
                const isSelected = selectedHospitalData.id === h.id;
                return (
                  <label 
                    key={h.id}
                    className={`flex items-start gap-3.5 py-4 cursor-pointer -mx-6 px-6 border-l-4 transition-colors ${isSelected ? 'bg-surface-container-low/50 border-primary' : 'hover:bg-surface-container-low/30 border-transparent'}`}
                    onClick={() => handleHospitalSelect(h)}
                  >
                    <input 
                      className="mt-1 text-primary focus:ring-0 w-4 h-4 border-outline" 
                      name="selected-hospital" 
                      type="radio" 
                      checked={isSelected}
                      readOnly
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className={`text-base font-semibold leading-tight ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{h.name}</h3>
                        {isSelected ? (
                          <span className="font-mono text-xs font-semibold text-primary px-2 py-0.5 rounded bg-surface-container border border-outline-variant/80">SELECTED</span>
                        ) : h.distance ? (
                          <span className="font-mono text-[11px] text-on-surface-variant">{h.distance}</span>
                        ) : null}
                      </div>
                      <p className="text-xs text-on-surface-variant leading-relaxed">
                        {h.address.replace(' away', '')} {isSelected && h.address.includes('away') && <span className="font-medium text-on-surface">· {h.address.split('·')[1]?.trim()}</span>}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="font-mono text-[10px] uppercase tracking-wider text-secondary font-medium">{h.tags}</span>
                      </div>
                      <div className="pt-1.5 flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <span className={`w-2 h-2 rounded-full ${h.statusColor} shrink-0`}></span>
                        <span className="font-mono text-[11px]">{h.status}</span>
                      </div>
                    </div>
                  </label>
                )
              })}
              {filteredHospitals.length === 0 && (
                <div className="py-12 text-center text-on-surface-variant text-sm font-mono">
                  No hospitals match your search. / कोई अस्पताल नहीं मिला।
                </div>
              )}
            </div>
            <div className="p-5 border-t border-outline-variant bg-surface-container-lowest space-y-2.5">
              <button 
                className="w-full h-14 bg-primary text-on-primary font-medium text-sm font-mono rounded hover:bg-primary-container transition-colors shadow-sm flex items-center justify-center gap-2" 
                onClick={confirmHospital}
                type="button"
              >
                <span>Confirm hospital / अस्पताल की पुष्टि करें</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
              <p className="text-center text-[11px] text-on-surface-variant leading-snug">
                You can change this anytime before your doctor consults. / परामर्श से पहले इसे कभी भी बदल सकते हैं।
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {isRescheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm bg-primary/40 transition-opacity duration-200" style={{backgroundColor: 'rgba(32, 25, 35, 0.45)'}}>
          <div className="relative w-full max-w-[400px] flex flex-col bg-surface rounded border border-outline-variant shadow-xl overflow-hidden transform transition-all duration-200 scale-100 opacity-100" style={{backgroundColor: 'rgb(255, 247, 252)'}}>
            <div className="p-6 pb-4 border-b border-outline-variant bg-surface-container-lowest flex items-start justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold text-primary leading-tight">Reschedule Appointment</h2>
                <p className="text-xs text-on-surface-variant">अपॉइंटमेंट का समय बदलें</p>
              </div>
              <button className="p-1.5 rounded hover:bg-surface-container text-on-surface-variant hover:text-primary transition-colors border border-transparent hover:border-outline-variant shrink-0" onClick={() => setIsRescheduleModalOpen(false)} type="button">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"></path>
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-4 bg-surface-container-lowest">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant mb-2">New Date</label>
                <input 
                  type="date" 
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full h-12 px-3 text-sm bg-surface border border-outline-variant rounded text-on-surface focus:outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="p-5 border-t border-outline-variant bg-surface-container-low flex justify-end gap-3">
              <button 
                className="px-4 py-2 text-on-surface-variant font-medium text-sm border border-outline-variant bg-surface rounded hover:bg-surface-container transition-colors"
                onClick={() => setIsRescheduleModalOpen(false)}
                type="button"
              >
                Cancel
              </button>
              <button 
                className="px-4 py-2 bg-primary text-on-primary font-medium text-sm rounded hover:bg-primary-container transition-colors"
                onClick={() => {
                  setAppointment({...appointment, status: 'RESCHEDULED', date: newRescheduleDate});
                  setIsRescheduleModalOpen(false);
                }}
                type="button"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
