import { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './YourStory.css';

export default function YourStory({ onNavigate, email, patientId, patient, medicalHistory }) {
  const { language, openLanguageModal, LANGUAGES, getSpeechLang, t } = useLanguage();

  const [isRecording, setIsRecording] = useState(false);
  const [answer, setAnswer] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [turn, setTurn] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const recognition = useRef(null);
  const submitting = useRef(false);

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const speakQuestion = (question, lang = language) => {
    if (!('speechSynthesis' in window) || !question) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(question);
    utterance.lang = getSpeechLang(lang);
    utterance.rate = 0.9;

    window.speechSynthesis.speak(utterance);
  };

  const request = async (path, body) => {
    const API_URL = import.meta.env.VITE_API_URL || '';

    const response = await fetch(
      `${API_URL}/api/interview/${path}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      throw new Error(
        (await response.json().catch(() => ({}))).detail ||
        'The interviewer is unavailable. Please try again.'
      );
    }

    return response.json();
  };

  const startInterview = (selectedLanguage) => {
    setLoading(true);
    setError('');
    setAnswer('');

    request('start', {
      language: selectedLanguage,
      patientId: patientId,
      medicalHistory: medicalHistory,
    })
      .then((data) => {
        setConversationId(data.conversationId);
        setTurn(data);
        speakQuestion(data.question, data.language);
      })
      .catch((e) => {
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    startInterview(language);

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognition.current) {
        recognition.current.stop();
      }
    };
  }, []);

  const handleMicMouseDown = () => {
    if (isRecording) {
      if (recognition.current) {
        recognition.current.stop();
      }
      return;
    }

    setError('');

    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setError(
        'Speech recognition is not supported in this browser. Please type your answer.'
      );
      return;
    }

    const recognizer = new Recognition();

    recognizer.lang = getSpeechLang(language);
    recognizer.interimResults = true;

    recognizer.onstart = () => {
      setIsRecording(true);
    };

    recognizer.onresult = (event) => {
      setAnswer(
        Array.from(event.results)
          .map((result) => result[0].transcript)
          .join('')
      );
    };

    recognizer.onerror = (event) => {
      setError(
        event.error === 'not-allowed'
          ? 'Microphone permission was denied. Please allow it or type your answer.'
          : 'Speech could not be recognized. Please try again or edit the text.'
      );
    };

    recognizer.onend = () => {
      setIsRecording(false);
    };

    recognition.current = recognizer;
    recognizer.start();
  };

  const handleContinue = async (
    value = answer,
    inputType = 'text'
  ) => {
    if (
      !value.trim() ||
      loading ||
      !conversationId ||
      submitting.current
    ) {
      if (!value.trim()) {
        setError('Please answer before continuing.');
      }
      return;
    }

    submitting.current = true;
    setLoading(true);
    setError('');

    try {
      const data = await request('message', {
        conversationId,
        text: value,
        inputType,
        language,
      });

      setTurn(data);
      setAnswer('');

      if (data.complete) {
        // Save the story to the backend
        try {
          await fetch('/api/patients/story', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              patientId: patientId,
              story: data.summary?.hpi || data.summary?.chiefComplaint || '',
              symptoms: data.summary
            })
          });
        } catch (e) {
          console.error('Failed to save story to backend:', e);
        }

        onNavigate?.('doctor', {
          summary: data.summary,
          patientId: patientId,
          patient: patient,
          medicalHistory: medicalHistory,
        });
      } else {
        speakQuestion(data.question, data.language);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      submitting.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="story-container">
      {/* Top Global Header (With Local SVG Logo & Forest Green Styling) */}
      <header className="story-header">
        <div className="story-header-inner">
          <div className="story-header-left">
            <div className="brand-logo-wrap">
              <img
                src="/assets/logo.svg"
                alt="AyuLekha"
                className="story-brand-logo"
              />
              <div className="header-brand-text">
                <span className="brand-title">AyuLekha</span>
                <span className="brand-sub font-mono">
                  {t('yourStory.brandSub') || 'AIIMS OPD • BLOCK B • ROOM 104'}
                </span>
              </div>
            </div>
          </div>

          <div className="story-header-right">
            <button
              type="button"
              className="lang-toggle font-mono"
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(26,92,56,0.08)',
                border: '1.5px solid #1A5C38',
                borderRadius: '8px',
                fontWeight: 'bold',
                color: '#1A5C38',
                fontSize: '13px',
              }}
              onClick={openLanguageModal}
              title={t('selectLanguage') || 'Select Language'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                translate
              </span>
              <span>{currentLangObj?.nativeName || 'Language'}</span>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                arrow_drop_down
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="story-main">
        <div className="story-hero">
          <div className="hero-meta">
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
              record_voice_over
            </span>
            <span>CHIEF COMPLAINT &amp; SYMPTOM ONSET</span>
            <span className="meta-dot">•</span>
            <span className="meta-highlight">VOICE NARRATIVE MODE</span>
          </div>

          <h1 className="hero-title">
            {loading
              ? 'Preparing your next question…'
              : turn?.question || 'Your interview could not be started.'}
          </h1>

          <p className="hero-subtitle">
            {t('yourStory.heroSubtitleVoice')}
          </p>
        </div>

        <div className="story-mic-section">
          <div className="mic-wrapper">
            {isRecording && <div className="mic-pulse-ring pulse-ring"></div>}

            <button
              type="button"
              className={`mic-btn focus-ring ${isRecording ? 'recording' : ''}`}
              aria-label={
                isRecording
                  ? 'Stop recording your answer'
                  : 'Start recording your answer'
              }
              onClick={handleMicMouseDown}
            >
              <svg
                className="mic-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.8"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>

              <span className="mic-label">
                {isRecording ? 'Tap to stop' : 'Tap to speak'}
              </span>
            </button>
          </div>

          <div className="mic-instructions">
            <span className="instructions-primary">
              {t('yourStory.instructionsPrimary')}
            </span>

            <span className="instructions-secondary">
              Tap again when you finish speaking
            </span>
          </div>

          <div
            className="waveform"
            aria-hidden="true"
            style={{
              opacity: isRecording ? 1 : 0.3,
            }}
          >
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.1s', height: '12px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.3s', height: '20px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.15s', height: '32px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.45s', height: '16px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.2s', height: '36px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.5s', height: '24px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.25s', height: '40px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.05s', height: '28px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.4s', height: '36px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.6s', height: '20px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.35s', height: '32px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.1s', height: '16px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.55s', height: '24px' }}></span>
            <span className={isRecording ? 'wave-bar' : ''} style={{ animationDelay: '0.2s', height: '12px' }}></span>
          </div>
        </div>

        <div className="divider"></div>

        <div className="story-transcript">
          <div className="transcript-status">
            <span className="status-pulse-dot"></span>
            <span>
              {isRecording
                ? 'Listening… tap mic to finish'
                : 'Review or edit your answer before submitting'}
            </span>
            <span className="meta-dot">•</span>
            <span>DIALECT: HINDI / ENGLISH MIX</span>
          </div>

          <textarea
            className="conversation-input"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Type your answer, or tap the microphone to speak…"
            disabled={loading}
          />

          {turn?.options && turn.options.length > 0 && (
            <div className="transcript-tags">
              <span className="tags-label">Quick Suggestions:</span>
              {turn.options.map((option) => (
                <button
                  className="tag-item"
                  type="button"
                  key={option}
                  onClick={() => {
                    setAnswer(option);
                    document.querySelector('.conversation-input')?.focus();
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="conversation-error">{error}</p>}

        <div className="story-actions">
          <div className="action-links">
            <button
              type="button"
              className="action-link focus-ring"
              onClick={() => document.querySelector('.conversation-input')?.focus()}
            >
              {t('yourStory.typeInstead')}
            </button>

            <span className="action-link-sep">•</span>

            <button
              type="button"
              className="action-link focus-ring"
              onClick={() => speakQuestion(turn?.question)}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: '18px', verticalAlign: 'middle', marginRight: '4px' }}
              >
                volume_up
              </span>
              {t('yourStory.listenAssist') || 'Listen question'}
            </button>
          </div>

          <button
            type="button"
            className="action-continue-btn focus-ring"
            onClick={() => handleContinue()}
            disabled={loading}
          >
            {loading ? 'AI is processing…' : 'Submit answer →'}
          </button>
        </div>
      </main>

      {/* Bottom Global Sticky Emergency Bar */}
      <footer className="story-footer">
        <div className="footer-inner">
          <div className="footer-compliance">
            <span
              className="material-symbols-outlined compliance-icon"
              style={{ fontSize: '18px' }}
            >
              verified_user
            </span>
            <span>
              DPDP ACT 2023 &amp; ABDM ENCRYPTED • ON-DEVICE WHISPER TRANSCRIPTION
            </span>
          </div>

          <a href="tel:01126588500" className="footer-emergency-btn focus-ring">
            <span
              className="material-symbols-outlined emergency-icon"
              style={{ fontSize: '18px' }}
            >
              emergency
            </span>
            <span>Emergency — get help now (011-26588500)</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
