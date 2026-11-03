# Financial Transaction Anomaly Detection and Investigation System

A simple academic MVP using synthetic/sample data only.

## Stack (versions checked 3 November 2026)
- Python 3.15.2
- FastAPI 0.162.0
- SQLAlchemy 2.1.6
- Alembic 1.20.1
- Pydantic 2.14.2 / pydantic-settings 2.16.2
- PostgreSQL 18 (use the latest 18.x patch available for your OS)
- Node.js 26.13.0 LTS
- Next.js 16.4.3 (JavaScript/JSX)
- React / React DOM 19.3.1

Check official release pages before installation because patch versions can move.

## What works
- Create pseudonymous accounts and sample transactions.
- Run five configurable rule checks: high amount, burst activity, repeated counterparty, baseline deviation and failed-transaction burst.
- Save each detection run, result, matched rule, and generated alert.
- Review alerts, create investigation cases, assign app users, and append case events.
- Dashboard shows counts and recent activity.

Risk scores are review-prioritisation aids, not proof of fraud. This prototype is not connected to banks or live UPI infrastructure.

## 1. Prerequisites
Install PostgreSQL 18, Python 3.15.2, and Node.js 26.13.0 LTS.
Create a database named `financial_anomaly_detection`.

## 2. Backend
```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
# Edit DATABASE_URL in .env with your PostgreSQL password.
alembic upgrade head
python seed.py
uvicorn app.main:app --reload
```
API docs: http://127.0.0.1:8000/docs

If you prefer a single SQL setup, `database/schema.sql` contains the equivalent schema. Use either Alembic migrations (recommended) or the SQL file, not both.

## 3. Frontend
Open another terminal:
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```
Open http://localhost:3000

## 4. Demo flow
1. Open Dashboard and click **Run detection**.
2. Open Transactions to inspect sample data.
3. Open Alerts to see generated alerts.
4. Open Cases, create a case from an alert, assign a reviewer, and add a case event.

## Notes
- Authentication is intentionally not implemented in this teaching MVP. `app_users` stores password hashes only; do not expose this demo publicly.
- Use only synthetic or approved sample data. Never store UPI PINs, OTPs, or real banking credentials.
- For deployment, add authentication/authorization, CSRF/CORS hardening, rate limits, audit controls, backups, and security review.
