'use client';

export default function RiskGauge({ score = 0, size = 110, strokeWidth = 10, showLabel = true }) {
  const normalized = Math.min(Math.max(Number(score) || 0, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalized / 100) * circumference;

  let color = '#10b981'; // Green
  let label = 'LOW RISK';
  let badgeClass = 'badge LOW';

  if (normalized >= 85) {
    color = '#ef4444'; // Red
    label = 'CRITICAL';
    badgeClass = 'badge CRITICAL';
  } else if (normalized >= 70) {
    color = '#f97316'; // Orange
    label = 'HIGH RISK';
    badgeClass = 'badge HIGH';
  } else if (normalized >= 40) {
    color = '#f59e0b'; // Amber
    label = 'MEDIUM RISK';
    badgeClass = 'badge MEDIUM';
  }

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1
          }}
        >
          <span style={{ fontSize: size > 80 ? '22px' : '16px', fontWeight: 800, color: '#0f172a' }}>
            {Math.round(normalized)}
          </span>
          <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
            /100
          </span>
        </div>
      </div>
      {showLabel && (
        <span className={badgeClass} style={{ fontSize: '11px' }}>
          {label}
        </span>
      )}
    </div>
  );
}
