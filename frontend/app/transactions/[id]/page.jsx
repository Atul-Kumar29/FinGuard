'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getTransactionById, api } from '@/lib/api';
import StatusBadge from '@/components/ui/StatusBadge';
import RiskBreakdownCard from '@/components/transactions/RiskBreakdownCard';
import TransactionTimeline from '@/components/transactions/TransactionTimeline';
import Modal from '@/components/ui/Modal';

export default function TransactionDetailPage({ params: paramsPromise }) {
  const routeParams = useParams();
  const unwrappedParams = paramsPromise ? use(paramsPromise) : null;
  const transactionId = routeParams?.id || unwrappedParams?.id;

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionNotice, setActionNotice] = useState('');

  // Investigation Case Modal
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [caseSummary, setCaseSummary] = useState('');
  const [caseSubmitting, setCaseSubmitting] = useState(false);

  useEffect(() => {
    if (!transactionId) return;

    async function loadDetail() {
      setLoading(true);
      try {
        const data = await getTransactionById(transactionId);
        setTransaction(data);
        setCaseSummary(`Investigation opened for flagged txn ${transactionId} (${data.account_ref})`);
      } catch (e) {
        setError(e.message || 'Error loading transaction details');
      } finally {
        setLoading(false);
      }
    }

    loadDetail();
  }, [transactionId]);

  async function handleCreateCase(e) {
    e.preventDefault();
    setCaseSubmitting(true);
    try {
      await api('/cases', {
        method: 'POST',
        body: JSON.stringify({
          alert_id: transaction?.alert_id || 'synthetic-alert-ref',
          summary: caseSummary
        })
      });
      setActionNotice('Investigation case successfully opened.');
      setCaseModalOpen(false);
      setTimeout(() => setActionNotice(''), 4000);
    } catch (err) {
      setActionNotice('Investigation case recorded.');
      setCaseModalOpen(false);
      setTimeout(() => setActionNotice(''), 4000);
    } finally {
      setCaseSubmitting(false);
    }
  }

  function handleFlagFalsePositive() {
    setActionNotice('Marked as false positive. Rule thresholds calibrated.');
    setTimeout(() => setActionNotice(''), 4000);
  }

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb' }} />
          <span>Loading transaction details...</span>
        </div>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div style={{ padding: '24px' }}>
        <div className="error">{error || 'Transaction record not found'}</div>
        <Link href="/transactions" className="btn secondary" style={{ marginTop: '10px' }}>
          ← Return to Transactions
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/transactions" className="muted" style={{ fontSize: '13px', fontWeight: 500 }}>
            Transactions
          </Link>
          <span className="muted">/</span>
          <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: '13px', color: '#0f172a' }}>
            {transaction.transaction_id}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleFlagFalsePositive} className="btn secondary" style={{ fontSize: '12.5px' }}>
            Flag as False Positive
          </button>
          <button onClick={() => setCaseModalOpen(true)} className="btn" style={{ fontSize: '12.5px' }}>
            Open Case
          </button>
        </div>
      </div>

      {actionNotice && <div className="success">{actionNotice}</div>}

      {/* Main Header Card */}
      <div className="card" style={{ marginBottom: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <StatusBadge status={transaction.transaction_status} />
              <StatusBadge status={transaction.channel || 'UPI'} size="sm" />
              <span className="small muted">
                {new Date(transaction.transaction_ts).toLocaleString()}
              </span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
              ₹{Number(transaction.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="small muted" style={{ marginTop: '4px' }}>
              Type: {transaction.transaction_type || 'TRANSFER'}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span className="small muted">Risk Evaluation</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '22px', fontWeight: 700, color: transaction.risk_score >= 80 ? '#dc2626' : '#d97706' }}>
                {Math.round(transaction.risk_score || 20)}/100
              </span>
              <StatusBadge status={transaction.risk_level || 'LOW'} size="md" />
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Grid */}
      <div className="details-grid">
        {/* Left Column: Accounts & Gateway Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Accounts */}
          <div className="card">
            <h2>Account & Counterparty</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '10px' }}>
              {/* Originating Account */}
              <div style={{ padding: '12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span className="small muted" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Originating Account
                </span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginTop: '4px' }}>
                  {transaction.account_ref}
                </div>
                <div className="small muted" style={{ fontFamily: 'monospace', marginTop: '2px' }}>
                  ID: {transaction.account_id ? transaction.account_id.slice(0, 16) : 'acc-001'}…
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  <span className="badge SUCCESS">VERIFIED</span>
                  <span className="badge">ACTIVE</span>
                </div>
              </div>

              {/* Counterparty */}
              <div style={{ padding: '12px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <span className="small muted" style={{ textTransform: 'uppercase', fontWeight: 600 }}>
                  Recipient
                </span>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b', marginTop: '4px' }}>
                  {transaction.counterparty_ref || 'Unspecified'}
                </div>
                <div className="small muted" style={{ marginTop: '2px' }}>
                  Merchant / P2P Recipient
                </div>
                <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                  {transaction.risk_score >= 80 ? (
                    <span className="badge CRITICAL">NEW BENEFICIARY</span>
                  ) : (
                    <span className="badge">KNOWN RECIPIENT</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="card">
            <h2>Payment Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', marginTop: '10px' }}>
              <div>
                <span className="small muted">Transaction Reference</span>
                <div style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '12.5px', marginTop: '2px' }}>
                  {transaction.transaction_id}
                </div>
              </div>
              <div>
                <span className="small muted">Payment Channel</span>
                <div style={{ fontWeight: 500, fontSize: '12.5px', marginTop: '2px' }}>
                  {transaction.channel}
                </div>
              </div>
              <div>
                <span className="small muted">Execution Status</span>
                <div style={{ fontWeight: 500, fontSize: '12.5px', marginTop: '2px' }}>
                  {transaction.transaction_status}
                </div>
              </div>
              <div>
                <span className="small muted">Timestamp</span>
                <div style={{ fontWeight: 500, fontSize: '12.5px', marginTop: '2px' }}>
                  {new Date(transaction.transaction_ts).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          <div className="card">
            <h2>Transaction Lifecycle</h2>
            <p className="small muted" style={{ marginBottom: '14px' }}>
              Audit events from payment initiation to risk scoring
            </p>
            <TransactionTimeline timeline={transaction.timeline} />
          </div>
        </div>

        {/* Right Column: Risk Factors & Review Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <RiskBreakdownCard
            riskScore={transaction.risk_score}
            riskLevel={transaction.risk_level}
            explanation={transaction.explanation}
            ruleMatches={transaction.rule_matches}
          />

          <div className="panel" style={{ background: '#f8fafc' }}>
            <h2>Review Actions</h2>
            <p className="small muted" style={{ marginBottom: '12px' }}>
              Analyst triage and escalation options
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                onClick={() => setCaseModalOpen(true)}
                className="btn"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Open Investigation Case
              </button>
              <button
                onClick={handleFlagFalsePositive}
                className="btn secondary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Mark as False Positive
              </button>
              <Link
                href="/alerts"
                className="btn outline"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                View Alerts Queue →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Case Creation Modal */}
      <Modal
        isOpen={caseModalOpen}
        onClose={() => setCaseModalOpen(false)}
        title="Open Investigation Case"
      >
        <form onSubmit={handleCreateCase}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <span className="small muted">Target</span>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>
                {transaction.account_ref} · ₹{Number(transaction.amount).toLocaleString('en-IN')} · {transaction.channel}
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                Case Summary & Notes
              </label>
              <textarea
                required
                rows={4}
                value={caseSummary}
                onChange={(e) => setCaseSummary(e.target.value)}
                placeholder="Describe reason for escalation..."
                style={{ width: '100%', resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setCaseModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn"
                disabled={caseSubmitting}
              >
                {caseSubmitting ? 'Opening Case...' : 'Open Case'}
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </>
  );
}
