from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models import Account, Transaction, DetectionResult, Alert, InvestigationCase, CaseEvent, AppUser
from app.schemas import TransactionCreate, TransactionOut, AlertOut, CaseCreate, CaseUpdate, EventCreate
from app.detection import run_detection, ensure_default_rules

app = FastAPI(title="Financial Transaction Anomaly Detection API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=settings.origins, allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    return {
        "transactions": db.scalar(select(func.count()).select_from(Transaction)) or 0,
        "alerts_open": db.scalar(select(func.count()).select_from(Alert).where(Alert.alert_status == "OPEN")) or 0,
        "cases_open": db.scalar(select(func.count()).select_from(InvestigationCase).where(InvestigationCase.case_status.in_(["OPEN", "IN_PROGRESS"]))) or 0,
        "anomalies": db.scalar(select(func.count()).select_from(DetectionResult).where(DetectionResult.is_anomaly.is_(True))) or 0,
    }

@app.get("/api/transactions", response_model=list[TransactionOut])
def list_transactions(limit: int = 100, db: Session = Depends(get_db)):
    return db.scalars(select(Transaction).order_by(desc(Transaction.transaction_ts)).limit(min(limit, 500))).all()

@app.post("/api/transactions", response_model=TransactionOut)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    account = db.scalar(select(Account).where(Account.account_ref == payload.account_ref))
    if not account:
        account = Account(account_ref=payload.account_ref)
        db.add(account)
        db.flush()
    tx = Transaction(account_id=account.account_id, amount=payload.amount,
                     transaction_ts=payload.transaction_ts, transaction_type=payload.transaction_type,
                     counterparty_ref=payload.counterparty_ref, transaction_status=payload.transaction_status,
                     channel=payload.channel)
    db.add(tx)
    db.commit()
    db.refresh(tx)
    return tx

@app.post("/api/detection/run")
def detection_run(db: Session = Depends(get_db)):
    return run_detection(db)

@app.get("/api/alerts", response_model=list[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    rows = db.execute(
        select(Alert, DetectionResult, Transaction, Account)
        .join(DetectionResult, Alert.result_id == DetectionResult.result_id)
        .join(Transaction, DetectionResult.transaction_id == Transaction.transaction_id)
        .join(Account, Transaction.account_id == Account.account_id)
        .order_by(Alert.created_at.desc()).limit(300)
    ).all()
    return [{"alert_id": a.alert_id, "result_id": r.result_id, "priority": a.priority,
             "alert_status": a.alert_status, "created_at": a.created_at,
             "transaction_id": t.transaction_id, "account_ref": ac.account_ref,
             "amount": t.amount, "risk_score": r.risk_score, "explanation": r.explanation}
            for a, r, t, ac in rows]

@app.patch("/api/alerts/{alert_id}")
def update_alert(alert_id: str, payload: dict, db: Session = Depends(get_db)):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(404, "Alert not found")
    status = payload.get("alert_status")
    if status not in {"OPEN", "IN_REVIEW", "ESCALATED", "CLOSED", "DISMISSED"}:
        raise HTTPException(400, "Invalid alert_status")
    alert.alert_status = status
    db.commit()
    return {"message": "Alert updated", "alert_status": alert.alert_status}

@app.get("/api/users")
def list_users(db: Session = Depends(get_db)):
    return [{"user_id": str(u.user_id), "username": u.username, "role": u.role}
            for u in db.scalars(select(AppUser).where(AppUser.is_active.is_(True))).all()]

@app.get("/api/cases")
def list_cases(db: Session = Depends(get_db)):
    cases = db.scalars(select(InvestigationCase).order_by(InvestigationCase.opened_at.desc())).all()
    return [{"case_id": str(c.case_id), "alert_id": str(c.alert_id),
             "assigned_to": str(c.assigned_to) if c.assigned_to else None,
             "case_status": c.case_status, "outcome": c.outcome, "summary": c.summary,
             "opened_at": c.opened_at.isoformat()} for c in cases]

@app.post("/api/cases")
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    if not db.get(Alert, payload.alert_id):
        raise HTTPException(404, "Alert not found")
    case = InvestigationCase(alert_id=payload.alert_id, assigned_to=payload.assigned_to,
                             summary=payload.summary)
    db.add(case)
    db.flush()
    db.add(CaseEvent(case_id=case.case_id, event_type="CASE_CREATED", notes="Investigation case created."))
    db.commit()
    return {"case_id": str(case.case_id), "message": "Case created"}

@app.patch("/api/cases/{case_id}")
def update_case(case_id: str, payload: CaseUpdate, db: Session = Depends(get_db)):
    case = db.get(InvestigationCase, case_id)
    if not case:
        raise HTTPException(404, "Case not found")
    data = payload.model_dump(exclude_unset=True)
    allowed_status = {"OPEN", "IN_PROGRESS", "PENDING", "RESOLVED", "CLOSED"}
    allowed_outcome = {"SUSPICIOUS", "NOT_SUSPICIOUS", "INCONCLUSIVE"}
    if "case_status" in data and data["case_status"] not in allowed_status:
        raise HTTPException(400, "Invalid case_status")
    if "outcome" in data and data["outcome"] not in allowed_outcome | {None}:
        raise HTTPException(400, "Invalid outcome")
    for key, value in data.items():
        setattr(case, key, value)
    if case.case_status in {"RESOLVED", "CLOSED"} and case.resolved_at is None:
        from app.models import now
        case.resolved_at = now()
    db.add(CaseEvent(case_id=case.case_id, event_type="CASE_UPDATED",
                     notes="Case fields updated: " + ", ".join(data.keys())))
    db.commit()
    return {"message": "Case updated"}

@app.post("/api/cases/{case_id}/events")
def add_case_event(case_id: str, payload: EventCreate, db: Session = Depends(get_db)):
    if not db.get(InvestigationCase, case_id):
        raise HTTPException(404, "Case not found")
    event = CaseEvent(case_id=case_id, user_id=payload.user_id,
                      event_type=payload.event_type, notes=payload.notes)
    db.add(event)
    db.commit()
    return {"message": "Event added"}

@app.get("/api/cases/{case_id}/events")
def get_case_events(case_id: str, db: Session = Depends(get_db)):
    if not db.get(InvestigationCase, case_id):
        raise HTTPException(404, "Case not found")
    events = db.scalars(select(CaseEvent).where(CaseEvent.case_id == case_id).order_by(CaseEvent.created_at.desc())).all()
    return [{"event_id": str(e.event_id), "event_type": e.event_type,
             "notes": e.notes, "created_at": e.created_at.isoformat()} for e in events]
