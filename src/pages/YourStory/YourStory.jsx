import { useEffect, useRef, useState } from 'react';
import './YourStory.css';

export default function YourStory({ onNavigate }) {
  const [isRecording, setIsRecording] = useState(false);
  const [answer, setAnswer] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [turn, setTurn] = useState(null);
  const [language, setLanguage] = useState('en');
  const [loading, setLoading] = useState(true);
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
    const API_URL = import.meta.env.VITE_API_URL || '';
    const response = await fetch(`${API_URL}/api/interview/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) throw new Error((await response.json().catch(() => ({}))).detail || 'The interviewer is unavailable. Please try again.');
    return response.json();
  };

  const startInterview = (selectedLanguage) => {
    setLoading(true); setError(''); setAnswer(''); window.speechSynthesis?.cancel();
    request('start', { language: selectedLanguage }).then((data) => { setConversationId(data.conversationId); setTurn(data); speakQuestion(data.question, selectedLanguage); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    request('start', { language: 'en' }).then((data) => { setConversationId(data.conversationId); setTurn(data); speakQuestion(data.question, 'en'); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    return () => recognition.current?.stop();
  }, []);

  const handleMicMouseDown = () => {
    if (isRecording) { recognition.current?.stop(); return; }
    if (loading) return;
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setError('Speech recognition is not supported by this browser. You can type your answer instead.'); return; }
    const recognizer = new Recognition();
    recognizer.lang = language === 'hi' ? 'hi-IN' : 'en-IN';
    recognizer.interimResults = true;
    recognizer.onstart = () => setIsRecording(true);
    recognizer.onresult = (event) => setAnswer(Array.from(event.results).map((result) => result[0].transcript).join(''));
    recognizer.onerror = (event) => setError(event.error === 'not-allowed' ? 'Microphone permission was denied. Please allow it or type your answer.' : 'Speech could not be recognized. Please try again or edit the text.');
    recognizer.onend = () => setIsRecording(false);
    recognition.current = recognizer;
    recognizer.start();
  };

  const handleContinue = async (value = answer, inputType = 'text') => {
    if (!value.trim() || loading || !conversationId || submitting.current) { if (!value.trim()) setError('Please answer before continuing.'); return; }
    submitting.current = true; setLoading(true); setError('');
    try { const data = await request('message', { conversationId, text: value, inputType, language }); setTurn(data); setAnswer(''); if (data.complete) onNavigate?.('doctor', { summary: data.summary }); else speakQuestion(data.question, data.language); }
    catch (e) { setError(e.message); } finally { submitting.current = false; setLoading(false); }
  };

  return (
    <div className="story-container">
      {/* Top Global Header */}
      <header className="story-header">
        <div className="story-header-inner">
          <div className="story-header-left">
            <img 
              src="https://lh3.googleusercontent.com/aida/AEtjO1WsmWm1b7dSIe0kmK-rc-_LIXyDScv_VWCU3xv3WQuNLdpL6-gjkhlrbb44rh9lvIozRSFtDSd_OCrjR6_C6RbXNWGIFLv2mqcZkO_eDqJhE4gnQh8AIKIKYuXOkncgudqzoPzHLtcEsAVcBq9xEz66WgMK58JBTyL3Y3wcOMDaCYR2ynibKHZD-8yROJZdYRR_2IXRuwPn1sZgeWt_sQvCLgw5CsyaS7fWfVeh6NfpTkAZ9pqEdJkIZQ" 
              alt="AyuLeakha" 
              className="story-brand-logo" 
            />
            <div className="story-header-divider"></div>
            <div className="story-header-context">
              AIIMS OPD • BLOCK B • ROOM 104
            </div>
          </div>

          <div className="story-header-right">
            <div className="story-lang-switcher">
              <button className={language === 'en' ? 'lang-en' : 'lang-btn focus-ring'} onClick={() => { setLanguage('en'); startInterview('en'); }}>EN</button>
              <span className="lang-sep">|</span>
              <button className={language === 'hi' ? 'lang-en' : 'lang-btn focus-ring'} onClick={() => { setLanguage('hi'); startInterview('hi'); }}>हिन्दी</button>
              <span className="lang-sep">|</span>
            </div>

            <button className="listen-btn focus-ring" onClick={() => speakQuestion(turn?.question)}>
              <svg className="listen-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
              </svg>
              <span>Listen Assist / सुनें</span>
            </button>

            <div className="user-badge">
              <span className="status-dot"></span>
              <span>TOKEN: <strong className="token-strong">#B-42</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Nav Rail */}
      <nav className="story-nav-rail" aria-label="Clinical Intake Progress">
        <div className="nav-rail-inner">
          <div className="nav-rail-meta">
            <div>STAGE 03 OF 04 • SPEECH HISTORY INTAKE</div>
            <div>REGISTRY REF: ABDM-2025-DL-AIIMS-0982</div>
          </div>

          <div className="nav-rail-track-container">
            <div className="track-bg"></div>
            <div className="track-fill"></div>

            <div className="stage-completed">
              <svg className="stage-completed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span>YOU</span>
            </div>

            <div className="stage-completed">
              <svg className="stage-completed-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
              </svg>
              <span>CONSENT</span>
            </div>

            <div className="stage-active">
              <div className="stage-active-dot"></div>
              <div className="stage-active-content">
                <svg className="stage-active-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
                </svg>
                <span>YOUR STORY</span>
              </div>
            </div>

            <div className="stage-upcoming">
              <svg className="stage-upcoming-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span>DOCTOR</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="story-main">
        <div className="story-queue-info">
          <div className="queue-wait-text">
            Token 47 · now serving 31 · about 38 minutes
          </div>
          <div className="active-mode-label">
            Core interview · about 12 questions
          </div>
          
          <div className="intake-variants">
            <span className="intake-label">Intake Pace:</span>
            <span className="intake-option" title="Queue wait: >45 mins">
              <strong className="intake-option-bold">Full:</strong> Full intake · ~18 questions
            </span>
            <span className="intake-option active" title="Queue wait: ~30–45 mins">
              <strong className="intake-option-bold">Core:</strong> Core interview · ~12 questions (Active)
            </span>
            <span className="intake-option" title="Queue wait: ~15–30 mins">
              <strong className="intake-option-bold">Focused:</strong> Focused check · ~6 questions
            </span>
            <span className="intake-option" title="Queue wait: <15 mins">
              <strong className="intake-option-bold">Triage:</strong> Rapid triage · ~3 questions
            </span>
          </div>
        </div>

        <div className="story-hero">
          <div className="hero-meta">
            <span>CHIEF COMPLAINT &amp; SYMPTOM ONSET</span>
            <span className="meta-dot">•</span>
            <span className="meta-highlight">VOICE NARRATIVE MODE</span>
          </div>
          <h1 className="hero-title">
            {loading ? 'Preparing your next question…' : turn?.question || 'Your interview could not be started.'}
          </h1>
          <p className="hero-subtitle">
            {language === 'hi' ? 'कृपया अपनी भाषा में आराम से उत्तर दें।' : 'Please answer in the language you are most comfortable using.'}
          </p>
        </div>

        <div className="story-mic-section">
          <div className="mic-wrapper">
            {isRecording && <div className="mic-pulse-ring pulse-ring"></div>}
            
            <button 
              type="button" 
              className="mic-btn focus-ring" 
              aria-label={isRecording ? 'Stop recording your answer' : 'Start recording your answer'}
              onClick={handleMicMouseDown}
            >
              <svg className="mic-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
              <span className="mic-label">{isRecording ? 'Tap to stop' : 'Tap to speak'}</span>
            </button>
          </div>

          <div className="mic-instructions">
            <span className="instructions-primary">Tap to speak / बोलने के लिए टैप करें</span>
            <span className="instructions-secondary">Tap again when you finish speaking</span>
          </div>

          <div className="waveform" aria-hidden="true" style={{ opacity: isRecording ? 1 : 0.3 }}>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.1s', height: '12px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.3s', height: '20px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.15s', height: '32px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.45s', height: '16px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.2s', height: '36px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.5s', height: '24px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.25s', height: '40px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.05s', height: '28px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.4s', height: '36px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.6s', height: '20px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.35s', height: '32px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.1s', height: '16px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.55s', height: '24px' }}></span>
            <span className={isRecording ? "wave-bar" : ""} style={{ animationDelay: '0.2s', height: '12px' }}></span>
          </div>
        </div>

        <div className="divider"></div>

        <div className="story-transcript">
            <div className="transcript-status">
              <span className="status-pulse-dot"></span>
              <span>{isRecording ? 'Listening… release when finished' : 'Review or edit your answer before submitting'}</span>
              <span className="meta-dot">•</span>
              <span>DIALECT: HINDI / ENGLISH MIX</span>
            </div>

            <textarea className="conversation-input" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer, or hold the microphone to speak…" disabled={loading} />

            <div className="transcript-tags">
              {turn?.options?.map((option) => <button className="tag-item" type="button" key={option} onClick={() => { setAnswer(option); document.querySelector('.conversation-input')?.focus(); }}>{option}</button>)}
            </div>
        </div>
        {error && <p className="conversation-error">{error}</p>}

        <div className="story-actions">
          <div className="action-links">
            <button type="button" className="action-link focus-ring" onClick={() => document.querySelector('.conversation-input')?.focus()}>Type instead (कीबोर्ड से लिखें)</button>
            <span className="action-link-sep">•</span>
            <button type="button" className="action-link focus-ring">Tap to answer (विकल्प चुनकर उत्तर दें)</button>
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
            <svg className="compliance-icon" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <span>DPDP ACT 2023 &amp; ABDM ENCRYPTED • ON-DEVICE WHISPER TRANSCRIPTION</span>
          </div>

          <a href="#" className="footer-emergency-btn focus-ring">
            <svg className="emergency-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
            </svg>
            <span>Emergency — get help now (011-26588500)</span>
          </a>
        </div>
      </footer>
    </div>
  );
}
