from fastapi import APIRouter, Query
from sse_starlette.sse import EventSourceResponse
import json
from typing import Optional

import yfinance as yf

from app.models.requests import ScanRequest
from app.services.scanner_service import scanner_service
from app.services.cache_service import cache_service


router = APIRouter(prefix="/api/v1", tags=["scanner"])


# =============================================================================
# Debug/Test Endpoints - Direct Yahoo Finance calls
# =============================================================================

@router.get("/stock/{ticker}", tags=["debug"])
async def get_stock_info(ticker: str):
    """Get stock info via yf.Ticker().info"""
    t = yf.Ticker(ticker)
    info = t.info
    return {
        "ticker": ticker,
        "price": info.get("regularMarketPrice") or info.get("currentPrice"),
        "pe_ratio": info.get("trailingPE"),
        "name": info.get("shortName"),
        "raw_info": info,
    }


@router.get("/stock/{ticker}/price", tags=["debug"])
async def get_stock_price(ticker: str):
    """Get stock price via yf.download()"""
    data = yf.download(ticker, period="1d", progress=False)
    if data.empty:
        return {"ticker": ticker, "price": None, "error": "No data"}
    price = data["Close"].iloc[-1]
    return {
        "ticker": ticker,
        "price": float(price),
    }


@router.get("/stock/{ticker}/expirations", tags=["debug"])
async def get_option_expirations(ticker: str):
    """Get available option expiration dates via yf.Ticker().options"""
    t = yf.Ticker(ticker)
    return {
        "ticker": ticker,
        "expirations": list(t.options),
    }


@router.get("/stock/{ticker}/chain/{expiration}", tags=["debug"])
async def get_option_chain(ticker: str, expiration: str):
    """Get full options chain via yf.Ticker().option_chain()"""
    t = yf.Ticker(ticker)
    chain = t.option_chain(expiration)
    return {
        "ticker": ticker,
        "expiration": expiration,
        "calls": chain.calls.to_dict(orient="records"),
        "puts": chain.puts.to_dict(orient="records"),
    }


@router.get("/stocks/batch", tags=["debug"])
async def get_batch_prices(tickers: str = Query(..., description="Comma-separated tickers")):
    """Get batch prices via yf.download() - the bulk fetch method"""
    import pandas as pd

    ticker_list = [t.strip().upper() for t in tickers.split(",")]
    data = yf.download(ticker_list, period="1d", progress=False, threads=True)

    result = {}
    if data.empty:
        return {"tickers": result}

    # Handle MultiIndex columns (multiple tickers)
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
        # Single ticker - flat columns
        price = data["Close"].iloc[-1]
        result[ticker_list[0]] = float(price) if pd.notna(price) else None

    return {"tickers": result}


# =============================================================================
# Main Scanner Endpoints
# =============================================================================

@router.post("/scan")
async def scan_options(request: ScanRequest):
    """Stream scan results using Server-Sent Events."""
    async def event_generator():
        async for event in scanner_service.scan_options(request):
            yield {"event": event["type"], "data": json.dumps(event["data"])}

    return EventSourceResponse(event_generator())


@router.get("/universes")
async def get_universes():
    """Return available stock universes."""
    return {
        "universes": [
            {"id": "sp100", "name": "S&P 100", "count": 102},
            {"id": "sp500", "name": "S&P 500", "count": 503},
            {"id": "custom", "name": "Custom List", "count": None},
        ]
    }


@router.post("/cache/clear")
async def clear_cache():
    """Clear the cache."""
    cache_service.clear()
    return {"status": "ok", "message": "Cache cleared"}


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
