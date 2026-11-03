'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Alerts() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  async function load() {
    try { setRows(await api('/alerts')); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);
  async function change(id, status) {
    try {
      await api(`/alerts/${id}`, { method: 'PATCH', body: JSON.stringify({ alert_status: status }) });
      await load();
    } catch (e) { setError(e.message); }
  }
  return <>
    <h1>Alerts</h1><p className="muted">Review anomaly alerts and update their workflow status.</p>
    {error && <p className="error">{error}</p>}
    <div className="tablewrap"><table><thead><tr><th>Created</th><th>Account</th><th>Amount</th><th>Risk</th><th>Priority</th><th>Explanation</th><th>Status</th><th>Action</th></tr></thead>
      <tbody>{rows.map(a => <tr key={a.alert_id}>
        <td>{new Date(a.created_at).toLocaleString()}</td><td>{a.account_ref}</td>
        <td>₹{Number(a.amount).toLocaleString('en-IN')}</td><td>{a.risk_score}/100</td>
        <td><span className={`badge ${a.priority}`}>{a.priority}</span></td><td>{a.explanation}</td>
        <td><span className={`badge ${a.alert_status}`}>{a.alert_status}</span></td>
        <td><select value={a.alert_status} onChange={e => change(a.alert_id, e.target.value)}>
          <option>OPEN</option><option>IN_REVIEW</option><option>ESCALATED</option><option>CLOSED</option><option>DISMISSED</option>
        </select></td>
      </tr>)}</tbody>
    </table></div>
  </>;
}
