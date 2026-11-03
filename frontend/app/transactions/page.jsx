'use client';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

export default function Transactions() {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ account_ref: 'SAMPLE-001', amount: '1000', counterparty_ref: 'MERCHANT-01', transaction_type: 'TRANSFER', transaction_status: 'SUCCESS' });

  async function load() {
    try { setRows(await api('/transactions')); }
    catch (e) { setError(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setError('');
    try {
      await api('/transactions', { method: 'POST', body: JSON.stringify({
        ...form, amount: Number(form.amount), transaction_ts: new Date().toISOString(), channel: 'UPI',
      }) });
      await load();
    } catch (e) { setError(e.message); }
  }

  return <>
    <h1>Transactions</h1><p className="muted">Sample transaction records. Add a synthetic transaction for testing.</p>
    <div className="panel section">
      <h2>Add transaction</h2>
      <form className="form" onSubmit={add}>
        <input aria-label="Account reference" value={form.account_ref} onChange={e => setForm({ ...form, account_ref: e.target.value })} placeholder="Account ref" />
        <input aria-label="Amount" type="number" min="0" step=".01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="Amount" />
        <input aria-label="Counterparty" value={form.counterparty_ref} onChange={e => setForm({ ...form, counterparty_ref: e.target.value })} placeholder="Counterparty" />
        <select value={form.transaction_status} onChange={e => setForm({ ...form, transaction_status: e.target.value })}><option>SUCCESS</option><option>FAILED</option><option>PENDING</option></select>
        <button className="btn">Add transaction</button>
      </form>
      {error && <p className="error">{error}</p>}
    </div>
    <div className="tablewrap"><table><thead><tr><th>Time</th><th>Account ID</th><th>Amount</th><th>Type</th><th>Counterparty</th><th>Status</th><th>Channel</th></tr></thead>
      <tbody>{rows.map(t => <tr key={t.transaction_id}>
        <td>{new Date(t.transaction_ts).toLocaleString()}</td><td className="small">{t.account_id.slice(0, 8)}…</td>
        <td>₹{Number(t.amount).toLocaleString('en-IN')}</td><td>{t.transaction_type}</td><td>{t.counterparty_ref || '—'}</td>
        <td><span className="badge">{t.transaction_status}</span></td><td>{t.channel}</td>
      </tr>)}</tbody></table></div>
  </>;
}
