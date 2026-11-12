'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { triggerDetectionRun } from '@/lib/api';

export default function TopBar() {
  const pathname = usePathname();
  const [running, setRunning] = useState(false);
  const [lastNotification, setLastNotification] = useState('');

  const routeTitles = {
    '/': { title: 'Dashboard', sub: 'Surveillance overview and risk metrics' },
    '/transactions': { title: 'Transactions', sub: 'Filter, inspect, and evaluate transaction activity' },
    '/alerts': { title: 'Alerts', sub: 'Manage flagged anomaly alerts' },
    '/cases': { title: 'Investigation Cases', sub: 'Case review and resolution management' }
  };

  const currentRoute = routeTitles[pathname] || (
    pathname.startsWith('/transactions/')
      ? { title: 'Transaction Review', sub: 'Transaction record details, risk factors, and timeline' }
      : { title: 'FinGuard', sub: 'Financial anomaly detection' }
  );

  async function handleQuickDetection() {
    setRunning(true);
    setLastNotification('');
    try {
      const res = await triggerDetectionRun();
      const count = res.data?.anomalies_detected ?? res.data?.alerts_created ?? 0;
      setLastNotification(`Detection run complete · ${count} alerts evaluated`);
      setTimeout(() => setLastNotification(''), 4000);
    } catch (e) {
      setLastNotification('Error executing detection run');
      setTimeout(() => setLastNotification(''), 4000);
    } finally {
      setRunning(false);
    }
  }

  return (
    <header className="top-bar">
      <div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
          {currentRoute.title}
        </div>
        <div style={{ fontSize: '12px', color: '#64748b' }}>
          {currentRoute.sub}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {lastNotification && (
          <div
            style={{
              fontSize: '12px',
              padding: '4px 10px',
              borderRadius: '4px',
              background: '#f0fdf4',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              fontWeight: 500
            }}
          >
            {lastNotification}
          </div>
        )}

        <button
          onClick={handleQuickDetection}
          disabled={running}
          className="btn"
          style={{ padding: '6px 12px', fontSize: '12.5px' }}
        >
          {running ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="pulse-dot" style={{ background: 'transparent' }}>
                <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
              </svg>
              <span>Running...</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>Run Detection</span>
            </>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '8px', borderLeft: '1px solid #e2e8f0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: '4px',
              background: '#f1f5f9',
              color: '#475569'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
            <span>API Online</span>
          </div>
        </div>
      </div>
    </header>
  );
}
