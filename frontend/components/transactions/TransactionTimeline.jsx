'use client';

export default function TransactionTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="small muted" style={{ padding: '16px', textAlign: 'center' }}>
        No timeline events recorded.
      </div>
    );
  }

  function renderStatusIcon(status) {
    if (status === 'completed') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    }
    if (status === 'alert' || status === 'warning') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
    }
    if (status === 'failed') {
      return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    }
    return (
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '4px' }}>
      {timeline.map((item, index) => {
        const isLast = index === timeline.length - 1;

        return (
          <div key={item.step || index} style={{ display: 'flex', gap: '14px', position: 'relative', paddingBottom: isLast ? '0' : '20px' }}>
            {!isLast && (
              <div
                style={{
                  position: 'absolute',
                  left: '11px',
                  top: '24px',
                  bottom: '0',
                  width: '1px',
                  background: '#e2e8f0'
                }}
              />
            )}

            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
                flexShrink: 0
              }}
            >
              {renderStatusIcon(item.status)}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
                  {item.step}
                </span>
                <span className="small muted">
                  {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                </span>
              </div>
              <p className="small muted" style={{ margin: '3px 0 0 0', lineHeight: 1.4 }}>
                {item.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
