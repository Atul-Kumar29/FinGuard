'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  getAlerts,
  updateAlertStatus,
  acknowledgeAlert,
  dismissAlert,
  escalateAlertToCase,
  calculateAlertStats
} from '@/lib/alertsApi';
import { getUsers } from '@/lib/casesApi';
import DataTable from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import FilterBar from '@/components/ui/FilterBar';
import StatCard from '@/components/ui/StatCard';
import AlertDrawer from '@/components/alerts/AlertDrawer';
import AlertEscalateModal from '@/components/alerts/AlertEscalateModal';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');
  const [isLiveActive, setIsLiveActive] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  // Selected Alert for Drawer & Escalation Modal
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [alertToEscalate, setAlertToEscalate] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Batch Selection
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const loadAlerts = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const [alertsRes, usersRes] = await Promise.allSettled([
        getAlerts(),
        getUsers()
      ]);

      if (alertsRes.status === 'fulfilled') {
        setAlerts(alertsRes.value.data || []);
      }
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data || []);
      }
      setLastRefreshed(new Date());
      setError('');
    } catch (e) {
      setError(e.message || 'Failed to load alert feed');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts();
  }, [loadAlerts]);

  // Real-time polling every 20 seconds when live is active
  useEffect(() => {
    if (!isLiveActive) return;
    const timer = setInterval(() => {
      loadAlerts(true);
    }, 20000);
    return () => clearInterval(timer);
  }, [isLiveActive, loadAlerts]);

  // Filtered and Sorted Alerts
  const filteredAlerts = useMemo(() => {
    const q = search.trim().toLowerCase();

    return alerts
      .filter((a) => {
        const matchesSearch =
          !q ||
          a.account_ref?.toLowerCase().includes(q) ||
          a.alert_id?.toLowerCase().includes(q) ||
          a.transaction_id?.toLowerCase().includes(q) ||
          a.counterparty_ref?.toLowerCase().includes(q) ||
          a.explanation?.toLowerCase().includes(q);

        const matchesSeverity =
          severityFilter === 'ALL' || a.priority === severityFilter;

        const matchesStatus =
          statusFilter === 'ALL' || a.alert_status === statusFilter;

        return matchesSearch && matchesSeverity && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'HIGHEST_RISK') {
          return (Number(b.risk_score) || 0) - (Number(a.risk_score) || 0);
        }
        if (sortBy === 'AMOUNT') {
          return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        }
        // Default NEWEST
        return new Date(b.created_at || 0) - new Date(a.created_at || 0);
      });
  }, [alerts, search, severityFilter, statusFilter, sortBy]);

  // Pagination slice
  const totalPages = Math.ceil(filteredAlerts.length / pageSize) || 1;
  const paginatedAlerts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlerts.slice(start, start + pageSize);
  }, [filteredAlerts, currentPage, pageSize]);

  // Statistics
  const stats = useMemo(() => calculateAlertStats(alerts), [alerts]);

  // Quick Triage Actions
  async function handleAcknowledge(alertId) {
    setActionLoading(true);
    try {
      await acknowledgeAlert(alertId);
      showNotification(`Alert ${alertId.slice(0, 8)} moved to IN_REVIEW.`);
      await loadAlerts(true);
      if (selectedAlert?.alert_id === alertId) {
        setSelectedAlert((prev) => (prev ? { ...prev, alert_status: 'IN_REVIEW' } : null));
      }
    } catch (e) {
      setError(e.message || 'Error updating alert');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDismiss(alertId, reason) {
    setActionLoading(true);
    try {
      await dismissAlert(alertId, reason);
      showNotification(`Alert ${alertId.slice(0, 8)} dismissed.`);
      await loadAlerts(true);
      if (selectedAlert?.alert_id === alertId) {
        setSelectedAlert((prev) => (prev ? { ...prev, alert_status: 'DISMISSED' } : null));
      }
    } catch (e) {
      setError(e.message || 'Error dismissing alert');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(alertId, newStatus) {
    setActionLoading(true);
    try {
      await updateAlertStatus(alertId, newStatus);
      showNotification(`Alert status updated to ${newStatus}.`);
      await loadAlerts(true);
      if (selectedAlert?.alert_id === alertId) {
        setSelectedAlert((prev) => (prev ? { ...prev, alert_status: newStatus } : null));
      }
    } catch (e) {
      setError(e.message || 'Failed to change status');
    } finally {
      setActionLoading(false);
    }
  }

  function handleOpenEscalateModal(alert) {
    setAlertToEscalate(alert);
    setEscalateModalOpen(true);
  }

  async function handleConfirmEscalate(casePayload) {
    setActionLoading(true);
    try {
      const res = await escalateAlertToCase(casePayload.alert_id, casePayload);
      showNotification(`Alert escalated! Investigation Case #${res.caseId?.slice(0, 8) || 'NEW'} created.`);
      setEscalateModalOpen(false);
      setDrawerOpen(false);
      await loadAlerts(true);
    } catch (e) {
      setError(e.message || 'Escalation failed');
    } finally {
      setActionLoading(false);
    }
  }

  // Batch actions
  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedAlerts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedAlerts.map((a) => a.alert_id)));
    }
  };

  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  async function handleBatchAcknowledge() {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        await acknowledgeAlert(id);
      }
      showNotification(`Acknowledged ${selectedIds.size} alerts.`);
      setSelectedIds(new Set());
      await loadAlerts(true);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleBatchDismiss() {
    if (selectedIds.size === 0) return;
    setActionLoading(true);
    try {
      for (const id of selectedIds) {
        await dismissAlert(id, 'Batch dismissed by analyst');
      }
      showNotification(`Dismissed ${selectedIds.size} alerts.`);
      setSelectedIds(new Set());
      await loadAlerts(true);
    } finally {
      setActionLoading(false);
    }
  }

  // Columns definition for DataTable
  const columns = [
    {
      key: 'select',
      header: (
        <input
          type="checkbox"
          checked={paginatedAlerts.length > 0 && selectedIds.size === paginatedAlerts.length}
          onChange={toggleSelectAll}
          onClick={(e) => e.stopPropagation()}
          aria-label="Select all rows"
        />
      ),
      width: '40px',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.has(row.alert_id)}
          onChange={() => toggleSelectOne(row.alert_id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select alert ${row.alert_id}`}
        />
      )
    },
    {
      key: 'created_at',
      header: 'Detected At',
      width: '135px',
      render: (row) => (
        <span style={{ fontSize: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
          {row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
          <span style={{ display: 'block', fontSize: '11px', color: '#94a3b8' }}>
            {row.created_at ? new Date(row.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
          </span>
        </span>
      )
    },
    {
      key: 'account_ref',
      header: 'Account & Transaction',
      render: (row) => (
        <div>
          <strong style={{ color: '#0f172a', fontSize: '13px', display: 'block' }}>
            {row.account_ref}
          </strong>
          <span style={{ fontSize: '11.5px', color: '#64748b', fontFamily: 'monospace' }}>
            {row.channel || 'UPI'} · {row.transaction_id ? `${row.transaction_id.slice(0, 10)}…` : 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      width: '110px',
      render: (row) => (
        <div style={{ textAlign: 'right' }}>
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>
            ₹{Number(row.amount || 0).toLocaleString('en-IN')}
          </strong>
          {row.counterparty_ref && (
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>
              {row.counterparty_ref}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: 'Severity',
      width: '110px',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          <StatusBadge status={row.priority} size="sm" />
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
            Risk: {row.risk_score}/100
          </span>
        </div>
      )
    },
    {
      key: 'explanation',
      header: 'Rule & Anomaly Explanation',
      render: (row) => (
        <div style={{ maxWidth: '380px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '12.5px',
              color: '#334155',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
            title={row.explanation}
          >
            {row.explanation || 'Anomaly pattern detected'}
          </p>
          {row.rule_matches && row.rule_matches.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', marginTop: '3px', flexWrap: 'wrap' }}>
              {row.rule_matches.slice(0, 2).map((rm, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: '10.5px',
                    padding: '1px 5px',
                    borderRadius: '3px',
                    background: '#f1f5f9',
                    color: '#475569',
                    fontWeight: 500
                  }}
                >
                  {rm.rule_name}
                </span>
              ))}
              {row.rule_matches.length > 2 && (
                <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                  +{row.rule_matches.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'alert_status',
      header: 'Status',
      width: '100px',
      render: (row) => <StatusBadge status={row.alert_status} size="sm" />
    },
    {
      key: 'actions',
      header: 'Quick Triage',
      align: 'right',
      width: '170px',
      render: (row) => (
        <div
          style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}
          onClick={(e) => e.stopPropagation()}
        >
          {row.alert_status === 'OPEN' && (
            <button
              type="button"
              className="btn secondary"
              title="Acknowledge (Move to In Review)"
              onClick={() => handleAcknowledge(row.alert_id)}
              disabled={actionLoading}
              style={{ padding: '4px 8px', fontSize: '11.5px' }}
            >
              ✓ Ack
            </button>
          )}

          {row.alert_status !== 'DISMISSED' && row.alert_status !== 'CLOSED' && (
            <button
              type="button"
              className="btn outline"
              title="Dismiss Alert"
              onClick={() => handleDismiss(row.alert_id, 'Dismissed from quick triage')}
              disabled={actionLoading}
              style={{ padding: '4px 8px', fontSize: '11.5px', color: '#64748b' }}
            >
              Dismiss
            </button>
          )}

          {row.alert_status !== 'ESCALATED' ? (
            <button
              type="button"
              className="btn"
              title="Escalate to Investigation Case"
              onClick={() => handleOpenEscalateModal(row)}
              disabled={actionLoading}
              style={{ padding: '4px 8px', fontSize: '11.5px', background: '#dc2626' }}
            >
              ⚑ Escalate
            </button>
          ) : (
            <Link
              href="/cases"
              className="btn outline"
              style={{ padding: '4px 8px', fontSize: '11.5px', color: '#2563eb' }}
            >
              Case →
            </Link>
          )}
        </div>
      )
    }
  ];

  return (
    <>
      {/* Top Header Bar */}
      <div className="top">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1>Real-Time Alert Feed</h1>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '3px 8px',
                borderRadius: '999px',
                background: isLiveActive ? '#f0fdf4' : '#f1f5f9',
                border: `1px solid ${isLiveActive ? '#bbf7d0' : '#cbd5e1'}`,
                fontSize: '11.5px',
                fontWeight: 600,
                color: isLiveActive ? '#15803d' : '#64748b'
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isLiveActive ? '#16a34a' : '#94a3b8'
                }}
              />
              {isLiveActive ? 'Live Polling Active' : 'Polling Paused'}
            </div>
          </div>
          <p className="muted" style={{ margin: '4px 0 0' }}>
            Monitor, prioritize, and triage financial anomaly alerts across high-velocity transaction streams.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={() => setIsLiveActive((prev) => !prev)}
            style={{ fontSize: '12px' }}
          >
            {isLiveActive ? '⏸ Pause Polling' : '▶ Resume Polling'}
          </button>

          <button
            type="button"
            className="btn secondary"
            onClick={() => loadAlerts()}
            disabled={loading}
            style={{ fontSize: '12px' }}
          >
            🔄 Refresh Now
          </button>
        </div>
      </div>

      {/* Notifications and Alerts */}
      {notification && <div className="success">{notification}</div>}
      {error && <div className="error">{error}</div>}

      {/* Summary Stat Cards */}
      <div className="grid">
        <StatCard
          title="Open Triage Queue"
          value={stats.open}
          subtitle={`${stats.critical} Critical alerts requiring review`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <StatCard
          title="In Review"
          value={stats.inReview}
          subtitle="Currently assigned or under review"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          title="Escalated to Cases"
          value={stats.escalated}
          subtitle="Transferred to investigation cases"
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2">
              <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
              <line x1="4" y1="22" x2="4" y2="15" />
            </svg>
          }
        />
        <StatCard
          title="Average Risk Score"
          value={`${stats.avgRisk}/100`}
          subtitle={`${stats.total} total detection events`}
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by account, alert ID, rule, explanation..."
        filters={[
          {
            label: 'Severity',
            value: severityFilter,
            onChange: setSeverityFilter,
            options: [
              { label: 'All Severities', value: 'ALL' },
              { label: 'Critical', value: 'CRITICAL' },
              { label: 'High', value: 'HIGH' },
              { label: 'Medium', value: 'MEDIUM' },
              { label: 'Low', value: 'LOW' }
            ]
          },
          {
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Open', value: 'OPEN' },
              { label: 'In Review', value: 'IN_REVIEW' },
              { label: 'Escalated', value: 'ESCALATED' },
              { label: 'Closed', value: 'CLOSED' },
              { label: 'Dismissed', value: 'DISMISSED' }
            ]
          },
          {
            label: 'Sort',
            value: sortBy,
            onChange: setSortBy,
            options: [
              { label: 'Newest First', value: 'NEWEST' },
              { label: 'Highest Risk Score', value: 'HIGHEST_RISK' },
              { label: 'Largest Amount', value: 'AMOUNT' }
            ]
          }
        ]}
        onClear={() => {
          setSearch('');
          setSeverityFilter('ALL');
          setStatusFilter('ALL');
          setSortBy('NEWEST');
        }}
        actions={
          selectedIds.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="small muted">{selectedIds.size} selected</span>
              <button
                type="button"
                className="btn secondary"
                onClick={handleBatchAcknowledge}
                disabled={actionLoading}
                style={{ padding: '5px 10px', fontSize: '12px' }}
              >
                ✓ Acknowledge All
              </button>
              <button
                type="button"
                className="btn outline"
                onClick={handleBatchDismiss}
                disabled={actionLoading}
                style={{ padding: '5px 10px', fontSize: '12px', color: '#64748b' }}
              >
                Dismiss All
              </button>
            </div>
          )
        }
      />

      {/* Main Alert Data Table */}
      <DataTable
        columns={columns}
        data={paginatedAlerts}
        isLoading={loading}
        emptyMessage="No anomaly alerts found matching your criteria."
        onRowClick={(row) => {
          setSelectedAlert(row);
          setDrawerOpen(true);
        }}
      />

      {/* Pagination Footer */}
      {filteredAlerts.length > pageSize && (
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
            {Math.min(currentPage * pageSize, filteredAlerts.length)} of {filteredAlerts.length} alerts
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

      {/* Alert Inspection Side Drawer */}
      <AlertDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        alert={selectedAlert}
        onAcknowledge={(id) => handleAcknowledge(id)}
        onDismiss={(id, reason) => handleDismiss(id, reason)}
        onEscalate={(alert) => handleOpenEscalateModal(alert)}
        onStatusChange={(id, status) => handleStatusChange(id, status)}
        isActionLoading={actionLoading}
      />

      {/* Alert Escalation to Case Modal */}
      <AlertEscalateModal
        isOpen={escalateModalOpen}
        onClose={() => setEscalateModalOpen(false)}
        alert={alertToEscalate}
        onConfirm={handleConfirmEscalate}
        users={users}
        isSubmitting={actionLoading}
      />
    </>
  );
}
