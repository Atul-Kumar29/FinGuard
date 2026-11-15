'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import StatusBadge from '@/components/ui/StatusBadge';

export default function AlertEscalateModal({
  isOpen,
  onClose,
  alert,
  onConfirm,
  users = [],
  isSubmitting = false
}) {
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState(alert?.priority || 'HIGH');
  const [summary, setSummary] = useState(
    alert ? `Investigate high-risk alert for ${alert.account_ref} (Risk ${alert.risk_score}/100): ${alert.explanation?.slice(0, 80)}…` : ''
  );

  if (!alert) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onConfirm({
      alert_id: alert.alert_id,
      assigned_to: assignedTo || null,
      priority,
      summary
    });
  }

  const formattedAmount = typeof alert.amount === 'number'
    ? `₹${alert.amount.toLocaleString('en-IN')}`
    : `₹${Number(alert.amount || 0).toLocaleString('en-IN')}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Escalate Alert to Investigation Case"
      maxWidth="540px"
      footer={
        <>
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            style={{ background: '#dc2626' }}
          >
            {isSubmitting ? 'Creating Case...' : 'Confirm Escalation'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Context Summary Box */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '12px 14px',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small">Account / Ref:</span>
            <strong>{alert.account_ref}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small">Flagged Amount:</span>
            <strong>{formattedAmount}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="muted small">Anomaly Risk Score:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <StatusBadge status={alert.priority} size="sm" />
              <strong>{alert.risk_score}/100</strong>
            </div>
          </div>
        </div>

        {/* Priority Selection */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Case Priority Level:
          </label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="CRITICAL">CRITICAL (Immediate response required)</option>
            <option value="HIGH">HIGH (Standard high priority triage)</option>
            <option value="MEDIUM">MEDIUM (Routine compliance review)</option>
            <option value="LOW">LOW (Informational spot-check)</option>
          </select>
        </div>

        {/* Investigator Assignment */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Assign Primary Investigator:
          </label>
          <select
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            style={{ width: '100%' }}
          >
            <option value="">Unassigned (Queue for intake)</option>
            {users.map((u) => (
              <option key={u.user_id || u.username} value={u.username || u.user_id}>
                {u.username} ({u.role || 'Investigator'})
              </option>
            ))}
            {users.length === 0 && (
              <>
                <option value="analyst">analyst (Fraud Analyst)</option>
                <option value="reviewer">reviewer (Compliance Reviewer)</option>
                <option value="admin">admin (Team Lead)</option>
              </>
            )}
          </select>
        </div>

        {/* Initial Case Notes / Hypothesis */}
        <div>
          <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
            Investigation Summary & Notes:
          </label>
          <textarea
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Document observed anomalies, triage hypotheses, or immediate action steps..."
            style={{ width: '100%', resize: 'vertical' }}
            required
          />
        </div>
      </form>
    </Modal>
  );
}
