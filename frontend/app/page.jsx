'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try { setStats(await api('/dashboard')); }
    catch (e) { setMessage(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function run() {
    setBusy(true); setMessage('');
    try {
      const result = await api('/detection/run', { method: 'POST' });
      setMessage(`Detection complete: ${result.transactions_analysed} transactions analysed, ${result.alerts_created} alerts created.`);
      await load();
    } catch (e) { setMessage(e.message); }
    finally { setBusy(false); }
  }

  return <>
    <div className="top">
      <div><h1>Dashboard</h1><div className="muted">Overview of transaction monitoring and investigations</div></div>
      <button className="btn" onClick={run} disabled={busy}>{busy ? 'Running…' : 'Run detection'}</button>
    </div>
    {message && <p className={message.startsWith('Detection') ? 'success' : 'error'}>{message}</p>}
    <div className="grid">
      {[
        ['Transactions', stats?.transactions],
        ['Anomalies flagged', stats?.anomalies],
        ['Open alerts', stats?.alerts_open],
        ['Open cases', stats?.cases_open],
      ].map(([label, value]) => <div className="card" key={label}>
        <div className="muted">{label}</div><div className="metric">{value ?? '—'}</div>
      </div>)}
    </div>
    <div className="panel section">
      <h2>How to use the prototype</h2>
      <ol>
        <li>Review sample transactions.</li><li>Run the rule-based detection pipeline.</li>
        <li>Review generated alerts and update their status.</li>
        <li>Create investigation cases and record reviewer activity.</li>
      </ol>
      <p className="muted small">Scores prioritise review; they do not establish fraud. Use synthetic or approved sample data only.</p>
    </div>
  </>;
}
