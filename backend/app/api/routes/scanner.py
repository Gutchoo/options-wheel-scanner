from fastapi import APIRouter, Query
from sse_starlette.sse import EventSourceResponse
import json
import pandas as pd

import yfinance as yf

from app.models.requests import ScanRequest
from app.services.scanner_service import scanner_service
from app.services.cache_service import cache_service


router = APIRouter(prefix="/api/v1")


# Helper function to safely convert DataFrame to dict
def df_to_dict(df):
    """Safely convert a DataFrame to a list of dicts, handling None/empty cases."""
    if df is None or (hasattr(df, 'empty') and df.empty):
        return []
    try:
        # Use pandas to_json then parse back - handles NaN, timestamps, etc.
        df_reset = df.reset_index()
        json_str = df_reset.to_json(orient="records", date_format="iso", default_handler=str)
        return json.loads(json_str)
    except Exception as e:
        # Fallback: try without reset_index
        try:
            json_str = df.to_json(orient="records", date_format="iso", default_handler=str)
            return json.loads(json_str)
        except Exception:
            return []


# =============================================================================
# Stock Info Endpoints
# =============================================================================

@router.get("/stock/{ticker}", tags=["Stock Info"])
async def get_stock_info(ticker: str):
    """Get comprehensive stock info via yf.Ticker().info"""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "ticker": ticker,
        "price": info.get("regularMarketPrice") or info.get("currentPrice"),
        "pe_ratio": info.get("trailingPE"),
        "name": info.get("shortName"),
        "raw_info": info,
    }


@router.get("/stock/{ticker}/price", tags=["Stock Info"])
async def get_stock_price(ticker: str):
    """Get current stock price via yf.download()"""
    data = yf.download(ticker, period="1d", progress=False)
    if data.empty:
        return {"ticker": ticker, "price": None, "error": "No data"}
    price = data["Close"].iloc[-1]
    return {
        "ticker": ticker,
        "price": float(price),
    }


@router.get("/stocks/batch", tags=["Stock Info"])
async def get_batch_prices(tickers: str = Query(..., description="Comma-separated tickers")):
    """Get batch prices for multiple tickers via yf.download()"""
    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    data = yf.download(ticker_list, period="1d", progress=False, threads=True)

    result = {}
    if data.empty:
        return {"tickers": result}

    if isinstance(data.columns, pd.MultiIndex):
        close_data = data["Close"]
        for ticker in ticker_list:
            try:
                if ticker in close_data.columns:
                    price = close_data[ticker].iloc[-1]
                    result[ticker] = float(price) if pd.notna(price) else None
                else:
                    result[ticker] = None
            except (KeyError, IndexError):
                result[ticker] = None
    else:
        price = data["Close"].iloc[-1]
        result[ticker_list[0]] = float(price) if pd.notna(price) else None

    return {"tickers": result}


@router.get("/stock/{ticker}/calendar", tags=["Stock Info"])
async def get_earnings_calendar(ticker: str):
    """Get upcoming events calendar (earnings date, dividend date, etc.)"""
    t = yf.Ticker(ticker)
    try:
        calendar = t.calendar
        return {
            "ticker": ticker,
            "calendar": calendar,
        }
    except Exception as e:
        return {
            "ticker": ticker,
            "error": str(e),
            "calendar": None,
        }


# =============================================================================
# Options Endpoints
# =============================================================================

@router.get("/stock/{ticker}/options/expirations", tags=["Options"])
async def get_option_expirations(ticker: str):
    """Get available option expiration dates"""
    t = yf.Ticker(ticker)
    return {
        "ticker": ticker,
        "expirations": list(t.options),
    }


@router.get("/stock/{ticker}/options/chain/{expiration}", tags=["Options"])
async def get_option_chain(ticker: str, expiration: str):
    """Get full options chain for a specific expiration date"""
    t = yf.Ticker(ticker)
    chain = t.option_chain(expiration)
    return {
        "ticker": ticker,
        "expiration": expiration,
        "calls": chain.calls.to_dict(orient="records"),
        "puts": chain.puts.to_dict(orient="records"),
    }


# =============================================================================
# Analyst Ratings & Recommendations Endpoints
# =============================================================================

@router.get("/stock/{ticker}/recommendations", tags=["Analyst"])
async def get_recommendations(ticker: str):
    """Get analyst recommendations history"""
    t = yf.Ticker(ticker)
    try:
        recommendations = t.recommendations
        return {
            "ticker": ticker,
            "recommendations": df_to_dict(recommendations),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "recommendations": None}


@router.get("/stock/{ticker}/recommendations/summary", tags=["Analyst"])
async def get_recommendations_summary(ticker: str):
    """Get summary of analyst recommendations (buy/hold/sell counts)"""
    t = yf.Ticker(ticker)
    try:
        summary = t.recommendations_summary
        return {
            "ticker": ticker,
            "recommendations_summary": df_to_dict(summary),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "recommendations_summary": None}


@router.get("/stock/{ticker}/upgrades-downgrades", tags=["Analyst"])
async def get_upgrades_downgrades(ticker: str):
    """Get recent analyst upgrades and downgrades"""
    t = yf.Ticker(ticker)
    try:
        upgrades_downgrades = t.upgrades_downgrades
        return {
            "ticker": ticker,
            "upgrades_downgrades": df_to_dict(upgrades_downgrades),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "upgrades_downgrades": None}


@router.get("/stock/{ticker}/price-targets", tags=["Analyst"])
async def get_analyst_price_targets(ticker: str):
    """Get analyst price targets (low, high, mean, current)"""
    t = yf.Ticker(ticker)
    try:
        price_targets = t.analyst_price_targets
        return {
            "ticker": ticker,
            "price_targets": price_targets,
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "price_targets": None}


# =============================================================================
# Analyst Estimates Endpoints
# =============================================================================

@router.get("/stock/{ticker}/estimates/earnings", tags=["Estimates"])
async def get_earnings_estimate(ticker: str):
    """Get earnings estimates"""
    t = yf.Ticker(ticker)
    try:
        earnings_estimate = t.earnings_estimate
        return {
            "ticker": ticker,
            "earnings_estimate": df_to_dict(earnings_estimate),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "earnings_estimate": None}


@router.get("/stock/{ticker}/estimates/revenue", tags=["Estimates"])
async def get_revenue_estimate(ticker: str):
    """Get revenue estimates"""
    t = yf.Ticker(ticker)
    try:
        revenue_estimate = t.revenue_estimate
        return {
            "ticker": ticker,
            "revenue_estimate": df_to_dict(revenue_estimate),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "revenue_estimate": None}


@router.get("/stock/{ticker}/estimates/eps-trend", tags=["Estimates"])
async def get_eps_trend(ticker: str):
    """Get EPS trend data"""
    t = yf.Ticker(ticker)
    try:
        eps_trend = t.eps_trend
        return {
            "ticker": ticker,
            "eps_trend": df_to_dict(eps_trend),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "eps_trend": None}


@router.get("/stock/{ticker}/estimates/eps-revisions", tags=["Estimates"])
async def get_eps_revisions(ticker: str):
    """Get EPS revisions data"""
    t = yf.Ticker(ticker)
    try:
        eps_revisions = t.eps_revisions
        return {
            "ticker": ticker,
            "eps_revisions": df_to_dict(eps_revisions),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "eps_revisions": None}


@router.get("/stock/{ticker}/estimates/growth", tags=["Estimates"])
async def get_growth_estimates(ticker: str):
    """Get growth estimates"""
    t = yf.Ticker(ticker)
    try:
        growth_estimates = t.growth_estimates
        return {
            "ticker": ticker,
            "growth_estimates": df_to_dict(growth_estimates),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "growth_estimates": None}


# =============================================================================
# Holders Endpoints
# =============================================================================

@router.get("/stock/{ticker}/holders/major", tags=["Holders"])
async def get_major_holders(ticker: str):
    """Get major holders breakdown (% held by insiders, institutions, etc.)"""
    t = yf.Ticker(ticker)
    try:
        major_holders = t.major_holders
        return {
            "ticker": ticker,
            "major_holders": df_to_dict(major_holders),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "major_holders": None}


@router.get("/stock/{ticker}/holders/institutional", tags=["Holders"])
async def get_institutional_holders(ticker: str):
    """Get list of institutional holders"""
    t = yf.Ticker(ticker)
    try:
        institutional_holders = t.institutional_holders
        return {
            "ticker": ticker,
            "institutional_holders": df_to_dict(institutional_holders),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "institutional_holders": None}


@router.get("/stock/{ticker}/holders/mutualfund", tags=["Holders"])
async def get_mutualfund_holders(ticker: str):
    """Get list of mutual fund holders"""
    t = yf.Ticker(ticker)
    try:
        mutualfund_holders = t.mutualfund_holders
        return {
            "ticker": ticker,
            "mutualfund_holders": df_to_dict(mutualfund_holders),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "mutualfund_holders": None}


# =============================================================================
# Insider Endpoints
# =============================================================================

@router.get("/stock/{ticker}/insider/transactions", tags=["Insider"])
async def get_insider_transactions(ticker: str):
    """Get all insider transactions"""
    t = yf.Ticker(ticker)
    try:
        insider_transactions = t.insider_transactions
        return {
            "ticker": ticker,
            "insider_transactions": df_to_dict(insider_transactions),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "insider_transactions": None}


@router.get("/stock/{ticker}/insider/purchases", tags=["Insider"])
async def get_insider_purchases(ticker: str):
    """Get insider purchases summary"""
    t = yf.Ticker(ticker)
    try:
        insider_purchases = t.insider_purchases
        return {
            "ticker": ticker,
            "insider_purchases": df_to_dict(insider_purchases),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "insider_purchases": None}


@router.get("/stock/{ticker}/insider/roster", tags=["Insider"])
async def get_insider_roster(ticker: str):
    """Get list of insiders and their holdings"""
    t = yf.Ticker(ticker)
    try:
        insider_roster = t.insider_roster_holders
        return {
            "ticker": ticker,
            "insider_roster": df_to_dict(insider_roster),
        }
    except Exception as e:
        return {"ticker": ticker, "error": str(e), "insider_roster": None}


# =============================================================================
# Scanner Endpoints
# =============================================================================

@router.post("/scan", tags=["Scanner"])
async def scan_options(request: ScanRequest):
    """Stream scan results using Server-Sent Events."""
    async def event_generator():
        async for event in scanner_service.scan_options(request):
            yield {"event": event["type"], "data": json.dumps(event["data"])}

    return EventSourceResponse(event_generator())


@router.get("/universes", tags=["Scanner"])
async def get_universes():
    """Return available stock universes."""
    return {
        "universes": [
            {"id": "sp100", "name": "S&P 100", "count": 102},
            {"id": "sp500", "name": "S&P 500", "count": 503},
            {"id": "custom", "name": "Custom List", "count": None},
        ]
    }


# =============================================================================
# System Endpoints
# =============================================================================

@router.post("/cache/clear", tags=["System"])
async def clear_cache():
    """Clear the cache."""
    cache_service.clear()
    return {"status": "ok", "message": "Cache cleared"}


@router.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
