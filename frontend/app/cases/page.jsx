'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Cases() {
  const [alerts, setAlerts] = useState([]);
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState('');
  const [summary, setSummary] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const [a, c] = await Promise.all([api('/alerts'), api('/cases')]);
      setAlerts(a); setCases(c);
      if (!selected && a.length) setSelected(a[0].alert_id);
    } catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    try {
      await api('/cases', { method: 'POST', body: JSON.stringify({ alert_id: selected, summary }) });
      setMsg('Investigation case created.'); setSummary(''); await load();
    } catch (e) { setError(e.message); }
  }
  async function update(id, status) {
    try {
      await api(`/cases/${id}`, { method: 'PATCH', body: JSON.stringify({ case_status: status }) });
      await load();
    } catch (e) { setError(e.message); }
  }

  return <>
    <h1>Investigation cases</h1><p className="muted">Create a human-review case from an alert and track its progress.</p>
    <div className="panel section"><h2>Open a case</h2>
      <form className="form" onSubmit={create}>
        <select value={selected} onChange={e => setSelected(e.target.value)}>
          <option value="">Select alert</option>
          {alerts.map(a => <option key={a.alert_id} value={a.alert_id}>{a.account_ref} · {a.priority} · ₹{a.amount}</option>)}
        </select>
        <input value={summary} onChange={e => setSummary(e.target.value)} placeholder="Case summary" />
        <button className="btn" disabled={!selected}>Create case</button>
      </form>
      {msg && <p className="success">{msg}</p>}{error && <p className="error">{error}</p>}
    </div>
    <div className="tablewrap"><table><thead><tr><th>Opened</th><th>Case ID</th><th>Alert ID</th><th>Summary</th><th>Status</th><th>Update</th></tr></thead>
      <tbody>{cases.map(c => <tr key={c.case_id}>
        <td>{new Date(c.opened_at).toLocaleString()}</td><td>{c.case_id.slice(0, 8)}…</td>
        <td>{c.alert_id.slice(0, 8)}…</td><td>{c.summary || '—'}</td>
        <td><span className="badge">{c.case_status}</span></td>
        <td><select value={c.case_status} onChange={e => update(c.case_id, e.target.value)}>
          <option>OPEN</option><option>IN_PROGRESS</option><option>PENDING</option><option>RESOLVED</option><option>CLOSED</option>
        </select></td>
      </tr>)}</tbody>
    </table></div>
  </>;
}
