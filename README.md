# Options Wheel Scanner

A real-time options scanner for identifying high-value selling opportunities across S&P 500 and S&P 100 stocks.

## What It Does

Scans thousands of options contracts to surface the best candidates for selling cash-secured puts and covered calls based on your criteria:

- **ROI & Annualized Returns** - Filter by minimum return on investment
- **Collateral Requirements** - Only show contracts you can afford to sell
- **Risk Filters** - Stock price ranges, P/E ratios, volume thresholds
- **Expiration Windows** - Target specific DTE (days to expiration) ranges
- **Moneyness** - Filter for ITM or OTM contracts

## Key Features

**Progressive Filtering Pipeline** - Eliminates stocks early based on price/collateral before expensive API calls, making scans fast even across 500+ tickers.

**Real-Time Streaming Results** - Options appear as they're found with live progress tracking.

**Comprehensive Metrics** - Each result includes premium, bid/ask, implied volatility, open interest, calculated ROI, and annualized returns.

## Tech Stack

| Layer     | Technology                                      |
| --------- | ----------------------------------------------- |
| Frontend  | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend   | FastAPI, Python 3.11+, async/await              |
| Data      | yfinance API options chains                     |
| Streaming | Server-Sent Events (SSE) for live results       |

## Architecture

```
┌─────────────────┐     SSE      ┌─────────────────┐
│   Next.js SPA   │◄────────────►│   FastAPI       │
│   React + TS    │              │   Scanner Svc   │
└─────────────────┘              └────────┬────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   yfinance      │
                                 │   Options API   │
                                 └─────────────────┘
```

---

## Getting Started

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 -m uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000
