// FinGuard API Client with Robust Endpoints & Fallback Mock Data

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const MOCK_TRANSACTIONS = [
  {
    transaction_id: 'tx-901a-88f1',
    account_id: 'acc-001-a1b2',
    account_ref: 'SAMPLE-001',
    account_status: 'ACTIVE',
    amount: 95000.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'PAYEE-GLOBAL-EX',
    transaction_status: 'SUCCESS',
    channel: 'UPI',
    risk_score: 94.0,
    risk_level: 'CRITICAL',
    explanation: 'Unusually high amount (₹95,000) sent to an unverified recipient following a recent credential update.',
    rule_matches: [
      { rule_name: 'HIGH_AMOUNT_DEVIATION', evidence: 'Amount is 7.2x above 30-day account baseline', observed: '₹95,000.00', threshold: '₹13,200.00', impact: '+45' },
      { rule_name: 'NEW_BENEFICIARY', evidence: 'First transaction to this counterparty', observed: 'Zero history', threshold: 'Known beneficiary', impact: '+30' },
      { rule_name: 'RAPID_VELOCITY', evidence: '3 transactions executed in under 6 minutes', observed: '3 tx / 6 min', threshold: '1 tx / 15 min', impact: '+19' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(), desc: 'UPI transfer initiated via mobile application', status: 'completed' },
      { step: 'Two-Factor Verification', timestamp: new Date(Date.now() - 1000 * 60 * 11.8).toISOString(), desc: 'SMS OTP confirmed by registered device', status: 'completed' },
      { step: 'Risk Rules Evaluated', timestamp: new Date(Date.now() - 1000 * 60 * 11.5).toISOString(), desc: 'Rule evaluation calculated composite score of 94/100', status: 'alert' },
      { step: 'Alert Dispatched', timestamp: new Date(Date.now() - 1000 * 60 * 11).toISOString(), desc: 'Critical alert routed to priority queue', status: 'warning' },
      { step: 'Case Assigned', timestamp: new Date(Date.now() - 1000 * 60 * 9).toISOString(), desc: 'Assigned to reviewer for triage', status: 'in_progress' }
    ]
  },
  {
    transaction_id: 'tx-872b-44c3',
    account_id: 'acc-002-c3d4',
    account_ref: 'SAMPLE-002',
    account_status: 'ACTIVE',
    amount: 48000.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'DIGITAL-ASSETS-EX',
    transaction_status: 'SUCCESS',
    channel: 'IMPS',
    risk_score: 88.0,
    risk_level: 'CRITICAL',
    explanation: 'High-value outflow to high-risk merchant category code depleting majority of balance.',
    rule_matches: [
      { rule_name: 'HIGH_RISK_MERCHANT', evidence: 'Merchant category matches high-risk asset intermediary', observed: 'MCC-6051', threshold: 'Retail MCC', impact: '+50' },
      { rule_name: 'BALANCE_DEPLETION', evidence: 'Transaction utilizes 82% of current account balance', observed: '82% balance', threshold: '50% balance', impact: '+38' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(), desc: 'IMPS transfer submitted', status: 'completed' },
      { step: 'Two-Factor Verification', timestamp: new Date(Date.now() - 1000 * 60 * 34.5).toISOString(), desc: 'OTP authentication successful', status: 'completed' },
      { step: 'Risk Rules Evaluated', timestamp: new Date(Date.now() - 1000 * 60 * 34).toISOString(), desc: 'High-risk MCC detected with score 88/100', status: 'alert' }
    ]
  },
  {
    transaction_id: 'tx-761c-33d2',
    account_id: 'acc-003-e5f6',
    account_ref: 'SAMPLE-003',
    account_status: 'ACTIVE',
    amount: 1700.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    transaction_type: 'ATM_WITHDRAWAL',
    counterparty_ref: 'ATM-TERMINAL-01',
    transaction_status: 'FAILED',
    channel: 'CARD',
    risk_score: 76.0,
    risk_level: 'HIGH',
    explanation: 'Multiple consecutive PIN verification failures followed by unusual terminal location.',
    rule_matches: [
      { rule_name: 'REPEATED_PIN_FAILURES', evidence: '3 consecutive incorrect PIN entries in 10 minutes', observed: '3 failures', threshold: '2 failures', impact: '+45' },
      { rule_name: 'GEOGRAPHIC_VELOCITY', evidence: 'ATM terminal 45km from previous card transaction', observed: '225 km/h', threshold: '80 km/h', impact: '+31' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(), desc: 'Card inserted at ATM-TERMINAL-01', status: 'completed' },
      { step: 'PIN Verification', timestamp: new Date(Date.now() - 1000 * 60 * 54.8).toISOString(), desc: 'PIN verification declined (Attempt 3)', status: 'failed' },
      { step: 'Risk Rules Evaluated', timestamp: new Date(Date.now() - 1000 * 60 * 54).toISOString(), desc: 'Failure sequence scored at 76/100', status: 'alert' }
    ]
  },
  {
    transaction_id: 'tx-654d-22e1',
    account_id: 'acc-001-a1b2',
    account_ref: 'SAMPLE-001',
    account_status: 'ACTIVE',
    amount: 2200.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    transaction_type: 'PAYMENT',
    counterparty_ref: 'RETAIL-STORE-03',
    transaction_status: 'SUCCESS',
    channel: 'UPI',
    risk_score: 45.0,
    risk_level: 'MEDIUM',
    explanation: 'Transaction conducted outside normal user activity hours.',
    rule_matches: [
      { rule_name: 'OFF_HOURS_ACTIVITY', evidence: 'Payment initiated at 02:45 AM local time', observed: '02:45 AM', threshold: '06:00 AM - 11:30 PM', impact: '+45' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(), desc: 'QR code payment completed', status: 'completed' },
      { step: 'Risk Rules Evaluated', timestamp: new Date(Date.now() - 1000 * 60 * 74).toISOString(), desc: 'Moderate risk assigned for off-hours activity', status: 'completed' }
    ]
  },
  {
    transaction_id: 'tx-543e-11f0',
    account_id: 'acc-002-c3d4',
    account_ref: 'SAMPLE-002',
    account_status: 'ACTIVE',
    amount: 1800.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'GROCERY-MART',
    transaction_status: 'SUCCESS',
    channel: 'UPI',
    risk_score: 22.0,
    risk_level: 'LOW',
    explanation: 'Standard verified grocery payment matching typical spending profile.',
    rule_matches: [],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), desc: 'Payment completed', status: 'completed' }
    ]
  },
  {
    transaction_id: 'tx-432f-00a9',
    account_id: 'acc-001-a1b2',
    account_ref: 'SAMPLE-001',
    account_status: 'ACTIVE',
    amount: 1200.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'CAFE-METRO',
    transaction_status: 'SUCCESS',
    channel: 'UPI',
    risk_score: 15.0,
    risk_level: 'LOW',
    explanation: 'Habitual cafe purchase with zero risk flags.',
    rule_matches: [],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(), desc: 'Payment cleared', status: 'completed' }
    ]
  },
  {
    transaction_id: 'tx-321g-99b8',
    account_id: 'acc-004-f7g8',
    account_ref: 'SAMPLE-004',
    account_status: 'ACTIVE',
    amount: 125000.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 210).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'ESCROW-SERVICES',
    transaction_status: 'PENDING',
    channel: 'RTGS',
    risk_score: 82.0,
    risk_level: 'HIGH',
    explanation: 'Large RTGS transfer to newly registered external escrow beneficiary held for review.',
    rule_matches: [
      { rule_name: 'LARGE_VALUE_TRANSFER', evidence: 'Amount exceeds ₹1,00,000 threshold for retail tier', observed: '₹1,25,000.00', threshold: '₹1,00,000.00', impact: '+52' },
      { rule_name: 'NEW_BENEFICIARY', evidence: 'First interaction with counterparty', observed: 'First transfer', threshold: 'Established contact', impact: '+30' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 210).toISOString(), desc: 'RTGS transfer requested', status: 'completed' },
      { step: 'Compliance Review', timestamp: new Date(Date.now() - 1000 * 60 * 208).toISOString(), desc: 'Placed in pending review queue', status: 'warning' }
    ]
  },
  {
    transaction_id: 'tx-210h-88c7',
    account_id: 'acc-002-c3d4',
    account_ref: 'SAMPLE-002',
    account_status: 'ACTIVE',
    amount: 700.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 280).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'RECEIVER-01',
    transaction_status: 'SUCCESS',
    channel: 'UPI',
    risk_score: 18.0,
    risk_level: 'LOW',
    explanation: 'Routine peer-to-peer transfer to known recipient.',
    rule_matches: [],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 280).toISOString(), desc: 'Transfer completed', status: 'completed' }
    ]
  },
  {
    transaction_id: 'tx-109i-77d6',
    account_id: 'acc-003-e5f6',
    account_ref: 'SAMPLE-003',
    account_status: 'ACTIVE',
    amount: 1500.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 340).toISOString(),
    transaction_type: 'ATM_WITHDRAWAL',
    counterparty_ref: 'ATM-METRO-02',
    transaction_status: 'FAILED',
    channel: 'CARD',
    risk_score: 72.0,
    risk_level: 'HIGH',
    explanation: 'Failed card authentication at automated teller machine.',
    rule_matches: [
      { rule_name: 'AUTHENTICATION_FAILURE', evidence: 'Declined card read attempt', observed: 'Declined', threshold: 'Approved', impact: '+72' }
    ],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 340).toISOString(), desc: 'ATM withdrawal declined', status: 'failed' }
    ]
  },
  {
    transaction_id: 'tx-098j-66e5',
    account_id: 'acc-005-h9i0',
    account_ref: 'SAMPLE-005',
    account_status: 'ACTIVE',
    amount: 34500.00,
    transaction_ts: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    transaction_type: 'TRANSFER',
    counterparty_ref: 'SUPPLIER-INC',
    transaction_status: 'SUCCESS',
    channel: 'NEFT',
    risk_score: 35.0,
    risk_level: 'MEDIUM',
    explanation: 'Vendor supplier invoice payment via NEFT clearing.',
    rule_matches: [],
    timeline: [
      { step: 'Transaction Initiated', timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(), desc: 'NEFT batch processed', status: 'completed' }
    ]
  }
];

export const MOCK_DASHBOARD_STATS = {
  transactions: 1248,
  alerts_open: 14,
  cases_open: 6,
  anomalies: 38,
  total_volume: 5894200.50,
  flagged_volume: 782400.00,
  detection_rate_pct: 3.04,
  avg_risk_score: 28.4,
  risk_breakdown: {
    critical: 12,
    high: 26,
    medium: 84,
    low: 1126,
  },
  channel_distribution: [
    { channel: 'UPI', count: 780, volume: 1845000, riskShare: 42 },
    { channel: 'IMPS', count: 240, volume: 1420000, riskShare: 28 },
    { channel: 'NEFT', count: 120, volume: 1680000, riskShare: 14 },
    { channel: 'CARD', count: 88, volume: 349200, riskShare: 11 },
    { channel: 'RTGS', count: 20, volume: 600000, riskShare: 5 }
  ],
  trends: [
    { label: 'Mon', total: 160, flagged: 4, volume: 640000 },
    { label: 'Tue', total: 195, flagged: 6, volume: 820000 },
    { label: 'Wed', total: 210, flagged: 8, volume: 910000 },
    { label: 'Thu', total: 180, flagged: 5, volume: 780000 },
    { label: 'Fri', total: 245, flagged: 9, volume: 1150000 },
    { label: 'Sat', total: 140, flagged: 3, volume: 590000 },
    { label: 'Sun', total: 118, flagged: 3, volume: 460000 }
  ]
};

// Core fetch wrapper
export async function api(path, options = {}) {
  try {
    const response = await fetch(`${BASE}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      cache: 'no-store',
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.detail || `Request failed (${response.status})`);
    }
    return response.json();
  } catch (error) {
    console.warn(`[FinGuard API] Request failed on "${path}":`, error.message);
    throw error;
  }
}

// Resilient API Client Functions
export async function getDashboardStats() {
  try {
    const data = await api('/dashboard');
    return {
      ...MOCK_DASHBOARD_STATS,
      transactions: data.transactions ?? MOCK_DASHBOARD_STATS.transactions,
      alerts_open: data.alerts_open ?? MOCK_DASHBOARD_STATS.alerts_open,
      cases_open: data.cases_open ?? MOCK_DASHBOARD_STATS.cases_open,
      anomalies: data.anomalies ?? MOCK_DASHBOARD_STATS.anomalies,
      isLive: true
    };
  } catch (err) {
    return {
      ...MOCK_DASHBOARD_STATS,
      isLive: false
    };
  }
}

export async function getTransactions(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.limit) query.set('limit', params.limit);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    
    const [liveTxns, liveAlerts] = await Promise.allSettled([
      api(`/transactions${queryString}`),
      api('/alerts')
    ]);

    if (liveTxns.status === 'fulfilled' && Array.isArray(liveTxns.value) && liveTxns.value.length > 0) {
      const alertsMap = new Map();
      if (liveAlerts.status === 'fulfilled' && Array.isArray(liveAlerts.value)) {
        liveAlerts.value.forEach(a => {
          alertsMap.set(String(a.transaction_id), a);
        });
      }

      const enriched = liveTxns.value.map(t => {
        const alert = alertsMap.get(String(t.transaction_id));
        const risk_score = alert ? Number(alert.risk_score) : (t.transaction_status === 'FAILED' ? 68.0 : 18.0);
        const risk_level = risk_score >= 85 ? 'CRITICAL' : risk_score >= 70 ? 'HIGH' : risk_score >= 40 ? 'MEDIUM' : 'LOW';
        
        return {
          ...t,
          amount: Number(t.amount),
          risk_score,
          risk_level,
          explanation: alert?.explanation || (t.transaction_status === 'FAILED' ? 'Transaction failure flagged for inspection' : 'Normal transaction profile')
        };
      });

      return { data: enriched, isLive: true };
    }
  } catch (err) {
    // Graceful fallback
  }

  return { data: MOCK_TRANSACTIONS, isLive: false };
}

export async function getTransactionById(id) {
  try {
    const listResult = await getTransactions({ limit: 500 });
    const found = listResult.data.find(t => String(t.transaction_id) === String(id));
    if (found) {
      const mockMatch = MOCK_TRANSACTIONS.find(m => String(m.transaction_id) === String(id)) || MOCK_TRANSACTIONS[0];
      return {
        ...mockMatch,
        ...found,
        rule_matches: found.rule_matches || mockMatch.rule_matches,
        timeline: found.timeline || mockMatch.timeline,
        isLive: listResult.isLive
      };
    }
  } catch (err) {
    // fallback
  }

  const mockMatch = MOCK_TRANSACTIONS.find(m => String(m.transaction_id) === String(id)) || {
    ...MOCK_TRANSACTIONS[0],
    transaction_id: id,
    account_ref: 'SAMPLE-001',
    amount: 12500.00
  };

  return { ...mockMatch, isLive: false };
}

export async function postTransaction(payload) {
  try {
    const created = await api('/transactions', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return { data: created, isLive: true };
  } catch (err) {
    const mockCreated = {
      transaction_id: `tx-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 6)}`,
      account_id: `acc-${Math.random().toString(36).substring(2, 6)}`,
      amount: payload.amount,
      transaction_ts: payload.transaction_ts || new Date().toISOString(),
      transaction_type: payload.transaction_type || 'TRANSFER',
      counterparty_ref: payload.counterparty_ref || 'MERCHANT-NEW',
      transaction_status: payload.transaction_status || 'SUCCESS',
      channel: payload.channel || 'UPI'
    };
    return { data: mockCreated, isLive: false };
  }
}

export async function triggerDetectionRun() {
  try {
    const result = await api('/detection/run', { method: 'POST' });
    return { data: result, isLive: true };
  } catch (err) {
    return {
      data: {
        transactions_analysed: 24,
        anomalies_detected: 4,
        alerts_created: 3,
        run_status: 'COMPLETED',
        method_version: 'rules-v1.2'
      },
      isLive: false
    };
  }
}
