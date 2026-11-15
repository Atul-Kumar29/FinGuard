'use client';

import { useEffect, useState, use, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  getCaseById,
  updateCase,
  addCaseEvent,
  getUsers
} from '@/lib/casesApi';
import StatusBadge from '@/components/ui/StatusBadge';
import InvestigationTimeline from '@/components/cases/InvestigationTimeline';
import CaseNotesPanel from '@/components/cases/CaseNotesPanel';
import EvidenceList from '@/components/cases/EvidenceList';
import Modal from '@/components/ui/Modal';

export default function CaseInvestigationPage({ params: paramsPromise }) {
  const router = useRouter();
  const routeParams = useParams();
  const unwrappedParams = paramsPromise ? use(paramsPromise) : null;
  const caseId = routeParams?.id || unwrappedParams?.id;

  const [caseData, setCaseData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolution / Outcome Modal
  const [outcomeModalOpen, setOutcomeModalOpen] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState('SUSPICIOUS');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadCase = useCallback(async () => {
    if (!caseId) return;
    setLoading(true);
    try {
      const [caseRes, usersRes] = await Promise.allSettled([
        getCaseById(caseId),
        getUsers()
      ]);

      if (caseRes.status === 'fulfilled') {
        setCaseData(caseRes.value);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
      setError('');
    } catch (e) {
      setError(e.message || 'Error fetching case investigation details');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadCase();
  }, [loadCase]);

  // Handle Case Status Transition
  async function handleStatusChange(newStatus) {
    if (newStatus === 'RESOLVED' || newStatus === 'CLOSED') {
      setOutcomeModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateCase(caseId, { case_status: newStatus });
      showNotification(`Case status updated to ${newStatus}.`);
      await loadCase();
    } catch (e) {
      setError(e.message || 'Failed to update case status');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Assignee Change
  async function handleAssigneeChange(newAssignee) {
    setIsSubmitting(true);
    try {
      await updateCase(caseId, { assigned_to: newAssignee || null });
      showNotification(`Investigator updated to ${newAssignee || 'Unassigned'}.`);
      await loadCase();
    } catch (e) {
      setError(e.message || 'Failed to update assignee');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Adding Note or Timeline Event
  async function handleAddNote(notePayload) {
    setIsSubmitting(true);
    try {
      await addCaseEvent(caseId, notePayload);
      showNotification('Note added to case audit trail.');
      await loadCase();
    } catch (e) {
      setError(e.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Adding Evidence Item
  async function handleAddEvidence(evidenceItem) {
    if (!caseData) return;
    const updatedEvidence = [evidenceItem, ...(caseData.evidence_items || [])];
    setCaseData((prev) => ({
      ...prev,
      evidence_items: updatedEvidence
    }));

    await addCaseEvent(caseId, {
      event_type: 'EVIDENCE_ATTACHED',
      notes: `Evidence attached: ${evidenceItem.title} (${evidenceItem.category}). ${evidenceItem.description}`,
      author_name: 'analyst'
    });

    showNotification('Evidence attached to case.');
    await loadCase();
  }

  // Finalize Case Outcome & Close/Resolve
  async function handleFinalizeOutcome(e) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateCase(caseId, {
        case_status: 'RESOLVED',
        outcome: selectedOutcome
      });

      if (outcomeNotes.trim()) {
        await addCaseEvent(caseId, {
          event_type: 'OUTCOME_SET',
          notes: `Resolution Outcome: ${selectedOutcome}. Final Analysis: ${outcomeNotes}`,
          author_name: 'analyst'
        });
      }

      showNotification(`Case successfully resolved as ${selectedOutcome}.`);
      setOutcomeModalOpen(false);
      setOutcomeNotes('');
      await loadCase();
    } catch (e) {
      setError(e.message || 'Failed to resolve case');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '60px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#64748b' }}>
          <div className="pulse-dot" style={{ color: '#2563eb' }} />
          <span>Loading investigation file #{caseId}…</span>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p className="error">Investigation case not found.</p>
        <Link href="/cases" className="btn secondary" style={{ marginTop: '12px' }}>
          ← Back to Cases
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Breadcrumb Navigation */}
      <div style={{ marginBottom: '14px' }}>
        <Link
          href="/cases"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12.5px',
            color: '#64748b',
            fontWeight: 500
          }}
        >
          ← Back to Cases Overview
        </Link>
      </div>

      {/* Case Header & Quick Status Strip */}
      <div
        className="card"
        style={{
          padding: '20px 24px',
          marginBottom: '20px',
          borderLeft: `5px solid ${
            caseData.priority === 'CRITICAL'
              ? '#dc2626'
              : caseData.priority === 'HIGH'
              ? '#f97316'
              : '#2563eb'
          }`
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
                CASE #{caseData.case_id.slice(0, 8)}
              </span>
              <StatusBadge status={caseData.priority || 'HIGH'} />
              <StatusBadge status={caseData.case_status} />
              {caseData.outcome && (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: caseData.outcome === 'SUSPICIOUS' ? '#fef2f2' : '#f0fdf4',
                    color: caseData.outcome === 'SUSPICIOUS' ? '#b91c1c' : '#15803d',
                    border: `1px solid ${caseData.outcome === 'SUSPICIOUS' ? '#fecaca' : '#bbf7d0'}`
                  }}
                >
                  OUTCOME: {caseData.outcome}
                </span>
              )}
            </div>

            <h1 style={{ fontSize: '20px', margin: 0, color: '#0f172a' }}>
              Investigation: {caseData.account_ref}
            </h1>
            <p className="muted" style={{ margin: '4px 0 0', fontSize: '13px' }}>
              Opened {caseData.opened_at ? new Date(caseData.opened_at).toLocaleString() : 'Recently'} · Linked Alert #{caseData.alert_id?.slice(0, 8)}
            </p>
          </div>

          {/* Status and Assignee Control Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <span className="small muted" style={{ display: 'block', marginBottom: '3px' }}>
                Case Status:
              </span>
              <select
                value={caseData.case_status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isSubmitting}
                style={{ fontSize: '12.5px', padding: '6px 10px', fontWeight: 600 }}
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="PENDING">PENDING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            <div>
              <span className="small muted" style={{ display: 'block', marginBottom: '3px' }}>
                Assigned Investigator:
              </span>
              <select
                value={caseData.assigned_to || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                disabled={isSubmitting}
                style={{ fontSize: '12.5px', padding: '6px 10px' }}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.user_id || u.username} value={u.username || u.user_id}>
                    {u.username} ({u.role || 'Investigator'})
                  </option>
                ))}
                {users.length === 0 && (
                  <>
                    <option value="analyst">analyst</option>
                    <option value="reviewer">reviewer</option>
                    <option value="admin">admin</option>
                  </>
                )}
              </select>
            </div>

            <div style={{ alignSelf: 'flex-end' }}>
              <button
                type="button"
                className="btn"
                onClick={() => setOutcomeModalOpen(true)}
                disabled={isSubmitting}
                style={{
                  background: caseData.outcome ? '#475569' : '#16a34a',
                  fontSize: '12.5px'
                }}
              >
                {caseData.outcome ? 'Update Outcome' : 'Resolve & Conclude'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Hypothesis Note */}
        {caseData.summary && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px 14px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              color: '#334155'
            }}
          >
            <strong style={{ color: '#0f172a' }}>Case Objective / Hypothesis: </strong>
            {caseData.summary}
          </div>
        )}
      </div>

      {/* Notifications */}
      {notification && <div className="success">{notification}</div>}
      {error && <div className="error">{error}</div>}

      {/* Two-Column Deep-Dive Investigation Workspace */}
      <div className="details-grid">
        {/* Left Column: Flagged Entities & Evidence Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <EvidenceList
            caseItem={caseData}
            evidenceItems={caseData.evidence_items || []}
            onAddEvidence={handleAddEvidence}
          />
        </div>

        {/* Right Column: Case Notes & Audit Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <CaseNotesPanel
            onAddNote={handleAddNote}
            isSubmitting={isSubmitting}
          />

          <InvestigationTimeline
            events={caseData.events || []}
          />
        </div>
      </div>

      {/* Outcome Finalization Modal */}
      <Modal
        isOpen={outcomeModalOpen}
        onClose={() => setOutcomeModalOpen(false)}
        title="Finalize Investigation Case Outcome"
        maxWidth="520px"
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setOutcomeModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleFinalizeOutcome}
              disabled={isSubmitting}
              style={{ background: '#16a34a' }}
            >
              {isSubmitting ? 'Recording Outcome...' : 'Confirm Resolution'}
            </button>
          </>
        }
      >
        <form onSubmit={handleFinalizeOutcome} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>
            Choose the final compliance disposition for Case #{caseData.case_id.slice(0, 8)}. This will record an official audit event and transition the case status to RESOLVED.
          </p>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Final Outcome Classification:
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: selectedOutcome === 'SUSPICIOUS' ? '2px solid #dc2626' : '1px solid #e2e8f0',
                  background: selectedOutcome === 'SUSPICIOUS' ? '#fef2f2' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="SUSPICIOUS"
                  checked={selectedOutcome === 'SUSPICIOUS'}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                />
                <div>
                  <strong style={{ color: '#991b1b', fontSize: '13px', display: 'block' }}>
                    SUSPICIOUS (Confirm Anomaly / File SAR)
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Confirmed unauthorized activity, account takeover, or money laundering pattern.
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: selectedOutcome === 'NOT_SUSPICIOUS' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                  background: selectedOutcome === 'NOT_SUSPICIOUS' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="NOT_SUSPICIOUS"
                  checked={selectedOutcome === 'NOT_SUSPICIOUS'}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                />
                <div>
                  <strong style={{ color: '#166534', fontSize: '13px', display: 'block' }}>
                    NOT_SUSPICIOUS (False Positive / Customer Cleared)
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Legitimate transaction verified with account holder or valid documentation.
                  </span>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: selectedOutcome === 'INCONCLUSIVE' ? '2px solid #d97706' : '1px solid #e2e8f0',
                  background: selectedOutcome === 'INCONCLUSIVE' ? '#fffbeb' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <input
                  type="radio"
                  name="outcome"
                  value="INCONCLUSIVE"
                  checked={selectedOutcome === 'INCONCLUSIVE'}
                  onChange={(e) => setSelectedOutcome(e.target.value)}
                />
                <div>
                  <strong style={{ color: '#b45309', fontSize: '13px', display: 'block' }}>
                    INCONCLUSIVE (Insufficient Evidence)
                  </strong>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Unverifiable counterparty or unresponsive account holder. Monitored for future alerts.
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Final Resolution Notes & Justification:
            </label>
            <textarea
              rows={3}
              value={outcomeNotes}
              onChange={(e) => setOutcomeNotes(e.target.value)}
              placeholder="State key evidence, customer statements, or reasoning behind this resolution..."
              style={{ width: '100%', resize: 'vertical' }}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
