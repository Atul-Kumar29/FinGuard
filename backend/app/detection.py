from datetime import timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models import (
    Transaction, DetectionRule, DetectionRun, DetectionResult,
    RuleMatch, Alert, now
)

DEFAULT_RULES = [
    ("High amount", "Flags transactions over a configured amount.", "HIGH_AMOUNT", 50000,
     {"amount_limit": 50000}),
    ("Burst activity", "Flags many transactions in a short time window.", "BURST_ACTIVITY", 5,
     {"window_minutes": 10, "max_transactions": 5}),
    ("Repeated counterparty", "Flags repeated transfers to one counterparty.", "REPEATED_COUNTERPARTY", 3,
     {"window_minutes": 60, "repeat_count": 3}),
    ("Baseline deviation", "Flags an amount substantially above account history.", "BASELINE_DEVIATION", 3,
     {"minimum_history": 3, "multiplier": 3}),
    ("Failed transaction burst", "Flags repeated failed transactions.", "FAILED_BURST", 3,
     {"window_minutes": 15, "failed_count": 3}),
]

def ensure_default_rules(db: Session):
    existing = {r.rule_name for r in db.scalars(select(DetectionRule)).all()}
    for name, desc, kind, threshold, config in DEFAULT_RULES:
        if name not in existing:
            db.add(DetectionRule(rule_name=name, description=desc, rule_type=kind,
                                 threshold_value=threshold, configuration=config))
    db.commit()

def evaluate_transaction(db: Session, tx: Transaction, all_txs: list[Transaction], rules: list[DetectionRule]):
    matched = []
    amount = Decimal(tx.amount)
    history = [t for t in all_txs if t.account_id == tx.account_id and t.transaction_id != tx.transaction_id
               and t.transaction_ts <= tx.transaction_ts]
    recent = [t for t in history if t.transaction_ts >= tx.transaction_ts - timedelta(minutes=10)]
    failed_recent = [t for t in recent if t.transaction_status == "FAILED"]
    for rule in rules:
        c = rule.configuration or {}
        kind = rule.rule_type
        evidence = None
        observed = None
        if kind == "HIGH_AMOUNT" and amount >= Decimal(str(c.get("amount_limit", rule.threshold_value or 50000))):
            evidence, observed = f"Amount {amount} meets/exceeds configured limit.", amount
        elif kind == "BURST_ACTIVITY":
            window = timedelta(minutes=int(c.get("window_minutes", 10)))
            count = sum(1 for t in history if tx.transaction_ts - window <= t.transaction_ts <= tx.transaction_ts)
            if count >= int(c.get("max_transactions", 5)):
                evidence, observed = f"{count} transactions within {int(window.total_seconds()/60)} minutes.", count
        elif kind == "REPEATED_COUNTERPARTY" and tx.counterparty_ref:
            window = timedelta(minutes=int(c.get("window_minutes", 60)))
            count = sum(1 for t in history if t.counterparty_ref == tx.counterparty_ref
                        and tx.transaction_ts - window <= t.transaction_ts <= tx.transaction_ts)
            if count + 1 >= int(c.get("repeat_count", 3)):
                evidence, observed = f"Repeated counterparty: {count + 1} transfers in the configured window.", count + 1
        elif kind == "BASELINE_DEVIATION" and len(history) >= int(c.get("minimum_history", 3)):
            values = [Decimal(t.amount) for t in history]
            avg = sum(values) / len(values)
            if avg > 0 and amount >= avg * Decimal(str(c.get("multiplier", 3))):
                evidence, observed = f"Amount is at least {c.get('multiplier', 3)}x historical average ({avg:.2f}).", amount
        elif kind == "FAILED_BURST":
            window = timedelta(minutes=int(c.get("window_minutes", 15)))
            count = sum(1 for t in history if t.transaction_status == "FAILED"
                        and tx.transaction_ts - window <= t.transaction_ts <= tx.transaction_ts)
            if tx.transaction_status == "FAILED" and count + 1 >= int(c.get("failed_count", 3)):
                evidence, observed = f"{count + 1} failed transactions within the configured window.", count + 1
        if evidence:
            matched.append((rule, evidence, observed))
    return matched

def run_detection(db: Session):
    ensure_default_rules(db)
    run = DetectionRun(method_version="rules-v1", run_status="RUNNING",
                       dataset_label="current database transactions")
    db.add(run)
    db.flush()
    txs = db.scalars(select(Transaction).order_by(Transaction.transaction_ts)).all()
    rules = db.scalars(select(DetectionRule).where(DetectionRule.is_active.is_(True))).all()
    created_alerts = 0
    for tx in txs:
        matches = evaluate_transaction(db, tx, txs, rules)
        # Every transaction receives a result for this run, including normal transactions.
        score = min(100, sum({"HIGH_AMOUNT": 35, "BURST_ACTIVITY": 25,
                              "REPEATED_COUNTERPARTY": 20, "BASELINE_DEVIATION": 25,
                              "FAILED_BURST": 20}.get(m[0].rule_type, 10) for m in matches))
        explanation = "; ".join(m[1] for m in matches) if matches else "No configured anomaly rule matched."
        result = DetectionResult(transaction_id=tx.transaction_id, detection_run_id=run.detection_run_id,
                                 risk_score=score, is_anomaly=bool(matches), explanation=explanation,
                                 model_label="RULE_BASED")
        db.add(result)
        db.flush()
        for rule, evidence, observed in matches:
            db.add(RuleMatch(result_id=result.result_id, rule_id=rule.rule_id,
                             evidence=evidence, observed_value=observed))
        if score >= 35:
            priority = "CRITICAL" if score >= 80 else "HIGH" if score >= 60 else "MEDIUM"
            db.add(Alert(result_id=result.result_id, priority=priority))
            created_alerts += 1
    run.run_status = "COMPLETED"
    run.completed_at = now()
    db.commit()
    return {"run_id": str(run.detection_run_id), "transactions_analysed": len(txs),
            "alerts_created": created_alerts, "status": run.run_status}
