'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskGauge from '@/components/ui/RiskGauge';
import AlertRuleCard from './AlertRuleCard';

export default function AlertDrawer({
  isOpen,
  onClose,
  alert,
  onAcknowledge,
  onDismiss,
  onEscalate,
  onStatusChange,
  isActionLoading = false
}) {
  const [dismissReason, setDismissReason] = useState('');
  const [showDismissInput, setShowDismissInput] = useState(false);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !alert) return null;

  function handleConfirmDismiss() {
    onDismiss && onDismiss(alert.alert_id, dismissReason || 'False positive / Low risk');
    setShowDismissInput(false);
    setDismissReason('');
  }

  const formattedAmount = typeof alert.amount === 'number'
    ? `₹${alert.amount.toLocaleString('en-IN')}`
    : `₹${Number(alert.amount || 0).toLocaleString('en-IN')}`;

  const formattedDate = alert.created_at
    ? new Date(alert.created_at).toLocaleString()
    : 'Just now';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
        transition: 'opacity 0.2s ease-in-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                ALERT #{alert.alert_id.slice(0, 8)}
              </span>
              <StatusBadge status={alert.priority} />
              <StatusBadge status={alert.alert_status} />
            </div>
            <h2 style={{ margin: 0, fontSize: '17px', color: '#0f172a' }}>
              {alert.account_ref} · {formattedAmount}
            </h2>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 0,
              cursor: 'pointer',
              fontSize: '20px',
              color: '#94a3b8',
              padding: '6px 10px',
              borderRadius: '6px'
            }}
            aria-label="Close alert drawer"
          >
            ✕
          </button>
        </div>

        {/* Drawer Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}
        >
          {/* Key Metrics Strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 1fr',
              gap: '16px',
              alignItems: 'center',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <RiskGauge score={alert.risk_score} size={84} strokeWidth={8} showLabel={false} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small muted">Risk Score:</span>
                <strong style={{ fontSize: '14px', color: alert.risk_score >= 80 ? '#b91c1c' : '#d97706' }}>
                  {alert.risk_score}/100 ({alert.priority})
                </strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small muted">Amount:</span>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>{formattedAmount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small muted">Channel:</span>
                <span className="badge" style={{ fontSize: '11px' }}>{alert.channel || 'UPI'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="small muted">Flagged At:</span>
                <span style={{ fontSize: '12px', color: '#475569' }}>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Anomaly Explanation */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Anomaly Explanation
            </h3>
            <div
              style={{
                backgroundColor: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                padding: '12px 14px',
                color: '#92400e',
                fontSize: '13px',
                lineHeight: '1.5'
              }}
            >
              {alert.explanation || 'No detailed explanation provided by the detection engine.'}
            </div>
          </div>

          {/* Related Entities */}
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '8px' }}>
              Entity Details & Transaction
            </h3>
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '12px',
                fontSize: '12.5px',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px'
              }}
            >
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '11px' }}>Account Ref</span>
                <strong style={{ color: '#0f172a' }}>{alert.account_ref}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '11px' }}>Counterparty Ref</span>
                <strong style={{ color: '#0f172a' }}>{alert.counterparty_ref || 'N/A'}</strong>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '11px' }}>Transaction ID</span>
                <span style={{ fontFamily: 'monospace', color: '#3b82f6' }}>
                  {alert.transaction_id ? `${alert.transaction_id.slice(0, 12)}…` : 'N/A'}
                </span>
              </div>
              <div>
                <span className="muted" style={{ display: 'block', fontSize: '11px' }}>Current Triage</span>
                <StatusBadge status={alert.alert_status} size="sm" />
              </div>
            </div>

            {alert.transaction_id && (
              <div style={{ marginTop: '8px' }}>
                <Link
                  href={`/transactions/${alert.transaction_id}`}
                  style={{
                    fontSize: '12.5px',
                    color: '#2563eb',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  View linked transaction record →
                </Link>
              </div>
            )}
          </div>

          {/* Triggered Detection Rules */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#334155', margin: 0 }}>
                Triggered Anomaly Rules ({alert.rule_matches?.length || 0})
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {alert.rule_matches && alert.rule_matches.length > 0 ? (
                alert.rule_matches.map((rule, idx) => (
                  <AlertRuleCard key={rule.rule_name || idx} rule={rule} />
                ))
              ) : (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    color: '#64748b',
                    fontSize: '12.5px'
                  }}
                >
                  No specific rule breakdown data available.
                </div>
              )}
            </div>
          </div>

          {/* Dismiss Reason Form */}
          {showDismissInput && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                Reason for Dismissal:
              </label>
              <input
                type="text"
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g. Verified customer travel or false positive"
                style={{ width: '100%' }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setShowDismissInput(false)}
                  style={{ padding: '5px 10px', fontSize: '12px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={handleConfirmDismiss}
                  disabled={isActionLoading}
                  style={{ background: '#64748b', padding: '5px 12px', fontSize: '12px' }}
                >
                  Confirm Dismiss
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer / Quick Triage Actions */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid #e2e8f0',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="small muted">Change Status:</span>
            <select
              value={alert.alert_status}
              onChange={(e) => onStatusChange && onStatusChange(alert.alert_id, e.target.value)}
              disabled={isActionLoading}
              style={{ fontSize: '12.5px', padding: '5px 8px' }}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_REVIEW">IN_REVIEW</option>
              <option value="ESCALATED">ESCALATED</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DISMISSED">DISMISSED</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {alert.alert_status === 'OPEN' && (
              <button
                type="button"
                className="btn secondary"
                onClick={() => onAcknowledge && onAcknowledge(alert.alert_id)}
                disabled={isActionLoading}
                style={{ fontSize: '12.5px' }}
              >
                ✓ Acknowledge
              </button>
            )}

            {alert.alert_status !== 'DISMISSED' && alert.alert_status !== 'CLOSED' && (
              <button
                type="button"
                className="btn outline"
                onClick={() => setShowDismissInput(true)}
                disabled={isActionLoading}
                style={{ fontSize: '12.5px', color: '#64748b' }}
              >
                Dismiss
              </button>
            )}

            {alert.alert_status !== 'ESCALATED' && (
              <button
                type="button"
                className="btn"
                onClick={() => onEscalate && onEscalate(alert)}
                disabled={isActionLoading}
                style={{ background: '#dc2626', fontSize: '12.5px' }}
              >
                ⚑ Escalate to Case
              </button>
            )}

            {alert.alert_status === 'ESCALATED' && (
              <Link
                href="/cases"
                className="btn"
                style={{ background: '#2563eb', fontSize: '12.5px' }}
              >
                Open Cases Queue →
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
