import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { sendChatMessage } from '../../../apps/patient/src/api/chatbot';
import './ChatbotPanel.css';

export default function ChatbotPanel({ isOpen, onClose }) {
  const { t, currentLangObj } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const panelRef = useRef(null);
  const abortControllerRef = useRef(null);

  const emergencyKeywords = [
    'chest pain', 'heart attack', 'breathing', 'stroke', 'bleeding', 'faint',
    'छाती में दर्द', 'सांस लेने में', 'दिल का दौरा'
  ];

  const hasEmergency = (text) => {
    const lower = text.toLowerCase();
    return emergencyKeywords.some(kw => lower.includes(kw));
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      panelRef.current?.focus();
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (messageText) => {
    const text = messageText || input;
    if (!text.trim()) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessage = { id: Date.now(), role: 'user', content: text, emergency: hasEmergency(text) };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const languageCode = currentLangObj?.code || 'en';
      const data = await sendChatMessage(text, languageCode, controller.signal);
      
      const assistantMessage = { 
        id: Date.now() + 1, 
        role: 'assistant', 
        content: data.reply,
        emergency: data.isEmergency || userMessage.emergency,
        webInsights: data.webInsights
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
      }
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setError(null);
  };

  const suggestions = [
    t('chatbot.suggest1', 'How do I book an appointment?'),
    t('chatbot.suggest2', 'Where can I see my reports?'),
    t('chatbot.suggest3', 'What is my ABHA ID?')
  ];

  if (!isOpen) return null;

  return (
    <div className="chatbot-overlay" onClick={(e) => e.target.classList.contains('chatbot-overlay') && onClose()}>
      <div 
        className="chatbot-panel" 
        role="dialog" 
        aria-label="Health Assistant" 
        aria-modal="true"
        ref={panelRef}
        tabIndex="-1"
      >
        <div className="chatbot-header">
          <div>
            <h2 className="chatbot-title">AyuLekha Assistant</h2>
            <p className="chatbot-subtitle">Powered by TinyFish AI</p>
          </div>
          <button className="chatbot-close-btn focus-ring" onClick={onClose} aria-label="Close assistant">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
        
        <div className="chatbot-disclaimer">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>This assistant gives general information only and does not diagnose or replace a doctor.</span>
        </div>

        <div className="chatbot-messages" aria-live="polite">
          {messages.length === 0 && !isTyping && (
            <div className="chatbot-empty">
              <p>How can I help you today?</p>
              <div className="chatbot-suggestions">
                {suggestions.map((sug, i) => (
                  <button key={i} className="chatbot-chip" onClick={() => handleSend(sug)}>
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`chatbot-message-wrapper ${msg.role}`}>
              {msg.emergency && msg.role === 'assistant' && (
                <div className="chatbot-emergency-banner">
                  <p><strong>Warning:</strong> This sounds like an emergency.</p>
                  <a href="tel:108" className="chatbot-call-btn">Call 108 Now</a>
                </div>
              )}
              <div className={`chatbot-bubble ${msg.role}`}>
                {msg.content}
                {msg.webInsights && msg.webInsights.results && (
                  <div className="chatbot-insights">
                    <strong>Web Reference:</strong>
                    <ul>
                      {msg.webInsights.results.map((res, i) => (
                        <li key={i}><a href={res.url} target="_blank" rel="noopener noreferrer">{res.title}</a></li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="chatbot-message-wrapper assistant">
              <div className="chatbot-bubble assistant typing">
                <span className="dot"></span><span className="dot"></span><span className="dot"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="chatbot-error">
              <p>{error}</p>
              <button className="chatbot-retry-btn" onClick={() => handleSend(messages[messages.length - 1]?.content)}>Retry</button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="chatbot-input-area">
          {messages.length > 0 && (
            <button className="chatbot-clear-btn" onClick={handleClear} title="Clear chat">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          )}
          <textarea 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isTyping ? 'Assistant is typing...' : 'Type a message...'}
            disabled={isTyping}
            className="chatbot-input"
            rows={1}
          />
          <button 
            className="chatbot-send-btn focus-ring"
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
