import { useEffect, useRef, useState } from 'react';
import { saveStory } from '../../api';
import { usePatient } from '../../contexts/PatientContext';
import { useLanguage } from '../../contexts/LanguageContext';
import './NewAppointment.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function NewAppointment({ onNavigate }) {
  const { patient } = usePatient();
  const { language, toggleLanguage } = useLanguage();
  const [answer, setAnswer] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [turn, setTurn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState('');
  const recognition = useRef(null);
  const submitting = useRef(false);

  const speakQuestion = (question, lang = language) => {
    if (!('speechSynthesis' in window) || !question) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  const request = async (path, body) => {
    const response = await fetch(`${API_URL}/api/interview/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.detail || 'The AI interviewer is unavailable. Please try again.');
    }
    return data;
  };

  const startInterview = async (selectedLanguage) => {
    setLoading(true);
    setError('');
    setAnswer('');
    setTurn(null);
    setConversationId(null);
    window.speechSynthesis?.cancel();

    try {
      const data = await request('start', { language: selectedLanguage });
      setConversationId(data.conversationId);
      setTurn(data);
      speakQuestion(data.question, selectedLanguage);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startInterview(language);
    return () => {
      recognition.current?.stop();
      window.speechSynthesis?.cancel();
    };
  }, [language]);

  const handleMicClick = () => {
    if (isRecording) {
      recognition.current?.stop();
      return;
    }
    if (loading) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setError('Speech recognition is not supported by this browser. You can type your answer instead.');
      return;
    }

    const recognizer = new Recognition();
    recognizer.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognizer.interimResults = true;
    recognizer.onstart = () => setIsRecording(true);
    recognizer.onresult = (event) => {
      setAnswer(Array.from(event.results).map((result) => result[0].transcript).join(''));
    };
    recognizer.onerror = (event) => {
      setError(event.error === 'not-allowed'
        ? 'Microphone permission was denied. Please allow it or type your answer.'
        : 'Speech could not be recognized. Please try again or edit the text.');
    };
    recognizer.onend = () => setIsRecording(false);
    recognition.current = recognizer;
    recognizer.start();
  };

  const saveCompletedInterview = async (summary) => {
    const story = [summary.chiefComplaint, summary.hpi, summary.clinicalNote]
      .filter(Boolean)
      .join('\n\n');
    await saveStory(patient?.id || 'GUEST', story || 'AI intake completed', summary.triageIndicators || []);
  };

  const handleContinue = async () => {
    const text = answer.trim();
    if (!text || loading || !conversationId || submitting.current) {
      if (!text) setError('Please answer before continuing.');
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError('');
    try {
      const data = await request('message', {
        conversationId,
        text,
        inputType: isRecording ? 'speech' : 'text',
        language,
      });
      setAnswer('');
      setTurn(data);

      if (data.complete) {
        await saveCompletedInterview(data.summary || {});
        onNavigate?.('dashboard');
      } else {
        speakQuestion(data.question, data.language);
      }
    } catch (err) {
      setError(err.message || 'Could not save your appointment intake. Please try again.');
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  const changeLanguage = (nextLanguage) => {
    if (nextLanguage === language && turn) return;
    toggleLanguage(nextLanguage);
  };

  return (
    <div className="story-container">
      <header className="story-header">
        <div className="story-header-inner">
          <div className="story-header-left">
            <div className="story-header-context">NEW APPOINTMENT · AI INTAKE</div>
          </div>
          <div className="story-header-right">
            <div className="story-lang-switcher">
              <button type="button" className={language === 'en' ? 'lang-en' : 'lang-btn focus-ring'} onClick={() => changeLanguage('en')}>EN</button>
              <span className="lang-sep">|</span>
              <button type="button" className={language === 'hi' ? 'lang-en' : 'lang-btn focus-ring'} onClick={() => changeLanguage('hi')}>हिन्दी</button>
            </div>
            <button type="button" className="listen-btn focus-ring" onClick={() => speakQuestion(turn?.question)} disabled={!turn}>Listen assist</button>
            <div className="user-badge">
              <span className="status-dot"></span>
              <span>TOKEN: <strong className="token-strong">{patient ? `#${patient.id}` : '#GUEST'}</strong></span>
            </div>
          </div>
        </div>
      </header>

      <nav className="story-nav-rail" aria-label="Appointment intake progress">
        <div className="nav-rail-inner">
          <div className="nav-rail-meta">
            <div>NEW APPOINTMENT · AI SYMPTOM INTAKE</div>
            <div>AYULEKHA AI · SOCRATES FRAMEWORK</div>
          </div>
        </div>
      </nav>

      <main className="story-main">
        <div className="story-hero">
          <div className="hero-meta"><span>YOUR STORY</span><span className="meta-dot">•</span><span className="meta-highlight">AI GUIDED</span></div>
          <h1 className="hero-title">{loading ? 'Preparing your next question…' : turn?.question || 'Your interview could not be started.'}</h1>
          <p className="hero-subtitle">{language === 'hi' ? 'कृपया अपनी भाषा में आराम से उत्तर दें।' : 'Please answer in the language you are most comfortable using.'}</p>
        </div>

        <div className="story-mic-section">
          <div className="mic-wrapper">
            {isRecording && <div className="mic-pulse-ring pulse-ring"></div>}
            <button type="button" className="mic-btn focus-ring" aria-label={isRecording ? 'Stop recording' : 'Start recording'} onClick={handleMicClick} disabled={loading}>
              <span className="mic-label">{isRecording ? 'Tap to stop' : 'Tap to speak'}</span>
            </button>
          </div>
          <div className="mic-instructions"><span className="instructions-primary">Tap to speak / बोलने के लिए टैप करें</span><span className="instructions-secondary">You can also type below.</span></div>
        </div>

        <div className="divider"></div>
        <div className="story-transcript">
          <div className="transcript-status"><span className="status-pulse-dot"></span><span>{isRecording ? 'Listening…' : 'Review or edit your answer before submitting'}</span></div>
          <textarea className="conversation-input" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="Type your answer, or tap the microphone to speak…" disabled={loading} />
          {turn?.options?.length > 0 && (
            <div className="transcript-tags">
              {turn.options.map((option) => <button className="tag-item" type="button" key={option} onClick={() => setAnswer(option)}>{option}</button>)}
            </div>
          )}
        </div>

        {error && <p className="conversation-error">{error}</p>}
        <div className="story-actions">
          <button type="button" className="action-link focus-ring" onClick={() => onNavigate?.('dashboard')} disabled={loading}>Cancel</button>
          <button type="button" className="action-continue-btn focus-ring" onClick={handleContinue} disabled={loading}>{loading ? 'AI is processing…' : 'Submit answer →'}</button>
        </div>
      </main>
    </div>
  );
}
