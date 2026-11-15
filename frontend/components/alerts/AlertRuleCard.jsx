'use client';

export default function AlertRuleCard({ rule, className = '' }) {
  if (!rule) return null;

  return (
    <div
      className={`card ${className}`}
      style={{
        padding: '14px',
        borderLeft: '4px solid #f59e0b',
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              background: '#fef3c7',
              color: '#b45309'
            }}
          >
            RULE TRIGGERED
          </span>
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
            {rule.rule_name || 'ANOMALY_RULE'}
          </span>
        </div>

        {rule.impact && (
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '999px',
              background: '#fee2e2',
              color: '#b91c1c'
            }}
          >
            {rule.impact} RISK
          </span>
        )}
      </div>

      {rule.description && (
        <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
          {rule.description}
        </p>
      )}

      {rule.evidence && (
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '12px',
            color: '#334155',
            marginTop: '2px'
          }}
        >
          <span style={{ fontWeight: 600, color: '#475569' }}>Evidence: </span>
          {rule.evidence}
        </div>
      )}

      {(rule.observed || rule.threshold) && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '11.5px',
            paddingTop: '4px'
          }}
        >
          <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Observed</span>
            <strong style={{ color: '#0f172a' }}>{rule.observed || '—'}</strong>
          </div>
          <div style={{ background: '#f1f5f9', padding: '6px 8px', borderRadius: '4px' }}>
            <span style={{ color: '#64748b', display: 'block', fontSize: '10.5px' }}>Baseline / Threshold</span>
            <strong style={{ color: '#0f172a' }}>{rule.threshold || 'Normal threshold'}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
