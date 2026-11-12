'use client';

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  variant = 'default',
  onClick,
  className = ''
}) {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span className="muted small" style={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {title}
          </span>
          <div className="metric">{value ?? '—'}</div>
        </div>
        {icon && (
          <div
            style={{
              padding: '8px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#f8fafc',
              color: '#475569',
              border: '1px solid #e2e8f0'
            }}
          >
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '12px' }}>
          {trend && (
            <span
              style={{
                fontWeight: 600,
                color: trend.isPositive ? '#16a34a' : '#dc2626',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </span>
          )}
          {subtitle && <span className="muted">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
