'use client';

import { useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskGauge from '@/components/ui/RiskGauge';

export default function EvidenceList({
  caseItem,
  evidenceItems = [],
  onAddEvidence,
  className = ''
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('DOCUMENTATION');
  const [newSeverity, setNewSeverity] = useState('HIGH');
  const [newDesc, setNewDesc] = useState('');
  const [newSource, setNewSource] = useState('Analyst Finding');

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddEvidence && onAddEvidence({
      id: `ev-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      severity: newSeverity,
      description: newDesc.trim(),
      source: newSource
    });

    setNewTitle('');
    setNewDesc('');
    setShowAddForm(false);
  }

  const formattedAmount = typeof caseItem?.amount === 'number'
    ? `₹${caseItem.amount.toLocaleString('en-IN')}`
    : `₹${Number(caseItem?.amount || 0).toLocaleString('en-IN')}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className={className}>
      {/* Flagged Entity Summary Card */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
            Flagged Entity & Transaction Profile
          </h3>
          <StatusBadge status={caseItem?.priority || 'HIGH'} />
        </div>

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
            <RiskGauge score={caseItem?.risk_score || 75} size={90} strokeWidth={9} showLabel={false} />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '12px',
              fontSize: '12.5px'
            }}
          >
            <div>
              <span className="muted small" style={{ display: 'block' }}>Primary Account:</span>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{caseItem?.account_ref || 'SAMPLE-001'}</strong>
            </div>

            <div>
              <span className="muted small" style={{ display: 'block' }}>Flagged Value:</span>
              <strong style={{ fontSize: '13.5px', color: '#0f172a' }}>{formattedAmount}</strong>
            </div>

            <div>
              <span className="muted small" style={{ display: 'block' }}>Linked Transaction:</span>
              {caseItem?.transaction_id ? (
                <Link
                  href={`/transactions/${caseItem.transaction_id}`}
                  style={{ color: '#2563eb', fontWeight: 600, fontFamily: 'monospace' }}
                >
                  {caseItem.transaction_id.slice(0, 12)}…
                </Link>
              ) : (
                <span style={{ color: '#64748b' }}>N/A</span>
              )}
            </div>

            <div>
              <span className="muted small" style={{ display: 'block' }}>Risk Assessment:</span>
              <strong style={{ color: caseItem?.risk_score >= 80 ? '#b91c1c' : '#d97706' }}>
                {caseItem?.risk_score || 75}/100 ({caseItem?.priority || 'HIGH'})
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Evidence & Artifacts */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Evidence & Anomaly Artifacts ({evidenceItems.length})
            </h3>
            <span className="muted small">Flagged indicators and behavioral violations</span>
          </div>

          <button
            type="button"
            className="btn secondary"
            onClick={() => setShowAddForm((prev) => !prev)}
            style={{ fontSize: '12px', padding: '5px 10px' }}
          >
            {showAddForm ? 'Cancel' : '+ Add Evidence'}
          </button>
        </div>

        {/* Add Evidence Sub-form */}
        {showAddForm && (
          <form
            onSubmit={handleAddSubmit}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
              Attach Supporting Evidence
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
              <div>
                <label className="muted small" style={{ display: 'block', marginBottom: '3px' }}>Title</label>
                <input
                  type="text"
                  placeholder="e.g. Inconsistent IP Subnet"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                  required
                />
              </div>

              <div>
                <label className="muted small" style={{ display: 'block', marginBottom: '3px' }}>Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                >
                  <option value="DOCUMENTATION">Documentation</option>
                  <option value="DEVICE_GEOLOCATION">Device & IP</option>
                  <option value="VELOCITY_RULE">Velocity</option>
                  <option value="COUNTERPARTY">Counterparty</option>
                  <option value="AUTHENTICATION">Authentication</option>
                </select>
              </div>

              <div>
                <label className="muted small" style={{ display: 'block', marginBottom: '3px' }}>Severity</label>
                <select
                  value={newSeverity}
                  onChange={(e) => setNewSeverity(e.target.value)}
                  style={{ width: '100%', fontSize: '12.5px' }}
                >
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            <div>
              <label className="muted small" style={{ display: 'block', marginBottom: '3px' }}>Description & Analysis</label>
              <textarea
                rows={2}
                placeholder="Observed facts, document links, or log excerpt..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ width: '100%', fontSize: '12.5px' }}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowAddForm(false)}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                style={{ padding: '5px 12px', fontSize: '12px' }}
              >
                Save Evidence Item
              </button>
            </div>
          </form>
        )}

        {/* Evidence Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {evidenceItems.length > 0 ? (
            evidenceItems.map((item, idx) => (
              <div
                key={item.id || idx}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  background: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: '#f1f5f9',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      {item.category || 'EVIDENCE'}
                    </span>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>
                      {item.title}
                    </strong>
                  </div>

                  <StatusBadge status={item.severity || 'HIGH'} size="sm" />
                </div>

                <p style={{ margin: 0, fontSize: '12.5px', color: '#334155', lineHeight: '1.4' }}>
                  {item.description}
                </p>

                {item.source && (
                  <span style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
                    Source: <strong style={{ color: '#64748b' }}>{item.source}</strong>
                  </span>
                )}
              </div>
            ))
          ) : (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '6px',
                color: '#64748b',
                fontSize: '12.5px'
              }}
            >
              No evidence artifacts currently attached to this case.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
