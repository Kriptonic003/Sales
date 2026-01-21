# AI Sales Loss Prediction System

Full-stack app that ingests Twitter/Reddit posts, runs sentiment + sales-loss models, and visualizes KPIs, charts, comments, alerts, and Gemini-powered chat guidance.

## Stack
- Backend: FastAPI, scikit-learn, SQLAlchemy, SQLite, requests (Gemini)
- Frontend: React (Vite), TypeScript, Tailwind, Recharts, Axios, React Router

## Quickstart
1) Backend
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate  # on Windows
pip install -r requirements.txt
set GEMINI_API_KEY=your_key_here   # optional, enables /chat
uvicorn backend.main:app --reload --port 8000
```
API will run at http://localhost:8000

2) Frontend
```bash
cd frontend
npm install
npm run dev -- --host --port 5173
```
Open http://localhost:5173 (Vite). The frontend expects `VITE_API_URL` (defaults to http://localhost:8000).

## Key Endpoints
- `POST /analyze-sentiment` — scores posts for a product/brand/platform/date range
- `POST /predict-sales-loss` — predicts drop %, probability, risk, explanation
- `GET /get-dashboard-data` — KPIs, charts, insights, alerts
- `GET /comments` — posts with sentiment labels (filterable)
- `POST /chat` — Gemini chatbot (requires `GEMINI_API_KEY`)

## Frontend Pages
- Landing (how it works, CTA)
- Product Analysis (inputs + immediate sentiment/prediction)
- Analytics Dashboard (KPIs, charts, alerts, AI insights, chat)
- Comments Viewer (table + sentiment filters)
- Model Explanation (NLP + ML flow)

## Notes
- Mock social posts + historical sales are bootstrapped on startup.
- Models: heuristic sentiment scoring; Logistic Regression for loss probability; Linear Regression for revenue projection.
- Dark mode neon theme; responsive layout; loading skeletons and alerts included.

