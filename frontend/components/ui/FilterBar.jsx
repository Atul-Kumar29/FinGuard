'use client';

export default function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search records...',
  filters = [],
  actions,
  onClear,
  className = ''
}) {
  const hasActiveFilters = searchValue || filters.some(f => f.value && f.value !== 'ALL');

  return (
    <div className={`filter-bar ${className}`}>
      <div className="filter-group" style={{ flex: 1, minWidth: '240px' }}>
        {onSearchChange && (
          <div style={{ position: 'relative', width: '100%', maxWidth: '300px' }}>
            <span
              style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              style={{ width: '100%', paddingLeft: '32px' }}
            />
          </div>
        )}

        {filters.map((filter) => (
          <div key={filter.id || filter.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {filter.label && <span className="small muted">{filter.label}:</span>}
            <select
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              style={{ padding: '6px 10px', fontSize: '12.5px' }}
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && onClear && (
          <button
            onClick={onClear}
            className="btn secondary"
            style={{ padding: '5px 9px', fontSize: '11.5px' }}
          >
            Reset
          </button>
        )}
      </div>

      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {actions}
        </div>
      )}
    </div>
  );
}
