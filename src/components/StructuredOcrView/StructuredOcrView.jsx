import React from 'react';
import './StructuredOcrView.css';

export default function StructuredOcrView({ ocrDoc }) {
  if (!ocrDoc) return null;

  const content = (
    ocrDoc.structured_summary ||
    ocrDoc.summary ||
    ocrDoc.ocrText ||
    ocrDoc.raw_ocr_text ||
    ocrDoc.ocr_text ||
    ''
  ).trim();
  const filename = ocrDoc.filename || ocrDoc.name || 'Diagnostic Document';
  const engine = ocrDoc.engine || 'AyuLekha OCR';
  const pageCount = ocrDoc.page_count || 1;

  if (!content) {
    return (
      <div className="sov-card">
        <div className="sov-header">
          <div className="sov-title">📄 {filename}</div>
          <span className="sov-badge">{engine}</span>
        </div>
        <div className="sov-empty">No structured clinical findings extracted from this document.</div>
      </div>
    );
  }

  // Parse markdown tables and text blocks
  const renderFormattedContent = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let currentTable = null;
    let tableHeaders = [];
    let tableRows = [];
    let currentBullets = [];

    const flushBullets = (keyPrefix) => {
      if (currentBullets.length > 0) {
        elements.push(
          <div key={`bullets-${keyPrefix}`} className="sov-kv-grid">
            {currentBullets.map((b, bIdx) => (
              <div key={bIdx} className="sov-kv-item">
                {b.key && <span className="sov-kv-key">{b.key}</span>}
                <span className="sov-kv-val">{b.val}</span>
              </div>
            ))}
          </div>
        );
        currentBullets = [];
      }
    };

    const flushTable = (keyPrefix) => {
      if (currentTable && tableHeaders.length > 0) {
        elements.push(
          <div key={`table-${keyPrefix}`} className="sov-table-wrap">
            <table className="sov-table">
              <thead>
                <tr>
                  {tableHeaders.map((th, thIdx) => (
                    <th key={thIdx}>{th}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((tr, trIdx) => (
                  <tr key={trIdx}>
                    {tr.map((td, tdIdx) => {
                      const isStatus = tableHeaders[tdIdx]?.toLowerCase().includes('status') || tableHeaders[tdIdx]?.toLowerCase().includes('interpretation');
                      const val = td.trim();
                      if (isStatus || ['high', 'low', 'normal', 'negative / sterile'].includes(val.toLowerCase())) {
                        let badgeClass = 'sov-status-normal';
                        let icon = '🟢';
                        if (val.toLowerCase().includes('high') || val.toLowerCase().includes('significant titre')) {
                          badgeClass = 'sov-status-high';
                          icon = '🔴';
                        } else if (val.toLowerCase().includes('low')) {
                          badgeClass = 'sov-status-low';
                          icon = '🟡';
                        }
                        return (
                          <td key={tdIdx}>
                            <span className={`sov-status-badge ${badgeClass}`}>
                              {icon} {val}
                            </span>
                          </td>
                        );
                      }
                      return <td key={tdIdx}>{td}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        currentTable = null;
        tableHeaders = [];
        tableRows = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Table line detection: starts and ends with '|'
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        flushBullets(idx);
        const cells = trimmed
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Check if separator line (|---|---|)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          // separator line, ignore
          return;
        }

        if (!currentTable) {
          currentTable = true;
          tableHeaders = cells;
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (currentTable) {
        flushTable(idx);
      }

      // Heading detection: ## or ###
      const headingMatch = trimmed.match(/^#{1,4}\s+(.+)/);
      if (headingMatch) {
        flushBullets(idx);
        elements.push(
          <div key={`h-${idx}`} className="sov-sec-heading">
            <span className="sov-sec-dot"></span>
            <h4>{headingMatch[1].replace(/[*_]/g, '')}</h4>
          </div>
        );
        return;
      }

      // Bullet / Key-Value detection: - **Key:** Value
      const bulletMatch = trimmed.match(/^[-*]\s*(.+)/);
      if (bulletMatch) {
        const bulletText = bulletMatch[1].trim();
        const kvMatch = bulletText.match(/^\*\*([^*]+)\*\*:\s*(.+)$/);
        if (kvMatch) {
          currentBullets.push({ key: kvMatch[1].trim(), val: kvMatch[2].trim() });
        } else {
          currentBullets.push({ key: '', val: bulletText.replace(/\*\*/g, '') });
        }
        return;
      }

      // Regular paragraph line
      if (trimmed) {
        // Filter out page dividers, end-of-report markers, and corrupt font artifacts
        if (trimmed.startsWith('--- Page') || trimmed.startsWith('~~End') || /^(?:7HVW|3HUIRUPHG|0D\[|6DNHW|%RRNLQJ)/.test(trimmed)) {
          return;
        }
        flushBullets(idx);
        elements.push(
          <p key={`p-${idx}`} className="sov-para">
            {trimmed.replace(/\*\*/g, '')}
          </p>
        );
      }
    });

    flushBullets('final');
    flushTable('final');

    return elements;
  };

  return (
    <div className="sov-card">
      <div className="sov-header">
        <div className="sov-title-wrap">
          <span className="sov-icon">🧪</span>
          <div>
            <div className="sov-title">{filename}</div>
            <div className="sov-meta">
              Engine: <strong>{engine}</strong> &bull; {pageCount} Page(s) &bull; Digitized Clinical Report
            </div>
          </div>
        </div>
        <span className="sov-badge">Structured Data</span>
      </div>

      <div className="sov-body">{renderFormattedContent(content)}</div>
    </div>
  );
}
