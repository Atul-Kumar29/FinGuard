'use client';

import { useState } from 'react';

export default function CaseNotesPanel({ onAddNote, isSubmitting = false, className = '' }) {
  const [noteText, setNoteText] = useState('');
  const [eventType, setEventType] = useState('NOTE_ADDED');
  const [authorName, setAuthorName] = useState('analyst');

  function handleSubmit(e) {
    e.preventDefault();
    if (!noteText.trim()) return;

    onAddNote({
      event_type: eventType,
      notes: noteText.trim(),
      author_name: authorName
    });

    setNoteText('');
  }

  const quickSnippets = [
    'Customer confirmed legitimate authorization via verified telephone call.',
    'Customer reports unauthorized transaction; initiated chargeback & blocked card.',
    'Beneficiary bank queried for KYC compliance on destination account.',
    'Requested secondary approval from compliance officer for case clearance.'
  ];

  return (
    <div className={`card ${className}`} style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
        Add Investigation Note / Audit Event
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Action Type:
            </label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={{ width: '100%', fontSize: '12.5px' }}
            >
              <option value="NOTE_ADDED">Investigation Note (General)</option>
              <option value="CUSTOMER_CONTACTED">Customer Outreach Log</option>
              <option value="EVIDENCE_REVIEWED">Evidence Analysis</option>
              <option value="SUSPICION_FLAGGED">Suspicion Flag / SAR Note</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
              Logged By:
            </label>
            <select
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              style={{ width: '100%', fontSize: '12.5px' }}
            >
              <option value="analyst">analyst (Investigator)</option>
              <option value="reviewer">reviewer (Compliance Reviewer)</option>
              <option value="admin">admin (Supervisor)</option>
            </select>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Notes & Findings:
          </label>
          <textarea
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type investigation findings, customer statements, or analysis steps..."
            style={{ width: '100%', resize: 'vertical', fontSize: '13px' }}
            required
          />
        </div>

        {/* Quick Snippets */}
        <div>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '6px' }}>
            Quick Template Inserts:
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {quickSnippets.map((snippet, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setNoteText(snippet)}
                style={{
                  textAlign: 'left',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  padding: '5px 8px',
                  fontSize: '11.5px',
                  color: '#475569',
                  cursor: 'pointer'
                }}
              >
                + {snippet}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="submit"
            className="btn"
            disabled={isSubmitting || !noteText.trim()}
            style={{ fontSize: '12.5px' }}
          >
            {isSubmitting ? 'Posting Note...' : 'Post Note to Audit Trail'}
          </button>
        </div>
      </form>
    </div>
  );
}
