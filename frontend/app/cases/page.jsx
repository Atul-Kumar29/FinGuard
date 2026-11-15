'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCases,
  getUsers,
  createCase,
  updateCase,
  calculateCaseStats
} from '@/lib/casesApi';
import { getAlerts } from '@/lib/alertsApi';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterBar from '@/components/ui/FilterBar';
import StatCard from '@/components/ui/StatCard';
import Modal from '@/components/ui/Modal';

export default function CasesPage() {
  const router = useRouter();
  const [cases, setCases] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [outcomeFilter, setOutcomeFilter] = useState('ALL');

  // Modal State for Opening a New Case
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCaseAlertId, setNewCaseAlertId] = useState('');
  const [newCaseAssignee, setNewCaseAssignee] = useState('');
  const [newCasePriority, setNewCasePriority] = useState('HIGH');
  const [newCaseSummary, setNewCaseSummary] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [casesRes, alertsRes, usersRes] = await Promise.allSettled([
        getCases(),
        getAlerts(),
        getUsers()
      ]);

      if (casesRes.status === 'fulfilled') {
        setCases(casesRes.value.data || []);
      }
      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
      setError('');
    } catch (e) {
      setError(e.message || 'Error loading cases');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Quick Create Case
  async function handleCreateCase(e) {
    e.preventDefault();
    if (!newCaseAlertId) {
      setError('Please select or specify a linked alert ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createCase({
        alert_id: newCaseAlertId,
        assigned_to: newCaseAssignee || null,
        priority: newCasePriority,
        summary: newCaseSummary
      });

      showNotification(`Investigation Case #${res.case_id.slice(0, 8)} opened successfully.`);
      setIsCreateModalOpen(false);
      setNewCaseAlertId('');
      setNewCaseSummary('');
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to create case');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Handle Quick Inline Status Update
  async function handleQuickStatusUpdate(caseId, newStatus) {
    try {
      await updateCase(caseId, { case_status: newStatus });
      showNotification(`Case #${caseId.slice(0, 8)} updated to ${newStatus}.`);
      await loadData();
    } catch (e) {
      setError(e.message || 'Failed to update status');
    }
  }

  // Filtered and Sorted Cases
  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();

    return cases.filter((c) => {
      const matchesSearch =
        !q ||
        c.case_id?.toLowerCase().includes(q) ||
        c.alert_id?.toLowerCase().includes(q) ||
        c.account_ref?.toLowerCase().includes(q) ||
        c.summary?.toLowerCase().includes(q) ||
        c.assigned_to?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'ALL' || c.case_status === statusFilter;

      const matchesPriority =
        priorityFilter === 'ALL' || c.priority === priorityFilter;

      const matchesAssignee =
        assigneeFilter === 'ALL' ||
        (assigneeFilter === 'UNASSIGNED' && !c.assigned_to) ||
        c.assigned_to === assigneeFilter;

      const matchesOutcome =
        outcomeFilter === 'ALL' ||
        (outcomeFilter === 'PENDING' && !c.outcome) ||
        c.outcome === outcomeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesOutcome;
    });
  }, [cases, search, statusFilter, priorityFilter, assigneeFilter, outcomeFilter]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredCases.length / pageSize) || 1;
  const paginatedCases = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCases.slice(start, start + pageSize);
  }, [filteredCases, currentPage, pageSize]);

  // Metrics
  const stats = useMemo(() => calculateCaseStats(cases), [cases]);

  // Columns definition for DataTable
  const columns = [
    {
      key: 'case_id',
      header: 'Case ID & Opened',
      width: '150px',
      render: (row) => (
        <div>
          <Link
            href={`/cases/${row.case_id}`}
            style={{ fontWeight: 700, color: '#2563eb', fontSize: '13px', display: 'block' }}
            onClick={(e) => e.stopPropagation()}
          >
            #{row.case_id.slice(0, 8)}…
          </Link>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            {row.opened_at ? new Date(row.opened_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
          </span>
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Priority',
      width: '105px',
      render: (row) => <StatusBadge status={row.priority || 'HIGH'} size="sm" />
    },
    {
      key: 'account_ref',
      header: 'Flagged Entity & Amount',
      render: (row) => (
        <div>
          <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>
            {row.account_ref}
          </strong>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            {typeof row.amount === 'number' ? `₹${row.amount.toLocaleString('en-IN')}` : `₹${Number(row.amount || 0).toLocaleString('en-IN')}`}
            {row.risk_score && ` · Score ${row.risk_score}/100`}
          </span>
        </div>
      )
    },
    {
      key: 'summary',
      header: 'Investigation Summary',
      render: (row) => (
        <p
          style={{
            margin: 0,
            fontSize: '12.5px',
            color: '#334155',
            maxWidth: '320px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
          title={row.summary}
        >
          {row.summary || 'Investigation opened for flagged anomaly'}
        </p>
      )
    },
    {
      key: 'assigned_to',
      header: 'Assignee',
      width: '130px',
      render: (row) => (
        row.assigned_to ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '999px',
              background: '#f1f5f9',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
              fontWeight: 600,
              color: '#334155'
            }}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: '#cbd5e1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9.5px',
                fontWeight: 700,
                color: '#1e293b'
              }}
            >
              {row.assigned_to.charAt(0).toUpperCase()}
            </span>
            {row.assigned_to}
          </span>
        ) : (
          <span style={{ fontSize: '11.5px', color: '#94a3b8', fontStyle: 'italic' }}>
            Unassigned
          </span>
        )
      )
    },
    {
      key: 'case_status',
      header: 'Status',
      width: '120px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <StatusBadge status={row.case_status} size="sm" />
          {row.outcome && (
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: row.outcome === 'SUSPICIOUS' ? '#b91c1c' : '#15803d'
              }}
            >
              ● {row.outcome}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      width: '150px',
      render: (row) => (
        <div
          style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}
          onClick={(e) => e.stopPropagation()}
        >
          <select
            value={row.case_status}
            onChange={(e) => handleQuickStatusUpdate(row.case_id, e.target.value)}
            style={{ fontSize: '11px', padding: '3px 6px' }}
          >
            <option value="OPEN">OPEN</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="PENDING">PENDING</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="CLOSED">CLOSED</option>
          </select>

          <Link
            href={`/cases/${row.case_id}`}
            className="btn"
            style={{ padding: '4px 8px', fontSize: '11.5px' }}
          >
            Investigate →
          </Link>
        </div>
      )
    }
  ];

  return (
    <>
      {/* Header */}
      <div className="top">
        <div>
          <h1>Investigation Cases</h1>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Comprehensive case management for triaged alerts, entity risk analysis, and audit trails.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ fontSize: '13px' }}
          >
            + Open New Case
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && <div className="success">{notification}</div>}
      {error && <div className="error">{error}</div>}

      {/* Case Metrics Grid */}
      <div className="grid">
        <StatCard
          title="Active Cases"
          value={stats.active}
          subtitle={`${stats.critical} Critical priority cases`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
            </svg>
          }
        />
        <StatCard
          title="In Progress"
          value={stats.inProgress}
          subtitle="Currently under active analysis"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          title="Pending Evidence / Info"
          value={stats.pending}
          subtitle="Awaiting customer or banking logs"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <StatCard
          title="Resolved & Closed"
          value={stats.resolved + stats.closed}
          subtitle={`${stats.suspicious} flagged as Suspicious (SAR)`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search case ID, account, summary, investigator..."
        filters={[
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Open', value: 'OPEN' },
              { label: 'In Progress', value: 'IN_PROGRESS' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Resolved', value: 'RESOLVED' },
              { label: 'Closed', value: 'CLOSED' }
            ]
          },
          {
            label: 'Priority',
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: 'All Priorities', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' }
            ]
          },
          {
            label: 'Assignee',
            value: assigneeFilter,
            onChange: setAssigneeFilter,
            options: [
              { label: 'All Assignees', value: 'ALL' },
              { label: 'Unassigned', value: 'UNASSIGNED' },
              { label: 'analyst', value: 'analyst' },
              { label: 'reviewer', value: 'reviewer' },
              { label: 'admin', value: 'admin' }
            ]
          },
          {
            label: 'Outcome',
            value: outcomeFilter,
            onChange: setOutcomeFilter,
            options: [
              { label: 'All Outcomes', value: 'ALL' },
              { label: 'Pending Outcome', value: 'PENDING' },
              { label: 'Suspicious (SAR)', value: 'SUSPICIOUS' },
              { label: 'Not Suspicious', value: 'NOT_SUSPICIOUS' },
              { label: 'Inconclusive', value: 'INCONCLUSIVE' }
            ]
          }
        ]}
        onClear={() => {
          setSearch('');
          setStatusFilter('ALL');
          setPriorityFilter('ALL');
          setAssigneeFilter('ALL');
          setOutcomeFilter('ALL');
        }}
      />

      {/* Main Cases Data Table */}
      <DataTable
        columns={columns}
        data={paginatedCases}
        isLoading={loading}
        emptyMessage="No investigation cases found matching the criteria."
        onRowClick={(row) => router.push(`/cases/${row.case_id}`)}
      />

      {/* Pagination Footer */}
      {filteredCases.length > pageSize && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            padding: '4px 8px'
          }}
        >
          <span className="small muted">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredCases.length)} of {filteredCases.length} cases
          </span>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Previous
            </button>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '0 8px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#475569'
              }}
            >
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{ padding: '5px 10px', fontSize: '12px' }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create New Case Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Open New Investigation Case"
        maxWidth="540px"
        footer={
          <>
            <button
              type="button"
              className="btn secondary"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn"
              onClick={handleCreateCase}
              disabled={isSubmitting || !newCaseAlertId}
            >
              {isSubmitting ? 'Opening Case...' : 'Create Case'}
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Select Flagged Alert:
            </label>
            <select
              value={newCaseAlertId}
              onChange={(e) => {
                setNewCaseAlertId(e.target.value);
                const matched = alerts.find((a) => String(a.alert_id) === e.target.value);
                if (matched) {
                  setNewCaseSummary(`Investigation opened for flagged txn on ${matched.account_ref} (₹${matched.amount}). ${matched.explanation?.slice(0, 70)}…`);
                  setNewCasePriority(matched.priority || 'HIGH');
                }
              }}
              style={{ width: '100%' }}
              required
            >
              <option value="">-- Choose alert from triage queue --</option>
              {alerts.map((a) => (
                <option key={a.alert_id} value={a.alert_id}>
                  {a.account_ref} · ₹{Number(a.amount).toLocaleString('en-IN')} · {a.priority} ({a.alert_status})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Priority:
              </label>
              <select
                value={newCasePriority}
                onChange={(e) => setNewCasePriority(e.target.value)}
                style={{ width: '100%' }}
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Assign Investigator:
              </label>
              <select
                value={newCaseAssignee}
                onChange={(e) => setNewCaseAssignee(e.target.value)}
                style={{ width: '100%' }}
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
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
              Case Summary & Initial Hypothesis:
            </label>
            <textarea
              rows={3}
              value={newCaseSummary}
              onChange={(e) => setNewCaseSummary(e.target.value)}
              placeholder="Summary of risk factors and initial investigation scope..."
              style={{ width: '100%', resize: 'vertical' }}
              required
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
