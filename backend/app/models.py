import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, Boolean, DateTime, Numeric, ForeignKey, UniqueConstraint, CheckConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

def now():
    return datetime.now(timezone.utc)

class Account(Base):
    __tablename__ = "accounts"
    account_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_ref: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    status: Mapped[str] = mapped_column(String(20), default="ACTIVE")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account")

class AppUser(Base):
    __tablename__ = "app_users"
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username: Mapped[str] = mapped_column(String(80), unique=True)
    password_hash: Mapped[str] = mapped_column(Text, default="DEMO_HASH_NOT_FOR_AUTH")
    role: Mapped[str] = mapped_column(String(20), default="ANALYST")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Transaction(Base):
    __tablename__ = "transactions"
    __table_args__ = (CheckConstraint("amount >= 0"),)
    transaction_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("accounts.account_id", ondelete="RESTRICT"))
    amount: Mapped[float] = mapped_column(Numeric(14,2))
    transaction_ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    transaction_type: Mapped[str] = mapped_column(String(40))
    counterparty_ref: Mapped[str | None] = mapped_column(String(100), nullable=True)
    transaction_status: Mapped[str] = mapped_column(String(20), default="SUCCESS")
    channel: Mapped[str] = mapped_column(String(40), default="UPI")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    account: Mapped["Account"] = relationship(back_populates="transactions")

class DetectionRule(Base):
    __tablename__ = "detection_rules"
    rule_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_name: Mapped[str] = mapped_column(String(120), unique=True)
    description: Mapped[str] = mapped_column(Text)
    rule_type: Mapped[str] = mapped_column(String(50))
    threshold_value: Mapped[float | None] = mapped_column(Numeric(14,2), nullable=True)
    configuration: Mapped[dict] = mapped_column(JSON, default=dict)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class DetectionRun(Base):
    __tablename__ = "detection_runs"
    detection_run_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    method_version: Mapped[str] = mapped_column(String(100), default="rules-v1")
    run_status: Mapped[str] = mapped_column(String(20), default="RUNNING")
    dataset_label: Mapped[str | None] = mapped_column(String(150), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

class DetectionResult(Base):
    __tablename__ = "detection_results"
    __table_args__ = (UniqueConstraint("transaction_id", "detection_run_id"), CheckConstraint("risk_score >= 0 AND risk_score <= 100"))
    result_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transactions.transaction_id", ondelete="RESTRICT"))
    detection_run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("detection_runs.detection_run_id", ondelete="CASCADE"))
    risk_score: Mapped[float] = mapped_column(Numeric(5,2))
    is_anomaly: Mapped[bool] = mapped_column(Boolean, default=False)
    explanation: Mapped[str] = mapped_column(Text)
    model_label: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class RuleMatch(Base):
    __tablename__ = "rule_matches"
    __table_args__ = (UniqueConstraint("result_id", "rule_id"),)
    rule_match_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("detection_results.result_id", ondelete="CASCADE"))
    rule_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("detection_rules.rule_id", ondelete="RESTRICT"))
    evidence: Mapped[str] = mapped_column(Text)
    observed_value: Mapped[float | None] = mapped_column(Numeric(14,2), nullable=True)
    matched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)

class Alert(Base):
    __tablename__ = "alerts"
    alert_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    result_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("detection_results.result_id", ondelete="CASCADE"), unique=True)
    priority: Mapped[str] = mapped_column(String(20))
    alert_status: Mapped[str] = mapped_column(String(20), default="OPEN")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class InvestigationCase(Base):
    __tablename__ = "investigation_cases"
    case_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("alerts.alert_id", ondelete="CASCADE"))
    assigned_to: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_users.user_id", ondelete="SET NULL"), nullable=True)
    case_status: Mapped[str] = mapped_column(String(20), default="OPEN")
    outcome: Mapped[str | None] = mapped_column(String(30), nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

class CaseEvent(Base):
    __tablename__ = "case_events"
    event_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("investigation_cases.case_id", ondelete="CASCADE"))
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("app_users.user_id", ondelete="SET NULL"), nullable=True)
    event_type: Mapped[str] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=now)
