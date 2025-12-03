from fastapi import APIRouter, Query
from sse_starlette.sse import EventSourceResponse
import json
import pandas as pd

import yfinance as yf

from app.models.requests import ScanRequest
from app.services.scanner_service import scanner_service
from app.services.cache_service import cache_service
from app.services.heatmap_service import heatmap_service


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
    data = yf.download(ticker, period="1d", progress=False, auto_adjust=False)
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
    data = yf.download(ticker_list, period="1d", progress=False, threads=True, auto_adjust=False)

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
# Snapshot Endpoints
# =============================================================================

@router.get("/stock/{ticker}/snapshot", tags=["Snapshot"])
async def get_ticker_snapshot(ticker: str):
    """
    Get comprehensive ticker snapshot with all key financial metrics.
    Aggregates data from multiple yfinance sources in one call.
    """
    t = yf.Ticker(ticker.upper())

    try:
        info = t.info

        # Handle case where ticker doesn't exist
        if not info or info.get("regularMarketPrice") is None:
            return {"ticker": ticker.upper(), "error": "Ticker not found", "snapshot": None}

        # Build profile section
        profile = {
            "name": info.get("shortName") or info.get("longName") or ticker.upper(),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "description": info.get("longBusinessSummary"),
            "website": info.get("website"),
            "hq": f"{info.get('city', '')}, {info.get('state', '')}".strip(", "),
            "employees": info.get("fullTimeEmployees"),
        }

        # Build price section
        current_price = info.get("regularMarketPrice") or info.get("currentPrice")
        prev_close = info.get("regularMarketPreviousClose") or info.get("previousClose")
        change = (current_price - prev_close) if current_price is not None and prev_close is not None else None
        change_percent = (change / prev_close * 100) if change is not None and prev_close else None

        price = {
            "current": current_price,
            "change": round(change, 2) if change is not None else None,
            "change_percent": round(change_percent, 2) if change_percent is not None else None,
            "day_high": info.get("dayHigh") or info.get("regularMarketDayHigh"),
            "day_low": info.get("dayLow") or info.get("regularMarketDayLow"),
            "prev_close": prev_close,
            "market_cap": info.get("marketCap"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "avg_volume": info.get("averageVolume"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
        }

        # Build valuation section
        valuation = {
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "peg_ratio": info.get("trailingPegRatio"),
            "ps_ratio": info.get("priceToSalesTrailing12Months"),
            "pb_ratio": info.get("priceToBook"),
            "ev_ebitda": info.get("enterpriseToEbitda"),
            "ev_revenue": info.get("enterpriseToRevenue"),
        }

        # Build profitability section
        profitability = {
            "gross_margin": info.get("grossMargins"),
            "operating_margin": info.get("operatingMargins"),
            "profit_margin": info.get("profitMargins"),
            "ebitda_margin": info.get("ebitdaMargins"),
            "roe": info.get("returnOnEquity"),
            "roa": info.get("returnOnAssets"),
        }

        # Build growth section
        growth = {
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),
            "earnings_quarterly_growth": info.get("earningsQuarterlyGrowth"),
            "eps_trailing": info.get("trailingEps"),
            "eps_forward": info.get("forwardEps"),
            "eps_current_year": info.get("epsCurrentYear"),
        }

        # Build balance sheet section
        balance_sheet = {
            "cash": info.get("totalCash"),
            "cash_per_share": info.get("totalCashPerShare"),
            "debt": info.get("totalDebt"),
            "debt_equity": info.get("debtToEquity"),
            "current_ratio": info.get("currentRatio"),
            "quick_ratio": info.get("quickRatio"),
            "book_value": info.get("bookValue"),
        }

        # Build cash flow section
        cash_flow = {
            "operating_cf": info.get("operatingCashflow"),
            "free_cf": info.get("freeCashflow"),
        }

        # Build analyst section
        analyst = {
            "rating": info.get("recommendationKey"),
            "rating_score": info.get("recommendationMean"),
            "target_low": info.get("targetLowPrice"),
            "target_mean": info.get("targetMeanPrice"),
            "target_high": info.get("targetHighPrice"),
            "target_median": info.get("targetMedianPrice"),
            "num_analysts": info.get("numberOfAnalystOpinions"),
        }

        # Build risk section
        risk = {
            "beta": info.get("beta"),
            "short_ratio": info.get("shortRatio"),
            "short_percent": info.get("shortPercentOfFloat"),
            "insider_ownership": info.get("heldPercentInsiders"),
            "institutional_ownership": info.get("heldPercentInstitutions"),
            "audit_risk": info.get("auditRisk"),
            "board_risk": info.get("boardRisk"),
            "overall_risk": info.get("overallRisk"),
        }

        # Build dividend section
        dividend = {
            "yield": info.get("dividendYield"),
            "rate": info.get("dividendRate"),
            "payout_ratio": info.get("payoutRatio"),
            "ex_date": info.get("exDividendDate"),
        }

        # Build earnings section with beat history
        earnings = {
            "next_date": None,
            "beat_history": [],
        }

        try:
            earnings_dates = t.earnings_dates
            if earnings_dates is not None and not earnings_dates.empty:
                # Get future earnings (next date)
                import datetime
                now = datetime.datetime.now(datetime.timezone.utc)
                future_earnings = earnings_dates[earnings_dates.index > now]
                if not future_earnings.empty:
                    earnings["next_date"] = str(future_earnings.index[0])

                # Get past earnings for beat history
                past_earnings = earnings_dates[earnings_dates.index <= now].head(8)
                beat_history = []
                for idx, row in past_earnings.iterrows():
                    eps_estimate = row.get("EPS Estimate")
                    reported_eps = row.get("Reported EPS")
                    surprise = row.get("Surprise(%)")
                    beat_history.append({
                        "date": str(idx),
                        "eps_estimate": float(eps_estimate) if pd.notna(eps_estimate) else None,
                        "reported_eps": float(reported_eps) if pd.notna(reported_eps) else None,
                        "surprise_pct": float(surprise) if pd.notna(surprise) else None,
                    })
                earnings["beat_history"] = beat_history
        except Exception:
            pass  # Earnings data not available for all tickers

        return {
            "ticker": ticker.upper(),
            "profile": profile,
            "price": price,
            "valuation": valuation,
            "profitability": profitability,
            "growth": growth,
            "balance_sheet": balance_sheet,
            "cash_flow": cash_flow,
            "analyst": analyst,
            "risk": risk,
            "dividend": dividend,
            "earnings": earnings,
        }

    except Exception as e:
        return {"ticker": ticker.upper(), "error": str(e), "snapshot": None}


@router.get("/stock/{ticker}/history", tags=["Snapshot"])
async def get_price_history(
    ticker: str,
    period: str = Query("1mo", description="Period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
):
    """Get historical price data for charting."""
    t = yf.Ticker(ticker.upper())

    try:
        # Map frontend periods to yfinance periods
        period_map = {
            "1d": "1d",
            "1w": "5d",
            "1m": "1mo",
            "3m": "3mo",
            "6m": "6mo",
            "1y": "1y",
            "5y": "5y",
            "max": "max",
        }
        yf_period = period_map.get(period, period)

        # Use appropriate interval based on period
        interval_map = {
            "1d": "5m",
            "5d": "15m",
            "1mo": "1d",
            "3mo": "1d",
            "6mo": "1d",
            "1y": "1d",
            "5y": "1wk",
            "max": "1mo",
        }
        interval = interval_map.get(yf_period, "1d")

        hist = t.history(period=yf_period, interval=interval)

        if hist.empty:
            return {"ticker": ticker.upper(), "period": period, "history": [], "error": "No data"}

        history = []
        for idx, row in hist.iterrows():
            history.append({
                "date": str(idx),
                "open": round(row["Open"], 2) if pd.notna(row["Open"]) else None,
                "high": round(row["High"], 2) if pd.notna(row["High"]) else None,
                "low": round(row["Low"], 2) if pd.notna(row["Low"]) else None,
                "close": round(row["Close"], 2) if pd.notna(row["Close"]) else None,
                "volume": int(row["Volume"]) if pd.notna(row["Volume"]) else None,
            })

        return {
            "ticker": ticker.upper(),
            "period": period,
            "history": history,
        }

    except Exception as e:
        return {"ticker": ticker.upper(), "period": period, "history": [], "error": str(e)}


@router.get("/stock/{ticker}/news", tags=["Snapshot"])
async def get_ticker_news(
    ticker: str,
    limit: int = Query(5, le=20, description="Number of news articles to return"),
):
    """Get recent news articles for a ticker."""
    t = yf.Ticker(ticker.upper())

    try:
        news = t.news

        if not news:
            return {"ticker": ticker.upper(), "news": []}

        articles = []
        for item in news[:limit]:
            content = item.get("content", {})
            thumbnail = content.get("thumbnail", {})
            resolutions = thumbnail.get("resolutions", [])
            thumbnail_url = resolutions[0].get("url") if resolutions else None

            canonical_url = content.get("canonicalUrl", {})
            click_url = content.get("clickThroughUrl", {})

            articles.append({
                "id": item.get("id"),
                "title": content.get("title"),
                "summary": content.get("summary"),
                "publisher": content.get("provider", {}).get("displayName"),
                "link": click_url.get("url") or canonical_url.get("url"),
                "published_at": content.get("pubDate"),
                "thumbnail": thumbnail_url,
            })

        return {
            "ticker": ticker.upper(),
            "news": articles,
        }

    except Exception as e:
        return {"ticker": ticker.upper(), "news": [], "error": str(e)}


@router.get("/stock/{ticker}/sec-filings", tags=["Snapshot"])
async def get_sec_filings(
    ticker: str,
    limit: int = Query(10, le=50, description="Number of filings to return"),
):
    """Get recent SEC filings for a ticker."""
    t = yf.Ticker(ticker.upper())

    try:
        filings = t.sec_filings

        if not filings:
            return {"ticker": ticker.upper(), "filings": []}

        result = []
        for filing in filings[:limit]:
            result.append({
                "type": filing.get("type"),
                "date": filing.get("date"),
                "title": filing.get("title"),
                "edgar_url": filing.get("edgarUrl"),
                "exhibits": filing.get("exhibits", {}),
            })

        return {
            "ticker": ticker.upper(),
            "filings": result,
        }

    except Exception as e:
        return {"ticker": ticker.upper(), "filings": [], "error": str(e)}


@router.get("/stock/{ticker}/earnings-history", tags=["Snapshot"])
async def get_earnings_history(ticker: str):
    """Get historical earnings data with estimates vs actuals."""
    t = yf.Ticker(ticker.upper())

    try:
        earnings_dates = t.earnings_dates

        if earnings_dates is None or earnings_dates.empty:
            return {"ticker": ticker.upper(), "earnings": []}

        earnings = []
        for idx, row in earnings_dates.iterrows():
            eps_estimate = row.get("EPS Estimate")
            reported_eps = row.get("Reported EPS")
            surprise = row.get("Surprise(%)")

            earnings.append({
                "date": str(idx),
                "eps_estimate": float(eps_estimate) if pd.notna(eps_estimate) else None,
                "reported_eps": float(reported_eps) if pd.notna(reported_eps) else None,
                "surprise_pct": float(surprise) if pd.notna(surprise) else None,
            })

        return {
            "ticker": ticker.upper(),
            "earnings": earnings,
        }

    except Exception as e:
        return {"ticker": ticker.upper(), "earnings": [], "error": str(e)}


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
# Heatmap Endpoints
# =============================================================================

@router.get("/heatmap", tags=["Heatmap"])
async def get_heatmap(
    period: str = Query("1d", description="Time period: 1d, 1w, 1m, 3m, ytd"),
):
    """
    Get S&P 500 sector heatmap data with stock performance grouped by sector.
    Returns stocks with price changes and market cap for treemap visualization.
    """
    return await heatmap_service.get_heatmap(period=period)


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


@router.get("/debug/memory", tags=["System"])
async def get_memory_usage():
    """Get current process memory usage."""
    import psutil
    import os
    import gc

    process = psutil.Process(os.getpid())
    mem = process.memory_info()

    # Access cache keys with lock to avoid race condition
    with cache_service._lock:
        cache_keys = list(cache_service._cache.keys())

    return {
        "rss_mb": round(mem.rss / 1024 / 1024, 2),  # Actual RAM used
        "cache_keys": cache_keys,
        "gc_counts": gc.get_count(),  # (gen0, gen1, gen2) object counts
    }


@router.post("/debug/gc", tags=["System"])
async def force_garbage_collection():
    """Force garbage collection and return memory before/after."""
    import psutil
    import os
    import gc

    process = psutil.Process(os.getpid())

    before = process.memory_info().rss / 1024 / 1024
    collected = gc.collect()  # Force full GC
    after = process.memory_info().rss / 1024 / 1024

    return {
        "before_mb": round(before, 2),
        "after_mb": round(after, 2),
        "freed_mb": round(before - after, 2),
        "objects_collected": collected,
    }
