'use client';

export default function DataTable({
  columns = [],
  data = [],
  emptyMessage = 'No records found',
  onRowClick,
  isLoading = false,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className={`tablewrap ${className}`} style={{ padding: '36px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
          <div className="pulse-dot" style={{ color: '#2563eb' }} />
          <span>Loading records...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`tablewrap ${className}`}>
      <table>
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  width: col.width || 'auto',
                  textAlign: col.align || 'left'
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={row.id || row.transaction_id || row.alert_id || row.case_id || rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {columns.map((col, colIdx) => {
                  const cellValue = col.key ? row[col.key] : null;
                  return (
                    <td
                      key={col.key || colIdx}
                      style={{ textAlign: col.align || 'left' }}
                    >
                      {col.render ? col.render(row, rowIdx) : (cellValue ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
