'use client';

export default function StatusBadge({ status, variant, size = 'md', pulse = false, className = '' }) {
  if (!status) return null;

  // Derive variant from status if not explicitly given
  const resolvedVariant = (variant || status).toString().toUpperCase().replace(/\s+/g, '_');
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  return (
    <span className={`badge ${resolvedVariant} ${currentSize} ${className}`}>
      {pulse && <span className="pulse-dot" />}
      <span>{status}</span>
    </span>
  );
}
