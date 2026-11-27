import React, { useState } from 'react';
import './FormattedAuditReport.css';

export default function FormattedAuditReport({ auditLog, onRevokeNoticed }) {
  const [viewMode, setViewMode] = useState('structured'); // 'structured' | 'raw'

  if (!auditLog) return null;

  const rawSummary = auditLog.summary || '';

  // Parse markdown sections
  const parseSections = (text) => {
    const sections = {};
    const lines = text.split('\n');
    let currentSection = 'Overview';
    let currentContent = [];

    lines.forEach((line) => {
      const match = line.match(/^##\s*(?:\d+\.\s*)?([^\n]+)/);
      if (match) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = match[1].trim();
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    });

    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  };

  const parsed = parseSections(rawSummary);

  // Helper to extract key-value bullets like - **Site:** Value
  const parseBullets = (sectionText) => {
    if (!sectionText) return [];
    const items = [];
    const lines = sectionText.split('\n');
    lines.forEach((l) => {
      const clean = l.trim().replace(/^[-*]\s*/, '');
      const kv = clean.match(/^\*\*([^*]+)\*\*:\s*(.*)$/);
      if (kv) {
        items.push({ key: kv[1].trim(), val: kv[2].trim() });
      } else if (clean.length > 0 && !clean.startsWith('#')) {
        items.push({ key: '', val: clean });
      }
    });
    return items;
  };

  // Extract SOCRATES items if present
  const hpiKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('hpi') || k.toLowerCase().includes('history of present illness'));
  const hpiBullets = hpiKey ? parseBullets(parsed[hpiKey]) : [];

  // Extract CC
  const ccKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('chief complaint') || k.toLowerCase().includes('cc'));
  const ccText = ccKey ? parsed[ccKey] : '';

  // Extract Triage / Red Flags
  const triageKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('triage') || k.toLowerCase().includes('red flag'));
  const triageText = triageKey ? parsed[triageKey] : '';
  const isRedFlag = triageText.toLowerCase().includes('red flag') || triageText.toLowerCase().includes('urgent') || triageText.toLowerCase().includes('emergency') || triageText.toLowerCase().includes('chest pain');

  // Extract Clinical Impression
  const impressionKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('clinical synthesis') || k.toLowerCase().includes('impression') || k.toLowerCase().includes('differential'));
  const impressionText = impressionKey ? parsed[impressionKey] : '';

  // Extract Recommended Workup
  const workupKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('recommended workup') || k.toLowerCase().includes('workup'));
  const workupText = workupKey ? parsed[workupKey] : '';

  // Extract PMH
  const pmhKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('past medical') || k.toLowerCase().includes('pmh'));
  const pmhText = pmhKey ? parsed[pmhKey] : '';

  // Extract ROS
  const rosKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('review of systems') || k.toLowerCase().includes('ros'));
  const rosText = rosKey ? parsed[rosKey] : '';

  // Extract Handoff
  const handoffKey = Object.keys(parsed).find((k) => k.toLowerCase().includes('handoff') || k.toLowerCase().includes('note'));
  const handoffText = handoffKey ? parsed[handoffKey] : '';

  return (
    <div className="far-container">
      {/* View Toggle */}
      <div className="far-view-toggle">
        <span className="far-badge">SQLite Audit Record</span>
        <div className="far-toggle-btns">
          <button
            type="button"
            className={`far-tb ${viewMode === 'structured' ? 'active' : ''}`}
            onClick={() => setViewMode('structured')}
          >
            📋 Structured Clinical View
          </button>
          <button
            type="button"
            className={`far-tb ${viewMode === 'raw' ? 'active' : ''}`}
            onClick={() => setViewMode('raw')}
          >
            📜 Raw Markdown
          </button>
        </div>
      </div>

      {viewMode === 'raw' ? (
        <pre className="far-raw-pre">{rawSummary || 'No summary text recorded in this audit log.'}</pre>
      ) : (
        <div className="far-content">
          {/* TRIAGE / URGENCY ALERT BANNER */}
          {triageText && (
            <div className={`far-triage-banner ${isRedFlag ? 'urgent' : 'stable'}`}>
              <div className="far-triage-icon">{isRedFlag ? '🚨' : '✅'}</div>
              <div>
                <div className="far-triage-title">
                  {isRedFlag ? 'Priority Clinical Red-Flag Triggered' : 'Routine OPD Triage — Clinically Stable'}
                </div>
                <div className="far-triage-body">{triageText}</div>
              </div>
            </div>
          )}

          {/* AT A GLANCE CHIEF COMPLAINT CARD */}
          {ccText && (
            <div className="far-card far-cc-card">
              <div className="far-card-header">
                <span className="far-card-icon">🩺</span>
                <span className="far-card-title">Chief Complaint (Presenting Problem)</span>
              </div>
              <div className="far-card-body far-cc-text">
                {ccText.replace(/^[-*]\s*/, '')}
              </div>
            </div>
          )}

          {/* SOCRATES HPI GRID */}
          {hpiBullets.length > 0 ? (
            <div className="far-card">
              <div className="far-card-header">
                <span className="far-card-icon">🔍</span>
                <span className="far-card-title">History of Present Illness (SOCRATES Analysis)</span>
              </div>
              <div className="far-socrates-grid">
                {hpiBullets.map((item, idx) => (
                  <div key={idx} className="far-soc-item">
                    <div className="far-soc-key">{item.key || 'Detail'}</div>
                    <div className="far-soc-val">{item.val}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            parsed[hpiKey] && (
              <div className="far-card">
                <div className="far-card-header">
                  <span className="far-card-icon">🔍</span>
                  <span className="far-card-title">History of Present Illness</span>
                </div>
                <div className="far-card-body">{parsed[hpiKey]}</div>
              </div>
            )
          )}

          {/* CLINICAL IMPRESSION & DIFFERENTIALS */}
          {impressionText && (
            <div className="far-card far-impression-card">
              <div className="far-card-header">
                <span className="far-card-icon">💡</span>
                <span className="far-card-title">Clinical Synthesis & Differential Considerations</span>
              </div>
              <div className="far-card-body far-impression-text">
                {impressionText}
              </div>
            </div>
          )}

          {/* RECOMMENDED WORKUP & CHECKS */}
          {workupText && (
            <div className="far-card">
              <div className="far-card-header">
                <span className="far-card-icon">🧪</span>
                <span className="far-card-title">Recommended OPD Workup & Bedside Checks</span>
              </div>
              <div className="far-card-body">
                <ul className="far-list">
                  {workupText.split('\n').filter(Boolean).map((line, idx) => (
                    <li key={idx}>
                      <span className="far-bullet-icon">✓</span>
                      <span>{line.replace(/^[-*]\s*/, '')}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* PMH & REVIEW OF SYSTEMS */}
          <div className="far-grid-2">
            {pmhText && (
              <div className="far-card">
                <div className="far-card-header">
                  <span className="far-card-icon">📋</span>
                  <span className="far-card-title">Past Medical & Medication History</span>
                </div>
                <div className="far-card-body">{pmhText}</div>
              </div>
            )}

            {rosText && (
              <div className="far-card">
                <div className="far-card-header">
                  <span className="far-card-icon">🫀</span>
                  <span className="far-card-title">Review of Systems (ROS)</span>
                </div>
                <div className="far-card-body">{rosText}</div>
              </div>
            )}
          </div>

          {/* EXECUTIVE CLINICAL HANDOFF */}
          {handoffText && (
            <div className="far-card far-handoff-card">
              <div className="far-card-header">
                <span className="far-card-icon">📝</span>
                <span className="far-card-title">Executive Clinical Handoff Note</span>
              </div>
              <div className="far-card-body">{handoffText}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
