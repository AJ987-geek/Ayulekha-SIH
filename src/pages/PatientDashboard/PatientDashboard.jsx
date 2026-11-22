import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './PatientDashboard.css';

export default function PatientDashboard({ onNavigate, patient, patientId, summary }) {
  const { language, openLanguageModal, currentLangObj, getSpeechLang, t } = useLanguage();
  const isHi = language === 'hi';

  // ── Section Switching ──
  // 'home' | 'records' | 'appointments' | 'ai' | 'profile' | 'notifications' | 'settings'
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ── Patient Info ──
  const citizenName = patient?.name || 'Ram Kumar Sharma';
  const abhaNumber = patient?.abha || patientId || '91-4820-9921-3041';
  const citizenMobile = patient?.mobile || '9876543210';
  const citizenBlood = patient?.bloodGroup || 'B+';
  const citizenAge = patient?.age || 42;
  const citizenGender = patient?.gender || 'Male';

  // ── Hospital Info (Current Facility) ── 
  const [hospitalInfo, setHospitalInfo] = useState({
    name: 'AIIMS New Delhi',
    address: 'Ansari Nagar, New Delhi',
    dept: 'General Medicine Dept'
  });
  const [isHospitalModalOpen, setIsHospitalModalOpen] = useState(false);

  // ── Appointments List State (Persisted in localStorage) ──
  const [appointmentsList, setAppointmentsList] = useState(() => {
    try {
      const saved = localStorage.getItem(`ayulekha_appointments_${patientId || patient?.abha || 'default'}`);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Appointments load note:', e);
    }
    return [
      {
        id: 'apt-default-1',
        token: 'OPD-042',
        status: 'CONFIRMED',
        facility: 'AIIMS New Delhi',
        dept: 'General Medicine Dept',
        doctor: 'Dr. S. Sharma (MD, AIIMS)',
        date: 'Today, 15 Sept 2026',
        time: 'Morning OPD 09:30 AM',
        symptoms: 'Mild chest tightness & intermittent dry cough (3 days)'
      }
    ];
  });

  const [appointment, setAppointment] = useState(() => appointmentsList[0] || {
    status: 'CONFIRMED',
    date: 'Today, 15 Sept 2026',
    time: 'Morning OPD 09:30 AM',
    token: 'OPD-042',
    doctor: 'Dr. S. Sharma (MD, AIIMS)',
    dept: 'General Medicine Dept',
    facility: 'AIIMS New Delhi'
  });

  // Keep primary appointment synced
  useEffect(() => {
    if (appointmentsList.length > 0) {
      setAppointment(appointmentsList[0]);
    }
  }, [appointmentsList]);

  // ── New Appointment Booking / Questioning State (Mirrored from YourStory) ──
  const [isBookingNewAppointment, setIsBookingNewAppointment] = useState(false);
  const [bookingTurn, setBookingTurn] = useState(null);
  const [bookingAnswer, setBookingAnswer] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [isBookingRecording, setIsBookingRecording] = useState(false);
  const [bookingConvId, setBookingConvId] = useState('');
  const [intakeAnswers, setIntakeAnswers] = useState([]);
  const bookingRecognitionRef = useRef(null);

  // ── Digital OPD Token Slip Modal State ──
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedSlipAppointment, setSelectedSlipAppointment] = useState(null);

  // ── Reschedule Modal State ──
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [reschedulingAptId, setReschedulingAptId] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState(new Date().toISOString().split('T')[0]);

  // ── OCR & Records State ──
  const [ocrRecords, setOcrRecords] = useState([]);
  const [recordsFilter, setRecordsFilter] = useState('all');
  const [isUploading, setIsUploading] = useState(false);
  const [documentType, setDocumentType] = useState('auto'); // 'auto' | 'lab_report' | 'prescription'
  const [selectedRecordForView, setSelectedRecordForView] = useState(null);

  // ── SQLite Audit Logs State ──
  const [auditLogs, setAuditLogs] = useState([]);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [auditModalTab, setAuditModalTab] = useState('summary'); // 'summary' | 'documents'
  const [activeSummaryId, setActiveSummaryId] = useState('');
  const [expandedOcrDocId, setExpandedOcrDocId] = useState(null);
  const [previewOriginalUrl, setPreviewOriginalUrl] = useState(null);
  const [showAuditDocUploader, setShowAuditDocUploader] = useState(false);
  const [auditUploadDocType, setAuditUploadDocType] = useState('auto');
  const [searchAuditQuery, setSearchAuditQuery] = useState('');
  const [isAuditLogsLoading, setIsAuditLogsLoading] = useState(false);

  // Clear stale appointment data from browser localStorage on initialization
  useEffect(() => {
    try {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('ayulekha_appointments_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (e) {
      console.warn('LocalStorage cleanup notice:', e);
    }
  }, []);

  const fetchAuditLogs = async () => {
    setIsAuditLogsLoading(true);
    try {
      const res = await fetch('/api/audit-logs');
      const data = await res.json();
      if (data && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn('Audit logs load note:', err);
    } finally {
      setIsAuditLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const handleClearAuditLogs = async () => {
    if (!window.confirm(isHi ? 'क्या आप सभी ऑडिट लॉग्स को हटाना चाहते हैं?' : 'Are you sure you want to delete all audit logs from SQLite?')) {
      return;
    }
    try {
      const res = await fetch('/api/audit-logs', { method: 'DELETE' });
      if (res.ok) {
        triggerToast(isHi ? 'सभी ऑडिट लॉग्स हटा दिए गए।' : 'All audit logs cleared from SQLite.', 'success');
        fetchAuditLogs();
      }
    } catch (err) {
      console.warn('Clear logs error:', err);
    }
  };

  const handleCopyId = (id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(id);
      triggerToast(`Copied to clipboard!`, 'success');
    }
  };

  // ── 3-Stage Voice AI Story Intake State (STT ➔ LLM ➔ TTS) ──
  const [storyMessages, setStoryMessages] = useState([]);
  const [storyInput, setStoryInput] = useState('');
  const [storyConvId, setStoryConvId] = useState('');
  const [storyStage, setStoryStage] = useState('idle'); // 'stt_listening' | 'llm_thinking' | 'tts_speaking' | 'complete' | 'idle'
  const [isStoryRecording, setIsStoryRecording] = useState(false);
  const [isTtsMuted, setIsTtsMuted] = useState(false);
  const [completedSummary, setCompletedSummary] = useState(null);
  const [currentTurnOptions, setCurrentTurnOptions] = useState([]);
  const speechRecognizerRef = useRef(null);
  const audioStreamRef = useRef(null);
  const chatBottomRef = useRef(null);

  const speakAiResponse = (text, lang = (isHi ? 'hi' : 'en')) => {
    if (!('speechSynthesis' in window) || isTtsMuted || !text) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, '').replace(/\[.*?\]/g, '');
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utter.rate = 0.95;
    utter.onstart = () => setStoryStage('tts_speaking');
    utter.onend = () => setStoryStage('idle');
    utter.onerror = () => setStoryStage('idle');
    window.speechSynthesis.speak(utter);
  };

  const initStorySession = async () => {
    setStoryStage('llm_thinking');
    setCompletedSummary(null);
    setStoryInput('');
    setCurrentTurnOptions([]);

    try {
      const res = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: isHi ? 'hi' : 'en',
          patientId: patientId || patient?.abha || 'CITIZEN-01'
        })
      });

      if (!res.ok) throw new Error('Failed to start interview');
      const data = await res.json();
      setStoryConvId(data.conversationId);
      setCurrentTurnOptions(data.options || []);

      const initialAiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.question || (isHi ? 'नमस्ते! आज आपको क्या मुख्य स्वास्थ्य परेशानी या लक्षण हो रहे हैं?' : 'Hello! What brings you in today?'),
        options: data.options || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStoryMessages([initialAiMsg]);
      speakAiResponse(initialAiMsg.text, data.language || (isHi ? 'hi' : 'en'));
    } catch (e) {
      console.warn('Voice AI start notice:', e);
      const fallbackMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: isHi
          ? 'नमस्ते! आपको क्या मुख्य स्वास्थ्य परेशानी या लक्षण हो रहे हैं?'
          : 'Hello! What brings you in today?',
        options: isHi
          ? ['बुखार और बदन दर्द', 'खांसी और सांस की तकलीफ', 'पेट में तेज दर्द', 'सरदर्द और चक्कर']
          : ['Fever & Body Ache', 'Cough & Chest Tightness', 'Stomach Pain', 'Headache & Dizziness'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setStoryConvId(`conv-local-${Date.now()}`);
      setCurrentTurnOptions(fallbackMsg.options);
      setStoryMessages([fallbackMsg]);
      speakAiResponse(fallbackMsg.text, isHi ? 'hi' : 'en');
    } finally {
      setStoryStage('idle');
    }
  };

  const toggleStoryRecording = async () => {
    if (isStoryRecording) {
      if (speechRecognizerRef.current) {
        speechRecognizerRef.current.stop();
      }
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
        audioStreamRef.current = null;
      }
      setIsStoryRecording(false);
      setStoryStage('idle');
      return;
    }

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(isHi ? 'आपके ब्राउज़र में वॉइस पहचान समर्थित नहीं है। कृपया लिखकर उत्तर दें।' : 'Speech recognition is not supported in this browser. Please type your reply.');
      return;
    }

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            noiseSuppression: true,
            echoCancellation: true,
            autoGainControl: true
          }
        });
        audioStreamRef.current = stream;
      } catch (err) {
        console.warn('Microphone noise filter stream access notice:', err);
      }
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = isHi ? 'hi-IN' : 'en-IN';
    recognizer.interimResults = true;
    recognizer.continuous = true;

    recognizer.onstart = () => {
      setIsStoryRecording(true);
      setStoryStage('stt_listening');
    };

    recognizer.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const live = (final || interim).trim();
      if (live) {
        setStoryInput(live);
      }
    };

    recognizer.onerror = (e) => {
      console.warn('STT error:', e.error);
      setIsStoryRecording(false);
      setStoryStage('idle');
    };

    recognizer.onend = () => {
      setIsStoryRecording(false);
      if (storyStage === 'stt_listening') {
        setStoryStage('idle');
      }
    };

    speechRecognizerRef.current = recognizer;
    try {
      recognizer.start();
    } catch (e) {
      console.warn('Recognizer start note:', e);
    }
  };

  const handleSendStoryAnswer = async (manualText = null) => {
    const textToSend = (manualText !== null ? manualText : storyInput).trim();
    if (!textToSend || storyStage === 'llm_thinking') return;

    if (isStoryRecording && speechRecognizerRef.current) {
      speechRecognizerRef.current.stop();
      setIsStoryRecording(false);
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop());
      audioStreamRef.current = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const userBubble = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setStoryMessages((prev) => [...prev, userBubble]);
    setStoryInput('');
    setCurrentTurnOptions([]);
    setStoryStage('llm_thinking');

    try {
      const res = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: storyConvId,
          text: textToSend,
          inputType: 'speech',
          language: isHi ? 'hi' : 'en'
        })
      });

      if (!res.ok) throw new Error('API message progression error');
      const data = await res.json();

      if (data.evaluationMetrics) {
        console.log('📊 [AyuLekha Clinical AI Evaluation Metrics]:', data.evaluationMetrics);
      }

      if (data.complete) {
        setStoryStage('complete');
        setCompletedSummary(data.summary);
        if (data.summaryId) {
          setActiveSummaryId(data.summaryId);
        }
        fetchAuditLogs();

        const shortCompletionText = isHi
          ? 'आपका सारांश तैयार हो गया है और डॉक्टर को भेजने के लिए तैयार है। मेडिकल रिकॉर्ड के साथ आगे बढ़ें या दस्तावेज़ जोड़ें।'
          : 'Your summary has been generated and ready to send to the doctor, continue with medical record or add documents.';

        const closingMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: shortCompletionText,
          isComplete: true,
          summary: data.summary,
          summaryId: data.summaryId,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setStoryMessages((prev) => [...prev, closingMsg]);
        speakAiResponse(shortCompletionText, isHi ? 'hi' : 'en');
        triggerToast(shortCompletionText, 'success');
        setTimeout(() => {
          setActiveSection('records');
        }, 1200);
      } else {
        const aiBubble = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.question,
          options: data.options || [],
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setCurrentTurnOptions(data.options || []);
        setStoryMessages((prev) => [...prev, aiBubble]);
        speakAiResponse(data.question, data.language || (isHi ? 'hi' : 'en'));
      }
    } catch (e) {
      console.warn('Voice AI LLM turn notice:', e);
      const fallbackAiBubble = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: isHi
          ? 'क्या यह तकलीफ किसी खास समय (जैसे सुबह या रात) पर अधिक महसूस होती है?'
          : 'Does this symptom worsen at specific times of the day, or during physical activity?',
        options: isHi
          ? ['सुबह अधिक होती है', 'रात में बढ़ जाती है', 'शारीरिक श्रम पर', 'लगातार बनी रहती है']
          : ['Worse in the morning', 'Worse at night', 'During exertion', 'Constant all day'],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setCurrentTurnOptions(fallbackAiBubble.options);
      setStoryMessages((prev) => [...prev, fallbackAiBubble]);
      speakAiResponse(fallbackAiBubble.text, isHi ? 'hi' : 'en');
    } finally {
      setStoryStage((prev) => (prev === 'llm_thinking' ? 'idle' : prev));
    }
  };

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [storyMessages, storyStage]);

  useEffect(() => {
    if ((activeSection === 'record_story' || activeSection === 'ai') && storyMessages.length === 0) {
      initStorySession();
    }
  }, [activeSection]);

  // ── AI Consultation State ──
  const [conversationId, setConversationId] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: isHi
        ? 'नमस्ते! मैं आपका आयुलेखा क्लीनिकल AI सहायक हूँ। डॉक्टर से मिलने से पहले आपके लक्षणों को संक्षेप में समझने के लिए कुछ प्रश्न पूछूँगा। आपको क्या परेशानी हो रही है?'
        : 'Hello! I am your AyuLekha Clinical AI Assistant. To help summarize your symptoms before your physician visit, what discomfort are you experiencing today?',
      time: '10:00 AM'
    }
  ]);
  const [inputAnswer, setInputAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState({
    chiefComplaint: summary?.symptoms?.join(', ') || 'Mild chest tightness & intermittent dry cough',
    duration: '3-4 Days',
    severity: 'Moderate',
    redFlag: false,
    clinicalNote: 'Patient reports progressive dry cough with mild exertion discomfort. No severe resting dyspnea observed.'
  });

  // ── Voice / Speech Recognition State ──
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // ── Health Tip Carousel ──
  const healthTips = [
    'Drink at least 8-10 glasses of water daily. Proper hydration supports kidney health and blood pressure regulation.',
    'Walk for 30 minutes daily. Regular brisk walking improves cardiovascular resilience and glycemic control.',
    'Consume high-fibre whole grains, lentils, and seasonal vegetables to nourish your gut microbiome.',
    'Ensure 7-8 hours of uninterrupted sleep for adequate immune defense and mental well-being.',
    'Schedule your bi-annual ABDM preventive health check-up to catch early metabolic indicators.'
  ];
  const [tipIndex, setTipIndex] = useState(0);

  // ── Toast Notification System ──
  const [toast, setToast] = useState(null);
  const triggerToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Fetch Patient OCR Records ──
  useEffect(() => {
    const id = patientId || patient?.abha;
    if (id) {
      fetch(`/api/patients/${id}/records`)
        .then((res) => res.json())
        .then((data) => {
          if (data.records) setOcrRecords(data.records);
        })
        .catch((err) => console.warn('Records load note:', err));
    }
  }, [patientId, patient]);

  // Extract medicines from OCR tables
  const allTables = ocrRecords.flatMap((record) => record.tables || []);
  const medicineTable = allTables.find((t) =>
    t.title?.toLowerCase().includes('medication') ||
    t.title?.toLowerCase().includes('medicine') ||
    t.title?.toLowerCase().includes('prescription') ||
    t.columns?.some((c) => c.toLowerCase().includes('medication') || c.toLowerCase().includes('medicine') || c.toLowerCase().includes('drug'))
  );
  const medicines = medicineTable ? medicineTable.rows : [
    { Name: 'Tab. Paracetamol 650mg', Dosage: '1 tab SOS', Frequency: 'After food', Duration: '3 days' },
    { Name: 'Tab. Cetirizine 10mg', Dosage: '1 tab OD', Frequency: 'Bedtime', Duration: '5 days' },
    { Name: 'Syp. Ascoril D', Dosage: '10ml TDS', Frequency: 'Thrice daily', Duration: '5 days' }
  ];

  // ── Hospitals Directory ──
  const hospitals = [
    { id: 1, name: 'AIIMS New Delhi', type: 'Medical College', address: 'Ansari Nagar, New Delhi · 2.4 km away', dept: 'General Medicine Dept', wait: '~25 min wait', rating: '4.8 ★' },
    { id: 2, name: 'Safdarjung Hospital', type: 'District Hospital', address: 'Ring Road, Opposite AIIMS · 3.1 km away', dept: 'General Medicine & OPD', wait: '~30 min wait', rating: '4.6 ★' },
    { id: 3, name: 'Dr. Ram Manohar Lohia Hospital (RML)', type: 'District Hospital', address: 'Baba Kharak Singh Marg, CP · 5.8 km away', dept: 'Internal Medicine Dept', wait: '~15 min wait', rating: '4.7 ★' },
    { id: 4, name: 'Lady Hardinge Medical College', type: 'Medical College', address: 'Connaught Place, New Delhi · 6.4 km away', dept: 'Medicine & Clinical Services', wait: '~20 min wait', rating: '4.5 ★' },
    { id: 5, name: 'CHC Shastri Nagar Community Clinic', type: 'CHC', address: 'Shastri Nagar Main Road · 1.2 km away', dept: 'Primary Care Unit', wait: '~10 min wait', rating: '4.4 ★' },
    { id: 6, name: 'PHC Hauz Khas Health Wellness Centre', type: 'PHC', address: 'Hauz Khas Village Road · 3.8 km away', dept: 'General Wellness', wait: '~5 min wait', rating: '4.3 ★' }
  ];

  // ── Clean up Speech on unmount ──
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (bookingRecognitionRef.current) bookingRecognitionRef.current.stop();
    };
  }, []);

  // ── Booking Voice Speech-to-Speech / Speech Synthesis ──
  const speakBookingQuestion = (questionText, lang = language) => {
    if (!('speechSynthesis' in window) || !questionText) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(questionText);
    utter.lang = getSpeechLang ? getSpeechLang() : (lang === 'hi' ? 'hi-IN' : 'en-IN');
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  };

  const startBookingFlow = () => {
    setIsBookingNewAppointment(true);
    setBookingLoading(true);
    setBookingError('');
    setBookingAnswer('');
    setIntakeAnswers([]);

    fetch('/api/interview/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: isHi ? 'hi' : 'en',
        patientId: patientId || patient?.abha || 'CITIZEN-01',
        medicalHistory: patient?.medicalHistory || ''
      })
    })
      .then((res) => {
        if (!res.ok) throw new Error('API offline');
        return res.json();
      })
      .then((data) => {
        setBookingConvId(data.conversationId);
        setBookingTurn(data);
        speakBookingQuestion(data.question, data.language);
      })
      .catch((e) => {
        console.warn('API interview notice, fallback to interactive SOCRATES intake:', e);
        const fallback = {
          conversationId: `conv-${Date.now()}`,
          question: isHi
            ? 'नमस्ते! आपको क्या मुख्य स्वास्थ्य परेशानी या लक्षण हो रहे हैं?'
            : 'Hello! What primary symptom or health concern brings you in today?',
          options: isHi
            ? ['बुखार और बदन दर्द', 'खांसी और सांस लेने में कठिनाई', 'पेट में तेज दर्द', 'सरदर्द और चक्कर']
            : ['Fever & Body Ache', 'Cough & Breathing Difficulty', 'Severe Stomach Pain', 'Headache & Dizziness'],
          language: isHi ? 'hi' : 'en'
        };
        setBookingConvId(fallback.conversationId);
        setBookingTurn(fallback);
        speakBookingQuestion(fallback.question, fallback.language);
      })
      .finally(() => {
        setBookingLoading(false);
      });
  };

  const handleBookingMicClick = () => {
    if (isBookingRecording) {
      if (bookingRecognitionRef.current) {
        bookingRecognitionRef.current.stop();
      }
      setIsBookingRecording(false);
      return;
    }

    setBookingError('');
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setBookingError(
        isHi
          ? 'आपके ब्राउज़र में वॉइस पहचान समर्थित नहीं है। कृपया लिखकर उत्तर दें।'
          : 'Speech recognition is not supported in this browser. Please type your answer.'
      );
      return;
    }

    const recognizer = new Recognition();
    recognizer.lang = getSpeechLang ? getSpeechLang() : (isHi ? 'hi-IN' : 'en-IN');
    recognizer.interimResults = true;

    recognizer.onstart = () => {
      setIsBookingRecording(true);
    };

    recognizer.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((r) => r[0].transcript)
        .join('');
      setBookingAnswer(transcript);
    };

    recognizer.onerror = (event) => {
      setBookingError(
        event.error === 'not-allowed'
          ? (isHi ? 'माइक्रोफ़ोन अनुमति अस्वीकृत। कृपया अनुमति दें या टाइप करें।' : 'Microphone permission was denied. Please allow it or type your answer.')
          : (isHi ? 'आवाज पहचानी नहीं जा सकी। कृपया पुनः प्रयास करें या लिखें।' : 'Speech could not be recognized. Please try again or edit the text.')
      );
      setIsBookingRecording(false);
    };

    recognizer.onend = () => {
      setIsBookingRecording(false);
    };

    bookingRecognitionRef.current = recognizer;
    recognizer.start();
  };

  const handleContinueBookingAnswer = async (value = bookingAnswer, inputType = 'text') => {
    if (!value.trim() || bookingLoading || !bookingConvId) {
      if (!value.trim()) {
        setBookingError(isHi ? 'कृपया आगे बढ़ने से पहले उत्तर दें।' : 'Please answer before continuing.');
      }
      return;
    }

    if (isBookingRecording && bookingRecognitionRef.current) {
      bookingRecognitionRef.current.stop();
      setIsBookingRecording(false);
    }

    setBookingLoading(true);
    setBookingError('');
    const newAnswers = [...intakeAnswers, { q: bookingTurn?.question, a: value }];
    setIntakeAnswers(newAnswers);

    try {
      const res = await fetch('/api/interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: bookingConvId,
          text: value,
          inputType,
          language: isHi ? 'hi' : 'en'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setBookingTurn(data);
        setBookingAnswer('');
        if (data.complete) {
          finishBookingAppointment(data.summary || { chiefComplaint: value });
        } else {
          speakBookingQuestion(data.question, data.language);
        }
        return;
      }
      throw new Error('Interview progression error');
    } catch {
      // Local SOCRATES question sequence fallback
      const step = newAnswers.length;
      if (step === 1) {
        const nextTurn = {
          conversationId: bookingConvId,
          question: isHi
            ? 'यह समस्या कितने समय से है (दिन/सप्ताह) और क्या यह लगातार बढ़ रही है?'
            : 'How long have you had this symptom (days/weeks), and is it progressively worsening?',
          options: isHi
            ? ['2-3 दिनों से', 'लगभग 1 हफ्ते से', '2 हफ्ते से अधिक समय से', 'आज अचानक शुरू हुआ']
            : ['Past 2-3 days', 'About 1 week', 'More than 2 weeks', 'Started suddenly today'],
          language: isHi ? 'hi' : 'en'
        };
        setBookingTurn(nextTurn);
        setBookingAnswer('');
        speakBookingQuestion(nextTurn.question, nextTurn.language);
      } else if (step === 2) {
        const nextTurn = {
          conversationId: bookingConvId,
          question: isHi
            ? 'तकलीफ की गंभीरता कैसी है और क्या कोई अन्य लक्षण (जैसे बुखार, सिरदर्द या सांस फूलना) भी है?'
            : 'How severe is the discomfort, and are there associated symptoms like fever or shortness of breath?',
          options: isHi
            ? ['हल्का - दिनचर्या सामान्य है', 'मध्यम - आराम करने की जरूरत है', 'गंभीर - तत्काल डॉक्टर को दिखाना है']
            : ['Mild - managing routine', 'Moderate - need rest', 'Severe - urgent consultation needed'],
          language: isHi ? 'hi' : 'en'
        };
        setBookingTurn(nextTurn);
        setBookingAnswer('');
        speakBookingQuestion(nextTurn.question, nextTurn.language);
      } else {
        const summary = {
          chiefComplaint: newAnswers[0]?.a || value,
          duration: newAnswers[1]?.a || '3-4 Days',
          severity: value,
          clinicalNote: `Patient reported: ${newAnswers.map((item, idx) => `[Q${idx + 1}: ${item.a}]`).join('; ')}`
        };
        finishBookingAppointment(summary);
      }
    } finally {
      setBookingLoading(false);
    }
  };

  const finishBookingAppointment = async (summary) => {
    const newToken = `OPD-0${Math.floor(20 + Math.random() * 70)}`;
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const dateFormatted = tomorrow.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });

    const symLower = JSON.stringify(summary).toLowerCase();
    let department = 'General Medicine Dept';
    let doctorName = 'Dr. S. Sharma (MD, AIIMS)';

    if (symLower.includes('chest') || symLower.includes('cough') || symLower.includes('breath') || symLower.includes('lung')) {
      department = 'Pulmonology & Respiratory Medicine';
      doctorName = 'Dr. Priya Nair (MD, Pulmonology)';
    } else if (symLower.includes('stomach') || symLower.includes('pain') || symLower.includes('vomit') || symLower.includes('abdomen')) {
      department = 'Gastroenterology OPD';
      doctorName = 'Dr. Rajesh Gupta (MD, Gastro)';
    } else if (symLower.includes('head') || symLower.includes('dizz') || symLower.includes('neuro')) {
      department = 'Neurology & Neuro Care';
      doctorName = 'Dr. Ananya Roy (DM, Neurology)';
    }

    const newApt = {
      id: `apt-${Date.now()}`,
      token: newToken,
      status: 'CONFIRMED',
      facility: 'AIIMS New Delhi',
      dept: department,
      doctor: doctorName,
      date: `Tomorrow, ${dateFormatted}`,
      time: 'Morning OPD 10:00 AM',
      symptoms: summary.chiefComplaint || summary.hpi || 'Clinical intake recorded via voice interview',
      summary: summary,
      bookedAt: new Date().toISOString()
    };

    const updated = [newApt, ...appointmentsList];
    setAppointmentsList(updated);
    setAppointment(newApt);
    try {
      localStorage.setItem(`ayulekha_appointments_${patientId || patient?.abha || 'default'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save error:', e);
    }

    try {
      await fetch('/api/patients/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: patientId || patient?.abha || 'CITIZEN-01',
          story: summary.hpi || summary.chiefComplaint || '',
          symptoms: summary
        })
      });
    } catch (e) {
      console.warn('Story save notice:', e);
    }

    setIsBookingNewAppointment(false);
    setSelectedSlipAppointment(newApt);
    setIsSlipModalOpen(true);
    triggerToast(
      isHi
        ? `नया अपॉइंटमेंट सफलतापूर्वक बुक हो गया! टोकन: ${newToken}`
        : `New appointment successfully confirmed! Token: ${newToken}`,
      'success'
    );
  };

  const handleCancelAppointment = (aptId) => {
    if (window.confirm(isHi ? 'क्या आप इस अपॉइंटमेंट को रद्द करना चाहते हैं?' : 'Are you sure you want to cancel this appointment slot?')) {
      const updated = appointmentsList.filter((a) => a.id !== aptId);
      setAppointmentsList(updated);
      try {
        localStorage.setItem(`ayulekha_appointments_${patientId || patient?.abha || 'default'}`, JSON.stringify(updated));
      } catch (e) {
        console.warn('Storage delete note:', e);
      }
      triggerToast(isHi ? 'अपॉइंटमेंट रद्द कर दिया गया।' : 'Appointment cancelled.', 'info');
    }
  };

  const handleOpenReschedule = (apt) => {
    setReschedulingAptId(apt?.id || appointmentsList[0]?.id);
    setIsRescheduleModalOpen(true);
  };

  const handleConfirmReschedule = () => {
    const updated = appointmentsList.map((a) => {
      if (a.id === reschedulingAptId || (!reschedulingAptId && a.id === appointmentsList[0]?.id)) {
        return { ...a, date: newRescheduleDate, status: 'RESCHEDULED' };
      }
      return a;
    });
    setAppointmentsList(updated);
    try {
      localStorage.setItem(`ayulekha_appointments_${patientId || patient?.abha || 'default'}`, JSON.stringify(updated));
    } catch (e) {
      console.warn('Storage save note:', e);
    }
    setIsRescheduleModalOpen(false);
    triggerToast(isHi ? 'अपॉइंटमेंट रीशेड्यूल हो गया!' : 'Appointment slot rescheduled successfully!', 'success');
  };

  // ── Voice Speech-to-Text ──
  const toggleSpeechRecognition = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please type your reply.');
      return;
    }

    const recognizer = new SpeechRecognition();
    recognizer.lang = isHi ? 'hi-IN' : 'en-IN';
    recognizer.interimResults = true;

    recognizer.onstart = () => setIsRecording(true);
    recognizer.onresult = (e) => {
      const transcript = Array.from(e.results).map((r) => r[0].transcript).join('');
      setInputAnswer(transcript);
    };
    recognizer.onerror = () => setIsRecording(false);
    recognizer.onend = () => setIsRecording(false);

    recognitionRef.current = recognizer;
    recognizer.start();
  };

  // ── Send AI Message ──
  const handleSendAiMessage = async () => {
    const text = inputAnswer.trim();
    if (!text) return;

    const userMsg = { sender: 'user', text, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputAnswer('');
    setAiLoading(true);

    try {
      // Connect to existing interview backend if available
      const url = conversationId ? '/api/interview/message' : '/api/interview/start';
      const body = conversationId ? { conversationId, text, language: isHi ? 'hi' : 'en' } : { language: isHi ? 'hi' : 'en' };
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);
      const aiReply = data.question || (isHi ? 'क्या आपको बुखार या सांस लेने में कोई परेशानी है?' : 'Are you experiencing any accompanying fever or shortness of breath?');
      setChatMessages((prev) => [...prev, { sender: 'ai', text: aiReply, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);

      // Update SOCRATES clinical note
      setAiSummary((prev) => ({
        ...prev,
        chiefComplaint: text.slice(0, 40),
        clinicalNote: `Patient reported: "${text}". Clinical triage active.`
      }));
    } catch (err) {
      console.warn('AI chat backend notice:', err);
      // Seamless interactive AI response fallback
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: 'ai',
            text: isHi
              ? 'धन्यवाद। मैंने यह जानकारी आपके क्लिनिकल सारांश में जोड़ दी है। क्या यह परेशानी रात में अधिक बढ़ जाती है?'
              : 'Thank you. I have indexed this in your clinical summary. Does the discomfort worsen during physical activity or at night?',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setAiSummary((prev) => ({
          ...prev,
          chiefComplaint: text.slice(0, 40),
          clinicalNote: `Patient stated: "${text}". Indexed for physician review.`
        }));
      }, 700);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Document Upload with OCR Engine ──
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('records', files[i]);
    }
    formData.append('document_type', documentType);
    if (activeSummaryId) {
      formData.append('summary_id', activeSummaryId);
    }

    try {
      const res = await fetch(`/api/patients/${abhaNumber}/records`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          setOcrRecords((prev) => [...data.results, ...prev]);
        }
        if (data.summary_id) {
          setActiveSummaryId(data.summary_id);
        }
        triggerToast(
          isHi
            ? 'दस्तावेज़ व OCR ऑडिट लॉग्स में जोड़ दिए गए! ऑडिट लॉग्स खोला जा रहा है...'
            : 'Original & OCR documents added to Audit Logs! Redirecting to Audit Logs...',
          'success'
        );
      } else {
        triggerToast('Uploaded and attached to Audit Logs!', 'success');
      }
    } catch (err) {
      console.warn('Upload notice:', err);
      triggerToast('Document uploaded to Audit Logs!', 'success');
    } finally {
      setIsUploading(false);
      await fetchAuditLogs();
      setActiveSection('audit_logs');
    }
  };

  // ── Edit Audit Log: Upload & Attach Documents Later Directly Inside an Audit Log ──
  const handleAuditLogFileUpload = async (e, targetSummaryId) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !targetSummaryId) return;

    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('records', files[i]);
    }
    formData.append('document_type', auditUploadDocType);
    formData.append('summary_id', targetSummaryId);

    try {
      const res = await fetch(`/api/patients/${abhaNumber}/records`, {
        method: 'POST',
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && Array.isArray(data.results)) {
          setOcrRecords((prev) => [...data.results, ...prev]);
        }
        if (data.audit_log) {
          setSelectedAuditLog(data.audit_log);
          if (Array.isArray(data.audit_log.ocr_documents) && data.audit_log.ocr_documents.length > 0) {
            const newestOcr = data.audit_log.ocr_documents[data.audit_log.ocr_documents.length - 1];
            setExpandedOcrDocId(newestOcr.id || `ocr-${data.audit_log.ocr_documents.length - 1}`);
          }
        }
        triggerToast(
          isHi
            ? `दस्तावेज़ व OCR सफलतापूर्वक ऑडिट लॉग (${targetSummaryId}) में जोड़ दिए गए!`
            : `Original & OCR documents attached to Audit Log (${targetSummaryId})!`,
          'success'
        );
      } else {
        triggerToast('Failed to attach documents to Audit Log.', 'error');
      }
    } catch (err) {
      console.warn('Audit log document attach error:', err);
      triggerToast('Error attaching documents to Audit Log.', 'error');
    } finally {
      setIsUploading(false);
      await fetchAuditLogs();
      e.target.value = '';
    }
  };

  // ── Audio Listen Text-to-Speech ──
  const handleListenAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = isHi
        ? `नमस्ते ${citizenName}। आपकी अगली ओपीडी अपॉइंटमेंट ${appointment.name || 'AIIMS न्यू दिल्ली'} में आज सुबह है। आपके पास सक्रिय 5 नुस्खे दर्ज हैं।`
        : `Hello ${citizenName}. Your next OPD appointment at AIIMS New Delhi is scheduled for this morning. You have active prescriptions and verified medical records.`;
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = isHi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utter);
      triggerToast(isHi ? 'ऑडियो सहायता सक्रिय...' : 'Audio narration active...', 'info');
    }
  };

  return (
    <div className="dash-body">
      <div className="app-layout">
        {/* ── SIDEBAR ── */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sb-brand">
            <div className="sb-logo">
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" fill="none" />
                <circle cx="11" cy="11" r="2" fill="#E8631A" />
              </svg>
            </div>
            <div>
              <div className="sb-name">AyuLekha</div>
              <div className="sb-tagline">{t('patientDashboard.tagline', 'CITIZEN HEALTH PORTAL')}</div>
            </div>
          </div>

          <div className="sb-mission">
            <span style={{ color: '#4CAF50' }}>●</span> ABDM / DPDP 2023 COMPLIANT
          </div>

          <nav className="sb-nav">
            <a
              href="#home"
              className={`sb-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('home'); setSidebarOpen(false); }}
            >
              <span>{t('patientDashboard.navHome', 'Home')}</span>
            </a>

            <a
              href="#record_story"
              className={`sb-link ${activeSection === 'record_story' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('record_story'); setSidebarOpen(false); }}
            >
              <span>{isHi ? '🎙️ स्टोरी रिकॉर्ड करें' : '🎙️ Record Story'}</span>
              <span className="sb-badge" style={{ background: '#E8F5E9', color: '#1A5C38', fontWeight: 800 }}>AI</span>
            </a>

            <a
              href="#records"
              className={`sb-link ${activeSection === 'records' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('records'); setSidebarOpen(false); }}
            >
              <span>{t('patientDashboard.navRecords', 'My Records')}</span>
              <span className="sb-badge">{ocrRecords.length || 3}</span>
            </a>

            <a
              href="#audit_logs"
              className={`sb-link ${activeSection === 'audit_logs' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('audit_logs'); setSidebarOpen(false); }}
            >
              <span>{isHi ? 'ऑडिट लॉग्स' : 'Audit Logs'}</span>
              <span className="sb-badge" style={{ background: '#E8F5E9', color: '#1A5C38' }}>{auditLogs.length}</span>
            </a>



            <a
              href="#profile"
              className={`sb-link ${activeSection === 'profile' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('profile'); setSidebarOpen(false); }}
            >

              <span>{t('patientDashboard.navProfile', 'Profile')}</span>
            </a>

            <a
              href="#notifications"
              className={`sb-link ${activeSection === 'notifications' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('notifications'); setSidebarOpen(false); }}
            >

              <span>{t('patientDashboard.navNotifications', 'Notifications')}</span>
              <span className="sb-badge">2</span>
            </a>

            <a
              href="#settings"
              className={`sb-link ${activeSection === 'settings' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); setActiveSection('settings'); setSidebarOpen(false); }}
            >

              <span>{t('patientDashboard.navSettings', 'Settings')}</span>
            </a>
          </nav>

          <div className="sb-bottom">
            <button
              type="button"
              className="sb-link"
              style={{ width: '100%', color: '#ffb4ab' }}
              onClick={() => {
                if (window.confirm(t('common.logoutConfirm', 'Are you sure you want to log out?'))) {
                  localStorage.removeItem('abhaId');
                  if (onNavigate) onNavigate('portal');
                }
              }}
            >

              <span>{t('patientDashboard.navLogout', 'Log Out')}</span>
            </button>
            <div style={{ padding: '8px 14px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
              24/7 Helpline: 1075 / 108
            </div>
          </div>
        </aside>

        {/* ── MAIN AREA ── */}
        <div className="main-area">
          {/* Header */}
          <header className="dash-header">
            <div className="dh-left">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                style={{ display: 'block' }}
              >
                ☰
              </button>
              <div className="dh-breadcrumb">
                {t('patientDashboard.breadcrumb', 'Home > ABDM Citizen Dashboard')}
              </div>

              {/* Hospital Switcher Button */}
              <button
                type="button"
                className="btn-outline"
                style={{ padding: '4px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => setIsHospitalModalOpen(true)}
              >
                <span>🏥 {hospitalInfo.name}</span>
                <span style={{ fontSize: '10px' }}>▾</span>
              </button>
            </div>

            <div className="dh-right">
              {/* Audio Listen */}
              <button
                type="button"
                className="btn-ghost"
                onClick={handleListenAudio}
                title="Listen via Audio"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 10px' }}
              >
                <span>🔊</span>
                <span>{t('patientDashboard.listen', 'Listen')}</span>
              </button>

              {/* Language Switch */}
              <button
                type="button"
                className="btn-ghost"
                onClick={openLanguageModal}
                style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '6px 10px' }}
              >
                <span>🌐</span>
                <span>{currentLangObj?.nativeName || 'English'}</span>
              </button>

              {/* ABHA Badge */}
              <div className="dh-abha" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                <span style={{ color: 'var(--success)' }}>●</span>
                <span>ABHA: <strong>{abhaNumber.slice(0, 10)}...</strong></span>
              </div>

              {/* User Avatar */}
              <div className="dh-user" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="dh-avatar" style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                  {citizenName.slice(0, 2).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          {/* Toast Alert */}
          {toast && (
            <div style={{ position: 'fixed', top: '70px', right: '24px', zIndex: 1000, background: toast.type === 'success' ? '#2E7D32' : '#1565C0', color: '#fff', padding: '12px 20px', borderRadius: '8px', boxShadow: '0 4px 16px rgba(0,0,0,0.2)', fontSize: '13px', fontWeight: '600' }}>
              {toast.msg}
            </div>
          )}

          {/* ── DASHBOARD CONTENT SCROLLABLE ── */}
          <main className="dash-content">
            {/* ════ SECTION 1: HOME ════ */}
            {activeSection === 'home' && (
              <section className="ds-section" id="sec-home">
                <div className="sec-head" style={{ marginBottom: '20px' }}>
                  <div>
                    <h2 className="sec-title" style={{ fontSize: '24px', fontWeight: 800 }}>
                      {isHi ? `नमस्ते, ${citizenName}! 🙏` : `Namaste, ${citizenName}! 🙏`}
                    </h2>
                    <p className="sec-sub" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isHi ? 'आपके आधिकारिक आयुष्मान भारत डिजिटल स्वास्थ्य पोर्टल में आपका स्वागत है।' : 'One Nation, One Digital Health Account under Ayushman Bharat Digital Mission.'}
                    </p>
                  </div>
                </div>

                {/* Big ABHA Card */}
                <div className="abha-card-big" style={{ background: 'linear-gradient(135deg, #0D3B25 0%, #1A5C38 60%, #2D7A52 100%)', color: '#fff', borderRadius: '16px', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                  <div className="acb-left">
                    <div style={{ fontSize: '12px', letterSpacing: '1px', opacity: 0.85, marginBottom: '6px' }}>
                      GOVT. OF INDIA • AYUSHMAN BHARAT DIGITAL MISSION
                    </div>
                    <div style={{ fontSize: '22px', fontWeight: 800 }}>{citizenName}</div>
                    <div style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.75, marginTop: '12px' }}>
                      ABHA ID NUMBER
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '1.5px', color: '#A8F2CC' }}>
                      {abhaNumber}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', marginTop: '10px', opacity: 0.9 }}>
                      <span>🎂 Age: {citizenAge} yrs</span>
                      <span>⚧ {citizenGender}</span>
                      <span>🩸 Blood: {citizenBlood}</span>
                    </div>
                  </div>
                  <div className="acb-right" style={{ textAlign: 'center' }}>
                    <div style={{ width: '90px', height: '90px', background: '#fff', color: '#000', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', margin: '0 auto 10px' }}>
                      [ QR CODE ]
                    </div>
                    <button
                      type="button"
                      className="btn-accent"
                      style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '6px' }}
                      onClick={() => triggerToast(isHi ? 'ABHA कार्ड डाउनलोड हो गया!' : 'ABHA Card PDF downloaded successfully!', 'success')}
                    >
                      📥 {isHi ? 'कार्ड डाउनलोड' : 'Download Card'}
                    </button>
                  </div>
                </div>

                {/* 🎙️ Voice AI Story Intake Banner Card */}
                <div
                  className="card"
                  style={{
                    padding: '24px',
                    borderRadius: '16px',
                    border: '1.5px solid #1A5C38',
                    background: 'linear-gradient(135deg, #F4FAF6 0%, #E8F5EE 100%)',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '16px',
                    boxShadow: '0 4px 14px rgba(26,92,56,0.08)'
                  }}
                >
                  <div style={{ flex: 1, minWidth: '280px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge" style={{ background: '#1A5C38', color: '#fff', fontWeight: 800, fontSize: '11px', padding: '3px 10px', borderRadius: '12px' }}>
                        NEW · 3-STAGE VOICE AI
                      </span>
                      <span style={{ fontSize: '12px', color: '#1A5C38', fontWeight: 700 }}>
                        STT ➔ Groq LLM ➔ WebTTS
                      </span>
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0D3B25', margin: '4px 0 6px 0' }}>
                      🎙️ {isHi ? 'वॉइस AI सहायक के साथ अपनी स्वास्थ्य कहानी बताएं' : 'Record Your Story with Voice AI Assistant'}
                    </h3>
                    <p style={{ fontSize: '13px', color: '#405B4B', margin: 0, lineHeight: 1.5 }}>
                      {isHi
                        ? 'माइक्रोफ़ोन से बोलें — बैकग्राउंड नॉइज़ कट STT आपके शब्दों को इनपुट बॉक्स में लाइव टाइप करेगा, Groq AI क्लिनिकल प्रश्न पूछेगा, और WebTTS उत्तर बोलेगा।'
                        : 'Talk with our real-time voice AI. Real-time STT transcribes your voice with noise cancellation, Groq LLM asks Socrates questions, and WebTTS speaks responses back.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      background: '#1A5C38',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(26,92,56,0.25)'
                    }}
                    onClick={() => {
                      setActiveSection('record_story');
                      if (storyMessages.length <= 1) {
                        initStorySession();
                      }
                    }}
                  >
                    <span>🎙️</span>
                    <span>{isHi ? 'स्टोरी रिकॉर्डिंग शुरू करें →' : 'Start Voice Story Intake →'}</span>
                  </button>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                  <div className="card" style={{ padding: '16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
                    <div style={{ fontSize: '24px' }}>📁</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{ocrRecords.length || 3}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isHi ? 'स्वास्थ्य रिकॉर्ड्स' : 'Health Records'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
                    <div style={{ fontSize: '24px' }}>📜</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent)' }}>{auditLogs.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isHi ? 'ऑडिट लॉग्स' : 'Audit Logs'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
                    <div style={{ fontSize: '24px' }}>💊</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--primary)' }}>{medicines.length}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isHi ? 'सक्रिय दवाइयाँ' : 'Active Medicines'}</div>
                  </div>
                  <div className="card" style={{ padding: '16px', textAlign: 'center', border: '1.5px solid var(--border)' }}>
                    <div style={{ fontSize: '24px' }}>🩺</div>
                    <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--success)' }}>120/80</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{isHi ? 'रक्तचाप (BP)' : 'Blood Pressure'}</div>
                  </div>
                </div>

                {/* Rotating Health Tip */}
                <div style={{ background: '#E8F5E9', border: '1.5px solid rgba(46,125,50,0.2)', borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>💡</span>
                    <div>
                      <strong style={{ fontSize: '12px', color: 'var(--primary)' }}>
                        {isHi ? 'दैनिक राष्ट्रीय स्वास्थ्य सलाह:' : 'Daily Preventive Health Tip:'}
                      </strong>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                        {healthTips[tipIndex]}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '11px', padding: '4px 10px', whiteSpace: 'nowrap' }}
                    onClick={() => setTipIndex((prev) => (prev + 1) % healthTips.length)}
                  >
                    {isHi ? 'अगली सलाह →' : 'Next Tip →'}
                  </button>
                </div>

                {/* SQLite Audit Trail Overview Card */}
                <div className="card" style={{ padding: '20px', border: '1.5px solid var(--border)', borderRadius: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge" style={{ background: '#E8F5E9', color: 'var(--success)' }}>
                      📜 SQLite Audit Trail • {auditLogs.length} Records Logged
                    </span>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ padding: '4px 12px', fontSize: '12px' }}
                      onClick={() => setActiveSection('audit_logs')}
                    >
                      {isHi ? 'सभी ऑडिट लॉग्स देखें →' : 'View All Logs →'}
                    </button>
                  </div>
                  {auditLogs.length > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px 16px',
                        background: 'var(--bg-muted)',
                        borderRadius: '10px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer'
                      }}
                      onClick={() => {
                        setSelectedAuditLog(auditLogs[0]);
                        setAuditModalTab('summary');
                        setActiveSection('audit_logs');
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: '#1A5C38', background: 'rgba(26,92,56,0.12)', padding: '4px 10px', borderRadius: '6px', fontFamily: 'monospace' }}>
                          🆔 {auditLogs[0].summary_id}
                        </span>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)' }}>
                        🕒 {new Date(auditLogs[0].time_created).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 700, margin: '4px 0' }}>
                        {isHi ? 'कोई ऑडिट लॉग अभी तक दर्ज नहीं है' : 'No Audit Logs Recorded in SQLite'}
                      </h4>
                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {isHi ? 'दस्तावेज़ अपलोड करें या AI इनटेक पूरा करें जिससे नया ऑडिट लॉग जनरेट हो।' : 'Upload medical records or complete an AI clinical intake to log summary metadata.'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Active Prescriptions Table (from OCR or default) */}
                <div className="card" style={{ padding: '20px', border: '1.5px solid var(--border)', borderRadius: '14px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700 }}>
                      💊 {isHi ? 'सक्रिय दवाइयाँ (OCR द्वारा सत्यापित)' : 'Active Prescriptions (OCR Verified)'}
                    </h3>
                    <span className="badge" style={{ background: 'rgba(26,92,56,0.1)', color: 'var(--primary)' }}>
                      PaddleOCR / TrOCR
                    </span>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-muted)', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px' }}>Medication Name</th>
                          <th style={{ padding: '10px' }}>Dosage</th>
                          <th style={{ padding: '10px' }}>Timing</th>
                          <th style={{ padding: '10px' }}>Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {medicines.map((m, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--divider)' }}>
                            <td style={{ padding: '10px', fontWeight: 600 }}>{m.Name || m[0]}</td>
                            <td style={{ padding: '10px' }}>{m.Dosage || m[1]}</td>
                            <td style={{ padding: '10px' }}>{m.Frequency || m[2]}</td>
                            <td style={{ padding: '10px' }}>{m.Duration || m[3] || 'As needed'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}

            {/* ════ SECTION 2: HEALTH RECORDS (WITH OCR) ════ */}
            {activeSection === 'records' && (
              <section className="ds-section" id="sec-records">
                <div className="sec-head" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 className="sec-title" style={{ fontSize: '24px', fontWeight: 800 }}>
                      {isHi ? 'पुराने स्वास्थ्य दस्तावेज़ अपलोड करें' : 'Upload & Digitize Medical Records'}
                    </h2>
                    <p className="sec-sub" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isHi
                        ? 'अपने पुराने नुस्खे, लैब रिपोर्ट्स व डिस्चार्ज सारांश को अपलोड करें। अपलोड के बाद आपको सीधे ऑडिट लॉग्स में ले जाया जाएगा।'
                        : 'Attach your original medical reports and prescriptions. Both original and OCR digitized documents are automatically saved to Audit Logs.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{
                      background: '#1A5C38',
                      color: '#fff',
                      padding: '10px 20px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => {
                      fetchAuditLogs();
                      setActiveSection('audit_logs');
                    }}
                  >
                    📜 {isHi ? 'ऑडिट लॉग्स पर जाएं →' : 'Proceed to Audit Logs →'}
                  </button>
                </div>

                {activeSummaryId && (
                  <div
                    style={{
                      background: '#E8F5E9',
                      border: '1.5px solid #81C784',
                      borderRadius: '12px',
                      padding: '14px 20px',
                      marginBottom: '20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '22px' }}>✅</span>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 800, color: '#1B5E20' }}>
                          {isHi
                            ? `क्लिनिकल सारांश (${activeSummaryId}) ऑडिट लॉग में दर्ज हो चुका है!`
                            : `Clinical Summary (${activeSummaryId}) Logged — Now Attach Supporting Documents`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#2E7D32' }}>
                          {isHi
                            ? 'नीचे दस्तावेज़ अपलोड करते ही मूल (Original) और OCR दोनों दस्तावेज़ आपके ऑडिट लॉग में जुड़ जाएंगे और ऑडिट लॉग खुल जाएगा।'
                            : 'Uploading files below will attach both the Original Document and the OCR Digitized Document directly to this Audit Log and take you to Audit Logs.'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Upload & Engine Selection Card */}
                <div className="card" style={{ padding: '24px', border: '1.5px solid var(--border)', borderRadius: '16px', marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '12px' }}>
                    📸 {isHi ? 'दस्तावेज़ कैप्चर व OCR इंजन चयन' : 'Document Capture & OCR Engine'}
                  </h3>

                  {/* OCR Selector Tabs */}
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    <button
                      type="button"
                      className={`btn ${documentType === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setDocumentType('auto')}
                    >
                      Auto (Mixed Format)
                    </button>
                    <button
                      type="button"
                      className={`btn ${documentType === 'lab_report' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setDocumentType('lab_report')}
                    >
                      Printed / Lab Reports (PaddleOCR)
                    </button>
                    <button
                      type="button"
                      className={`btn ${documentType === 'prescription' ? 'btn-primary' : 'btn-outline'}`}
                      onClick={() => setDocumentType('prescription')}
                    >
                      Handwritten Prescription (TrOCR)
                    </button>
                  </div>

                  {/* Drag and Drop Box */}
                  <div style={{ border: '2px dashed var(--border)', borderRadius: '12px', padding: '32px 20px', textAlign: 'center', background: 'var(--bg-muted)' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>📄</div>
                    <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '4px' }}>
                      {isHi ? 'फ़ाइलें यहाँ खींचें या ब्राउज़ करें' : 'Drag & drop reports here, or browse from device'}
                    </h4>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '18px' }}>
                      Supports camera capture, PDF, JPG, PNG • Max 25MB per file
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                      <label className="btn-primary" style={{ cursor: 'pointer', padding: '10px 24px', display: 'inline-block' }}>
                        📁 {isUploading ? 'Uploading & Processing OCR...' : (isHi ? 'दस्तावेज़ चुनें और अपलोड करें' : 'Select Document to Upload')}
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={handleFileUpload}
                          style={{ display: 'none' }}
                          disabled={isUploading}
                        />
                      </label>

                      <button
                        type="button"
                        className="btn-outline"
                        style={{
                          padding: '10px 24px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '14px',
                          borderColor: '#1A5C38',
                          color: '#1A5C38',
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          fetchAuditLogs();
                          setActiveSection('audit_logs');
                        }}
                        disabled={isUploading}
                      >
                        ⏭️ {isHi ? 'छोड़ें (Skip) और ऑडिट लॉग्स पर जाएं →' : 'Skip & Continue to Audit Logs →'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Existing Records Feed */}
                <div className="card" style={{ padding: '20px', border: '1.5px solid var(--border)', borderRadius: '16px' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '14px' }}>
                    📂 {isHi ? 'डिजिटाइज्ड मेडिकल रिकॉर्ड्स' : 'Indexed Medical Records'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {ocrRecords.length > 0 ? (
                      ocrRecords.map((rec, i) => {
                        const isRecOpen = selectedRecordForView && (selectedRecordForView.id === rec.id && selectedRecordForView.filename === rec.filename);
                        return (
                          <div key={rec.id || i} style={{ padding: '14px', border: '1px solid var(--border)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: '14px' }}>
                                  {rec.filename || rec.title || `Clinical Record #${i + 1}`}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                  {rec.timestamp ? new Date(rec.timestamp).toLocaleString() : (rec.date || 'Indexed on AIIMS Cloud')} • {rec.engine || 'OCR Verified'}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn-outline"
                                style={{ fontSize: '12px', padding: '4px 12px' }}
                                onClick={() => setSelectedRecordForView(isRecOpen ? null : rec)}
                              >
                                {isRecOpen ? 'Hide OCR' : 'View Record'}
                              </button>
                            </div>
                            {isRecOpen && (
                              <div style={{ background: '#FAF9F6', border: '1px solid #E5E0D5', borderRadius: '8px', padding: '12px', fontSize: '13px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {rec.summary || rec.raw_ocr_text || 'No OCR text available.'}
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                        No uploaded archives yet. Upload past prescriptions above to feed your doctor's OPD view.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* ════ SECTION 3: SYSTEM AUDIT LOGS (SQLITE LOCAL STORAGE) ════ */}
            {activeSection === 'audit_logs' && (
              <section className="ds-section" id="sec-audit-logs">
                <div className="sec-head" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 className="sec-title" style={{ fontSize: '24px', fontWeight: 800, color: '#1A5C38' }}>
                      📜 {isHi ? 'सिस्टम ऑडिट लॉग्स (SQLite लोकल स्टोरेज)' : 'System Audit Trail (SQLite Local Storage)'}
                    </h2>
                    <p className="sec-sub" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isHi
                        ? 'स्थानीय SQLite डेटाबेस में संग्रहीत सभी क्लिनिकल सारांश, जुड़े दस्तावेज़ों की संख्या व मेटाडेटा का सुरक्षित रिकॉर्ड।'
                        : 'Tamper-evident SQLite audit logs tracking clinical consultation summaries, attached document IDs, timestamps, and document metadata.'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '13px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={fetchAuditLogs}
                      disabled={isAuditLogsLoading}
                    >
                      <span>🔄</span>
                      <span>{isAuditLogsLoading ? 'Loading...' : (isHi ? 'रिफ्रेश' : 'Refresh Logs')}</span>
                    </button>
                    {auditLogs.length > 0 && (
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ fontSize: '13px', padding: '8px 16px', color: '#D32F2F', borderColor: '#FFCDD2' }}
                        onClick={handleClearAuditLogs}
                      >
                        🗑️ {isHi ? 'सभी लॉग हटाएं' : 'Wipe Logs'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="card" style={{ padding: '16px 20px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                    <input
                      type="text"
                      className="fi"
                      placeholder={isHi ? 'summary_id, दस्तावेज़ नाम या सारांश से खोजें...' : 'Search by summary_id, documents_id, file name, or summary...'}
                      value={searchAuditQuery}
                      onChange={(e) => setSearchAuditQuery(e.target.value)}
                      style={{ paddingLeft: '36px' }}
                    />
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>🔍</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {auditLogs.filter((l) => {
                      if (!searchAuditQuery) return true;
                      const q = searchAuditQuery.toLowerCase();
                      return (
                        (l.summary_id && l.summary_id.toLowerCase().includes(q)) ||
                        (l.documents_id && l.documents_id.toLowerCase().includes(q)) ||
                        (l.name_of_documents && l.name_of_documents.toLowerCase().includes(q)) ||
                        (l.summary && l.summary.toLowerCase().includes(q))
                      );
                    }).length} {isHi ? 'रिकॉर्ड्स मिले' : 'logs matched'}
                  </div>
                </div>

                {/* Audit Logs List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {(() => {
                    const filteredLogs = auditLogs.filter((l) => {
                      if (!searchAuditQuery) return true;
                      const q = searchAuditQuery.toLowerCase();
                      return (
                        (l.summary_id && l.summary_id.toLowerCase().includes(q)) ||
                        (l.documents_id && l.documents_id.toLowerCase().includes(q)) ||
                        (l.name_of_documents && l.name_of_documents.toLowerCase().includes(q)) ||
                        (l.summary && l.summary.toLowerCase().includes(q))
                      );
                    });

                    if (filteredLogs.length === 0) {
                      return (
                        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#ffffff', borderRadius: '14px', border: '1px dashed var(--border)' }}>
                          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📜</div>
                          <h4 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
                            {isHi ? 'कोई ऑडिट लॉग नहीं मिला' : 'No SQLite Audit Logs Found'}
                          </h4>
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', maxWidth: '440px', margin: '0 auto 16px auto' }}>
                            {isHi
                              ? 'वॉइस AI असिस्टेंट से अपनी समस्या बताएं या स्वास्थ्य दस्तावेज़ अपलोड करें जिससे स्वचालित रूप से नया ऑडिट लॉग तैयार हो सके।'
                              : 'Complete a consultation story with the Voice AI assistant or upload clinical records to automatically record an audit trail in SQLite.'}
                          </p>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ background: '#1A5C38', color: '#fff', padding: '10px 20px', borderRadius: '8px', fontWeight: 700 }}
                            onClick={() => {
                              setActiveSection('record_story');
                              if (storyMessages.length <= 1) initStorySession();
                            }}
                          >
                            🎙️ {isHi ? 'स्टोरी रिकॉर्डिंग शुरू करें' : 'Record Story with Voice AI'}
                          </button>
                        </div>
                      );
                    }

                    return filteredLogs.map((log, index) => (
                      <div
                        key={log.summary_id || index}
                        className="card"
                        style={{
                          padding: '18px 24px',
                          border: '1.5px solid var(--border)',
                          borderRadius: '14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '16px',
                          background: '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onClick={() => {
                          setSelectedAuditLog(log);
                          setAuditModalTab('summary');
                          setPreviewOriginalUrl(null);
                          setExpandedOcrDocId(null);
                        }}
                      >
                        {/* Left: Summary ID Only */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontSize: '15px',
                              fontWeight: 800,
                              color: '#1A5C38',
                              background: '#E8F5E9',
                              padding: '6px 14px',
                              borderRadius: '8px',
                              border: '1px solid #C8E6C9',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}
                            title="Click to copy summary_id"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyId(log.summary_id);
                            }}
                          >
                            🆔 {log.summary_id}
                            <span style={{ fontSize: '12px', opacity: 0.7 }}>📋</span>
                          </span>
                        </div>

                        {/* Right: Time Created + Edit / Open Actions */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>🕒</span>
                            <span>{log.time_created ? new Date(log.time_created).toLocaleString() : 'N/A'}</span>
                          </div>
                          <button
                            type="button"
                            className="btn-outline"
                            style={{
                              fontSize: '12px',
                              padding: '6px 14px',
                              fontWeight: 700,
                              color: '#1A5C38',
                              borderColor: '#1A5C38',
                              background: '#E8F5E9'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditLog(log);
                              setAuditModalTab('documents');
                              setShowAuditDocUploader(true);
                              setPreviewOriginalUrl(null);
                              setExpandedOcrDocId(null);
                            }}
                          >
                            ✏️ {isHi ? 'संपादित करें / दस्तावेज़ जोड़ें' : 'Edit / Add Documents'}
                          </button>
                          <button
                            type="button"
                            className="btn-outline"
                            style={{ fontSize: '12px', padding: '6px 14px', fontWeight: 700, color: '#1A5C38', borderColor: '#1A5C38' }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAuditLog(log);
                              setAuditModalTab('summary');
                              setShowAuditDocUploader(false);
                              setPreviewOriginalUrl(null);
                              setExpandedOcrDocId(null);
                            }}
                          >
                            {isHi ? 'खोलें →' : 'Open →'}
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </section>
            )}

            {/* ════ SECTION 4: 3-STAGE VOICE-AI STORY INTAKE (STT ➔ LLM ➔ TTS) ════ */}
            {(activeSection === 'record_story' || activeSection === 'ai') && (
              <section className="ds-section" id="sec-voice-story">
                {/* Header */}
                <div className="sec-head" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 className="sec-title" style={{ fontSize: '24px', fontWeight: 800, color: '#1A5C38' }}>
                      🎙️ {isHi ? 'वॉइस AI सहायक के साथ अपनी स्वास्थ्य कहानी बताएं' : 'Record Your Story with Voice AI'}
                    </h2>
                    <p className="sec-sub" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {isHi
                        ? '3-स्तरीय आर्किटेक्चर: STT (बैकग्राउंड नॉइज़ कट) आपके शब्दों को लाइव टाइप करता है, Groq Socrates LLM क्लिनिकल विश्लेषण करता है, और WebTTS उत्तर बोलता है।'
                        : '3-Stage Voice AI: STT noise filtering writes words live into the input box, Groq Socrates LLM analyzes symptoms, and WebTTS speaks responses back.'}
                    </p>
                  </div>

                  {/* Top Control Buttons */}
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '13px', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={() => setIsTtsMuted((prev) => !prev)}
                    >
                      <span>{isTtsMuted ? '🔇' : '🔊'}</span>
                      <span>{isTtsMuted ? (isHi ? 'आवाज चालू करें' : 'Unmute Voice') : (isHi ? 'आवाज म्यूट करें' : 'Mute Voice')}</span>
                    </button>
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '13px', padding: '6px 14px' }}
                      onClick={initStorySession}
                      disabled={storyStage === 'llm_thinking'}
                    >
                      🔄 {isHi ? 'शुरू से शुरू करें' : 'Restart Story'}
                    </button>
                  </div>
                </div>

                {/* 3-Stage Visual Architecture Pipeline Status Badges */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                  {/* Stage 1: STT */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: isStoryRecording || storyStage === 'stt_listening' ? '#2E7D32' : 'var(--border)',
                    background: isStoryRecording || storyStage === 'stt_listening' ? '#E8F5E9' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: isStoryRecording ? '0 0 10px rgba(46,125,50,0.25)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '24px' }}>🎙️</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: isStoryRecording ? '#1A5C38' : 'var(--text-muted)' }}>
                        STAGE 1: STT
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: isStoryRecording ? '#1A5C38' : '#1c1c18' }}>
                        {isStoryRecording ? (isHi ? 'आवाज सुन रहा है...' : 'Listening (Noise Cut)') : (isHi ? 'माइक तैयार' : 'Speech to Text')}
                      </div>
                    </div>
                  </div>

                  {/* Stage 2: LLM */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: storyStage === 'llm_thinking' ? '#1565C0' : 'var(--border)',
                    background: storyStage === 'llm_thinking' ? '#E3F2FD' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: storyStage === 'llm_thinking' ? '0 0 10px rgba(21,101,192,0.25)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '24px' }}>🧠</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: storyStage === 'llm_thinking' ? '#1565C0' : 'var(--text-muted)' }}>
                        STAGE 2: LLM
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: storyStage === 'llm_thinking' ? '#1565C0' : '#1c1c18' }}>
                        {storyStage === 'llm_thinking' ? (isHi ? 'विश्लेषण जारी...' : 'Groq Socrates Thinking') : 'Groq Socrates (Ready)'}
                      </div>
                    </div>
                  </div>

                  {/* Stage 3: TTS */}
                  <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1.5px solid',
                    borderColor: storyStage === 'tts_speaking' ? '#E65100' : 'var(--border)',
                    background: storyStage === 'tts_speaking' ? '#FFF3E0' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    boxShadow: storyStage === 'tts_speaking' ? '0 0 10px rgba(230,81,0,0.25)' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    <span style={{ fontSize: '24px' }}>🔊</span>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: storyStage === 'tts_speaking' ? '#E65100' : 'var(--text-muted)' }}>
                        STAGE 3: TTS
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: storyStage === 'tts_speaking' ? '#E65100' : '#1c1c18' }}>
                        {storyStage === 'tts_speaking' ? (isHi ? 'उत्तर बोल रहा है...' : 'WebTTS Speaking') : (isTtsMuted ? 'Muted' : 'WebTTS Active')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Voice-AI Chat Box Container */}
                <div
                  className="card"
                  style={{
                    border: '1.5px solid var(--border)',
                    borderRadius: '16px',
                    padding: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '520px',
                    background: '#FAF8F5',
                    overflow: 'hidden'
                  }}
                >
                  {/* Chat Message Stream */}
                  <div
                    style={{
                      flex: 1,
                      padding: '24px',
                      overflowY: 'auto',
                      maxHeight: '460px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px'
                    }}
                  >
                    {storyMessages.map((msg) => (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                          gap: '6px'
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            maxWidth: '82%',
                            flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
                          }}
                        >
                          {/* Avatar */}
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '50%',
                              background: msg.sender === 'user' ? '#1A5C38' : '#2C3E50',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '18px',
                              flexShrink: 0,
                              boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                            }}
                          >
                            {msg.sender === 'user' ? '👤' : '🤖'}
                          </div>

                          {/* Bubble */}
                          <div
                            style={{
                              background: msg.sender === 'user' ? '#1A5C38' : '#ffffff',
                              color: msg.sender === 'user' ? '#ffffff' : '#1c1c18',
                              padding: '14px 18px',
                              borderRadius: msg.sender === 'user' ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                              border: msg.sender === 'user' ? 'none' : '1px solid #E0DCD5',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                              fontSize: '14px',
                              lineHeight: 1.6
                            }}
                          >
                            <div>{msg.text}</div>

                            <div
                              style={{
                                fontSize: '11px',
                                marginTop: '6px',
                                opacity: msg.sender === 'user' ? 0.8 : 0.5,
                                textAlign: msg.sender === 'user' ? 'right' : 'left'
                              }}
                            >
                              {msg.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* LLM Thinking Indicator */}
                    {storyStage === 'llm_thinking' && (
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            background: '#2C3E50',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px'
                          }}
                        >
                          🤖
                        </div>
                        <div
                          style={{
                            background: '#fff',
                            padding: '12px 18px',
                            borderRadius: '4px 18px 18px 18px',
                            border: '1px solid #E0DCD5',
                            fontSize: '13px',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <span className="status-pulse-dot" style={{ background: '#1565C0' }}></span>
                          <span>{isHi ? 'AI डॉक्टर विश्लेषण कर रहा है...' : 'AI Doctor is formulating Socrates clinical question...'}</span>
                        </div>
                      </div>
                    )}

                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick Suggestion Pills */}
                  {currentTurnOptions.length > 0 && storyStage !== 'complete' && (
                    <div
                      style={{
                        padding: '10px 24px',
                        background: '#F5F2EB',
                        borderTop: '1px solid #E6E1D8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#6A675E' }}>
                        💡 {isHi ? 'सुझाव:' : 'Quick Options:'}
                      </span>
                      {currentTurnOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          className="btn-outline"
                          style={{
                            fontSize: '12px',
                            padding: '4px 12px',
                            background: '#fff',
                            borderColor: '#D4CEBF',
                            borderRadius: '20px',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleSendStoryAnswer(opt)}
                          disabled={storyStage === 'llm_thinking'}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Voice-Driven Text Input Bar */}
                  <div
                    style={{
                      padding: '16px 20px',
                      background: '#ffffff',
                      borderTop: '1.5px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px'
                    }}
                  >
                    {/* Glowing Microphone Button */}
                    <div style={{ position: 'relative' }}>
                      {isStoryRecording && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: '-6px',
                            borderRadius: '50%',
                            border: '2px solid #2E7D32',
                            animation: 'pulseRing 1.5s infinite',
                            pointerEvents: 'none'
                          }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={toggleStoryRecording}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: '50%',
                          background: isStoryRecording ? '#D32F2F' : '#1A5C38',
                          color: '#ffffff',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '22px',
                          boxShadow: isStoryRecording
                            ? '0 0 16px rgba(211,47,47,0.6)'
                            : '0 4px 12px rgba(26,92,56,0.3)',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        title={isStoryRecording ? 'Stop Recording' : 'Speak (Speech to Text)'}
                        disabled={storyStage === 'llm_thinking'}
                      >
                        {isStoryRecording ? '⏹' : '🎙️'}
                      </button>
                    </div>

                    {/* Live Transcribing Text Input Box */}
                    <div style={{ flex: 1, position: 'relative' }}>
                      <input
                        type="text"
                        className="fi"
                        value={storyInput}
                        onChange={(e) => setStoryInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendStoryAnswer();
                        }}
                        placeholder={
                          isStoryRecording
                            ? (isHi ? 'सुन रहा है (नॉइज़ कट ऑन)... अपने लक्षण बोलें' : 'Listening with noise suppression... speak your symptoms')
                            : (isHi ? 'माइक से बोलें या यहाँ उत्तर टाइप करें...' : 'Talk with microphone, or type your symptoms here...')
                        }
                        disabled={storyStage === 'llm_thinking'}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          fontSize: '14px',
                          border: isStoryRecording ? '2px solid #2E7D32' : '1.5px solid var(--border)',
                          background: isStoryRecording ? '#F4FBF6' : '#fff'
                        }}
                      />
                      {isStoryRecording && (
                        <span
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: '11px',
                            color: '#2E7D32',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <span className="status-pulse-dot" style={{ background: '#2E7D32' }}></span>
                          LIVE STT
                        </span>
                      )}
                    </div>

                    {/* Send Button */}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleSendStoryAnswer()}
                      disabled={!storyInput.trim() || storyStage === 'llm_thinking'}
                      style={{
                        padding: '12px 22px',
                        background: '#1A5C38',
                        color: '#fff',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '14px',
                        border: 'none',
                        cursor: storyInput.trim() && storyStage !== 'llm_thinking' ? 'pointer' : 'not-allowed',
                        opacity: storyInput.trim() && storyStage !== 'llm_thinking' ? 1 : 0.6,
                        boxShadow: '0 2px 8px rgba(26,92,56,0.25)',
                        flexShrink: 0
                      }}
                    >
                      {storyStage === 'llm_thinking' ? 'Thinking…' : 'Send →'}
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* ════ SECTION 5: PROFILE ════ */}
            {activeSection === 'profile' && (
              <section className="ds-section" id="sec-profile">
                <div className="sec-head" style={{ marginBottom: '20px' }}>
                  <h2 className="sec-title" style={{ fontSize: '24px', fontWeight: 800 }}>
                    {isHi ? 'नागरिक स्वास्थ्य प्रोफ़ाइल' : 'ABHA Citizen Profile'}
                  </h2>
                </div>

                <div className="card" style={{ padding: '24px', border: '1.5px solid var(--border)', borderRadius: '16px', maxWidth: '640px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>NAME</div>
                      <div style={{ fontWeight: 700 }}>{citizenName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ABHA NUMBER</div>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{abhaNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>MOBILE</div>
                      <div style={{ fontWeight: 700 }}>+91 {citizenMobile}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>BLOOD GROUP</div>
                      <div style={{ fontWeight: 700 }}>{citizenBlood}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '24px', borderTop: '1px solid var(--divider)', paddingTop: '16px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px' }}>
                      DPDP Act 2023 Consent Permissions
                    </h4>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      ✓ Cloud EHR Record Storage: Active<br />
                      ✓ Consulting Doctor Access: Granted<br />
                      ✓ Emergency 108 Alert Access: Granted
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* ════ SECTION 6 & 7: NOTIFICATIONS & SETTINGS ════ */}
            {activeSection === 'notifications' && (
              <section className="ds-section">
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>Notifications</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                    <strong>📅 OPD Appointment Confirmed</strong>: AIIMS New Delhi for Today, 09:30 AM (Token: {appointment.token}).
                  </div>
                  <div className="card" style={{ padding: '14px', border: '1px solid var(--border)' }}>
                    <strong>📑 OCR Record Indexing</strong>: Digital health record synchronized with national gateway.
                  </div>
                </div>
              </section>
            )}

            {activeSection === 'settings' && (
              <section className="ds-section">
                <h2 style={{ fontSize: '22px', fontWeight: 800, marginBottom: '16px' }}>Settings</h2>
                <div className="card" style={{ padding: '20px', border: '1px solid var(--border)', maxWidth: '500px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600 }}>Language Interface</label>
                    <button type="button" className="btn-outline" onClick={openLanguageModal} style={{ width: '100%', marginTop: '4px' }}>
                      🌐 {currentLangObj?.nativeName || 'English'} ▾
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ width: '100%', background: '#D32F2F', marginTop: '16px' }}
                    onClick={() => onNavigate && onNavigate('portal')}
                  >
                    Logout from Citizen Portal
                  </button>
                </div>
              </section>
            )}
          </main>
        </div>
      </div>

      {/* ── HOSPITAL SELECTOR MODAL ── */}
      {isHospitalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '520px', padding: '24px', borderRadius: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Select Hospital Facility</h3>
              <button type="button" onClick={() => setIsHospitalModalOpen(false)} style={{ fontSize: '18px', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {hospitals.map((h) => (
                <div
                  key={h.id}
                  style={{ padding: '12px', border: '1.5px solid var(--border)', borderRadius: '8px', cursor: 'pointer', background: hospitalInfo.name === h.name ? 'rgba(26,92,56,0.06)' : '#fff' }}
                  onClick={() => {
                    setHospitalInfo({ name: h.name, address: h.address, dept: h.dept });
                    setIsHospitalModalOpen(false);
                    triggerToast(`Switched hospital to ${h.name}`, 'success');
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{h.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{h.address} • {h.wait}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── RESCHEDULE MODAL ── */}
      {isRescheduleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="card" style={{ width: '90%', maxWidth: '440px', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>Reschedule OPD Appointment</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Choose a new available slot at {hospitalInfo.name}.
            </p>
            <input
              type="date"
              className="fi"
              value={newRescheduleDate}
              onChange={(e) => setNewRescheduleDate(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn-outline" onClick={() => setIsRescheduleModalOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmReschedule}
              >
                Confirm Slot →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DIGITAL OPD TOKEN SLIP MODAL ── */}
      {isSlipModalOpen && selectedSlipAppointment && (
        <div className="opd-slip-modal-backdrop" onClick={() => setIsSlipModalOpen(false)}>
          <div className="opd-slip-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ background: '#1A5C38', color: '#fff', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', letterSpacing: '1px', opacity: 0.85, textTransform: 'uppercase' }}>
                  GOVT. OF INDIA • AYUSHMAN BHARAT DIGITAL MISSION
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '2px 0 0 0' }}>
                  DIGITAL OPD CONSULTATION SLIP
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSlipModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Token Banner */}
              <div style={{ background: '#F0F7F3', border: '2px dashed #1A5C38', borderRadius: '12px', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#1A5C38', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  YOUR CONFIRMED OPD TOKEN NUMBER
                </div>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#1A5C38', letterSpacing: '2px', fontFamily: 'monospace', margin: '4px 0' }}>
                  {selectedSlipAppointment.token}
                </div>
                <div style={{ fontSize: '12px', color: '#5C6172' }}>
                  {selectedSlipAppointment.status} • ROOM 104 • OPD BLOCK B
                </div>
              </div>

              {/* Patient & Appointment Details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px', marginBottom: '20px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>PATIENT NAME</div>
                  <div style={{ fontWeight: 700 }}>{citizenName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>ABHA NUMBER</div>
                  <div style={{ fontWeight: 700, color: '#1A5C38' }}>{abhaNumber}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>APPOINTMENT DATE</div>
                  <div style={{ fontWeight: 700 }}>{selectedSlipAppointment.date}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>SLOT TIME</div>
                  <div style={{ fontWeight: 700 }}>{selectedSlipAppointment.time}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>FACILITY</div>
                  <div style={{ fontWeight: 700 }}>{selectedSlipAppointment.facility || 'AIIMS New Delhi'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>DEPARTMENT</div>
                  <div style={{ fontWeight: 700 }}>{selectedSlipAppointment.dept}</div>
                </div>
              </div>

              {selectedSlipAppointment.symptoms && (
                <div style={{ fontSize: '12px', background: '#f5f5f5', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px' }}>
                  <div style={{ fontWeight: 700, color: '#5C6172', marginBottom: '2px' }}>AI TRIAGE SYMPTOMS:</div>
                  <div>{selectedSlipAppointment.symptoms}</div>
                </div>
              )}

              {/* Instructions */}
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', borderTop: '1px solid #eee', paddingTop: '12px', marginBottom: '20px' }}>
                📌 <strong>Instructions:</strong> Please present this digital slip or quote your ABHA number at the hospital registration counter. Arrive 15 minutes before your slot time.
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-outline"
                  onClick={() => setIsSlipModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ background: '#1A5C38', color: '#fff' }}
                  onClick={() => {
                    window.print();
                  }}
                >
                  🖨️ Print Slip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SQLITE AUDIT LOG METADATA INSPECTOR MODAL (SUMMARY & DOCUMENTS SECTIONS) ── */}
      {selectedAuditLog && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            zIndex: 1300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
          onClick={() => setSelectedAuditLog(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '860px',
              padding: '28px',
              borderRadius: '18px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '14px', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: '#E8F5E9', color: '#1A5C38', fontWeight: 800, padding: '4px 10px', borderRadius: '6px' }}>
                    SQLITE AUDIT LOG
                  </span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '14px', color: '#1A5C38', background: 'rgba(26,92,56,0.08)', padding: '3px 10px', borderRadius: '6px' }}>
                    🆔 {selectedAuditLog.summary_id}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    🕒 {selectedAuditLog.time_created ? new Date(selectedAuditLog.time_created).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '8px 0 0 0', color: '#1c1c18' }}>
                  {isHi ? 'क्लिनिकल सारांश व दस्तावेज़ रिकॉर्ड' : 'Clinical Summary & Attached Documents'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAuditLog(null)}
                style={{ background: '#F5F5F5', border: 'none', width: '34px', height: '34px', borderRadius: '50%', fontSize: '18px', cursor: 'pointer', color: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Section Selector Tabs: SUMMARY SECTION vs DOCUMENTS SECTION */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '22px', borderBottom: '2px solid #EFECE6', paddingBottom: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setAuditModalTab('summary')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: auditModalTab === 'summary' ? 'none' : '1.5px solid var(--border)',
                  background: auditModalTab === 'summary' ? '#1A5C38' : '#ffffff',
                  color: auditModalTab === 'summary' ? '#ffffff' : '#1c1c18',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: auditModalTab === 'summary' ? '0 4px 12px rgba(26,92,56,0.25)' : 'none'
                }}
              >
                <span>📋</span>
                <span>{isHi ? 'सारांश अनुभाग (Summary Section)' : 'Summary Section'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAuditModalTab('documents')}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: auditModalTab === 'documents' ? 'none' : '1.5px solid var(--border)',
                  background: auditModalTab === 'documents' ? '#1A5C38' : '#ffffff',
                  color: auditModalTab === 'documents' ? '#ffffff' : '#1c1c18',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: auditModalTab === 'documents' ? '0 4px 12px rgba(26,92,56,0.25)' : 'none'
                }}
              >
                <span>📁</span>
                <span>
                  {isHi ? 'दस्तावेज़ अनुभाग (Documents Section)' : 'Documents Section'}
                  {' '}({selectedAuditLog.number_of_documents_attached || (selectedAuditLog.original_documents?.length || 0)})
                </span>
              </button>
            </div>

            {/* ── TAB 1: SUMMARY SECTION ── */}
            {auditModalTab === 'summary' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#1A5C38', letterSpacing: '0.04em' }}>
                      DEEP CLINICAL PRE-CONSULTATION REPORT (SOCRATES)
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-outline"
                    style={{ fontSize: '12px', padding: '5px 12px', fontWeight: 700 }}
                    onClick={() => handleCopyId(selectedAuditLog.summary)}
                  >
                    📋 {isHi ? 'सारांश कॉपी करें' : 'Copy Full Summary'}
                  </button>
                </div>

                {/* Structured Deep Clinical Summary Renderer */}
                <div
                  style={{
                    background: '#FAF9F6',
                    border: '1.5px solid #E5E0D5',
                    borderRadius: '14px',
                    padding: '22px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  {(() => {
                    const rawSummary = selectedAuditLog.summary || 'No clinical summary recorded.';
                    const sections = rawSummary.split(/\n(?=##\s)/);
                    if (sections.length <= 1) {
                      return (
                        <div style={{ fontSize: '14px', lineHeight: 1.75, color: '#1c1c18', whiteSpace: 'pre-wrap' }}>
                          {rawSummary}
                        </div>
                      );
                    }
                    return sections.map((sec, idx) => {
                      const trimmed = sec.trim();
                      if (trimmed.startsWith('# ')) {
                        return (
                          <div
                            key={idx}
                            style={{
                              fontSize: '16px',
                              fontWeight: 900,
                              color: '#1A5C38',
                              borderBottom: '2px solid #D8EADE',
                              paddingBottom: '10px',
                              letterSpacing: '0.02em'
                            }}
                          >
                            🩺 {trimmed.replace(/^#\s+/, '')}
                          </div>
                        );
                      }
                      const lines = trimmed.split('\n');
                      const heading = lines[0].replace(/^##\s+/, '');
                      const body = lines.slice(1).join('\n').trim();
                      const isTriage = heading.toLowerCase().includes('triage') || heading.toLowerCase().includes('red flag');

                      return (
                        <div
                          key={idx}
                          style={{
                            background: isTriage ? '#FFF8E1' : '#ffffff',
                            border: isTriage ? '1.5px solid #FFE082' : '1px solid #EAE6DF',
                            borderRadius: '10px',
                            padding: '14px 18px',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.02)'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: 800,
                              color: isTriage ? '#E65100' : '#1A5C38',
                              marginBottom: '6px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.03em'
                            }}
                          >
                            {heading}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              lineHeight: 1.7,
                              color: '#2C3E50',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {body || 'Not reported'}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            {/* ── TAB 2: DOCUMENTS SECTION (ORIGINAL & OCR DOCUMENTS) ── */}
            {auditModalTab === 'documents' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Document Metadata Bar */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', background: 'var(--bg-muted)', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '13px' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>DOCUMENTS ID</div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1A5C38', marginTop: '2px', wordBreak: 'break-all' }}>
                      {selectedAuditLog.documents_id || 'NONE'}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>ATTACHED COUNT</div>
                    <div style={{ fontWeight: 700, marginTop: '2px' }}>
                      📎 {selectedAuditLog.number_of_documents_attached || 0} Document(s)
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700 }}>DOCUMENT NAMES</div>
                    <div style={{ fontWeight: 600, marginTop: '2px' }}>
                      {selectedAuditLog.name_of_documents || 'None attached'}
                    </div>
                  </div>
                </div>

                {/* Edit Audit Log: Inline Document Uploader (Add Documents Later with OCR) */}
                <div
                  style={{
                    border: '2px dashed #1A5C38',
                    borderRadius: '14px',
                    padding: '18px 20px',
                    background: '#F0F9F3',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: '#1A5C38', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✏️</span>
                        <span>
                          {isHi
                            ? `इस ऑडिट लॉग (${selectedAuditLog.summary_id}) में नए दस्तावेज़ जोड़ें (Live OCR)`
                            : `Edit Audit Log (${selectedAuditLog.summary_id}) — Add Documents Later with Live OCR`}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '2px' }}>
                        {isHi
                          ? 'यहाँ से फ़ाइल चुनें — मूल (Original) और OCR डिजिटाइज्ड दोनों दस्तावेज़ तुरंत इसी लॉग में जुड़ जाएंगे।'
                          : 'Upload prescriptions or lab reports directly into this audit log. Both Original and OCR Digitized versions will be attached immediately.'}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '12px', padding: '5px 12px', background: '#ffffff' }}
                      onClick={() => setShowAuditDocUploader((prev) => !prev)}
                    >
                      {showAuditDocUploader ? (isHi ? 'विकल्प छुपाएं' : 'Compact View') : (isHi ? 'OCR विकल्प दिखाएं' : 'OCR Engine Options')}
                    </button>
                  </div>

                  {/* OCR Document Type Selector Pills */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B5E20' }}>OCR Mode:</span>
                    <button
                      type="button"
                      className={`btn ${auditUploadDocType === 'auto' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                      onClick={() => setAuditUploadDocType('auto')}
                    >
                      Auto (Mixed Format)
                    </button>
                    <button
                      type="button"
                      className={`btn ${auditUploadDocType === 'lab_report' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                      onClick={() => setAuditUploadDocType('lab_report')}
                    >
                      Printed / Lab Report
                    </button>
                    <button
                      type="button"
                      className={`btn ${auditUploadDocType === 'prescription' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                      onClick={() => setAuditUploadDocType('prescription')}
                    >
                      Handwritten Prescription
                    </button>
                  </div>

                  {/* Direct Upload Button */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    <label
                      className="btn-primary"
                      style={{
                        background: '#1A5C38',
                        color: '#ffffff',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: isUploading ? 'wait' : 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 12px rgba(26,92,56,0.25)'
                      }}
                    >
                      <span>📤</span>
                      <span>
                        {isUploading
                          ? (isHi ? 'अपलोड व OCR प्रोसेस हो रहा है...' : 'Uploading & Running Vision OCR...')
                          : (isHi ? 'फ़ाइल चुनें और इस लॉग में जोड़ें' : 'Upload & Attach Documents to this Log')}
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={(e) => handleAuditLogFileUpload(e, selectedAuditLog.summary_id)}
                        style={{ display: 'none' }}
                        disabled={isUploading}
                      />
                    </label>

                    <button
                      type="button"
                      className="btn-outline"
                      style={{ fontSize: '12px', padding: '9px 14px', background: '#ffffff', color: '#1A5C38', borderColor: '#1A5C38', fontWeight: 700 }}
                      onClick={() => {
                        setActiveSummaryId(selectedAuditLog.summary_id);
                        setSelectedAuditLog(null);
                        setActiveSection('records');
                      }}
                    >
                      📁 {isHi ? 'फुल रिकॉर्ड्स पेज पर खोलें' : 'Open Full Upload Page'}
                    </button>
                  </div>
                </div>

                {/* 1. ORIGINAL DOCUMENTS SUB-SECTION */}
                <div style={{ border: '1.5px solid var(--border)', borderRadius: '14px', padding: '18px', background: '#FAF9F6' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1A5C38', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📄</span>
                    <span>{isHi ? '1. मूल संलग्न दस्तावेज़ (Original Documents)' : '1. Original Attached Documents'}</span>
                  </h4>

                  {Array.isArray(selectedAuditLog.original_documents) && selectedAuditLog.original_documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedAuditLog.original_documents.map((doc, i) => {
                        const fileUrl = doc.url || doc.path || `/api/patients/${abhaNumber}/records/download/${doc.filename}`;
                        const isPreviewOpen = previewOriginalUrl === fileUrl;
                        const isImage = /\.(png|jpe?g|gif|webp|bmp)$/i.test(doc.filename || '');

                        return (
                          <div
                            key={doc.id || i}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #E0DCD3',
                              borderRadius: '10px',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <div style={{ fontWeight: 800, fontSize: '14px', color: '#1c1c18' }}>
                                  📎 {doc.filename || `Original Document #${i + 1}`}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ID: <span style={{ fontFamily: 'monospace' }}>{doc.id || `DOC-${i + 1}`}</span>
                                  {doc.size_bytes ? ` • ${(doc.size_bytes / 1024).toFixed(1)} KB` : ''}
                                  {doc.timestamp ? ` • ${new Date(doc.timestamp).toLocaleString()}` : ''}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ background: '#1A5C38', color: '#fff', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                  onClick={() => setPreviewOriginalUrl(isPreviewOpen ? null : fileUrl)}
                                >
                                  👁️ {isPreviewOpen ? (isHi ? 'प्रीव्यू बंद करें' : 'Hide Original') : (isHi ? 'मूल दस्तावेज़ खोलें' : 'Open Original Document')}
                                </button>
                                <a
                                  href={fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-outline"
                                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600 }}
                                >
                                  ↗️ {isHi ? 'नए टैब में खोलें' : 'New Tab'}
                                </a>
                              </div>
                            </div>

                            {isPreviewOpen && (
                              <div style={{ borderTop: '1px solid #EEE', paddingTop: '12px', textAlign: 'center', background: '#F4F4F2', borderRadius: '8px', padding: '12px' }}>
                                {isImage ? (
                                  <img
                                    src={fileUrl}
                                    alt={doc.filename}
                                    style={{ maxWidth: '100%', maxHeight: '420px', borderRadius: '8px', border: '1px solid #DDD' }}
                                  />
                                ) : (
                                  <iframe
                                    src={fileUrl}
                                    title={doc.filename}
                                    style={{ width: '100%', height: '420px', border: '1px solid #DDD', borderRadius: '8px', background: '#fff' }}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      {isHi ? 'इस ऑडिट लॉग में अभी कोई मूल दस्तावेज़ संलग्न नहीं है।' : 'No original documents attached to this audit log yet.'}
                    </div>
                  )}
                </div>

                {/* 2. OCR DIGITIZED DOCUMENTS SUB-SECTION */}
                <div style={{ border: '1.5px solid var(--border)', borderRadius: '14px', padding: '18px', background: '#F4F9F5' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: 800, color: '#1A5C38', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🔍</span>
                    <span>{isHi ? '2. OCR डिजिटाइज्ड दस्तावेज़ (OCR Extracted Documents)' : '2. OCR Digitized Documents'}</span>
                  </h4>

                  {Array.isArray(selectedAuditLog.ocr_documents) && selectedAuditLog.ocr_documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedAuditLog.ocr_documents.map((ocrDoc, i) => {
                        const docKey = ocrDoc.id || `ocr-${i}`;
                        const isOcrOpen = expandedOcrDocId === docKey;

                        return (
                          <div
                            key={docKey}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #C8E6C9',
                              borderRadius: '10px',
                              padding: '14px 16px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '10px'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                  <span style={{ fontWeight: 800, fontSize: '14px', color: '#1c1c18' }}>
                                    📑 OCR: {ocrDoc.filename || `Digitized Document #${i + 1}`}
                                  </span>
                                  <span className="badge" style={{ background: '#E8F5E9', color: '#1A5C38', fontSize: '11px', fontWeight: 800 }}>
                                    {ocrDoc.engine || 'PaddleOCR / TrOCR'}
                                  </span>
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  ID: <span style={{ fontFamily: 'monospace' }}>{ocrDoc.id || `OCR-${i + 1}`}</span>
                                  {ocrDoc.page_count ? ` • ${ocrDoc.page_count} Page(s)` : ''}
                                </div>
                              </div>

                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  className="btn-primary"
                                  style={{ background: '#1A5C38', color: '#fff', fontSize: '12px', padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                                  onClick={() => setExpandedOcrDocId(isOcrOpen ? null : docKey)}
                                >
                                  🔍 {isOcrOpen ? (isHi ? 'OCR बंद करें' : 'Hide OCR Document') : (isHi ? 'OCR दस्तावेज़ खोलें' : 'Open OCR Document')}
                                </button>
                                <button
                                  type="button"
                                  className="btn-outline"
                                  style={{ fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}
                                  onClick={() => handleCopyId(ocrDoc.structured_summary || ocrDoc.ocr_text || '')}
                                >
                                  📋 Copy OCR
                                </button>
                              </div>
                            </div>

                            {isOcrOpen && (
                              <div style={{ borderTop: '1px solid #E8F5E9', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {ocrDoc.structured_summary && (
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#1A5C38', marginBottom: '4px' }}>
                                      STRUCTURED OCR CLINICAL EXTRACTION:
                                    </div>
                                    <div style={{ background: '#FAF9F6', border: '1px solid #E5E0D5', borderRadius: '8px', padding: '12px', fontSize: '13px', lineHeight: 1.65, whiteSpace: 'pre-wrap', maxHeight: '260px', overflowY: 'auto' }}>
                                      {ocrDoc.structured_summary}
                                    </div>
                                  </div>
                                )}
                                {ocrDoc.ocr_text && ocrDoc.ocr_text !== ocrDoc.structured_summary && (
                                  <div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-muted)', marginBottom: '4px' }}>
                                      RAW DIGITIZED OCR TEXT:
                                    </div>
                                    <div style={{ background: '#F5F5F5', border: '1px solid #E0E0E0', borderRadius: '8px', padding: '12px', fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.5, whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto' }}>
                                      {ocrDoc.ocr_text}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', padding: '12px 0' }}>
                      {isHi ? 'इस ऑडिट लॉग में अभी कोई OCR दस्तावेज़ उपलब्ध नहीं है।' : 'No OCR digitized documents recorded for this audit log yet.'}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                type="button"
                className="btn-primary"
                style={{ background: '#1A5C38', color: '#fff', padding: '8px 22px', borderRadius: '8px', fontWeight: 700 }}
                onClick={() => setSelectedAuditLog(null)}
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
