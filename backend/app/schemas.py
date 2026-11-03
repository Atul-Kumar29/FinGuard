from datetime import datetime
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class TransactionCreate(BaseModel):
    account_ref: str = Field(min_length=2, max_length=80)
    amount: Decimal = Field(ge=0, max_digits=14, decimal_places=2)
    transaction_ts: datetime
    transaction_type: str = "TRANSFER"
    counterparty_ref: str | None = None
    transaction_status: str = "SUCCESS"
    channel: str = "UPI"

class TransactionOut(ORMModel):
    transaction_id: UUID
    account_id: UUID
    amount: Decimal
    transaction_ts: datetime
    transaction_type: str
    counterparty_ref: str | None
    transaction_status: str
    channel: str

class AlertOut(BaseModel):
    alert_id: UUID
    result_id: UUID
    priority: str
    alert_status: str
    created_at: datetime
    transaction_id: UUID
    account_ref: str
    amount: Decimal
    risk_score: Decimal
    explanation: str

class CaseCreate(BaseModel):
    alert_id: UUID
    assigned_to: UUID | None = None
    summary: str | None = None

class CaseUpdate(BaseModel):
    assigned_to: UUID | None = None
    case_status: str | None = None
    outcome: str | None = None
    summary: str | None = None

class EventCreate(BaseModel):
    user_id: UUID | None = None
    event_type: str = Field(min_length=2, max_length=50)
    notes: str | None = None
