// Alerts API client with live backend integration and resilient offline/mock store

import { api } from '@/lib/api';

export const INITIAL_MOCK_ALERTS = [
  {
    alert_id: 'alt-9901-a1',
    result_id: 'res-8801',
    transaction_id: 'tx-901a-88f1',
    account_ref: 'SAMPLE-001',
    amount: 95000.00,
    risk_score: 94.0,
    priority: 'CRITICAL',
    alert_status: 'OPEN',
    channel: 'UPI',
    counterparty_ref: 'PAYEE-GLOBAL-EX',
    created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    explanation: 'Unusually high amount (₹95,000) sent to an unverified recipient following a recent credential update.',
    rule_matches: [
      {
        rule_name: 'HIGH_AMOUNT_DEVIATION',
        description: 'Transaction amount exceeds 7x the 30-day baseline average',
        evidence: 'Amount is 7.2x above 30-day account baseline',
        observed: '₹95,000.00',
        threshold: '₹13,200.00',
        impact: '+45'
      },
      {
        rule_name: 'NEW_BENEFICIARY',
        description: 'First high-value transaction executed to counterparty',
        evidence: 'Zero prior transfer history with counterparty PAYEE-GLOBAL-EX',
        observed: 'Zero history',
        threshold: 'Established contact',
        impact: '+30'
      },
      {
        rule_name: 'RAPID_VELOCITY',
        description: 'Multiple high-velocity transactions within 10 minutes',
        evidence: '3 transactions executed in under 6 minutes',
        observed: '3 tx / 6 min',
        threshold: '1 tx / 15 min',
        impact: '+19'
      }
    ]
  },
  {
    alert_id: 'alt-8802-b2',
    result_id: 'res-7702',
    transaction_id: 'tx-872b-44c3',
    account_ref: 'SAMPLE-002',
    amount: 48000.00,
    risk_score: 88.0,
    priority: 'CRITICAL',
    alert_status: 'OPEN',
    channel: 'IMPS',
    counterparty_ref: 'DIGITAL-ASSETS-EX',
    created_at: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    explanation: 'High-value outflow to high-risk merchant category code depleting majority of balance.',
    rule_matches: [
      {
        rule_name: 'HIGH_RISK_MERCHANT',
        description: 'Merchant matches prohibited or high-risk asset intermediary',
        evidence: 'Merchant category matches high-risk asset intermediary',
        observed: 'MCC-6051',
        threshold: 'Retail MCC',
        impact: '+50'
      },
      {
        rule_name: 'BALANCE_DEPLETION',
        description: 'Single transfer drains over 80% of account liquidity',
        evidence: 'Transaction utilizes 82% of current account balance',
        observed: '82% balance',
        threshold: '50% balance',
        impact: '+38'
      }
    ]
  },
  {
    alert_id: 'alt-7703-c3',
    result_id: 'res-6603',
    transaction_id: 'tx-761c-33d2',
    account_ref: 'SAMPLE-003',
    amount: 1700.00,
    risk_score: 76.0,
    priority: 'HIGH',
    alert_status: 'IN_REVIEW',
    channel: 'CARD',
    counterparty_ref: 'ATM-TERMINAL-01',
    created_at: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    explanation: 'Multiple consecutive PIN verification failures followed by unusual terminal location.',
    rule_matches: [
      {
        rule_name: 'REPEATED_PIN_FAILURES',
        description: 'Consecutive incorrect credentials on card reader',
        evidence: '3 consecutive incorrect PIN entries in 10 minutes',
        observed: '3 failures',
        threshold: '2 failures',
        impact: '+45'
      },
      {
        rule_name: 'GEOGRAPHIC_VELOCITY',
        description: 'Physical displacement speed exceeds feasible travel speed',
        evidence: 'ATM terminal 45km from previous card transaction in 12 min',
        observed: '225 km/h',
        threshold: '80 km/h',
        impact: '+31'
      }
    ]
  },
  {
    alert_id: 'alt-6604-d4',
    result_id: 'res-5504',
    transaction_id: 'tx-321g-99b8',
    account_ref: 'SAMPLE-004',
    amount: 125000.00,
    risk_score: 82.0,
    priority: 'HIGH',
    alert_status: 'OPEN',
    channel: 'RTGS',
    counterparty_ref: 'ESCROW-SERVICES',
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    explanation: 'Large RTGS transfer to newly registered external escrow beneficiary held for review.',
    rule_matches: [
      {
        rule_name: 'LARGE_VALUE_TRANSFER',
        description: 'Transfer exceeds wholesale retail monitoring threshold',
        evidence: 'Amount exceeds ₹1,00,000 threshold for retail tier',
        observed: '₹1,25,000.00',
        threshold: '₹1,00,000.00',
        impact: '+52'
      },
      {
        rule_name: 'NEW_BENEFICIARY',
        description: 'First high-value payment to new payee',
        evidence: 'First interaction with counterparty ESCROW-SERVICES',
        observed: 'First transfer',
        threshold: 'Established contact',
        impact: '+30'
      }
    ]
  },
  {
    alert_id: 'alt-5505-e5',
    result_id: 'res-4405',
    transaction_id: 'tx-654d-22e1',
    account_ref: 'SAMPLE-001',
    amount: 2200.00,
    risk_score: 45.0,
    priority: 'MEDIUM',
    alert_status: 'DISMISSED',
    channel: 'UPI',
    counterparty_ref: 'RETAIL-STORE-03',
    created_at: new Date(Date.now() - 1000 * 60 * 310).toISOString(),
    explanation: 'Transaction conducted outside normal user activity hours (02:45 AM).',
    rule_matches: [
      {
        rule_name: 'OFF_HOURS_ACTIVITY',
        description: 'Payment initiated during low-activity nighttime window',
        evidence: 'Payment initiated at 02:45 AM local time',
        observed: '02:45 AM',
        threshold: '06:00 AM - 11:30 PM',
        impact: '+45'
      }
    ]
  },
  {
    alert_id: 'alt-4406-f6',
    result_id: 'res-3306',
    transaction_id: 'tx-109i-77d6',
    account_ref: 'SAMPLE-003',
    amount: 1500.00,
    risk_score: 72.0,
    priority: 'HIGH',
    alert_status: 'ESCALATED',
    channel: 'CARD',
    counterparty_ref: 'ATM-METRO-02',
    created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    explanation: 'Failed card authentication at automated teller machine following velocity warning.',
    rule_matches: [
      {
        rule_name: 'AUTHENTICATION_FAILURE',
        description: 'Declined transaction with repeated invalid PIN',
        evidence: 'Declined card read attempt at ATM terminal',
        observed: 'Declined',
        threshold: 'Approved',
        impact: '+72'
      }
    ]
  },
  {
    alert_id: 'alt-3307-g7',
    result_id: 'res-2207',
    transaction_id: 'tx-098j-66e5',
    account_ref: 'SAMPLE-005',
    amount: 34500.00,
    risk_score: 38.0,
    priority: 'LOW',
    alert_status: 'CLOSED',
    channel: 'NEFT',
    counterparty_ref: 'SUPPLIER-INC',
    created_at: new Date(Date.now() - 1000 * 60 * 580).toISOString(),
    explanation: 'Routine business vendor settlement flagged for threshold review.',
    rule_matches: [
      {
        rule_name: 'VENDOR_AUDIT_SAMPLE',
        description: 'Randomized sampling for periodic vendor audit verification',
        evidence: 'Quarterly compliance spot check selection',
        observed: 'Sample tier 2',
        threshold: 'Sample tier 1',
        impact: '+38'
      }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'finguard_alerts_store';

function getStoredAlerts() {
  if (typeof window === 'undefined') return INITIAL_MOCK_ALERTS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_MOCK_ALERTS));
      return INITIAL_MOCK_ALERTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_MOCK_ALERTS;
  }
}

function saveStoredAlerts(alerts) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Fetch all alerts from backend or local fallback
 */
export async function getAlerts() {
  try {
    const liveAlerts = await api('/alerts');
    if (Array.isArray(liveAlerts) && liveAlerts.length > 0) {
      const stored = getStoredAlerts();
      const localStatusMap = new Map(stored.map(a => [String(a.alert_id), a]));

      const enriched = liveAlerts.map(a => {
        const idStr = String(a.alert_id);
        const localMatch = localStatusMap.get(idStr);
        const mockMatch = INITIAL_MOCK_ALERTS.find(m => String(m.alert_id) === idStr) || INITIAL_MOCK_ALERTS[0];

        return {
          ...mockMatch,
          ...a,
          alert_id: idStr,
          transaction_id: String(a.transaction_id || mockMatch.transaction_id),
          amount: Number(a.amount ?? mockMatch.amount),
          risk_score: Number(a.risk_score ?? mockMatch.risk_score),
          priority: a.priority || mockMatch.priority,
          alert_status: localMatch?.alert_status || a.alert_status || 'OPEN',
          created_at: a.created_at || mockMatch.created_at,
          explanation: a.explanation || mockMatch.explanation,
          rule_matches: localMatch?.rule_matches || mockMatch.rule_matches || []
        };
      });

      return { data: enriched, isLive: true };
    }
  } catch (err) {
    // Backend offline or error -> fall back to stored mock alerts
  }

  return { data: getStoredAlerts(), isLive: false };
}

/**
 * Fetch single alert by ID
 */
export async function getAlertById(alertId) {
  const { data } = await getAlerts();
  const found = data.find(a => String(a.alert_id) === String(alertId));
  if (found) return found;

  const mock = INITIAL_MOCK_ALERTS[0];
  return {
    ...mock,
    alert_id: alertId
  };
}

/**
 * Update alert workflow status (OPEN, IN_REVIEW, ESCALATED, CLOSED, DISMISSED)
 */
export async function updateAlertStatus(alertId, newStatus, reason = '') {
  let backendSuccess = false;
  try {
    await api(`/alerts/${alertId}`, {
      method: 'PATCH',
      body: JSON.stringify({ alert_status: newStatus })
    });
    backendSuccess = true;
  } catch (err) {
    // Backend unavailable, fallback to local update
  }

  const stored = getStoredAlerts();
  const updated = stored.map(a => {
    if (String(a.alert_id) === String(alertId)) {
      return {
        ...a,
        alert_status: newStatus,
        status_updated_at: new Date().toISOString(),
        triage_note: reason || a.triage_note
      };
    }
    return a;
  });

  saveStoredAlerts(updated);
  return { success: true, alert_status: newStatus, isLive: backendSuccess };
}

/**
 * Quick triage: Acknowledge alert (transition from OPEN -> IN_REVIEW)
 */
export async function acknowledgeAlert(alertId) {
  return updateAlertStatus(alertId, 'IN_REVIEW', 'Acknowledged by analyst for triage');
}

/**
 * Quick triage: Dismiss alert (transition to DISMISSED)
 */
export async function dismissAlert(alertId, reason = 'False positive / Low operational risk') {
  return updateAlertStatus(alertId, 'DISMISSED', reason);
}

/**
 * Quick triage: Escalate alert to an investigation case
 */
export async function escalateAlertToCase(alertId, caseDetails = {}) {
  // Update status to ESCALATED
  const alertUpdate = await updateAlertStatus(alertId, 'ESCALATED', caseDetails.summary || 'Escalated to investigation case');

  // Attempt backend case creation
  let createdCaseId = null;
  try {
    const res = await api('/cases', {
      method: 'POST',
      body: JSON.stringify({
        alert_id: alertId,
        assigned_to: caseDetails.assigned_to || null,
        summary: caseDetails.summary || `Escalated investigation from alert ${alertId}`
      })
    });
    createdCaseId = res?.case_id;
  } catch (err) {
    createdCaseId = `case-${Date.now().toString(36)}`;
  }

  return {
    success: true,
    alertUpdate,
    caseId: createdCaseId
  };
}

/**
 * Calculate statistical aggregates for alerts dashboard
 */
export function calculateAlertStats(alerts = []) {
  const total = alerts.length;
  const openCount = alerts.filter(a => a.alert_status === 'OPEN').length;
  const inReviewCount = alerts.filter(a => a.alert_status === 'IN_REVIEW').length;
  const escalatedCount = alerts.filter(a => a.alert_status === 'ESCALATED').length;
  const dismissedCount = alerts.filter(a => a.alert_status === 'DISMISSED').length;
  const closedCount = alerts.filter(a => a.alert_status === 'CLOSED').length;
  const criticalCount = alerts.filter(a => a.priority === 'CRITICAL' && a.alert_status !== 'DISMISSED' && a.alert_status !== 'CLOSED').length;
  const highCount = alerts.filter(a => a.priority === 'HIGH' && a.alert_status !== 'DISMISSED' && a.alert_status !== 'CLOSED').length;

  const totalRisk = alerts.reduce((acc, curr) => acc + (Number(curr.risk_score) || 0), 0);
  const avgRisk = total > 0 ? (totalRisk / total).toFixed(1) : 0;

  return {
    total,
    open: openCount,
    inReview: inReviewCount,
    escalated: escalatedCount,
    dismissed: dismissedCount,
    closed: closedCount,
    critical: criticalCount,
    high: highCount,
    avgRisk
  };
}
