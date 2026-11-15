'use client';

export default function InvestigationTimeline({ events = [], className = '' }) {
  if (!events || events.length === 0) {
    return (
      <div
        className={`card ${className}`}
        style={{
          padding: '24px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '13px'
        }}
      >
        No timeline events recorded yet.
      </div>
    );
  }

  const getEventBadge = (type) => {
    switch (type) {
      case 'CASE_CREATED':
        return { label: 'Case Created', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' };
      case 'STATUS_CHANGED':
        return { label: 'Status Update', color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
      case 'OUTCOME_SET':
        return { label: 'Outcome Finalized', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
      case 'CASE_ASSIGNED':
      case 'ASSIGNMENT_UPDATED':
        return { label: 'Assigned', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
      case 'NOTE_ADDED':
        return { label: 'Analyst Note', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' };
      case 'CUSTOMER_CONTACTED':
        return { label: 'Customer Outreach', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' };
      case 'SUSPICION_FLAGGED':
        return { label: 'Suspicion Flag', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
      default:
        return { label: type.replace(/_/g, ' '), color: '#475569', bg: '#f8fafc', border: '#e2e8f0' };
    }
  };

  return (
    <div className={`card ${className}`} style={{ padding: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>
        Investigation Audit Trail & Timeline ({events.length})
      </h3>

      <div style={{ position: 'relative', paddingLeft: '24px' }}>
        {/* Continuous vertical timeline bar */}
        <div
          style={{
            position: 'absolute',
            top: '8px',
            bottom: '8px',
            left: '7px',
            width: '2px',
            background: '#e2e8f0'
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {events.map((evt, idx) => {
            const badge = getEventBadge(evt.event_type);
            const timeStr = evt.created_at
              ? new Date(evt.created_at).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
              : 'Recent';

            return (
              <div key={evt.event_id || idx} style={{ position: 'relative' }}>
                {/* Timeline node dot */}
                <div
                  style={{
                    position: 'absolute',
                    left: '-24px',
                    top: '3px',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    border: `3px solid ${badge.color}`,
                    boxShadow: '0 0 0 2px #f8fafc'
                  }}
                />

                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '8px',
                      marginBottom: '6px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>
                      <strong style={{ fontSize: '12.5px', color: '#1e293b' }}>
                        {evt.author_name || 'Investigator'}
                      </strong>
                    </div>

                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                      {timeStr}
                    </span>
                  </div>

                  <p
                    style={{
                      margin: 0,
                      fontSize: '12.5px',
                      color: '#334155',
                      lineHeight: '1.5',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {evt.notes || 'No log details specified.'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
