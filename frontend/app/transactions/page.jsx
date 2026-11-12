'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { getTransactions, postTransaction } from '@/lib/api';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterBar from '@/components/ui/FilterBar';
import Modal from '@/components/ui/Modal';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modal State for Transaction Simulation
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    account_ref: 'SAMPLE-001',
    amount: '12500',
    counterparty_ref: 'MERCHANT-CRYPTO-EX',
    transaction_type: 'TRANSFER',
    transaction_status: 'SUCCESS',
    channel: 'UPI'
  });

  async function loadTransactions() {
    setLoading(true);
    try {
      const result = await getTransactions({ limit: 200 });
      setTransactions(result.data || []);
    } catch (e) {
      setError(e.message || 'Error fetching transactions');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTransactions();
  }, []);

  async function handleAddTransaction(e) {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        amount: Number(form.amount),
        transaction_ts: new Date().toISOString()
      };
      await postTransaction(payload);
      setSuccessMsg('Test transaction recorded successfully.');
      setIsModalOpen(false);
      await loadTransactions();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (e) {
      setError(e.message || 'Failed to record transaction');
    } finally {
      setIsSubmitting(false);
    }
  }

  const filteredRows = useMemo(() => {
    return transactions.filter(t => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || (
        (t.transaction_id && t.transaction_id.toLowerCase().includes(q)) ||
        (t.account_ref && t.account_ref.toLowerCase().includes(q)) ||
        (t.counterparty_ref && t.counterparty_ref.toLowerCase().includes(q))
      );

      const matchesRisk =
        riskFilter === 'ALL' ||
        (riskFilter === 'CRITICAL' && t.risk_score >= 85) ||
        (riskFilter === 'HIGH' && t.risk_score >= 70 && t.risk_score < 85) ||
        (riskFilter === 'MEDIUM' && t.risk_score >= 40 && t.risk_score < 70) ||
        (riskFilter === 'LOW' && t.risk_score < 40);

      const matchesStatus = statusFilter === 'ALL' || t.transaction_status === statusFilter;
      const matchesChannel = channelFilter === 'ALL' || t.channel === channelFilter;

      return matchesSearch && matchesRisk && matchesStatus && matchesChannel;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') return new Date(b.transaction_ts) - new Date(a.transaction_ts);
      if (sortBy === 'OLDEST') return new Date(a.transaction_ts) - new Date(b.transaction_ts);
      if (sortBy === 'AMOUNT_HIGH') return Number(b.amount) - Number(a.amount);
      if (sortBy === 'AMOUNT_LOW') return Number(a.amount) - Number(b.amount);
      if (sortBy === 'RISK_HIGH') return (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0);
      return 0;
    });
  }, [transactions, search, riskFilter, statusFilter, channelFilter, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  function handleClearFilters() {
    setSearch('');
    setRiskFilter('ALL');
    setStatusFilter('ALL');
    setChannelFilter('ALL');
    setSortBy('NEWEST');
    setCurrentPage(1);
  }

  const columns = [
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
      header: 'Transaction ID',
      key: 'transaction_id',
      render: (t) => (
        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: '#475569' }}>
          {t.transaction_id.slice(0, 12)}…
        </span>
      )
    },
    {
      header: 'Account Ref',
      key: 'account_ref',
      render: (t) => (
        <span style={{ fontWeight: 600, color: '#0f172a' }}>
          {t.account_ref || 'SAMPLE-001'}
        </span>
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
      header: 'Channel',
      key: 'channel',
      render: (t) => (
        <span className="badge" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          {t.channel || 'UPI'}
        </span>
      )
    },
    {
      header: 'Status',
      key: 'transaction_status',
      render: (t) => <StatusBadge status={t.transaction_status} />
    },
    {
      header: 'Risk Score',
      key: 'risk_score',
      render: (t) => {
        const score = Math.round(t.risk_score || 18);
        const level = t.risk_level || (score >= 85 ? 'CRITICAL' : score >= 70 ? 'HIGH' : score >= 40 ? 'MEDIUM' : 'LOW');
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, fontSize: '12.5px', color: score >= 75 ? '#dc2626' : score >= 40 ? '#d97706' : '#16a34a' }}>
              {score}
            </span>
            <StatusBadge status={level} size="sm" />
          </div>
        );
      }
    },
    {
      header: 'Action',
      render: (t) => (
        <Link
          href={`/transactions/${t.transaction_id}`}
          className="btn secondary"
          style={{ padding: '4px 10px', fontSize: '12px' }}
        >
          View →
        </Link>
      )
    }
  ];

  return (
    <>
      <div className="top">
        <div>
          <h1>Transactions</h1>
          <div className="muted">Review, filter, and inspect processed transaction records</div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" onClick={() => setIsModalOpen(true)}>
            + Simulate Transaction
          </button>
        </div>
      </div>

      {successMsg && <div className="success">{successMsg}</div>}
      {error && <div className="error">{error}</div>}

      <FilterBar
        searchValue={search}
        onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
        searchPlaceholder="Search ID, Account or Counterparty..."
        filters={[
          {
            id: 'risk',
            label: 'Risk',
            value: riskFilter,
            onChange: (v) => { setRiskFilter(v); setCurrentPage(1); },
            options: [
              { label: 'All Risk Levels', value: 'ALL' },
              { label: 'Critical (85+)', value: 'CRITICAL' },
              { label: 'High (70–84)', value: 'HIGH' },
              { label: 'Medium (40–69)', value: 'MEDIUM' },
              { label: 'Low (<40)', value: 'LOW' }
            ]
          },
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: (v) => { setStatusFilter(v); setCurrentPage(1); },
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'SUCCESS', value: 'SUCCESS' },
              { label: 'FAILED', value: 'FAILED' },
              { label: 'PENDING', value: 'PENDING' }
            ]
          },
          {
            id: 'channel',
            label: 'Channel',
            value: channelFilter,
            onChange: (v) => { setChannelFilter(v); setCurrentPage(1); },
            options: [
              { label: 'All Channels', value: 'ALL' },
              { label: 'UPI', value: 'UPI' },
              { label: 'IMPS', value: 'IMPS' },
              { label: 'NEFT', value: 'NEFT' },
              { label: 'RTGS', value: 'RTGS' },
              { label: 'CARD', value: 'CARD' }
            ]
          },
          {
            id: 'sort',
            label: 'Sort',
            value: sortBy,
            onChange: (v) => { setSortBy(v); setCurrentPage(1); },
            options: [
              { label: 'Newest First', value: 'NEWEST' },
              { label: 'Oldest First', value: 'OLDEST' },
              { label: 'Highest Amount', value: 'AMOUNT_HIGH' },
              { label: 'Lowest Amount', value: 'AMOUNT_LOW' },
              { label: 'Highest Risk', value: 'RISK_HIGH' }
            ]
          }
        ]}
        onClear={handleClearFilters}
        actions={
          <span className="small muted">
            <strong>{filteredRows.length}</strong> results
          </span>
        }
      />

      <DataTable
        columns={columns}
        data={paginatedRows}
        isLoading={loading}
        emptyMessage="No transactions matched the selected filters."
      />

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#64748b' }}>
          <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
          <span>·</span>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            style={{ padding: '3px 6px', fontSize: '12px' }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn secondary"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            Previous
          </button>
          <button
            className="btn secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            style={{ padding: '5px 12px', fontSize: '12px' }}
          >
            Next
          </button>
        </div>
      </div>

      {/* Record Transaction Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Test Transaction"
      >
        <form onSubmit={handleAddTransaction}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                Account Reference
              </label>
              <input
                required
                value={form.account_ref}
                onChange={e => setForm({ ...form, account_ref: e.target.value })}
                placeholder="e.g. SAMPLE-001"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                  Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                  Channel
                </label>
                <select
                  value={form.channel}
                  onChange={e => setForm({ ...form, channel: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="UPI">UPI</option>
                  <option value="IMPS">IMPS</option>
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="CARD">CARD</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                Counterparty Entity
              </label>
              <input
                required
                value={form.counterparty_ref}
                onChange={e => setForm({ ...form, counterparty_ref: e.target.value })}
                placeholder="e.g. MERCHANT-01"
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                  Status
                </label>
                <select
                  value={form.transaction_status}
                  onChange={e => setForm({ ...form, transaction_status: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                  Type
                </label>
                <select
                  value={form.transaction_type}
                  onChange={e => setForm({ ...form, transaction_type: e.target.value })}
                  style={{ width: '100%' }}
                >
                  <option value="TRANSFER">TRANSFER</option>
                  <option value="PAYMENT">PAYMENT</option>
                  <option value="ATM_WITHDRAWAL">ATM_WITHDRAWAL</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Record Transaction'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
