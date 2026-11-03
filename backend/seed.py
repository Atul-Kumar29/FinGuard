from datetime import datetime, timedelta, timezone
from decimal import Decimal
from sqlalchemy import select
from app.database import SessionLocal
from app.models import Account, AppUser, Transaction
from app.detection import ensure_default_rules

def main():
    db = SessionLocal()
    try:
        ensure_default_rules(db)
        if not db.scalar(select(AppUser).limit(1)):
            db.add_all([
                AppUser(username="admin", password_hash="DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH", role="ADMIN"),
                AppUser(username="analyst", password_hash="DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH", role="ANALYST"),
                AppUser(username="reviewer", password_hash="DEMO_ONLY_NOT_A_REAL_PASSWORD_HASH", role="REVIEWER"),
            ])
        if not db.scalar(select(Transaction).limit(1)):
            accounts = [Account(account_ref=f"SAMPLE-{i:03d}") for i in range(1, 4)]
            db.add_all(accounts)
            db.flush()
            now = datetime.now(timezone.utc)
            rows = [
                (0, 1200, 0, "SUCCESS", "SHOP-01"),
                (0, 1800, 2, "SUCCESS", "SHOP-02"),
                (0, 2200, 4, "SUCCESS", "SHOP-03"),
                (0, 95000, 6, "SUCCESS", "NEW-COUNTERPARTY"),
                (1, 500, 1, "SUCCESS", "RECEIVER-01"),
                (1, 700, 3, "SUCCESS", "RECEIVER-01"),
                (1, 900, 5, "SUCCESS", "RECEIVER-01"),
                (2, 1500, 1, "FAILED", "ATM-01"),
                (2, 1600, 2, "FAILED", "ATM-01"),
                (2, 1700, 3, "FAILED", "ATM-01"),
            ]
            for idx, amount, minutes, status, counterparty in rows:
                db.add(Transaction(account_id=accounts[idx].account_id, amount=Decimal(str(amount)),
                                   transaction_ts=now - timedelta(minutes=minutes),
                                   transaction_type="TRANSFER", counterparty_ref=counterparty,
                                   transaction_status=status, channel="UPI"))
        db.commit()
        print("Seed data ready.")
    finally:
        db.close()

if __name__ == "__main__":
    main()
