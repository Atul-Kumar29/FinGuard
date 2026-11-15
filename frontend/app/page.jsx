'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats, getTransactions, triggerDetectionRun } from '@/lib/api';
import StatCard from '@/components/ui/StatCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable from '@/components/ui/DataTable';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentAnomalies, setRecentAnomalies] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const [statsData, txResult] = await Promise.all([
        getDashboardStats(),
        getTransactions({ limit: 50 })
      ]);
      setStats(statsData);
      
      const highRisk = (txResult.data || [])
        .filter(t => (t.risk_score >= 60 || t.transaction_status === 'FAILED'))
        .slice(0, 5);
      setRecentAnomalies(highRisk);
    } catch (e) {
      setMessage(e.message || 'Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function runPipeline() {
    setBusy(true);
    setMessage('');
    try {
      const result = await triggerDetectionRun();
      const analysed = result.data?.transactions_analysed ?? 0;
      const alerts = result.data?.alerts_created ?? 0;
      setMessage(`Detection completed: ${analysed} transactions evaluated, ${alerts} alerts updated.`);
      await loadData();
    } catch (e) {
      setMessage(e.message || 'Error running detection pipeline');
    } finally {
      setBusy(false);
    }
  }

  const anomalyColumns = [
    {
      header: 'Timestamp',
      key: 'transaction_ts',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 500 }}>{new Date(t.transaction_ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div className="small muted">{new Date(t.transaction_ts).toLocaleDateString()}</div>
        </div>
      )
    },
    {
      header: 'Account / ID',
      key: 'account_ref',
      render: (t) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{t.account_ref}</div>
          <div className="small muted" style={{ fontFamily: 'monospace' }}>{t.transaction_id.slice(0, 10)}…</div>
        </div>
      )
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (t) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          ₹{Number(t.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      )
    },
    {
      header: 'Counterparty',
      key: 'counterparty_ref',
      render: (t) => <span>{t.counterparty_ref || '—'}</span>
    },
    {
      header: 'Risk Score',
      key: 'risk_score',
      render: (t) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontWeight: 700, color: t.risk_score >= 80 ? '#dc2626' : t.risk_score >= 50 ? '#d97706' : '#16a34a' }}>
            {t.risk_score}
          </span>
          <StatusBadge status={t.risk_level || (t.risk_score >= 80 ? 'CRITICAL' : 'HIGH')} size="sm" />
        </div>
      )
    },
    {
      header: 'Explanation',
      key: 'explanation',
      render: (t) => (
        <span className="small muted" style={{ maxWidth: '300px', display: 'inline-block', lineHeight: 1.3 }}>
          {t.explanation || 'Elevated risk parameters detected'}
        </span>
      )
    },
    {
      header: 'Action',
      render: (t) => (
        <Link
          href={`/transactions/${t.transaction_id}`}
          className="btn secondary"
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          Review →
        </Link>
      )
    }
  ];

  return (
    <>
      <div className="top">
        <div>
          <h1>Dashboard</h1>
          <div className="muted">Overview of monitored transactions, flagged anomalies, and alert queues</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={runPipeline} disabled={busy}>
            {busy ? 'Running detection...' : 'Run Detection'}
          </button>
        </div>
      </div>

      {message && (
        <div className={message.startsWith('Detection') ? 'success' : 'error'}>
          {message}
        </div>
      )}

      {/* KPI Stat Cards */}
      <div className="grid">
        <StatCard
          title="Monitored Volume"
          value={stats ? `₹${(stats.total_volume || 5894200).toLocaleString('en-IN')}` : '—'}
          subtitle="Processed volume"
          trend={{ value: '8.4%', isPositive: true }}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          }
        />
        <StatCard
          title="Total Transactions"
          value={stats?.transactions ?? '—'}
          subtitle="All channels"
          trend={{ value: '14.2%', isPositive: true }}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          }
        />
        <StatCard
          title="Flagged Anomalies"
          value={stats?.anomalies ?? '—'}
          subtitle="Rule violations"
          variant="critical"
          trend={{ value: '2.1%', isPositive: false }}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          }
        />
        <StatCard
          title="Open Alerts & Cases"
          value={stats ? `${stats.alerts_open ?? 0} / ${stats.cases_open ?? 0}` : '—'}
          subtitle="Pending reviewer action"
          variant="warning"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          }
        />
      </div>

      {/* Visual Analytics Grid */}
      <div className="analytics-grid">
        {/* Trend Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div>
              <h2>Transaction & Anomaly Activity (Last 7 Days)</h2>
              <span className="small muted">Volume vs flagged items</span>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '11.5px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
                <span>Volume</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '10px', height: '10px', background: '#dc2626', borderRadius: '2px' }} />
                <span>Flagged</span>
              </div>
            </div>
          </div>

          <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '10px 0 0 0' }}>
            {(stats?.trends || [
              { label: 'Mon', total: 160, flagged: 4 },
              { label: 'Tue', total: 195, flagged: 6 },
              { label: 'Wed', total: 210, flagged: 8 },
              { label: 'Thu', total: 180, flagged: 5 },
              { label: 'Fri', total: 245, flagged: 9 },
              { label: 'Sat', total: 140, flagged: 3 },
              { label: 'Sun', total: 118, flagged: 3 }
            ]).map((day) => {
              const heightPercent = Math.min(Math.round((day.total / 260) * 100), 100);
              const flaggedPercent = Math.min(Math.round((day.flagged / 12) * 100), 100);

              return (
                <div
                  key={day.label}
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: '100%',
                    justifyContent: 'flex-end',
                    gap: '6px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '160px', width: '100%', justifyContent: 'center' }}>
                    <div
                      title={`Volume: ${day.total}`}
                      style={{
                        width: '40%',
                        maxWidth: '24px',
                        height: `${heightPercent}%`,
                        background: '#3b82f6',
                        borderRadius: '3px 3px 0 0'
                      }}
                    />
                    <div
                      title={`Flagged: ${day.flagged}`}
                      style={{
                        width: '24%',
                        maxWidth: '14px',
                        height: `${Math.max(flaggedPercent, 8)}%`,
                        background: '#dc2626',
                        borderRadius: '2px 2px 0 0'
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 500, color: '#64748b' }}>
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Risk Distribution Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2>Risk Tier Distribution</h2>
            <p className="small muted" style={{ marginBottom: '14px' }}>Active transactions grouped by score</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500, color: '#991b1b' }}>Critical (85+)</span>
                  <span style={{ fontWeight: 600 }}>12</span>
                </div>
                <div style={{ height: '6px', background: '#fef2f2', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '18%', height: '100%', background: '#dc2626' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500, color: '#9a3412' }}>High (70–84)</span>
                  <span style={{ fontWeight: 600 }}>26</span>
                </div>
                <div style={{ height: '6px', background: '#fff7ed', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '34%', height: '100%', background: '#ea580c' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500, color: '#92400e' }}>Medium (40–69)</span>
                  <span style={{ fontWeight: 600 }}>84</span>
                </div>
                <div style={{ height: '6px', background: '#fffbeb', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '55%', height: '100%', background: '#d97706' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 500, color: '#166534' }}>Low (&lt;40)</span>
                  <span style={{ fontWeight: 600 }}>1,126</span>
                </div>
                <div style={{ height: '6px', background: '#f0fdf4', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: '92%', height: '100%', background: '#16a34a' }} />
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="small muted">Top Flagged Channel</span>
              <span className="badge CRITICAL">UPI (58%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flagged Transactions Table */}
      <div className="section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div>
            <h2>Flagged Transactions Requiring Review</h2>
            <div className="muted small">High-priority items identified by risk detection rules</div>
          </div>
          <Link href="/transactions" className="btn secondary" style={{ fontSize: '12.5px' }}>
            View All Transactions →
          </Link>
        </div>

        <DataTable
          columns={anomalyColumns}
          data={recentAnomalies}
          isLoading={loading}
          emptyMessage="No flagged transactions requiring review."
        />
      </div>
    </>
  );
}
