'use client';

import RiskGauge from '@/components/ui/RiskGauge';
import StatusBadge from '@/components/ui/StatusBadge';

export default function RiskBreakdownCard({
  riskScore = 0,
  riskLevel = 'LOW',
  explanation = '',
  ruleMatches = []
}) {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Risk Evaluation</h2>
          <div className="small muted">Automated rule evaluation summary</div>
        </div>
        <StatusBadge status={riskLevel} size="md" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
        <RiskGauge score={riskScore} size={96} strokeWidth={8} />
        
        <div style={{ flex: 1, minWidth: '200px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
            Risk Explanation
          </div>
          <div
            style={{
              padding: '10px 12px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#334155',
              fontSize: '12.5px',
              lineHeight: 1.4
            }}
          >
            {explanation || 'No high-risk indicators identified for this transaction.'}
          </div>
        </div>
      </div>

      {ruleMatches && ruleMatches.length > 0 && (
        <div>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: '8px' }}>
            Triggered Rules ({ruleMatches.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ruleMatches.map((rule, idx) => (
              <div
                key={rule.rule_name || idx}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  gap: '10px',
                  flexWrap: 'wrap'
                }}
              >
                <div style={{ flex: 1, minWidth: '180px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: 600, fontSize: '12.5px', color: '#0f172a' }}>
                      {rule.rule_name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '3px',
                        background: '#fef2f2',
                        color: '#991b1b',
                        border: '1px solid #fecaca'
                      }}
                    >
                      {rule.impact} pts
                    </span>
                  </div>
                  <div className="small muted" style={{ marginTop: '2px' }}>
                    {rule.evidence}
                  </div>
                </div>

                <div style={{ textAlign: 'right', fontSize: '11.5px' }}>
                  <div style={{ color: '#0f172a', fontWeight: 500 }}>
                    Observed: <span style={{ color: '#b91c1c' }}>{rule.observed}</span>
                  </div>
                  <div className="muted">
                    Baseline: {rule.threshold}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
