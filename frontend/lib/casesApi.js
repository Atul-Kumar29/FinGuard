// Cases API client with live backend integration and resilient offline/mock store

import { api } from '@/lib/api';
import { getAlerts, INITIAL_MOCK_ALERTS } from './alertsApi';

export const INITIAL_MOCK_USERS = [
  { user_id: 'usr-admin-01', username: 'admin', role: 'ADMIN' },
  { user_id: 'usr-analyst-02', username: 'analyst', role: 'ANALYST' },
  { user_id: 'usr-reviewer-03', username: 'reviewer', role: 'REVIEWER' }
];

export const INITIAL_MOCK_CASES = [
  {
    case_id: 'cas-901-f1a2',
    alert_id: 'alt-9901-a1',
    transaction_id: 'tx-901a-88f1',
    account_ref: 'SAMPLE-001',
    amount: 95000.00,
    priority: 'CRITICAL',
    risk_score: 94.0,
    case_status: 'IN_PROGRESS',
    outcome: null,
    assigned_to: 'analyst',
    assigned_to_user_id: 'usr-analyst-02',
    summary: 'High-value UPI transfer to unverified foreign beneficiary following credential reset.',
    opened_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    resolved_at: null,
    evidence_items: [
      {
        id: 'ev-1',
        title: 'Amount Threshold Breach',
        category: 'VELOCITY_RULE',
        severity: 'CRITICAL',
        description: 'Amount ₹95,000 is 7.2x greater than median account outflow of ₹13,200.',
        source: 'Rules Engine v1.2'
      },
      {
        id: 'ev-2',
        title: 'New Beneficiary Interaction',
        category: 'COUNTERPARTY',
        severity: 'HIGH',
        description: 'Payee PAYEE-GLOBAL-EX registered 14 minutes prior to large fund movement.',
        source: 'Core Banking API'
      },
      {
        id: 'ev-3',
        title: 'Authentication Location Discrepancy',
        category: 'DEVICE_GEOLOCATION',
        severity: 'MEDIUM',
        description: 'Transaction initiated from IP range 198.51.100.22 (differs from primary residence ASN).',
        source: 'Session Gateway'
      }
    ],
    events: [
      {
        event_id: 'evt-1',
        event_type: 'CASE_CREATED',
        notes: 'Investigation initiated from Alert alt-9901-a1 by rules engine triage.',
        author_name: 'System',
        created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString()
      },
      {
        event_id: 'evt-2',
        event_type: 'CASE_ASSIGNED',
        notes: 'Case assigned to analyst for deep-dive entity inspection.',
        author_name: 'admin',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        event_id: 'evt-3',
        event_type: 'NOTE_ADDED',
        notes: 'Contacted customer via out-of-band verification channel. Waiting for confirmation callback.',
        author_name: 'analyst',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ]
  },
  {
    case_id: 'cas-802-e2b3',
    alert_id: 'alt-8802-b2',
    transaction_id: 'tx-872b-44c3',
    account_ref: 'SAMPLE-002',
    amount: 48000.00,
    priority: 'CRITICAL',
    risk_score: 88.0,
    case_status: 'OPEN',
    outcome: null,
    assigned_to: 'reviewer',
    assigned_to_user_id: 'usr-reviewer-03',
    summary: 'Drainage pattern to high-risk cryptocurrency merchant category code (MCC-6051).',
    opened_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    resolved_at: null,
    evidence_items: [
      {
        id: 'ev-4',
        title: 'Prohibited MCC Category',
        category: 'MERCHANT_COMPLIANCE',
        severity: 'CRITICAL',
        description: 'Merchant terminal DIGITAL-ASSETS-EX flagged in high-risk asset registry.',
        source: 'Sanctions & Watchlist DB'
      },
      {
        id: 'ev-5',
        title: 'Account Liquidity Depletion',
        category: 'BALANCE_RATIO',
        severity: 'HIGH',
        description: 'Transaction consumed 82% of current balance in single checkout.',
        source: 'Ledger Service'
      }
    ],
    events: [
      {
        event_id: 'evt-4',
        event_type: 'CASE_CREATED',
        notes: 'Auto-escalated due to critical risk score of 88/100.',
        author_name: 'System',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      }
    ]
  },
  {
    case_id: 'cas-703-d3c4',
    alert_id: 'alt-4406-f6',
    transaction_id: 'tx-109i-77d6',
    account_ref: 'SAMPLE-003',
    amount: 1500.00,
    priority: 'HIGH',
    risk_score: 72.0,
    case_status: 'PENDING',
    outcome: null,
    assigned_to: null,
    assigned_to_user_id: null,
    summary: 'ATM skimming or stolen card pattern: multiple failed PIN attempts followed by physical ATM denial.',
    opened_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    resolved_at: null,
    evidence_items: [
      {
        id: 'ev-6',
        title: 'Consecutive PIN Declines',
        category: 'AUTHENTICATION',
        severity: 'HIGH',
        description: 'Card rejected 3 consecutive times within 4 minutes at ATM-METRO-02.',
        source: 'Card Switch'
      }
    ],
    events: [
      {
        event_id: 'evt-5',
        event_type: 'CASE_CREATED',
        notes: 'Card security incident case opened.',
        author_name: 'System',
        created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString()
      },
      {
        event_id: 'evt-6',
        event_type: 'STATUS_CHANGED',
        notes: 'Placed in PENDING awaiting ATM camera log extraction.',
        author_name: 'admin',
        created_at: new Date(Date.now() - 1000 * 60 * 150).toISOString()
      }
    ]
  },
  {
    case_id: 'cas-604-c4d5',
    alert_id: 'alt-6604-d4',
    transaction_id: 'tx-321g-99b8',
    account_ref: 'SAMPLE-004',
    amount: 125000.00,
    priority: 'HIGH',
    risk_score: 82.0,
    case_status: 'RESOLVED',
    outcome: 'NOT_SUSPICIOUS',
    assigned_to: 'reviewer',
    assigned_to_user_id: 'usr-reviewer-03',
    summary: 'Large wholesale RTGS payment to real estate escrow services verified via customer phone confirmation.',
    opened_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    evidence_items: [
      {
        id: 'ev-7',
        title: 'Verified Contract Documentation',
        category: 'DOCUMENTATION',
        severity: 'LOW',
        description: 'Customer provided legal purchase deed and notarized property acquisition agreement.',
        source: 'Support Document Portal'
      }
    ],
    events: [
      {
        event_id: 'evt-7',
        event_type: 'CASE_CREATED',
        notes: 'High-value wire review.',
        author_name: 'System',
        created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString()
      },
      {
        event_id: 'evt-8',
        event_type: 'OUTCOME_SET',
        notes: 'Case resolved as NOT_SUSPICIOUS. Verified legitimate real estate escrow down-payment.',
        author_name: 'reviewer',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      }
    ]
  },
  {
    case_id: 'cas-505-b5e6',
    alert_id: 'alt-7703-c3',
    transaction_id: 'tx-761c-33d2',
    account_ref: 'SAMPLE-003',
    amount: 1700.00,
    priority: 'HIGH',
    risk_score: 76.0,
    case_status: 'CLOSED',
    outcome: 'SUSPICIOUS',
    assigned_to: 'analyst',
    assigned_to_user_id: 'usr-analyst-02',
    summary: 'Confirmed card cloning attempt. Card immediately blocked and customer refunded.',
    opened_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString(),
    resolved_at: new Date(Date.now() - 1000 * 60 * 400).toISOString(),
    evidence_items: [
      {
        id: 'ev-8',
        title: 'Geographic Impossible Velocity',
        category: 'LOCATION',
        severity: 'CRITICAL',
        description: 'Card attempted in Mumbai 12 minutes after physical transaction in Pune.',
        source: 'Fraud Network'
      }
    ],
    events: [
      {
        event_id: 'evt-9',
        event_type: 'CASE_CREATED',
        notes: 'Impossible speed alert case.',
        author_name: 'System',
        created_at: new Date(Date.now() - 1000 * 60 * 1200).toISOString()
      },
      {
        event_id: 'evt-10',
        event_type: 'OUTCOME_SET',
        notes: 'Confirmed cloned card compromise. Card blocked and replacement dispatched.',
        author_name: 'analyst',
        created_at: new Date(Date.now() - 1000 * 60 * 400).toISOString()
      }
    ]
  }
];

const LOCAL_CASES_KEY = 'finguard_cases_store';

function getStoredCases() {
  if (typeof window === 'undefined') return INITIAL_MOCK_CASES;
  try {
    const raw = localStorage.getItem(LOCAL_CASES_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_CASES_KEY, JSON.stringify(INITIAL_MOCK_CASES));
      return INITIAL_MOCK_CASES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_CASES;
  }
}

function saveStoredCases(cases) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CASES_KEY, JSON.stringify(cases));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Fetch investigator users from backend or fallback
 */
export async function getUsers() {
  try {
    const users = await api('/users');
    if (Array.isArray(users) && users.length > 0) {
      return { data: users, isLive: true };
    }
  } catch (err) {
    // fallback
  }
  return { data: INITIAL_MOCK_USERS, isLive: false };
}

/**
 * Fetch all investigation cases
 */
export async function getCases() {
  try {
    const [liveCases, alertsRes, usersRes] = await Promise.allSettled([
      api('/cases'),
      getAlerts(),
      getUsers()
    ]);

    if (liveCases.status === 'fulfilled' && Array.isArray(liveCases.value) && liveCases.value.length > 0) {
      const alerts = alertsRes.status === 'fulfilled' ? alertsRes.value.data : INITIAL_MOCK_ALERTS;
      const users = usersRes.status === 'fulfilled' ? usersRes.value.data : INITIAL_MOCK_USERS;
      const alertsMap = new Map(alerts.map(a => [String(a.alert_id), a]));
      const usersMap = new Map(users.map(u => [String(u.user_id), u.username]));

      const stored = getStoredCases();
      const localMap = new Map(stored.map(c => [String(c.case_id), c]));

      const enriched = liveCases.value.map(c => {
        const idStr = String(c.case_id);
        const localMatch = localMap.get(idStr);
        const alertMatch = alertsMap.get(String(c.alert_id));
        const mockMatch = INITIAL_MOCK_CASES.find(m => String(m.case_id) === idStr) || INITIAL_MOCK_CASES[0];

        const assignedName = c.assigned_to
          ? (usersMap.get(String(c.assigned_to)) || c.assigned_to)
          : (localMatch?.assigned_to || null);

        const priority = alertMatch?.priority || mockMatch.priority || 'MEDIUM';
        const risk_score = alertMatch?.risk_score || mockMatch.risk_score || 50;
        const account_ref = alertMatch?.account_ref || mockMatch.account_ref || 'ACC-REF';
        const amount = alertMatch?.amount || mockMatch.amount || 0;

        return {
          ...mockMatch,
          ...c,
          case_id: idStr,
          alert_id: String(c.alert_id),
          account_ref,
          amount,
          priority,
          risk_score,
          assigned_to: assignedName,
          case_status: localMatch?.case_status || c.case_status || 'OPEN',
          outcome: localMatch?.outcome !== undefined ? localMatch.outcome : c.outcome,
          summary: c.summary || localMatch?.summary || mockMatch.summary,
          opened_at: c.opened_at || mockMatch.opened_at,
          evidence_items: localMatch?.evidence_items || mockMatch.evidence_items || [],
          events: localMatch?.events || mockMatch.events || []
        };
      });

      return { data: enriched, isLive: true };
    }
  } catch (err) {
    // fallback
  }

  return { data: getStoredCases(), isLive: false };
}

/**
 * Fetch case by ID with full timeline events and evidence
 */
export async function getCaseById(caseId) {
  const { data: allCases } = await getCases();
  let found = allCases.find(c => String(c.case_id) === String(caseId));

  if (!found) {
    found = {
      ...INITIAL_MOCK_CASES[0],
      case_id: caseId,
      summary: `Investigation case #${caseId}`
    };
  }

  // Try to load latest events from backend
  try {
    const liveEvents = await api(`/cases/${caseId}/events`);
    if (Array.isArray(liveEvents) && liveEvents.length > 0) {
      found = {
        ...found,
        events: liveEvents.map(e => ({
          event_id: String(e.event_id),
          event_type: e.event_type,
          notes: e.notes,
          author_name: e.user_id || 'System',
          created_at: e.created_at
        }))
      };
    }
  } catch (err) {
    // Keep local events
  }

  return found;
}

/**
 * Create a new investigation case
 */
export async function createCase({ alert_id, assigned_to = null, summary = '', priority = 'HIGH' }) {
  let backendCaseId = null;
  try {
    const res = await api('/cases', {
      method: 'POST',
      body: JSON.stringify({
        alert_id,
        assigned_to: assigned_to || null,
        summary
      })
    });
    backendCaseId = res?.case_id;
  } catch (err) {
    // fallback to generated ID
  }

  const newId = backendCaseId || `cas-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`;
  const stored = getStoredCases();

  // Find linked alert details
  const mockAlert = INITIAL_MOCK_ALERTS.find(a => String(a.alert_id) === String(alert_id));

  const newCase = {
    case_id: newId,
    alert_id: String(alert_id),
    transaction_id: mockAlert?.transaction_id || 'tx-synth-ref',
    account_ref: mockAlert?.account_ref || 'ACC-FLAGGED',
    amount: mockAlert?.amount || 0,
    priority: mockAlert?.priority || priority,
    risk_score: mockAlert?.risk_score || 75,
    case_status: 'OPEN',
    outcome: null,
    assigned_to: assigned_to || null,
    summary: summary || `Investigation opened for alert ${alert_id}`,
    opened_at: new Date().toISOString(),
    resolved_at: null,
    evidence_items: mockAlert?.rule_matches?.map((r, i) => ({
      id: `ev-gen-${i}`,
      title: r.rule_name,
      category: 'RULE_TRIGGER',
      severity: mockAlert.priority,
      description: r.evidence,
      source: 'FinGuard Detection Engine'
    })) || [
      {
        id: 'ev-init-1',
        title: 'Alert Trigger',
        category: 'SYSTEM_FLAG',
        severity: priority,
        description: summary || 'Case opened for investigation review.',
        source: 'Alert Triage'
      }
    ],
    events: [
      {
        event_id: `evt-${Date.now()}-1`,
        event_type: 'CASE_CREATED',
        notes: summary || 'Case created and queued for investigation.',
        author_name: 'Current Analyst',
        created_at: new Date().toISOString()
      }
    ]
  };

  saveStoredCases([newCase, ...stored]);
  return { success: true, case: newCase, case_id: newId, isLive: Boolean(backendCaseId) };
}

/**
 * Update case status, outcome, summary, or assignee
 */
export async function updateCase(caseId, payload) {
  let backendSuccess = false;
  try {
    await api(`/cases/${caseId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    backendSuccess = true;
  } catch (err) {
    // local fallback
  }

  const stored = getStoredCases();
  let updatedCase = null;

  const updatedList = stored.map(c => {
    if (String(c.case_id) === String(caseId)) {
      const isResolving = payload.case_status === 'RESOLVED' || payload.case_status === 'CLOSED';
      const newEvents = [...(c.events || [])];

      if (payload.case_status && payload.case_status !== c.case_status) {
        newEvents.unshift({
          event_id: `evt-${Date.now()}-status`,
          event_type: 'STATUS_CHANGED',
          notes: `Status changed from ${c.case_status} to ${payload.case_status}.`,
          author_name: 'Analyst',
          created_at: new Date().toISOString()
        });
      }

      if (payload.outcome && payload.outcome !== c.outcome) {
        newEvents.unshift({
          event_id: `evt-${Date.now()}-outcome`,
          event_type: 'OUTCOME_SET',
          notes: `Investigation outcome marked as ${payload.outcome}.`,
          author_name: 'Analyst',
          created_at: new Date().toISOString()
        });
      }

      if (payload.assigned_to !== undefined && payload.assigned_to !== c.assigned_to) {
        newEvents.unshift({
          event_id: `evt-${Date.now()}-assign`,
          event_type: 'ASSIGNMENT_UPDATED',
          notes: `Assigned investigator updated to ${payload.assigned_to || 'Unassigned'}.`,
          author_name: 'Analyst',
          created_at: new Date().toISOString()
        });
      }

      updatedCase = {
        ...c,
        ...payload,
        resolved_at: isResolving ? (c.resolved_at || new Date().toISOString()) : c.resolved_at,
        events: newEvents
      };
      return updatedCase;
    }
    return c;
  });

  saveStoredCases(updatedList);
  return { success: true, case: updatedCase, isLive: backendSuccess };
}

/**
 * Add an audit/investigation note or event to a case
 */
export async function addCaseEvent(caseId, { event_type = 'NOTE_ADDED', notes = '', user_id = null, author_name = 'Analyst' }) {
  let backendSuccess = false;
  try {
    await api(`/cases/${caseId}/events`, {
      method: 'POST',
      body: JSON.stringify({
        event_type,
        notes,
        user_id
      })
    });
    backendSuccess = true;
  } catch (err) {
    // local fallback
  }

  const stored = getStoredCases();
  const newEvent = {
    event_id: `evt-${Date.now()}`,
    event_type,
    notes,
    author_name,
    created_at: new Date().toISOString()
  };

  const updatedList = stored.map(c => {
    if (String(c.case_id) === String(caseId)) {
      return {
        ...c,
        events: [newEvent, ...(c.events || [])]
      };
    }
    return c;
  });

  saveStoredCases(updatedList);
  return { success: true, event: newEvent, isLive: backendSuccess };
}

/**
 * Calculate statistical aggregates for cases dashboard
 */
export function calculateCaseStats(cases = []) {
  const total = cases.length;
  const openCount = cases.filter(c => c.case_status === 'OPEN').length;
  const inProgressCount = cases.filter(c => c.case_status === 'IN_PROGRESS').length;
  const pendingCount = cases.filter(c => c.case_status === 'PENDING').length;
  const resolvedCount = cases.filter(c => c.case_status === 'RESOLVED').length;
  const closedCount = cases.filter(c => c.case_status === 'CLOSED').length;
  const criticalCount = cases.filter(c => c.priority === 'CRITICAL' && c.case_status !== 'CLOSED' && c.case_status !== 'RESOLVED').length;
  const suspiciousCount = cases.filter(c => c.outcome === 'SUSPICIOUS').length;

  return {
    total,
    open: openCount,
    inProgress: inProgressCount,
    pending: pendingCount,
    resolved: resolvedCount,
    closed: closedCount,
    active: openCount + inProgressCount + pendingCount,
    critical: criticalCount,
    suspicious: suspiciousCount
  };
}
