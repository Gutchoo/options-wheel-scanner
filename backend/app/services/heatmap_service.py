import asyncio
import gc
import json
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from collections import defaultdict
from pathlib import Path

import yfinance as yf
import pandas as pd

from app.models.responses import HeatmapStock, HeatmapSector, HeatmapResponse
from app.utils.ticker_lists import SP500_TICKERS
from app.services.cache_service import cache_service


# Period mapping for yfinance
PERIOD_MAP = {
    "1d": "2d",    # Need 2 days to calculate 1 day change
    "1w": "7d",
    "1m": "1mo",
    "3m": "3mo",
    "ytd": "ytd",
}

# Load static stock info (sector, name, market_cap)
STATIC_INFO_PATH = Path(__file__).parent.parent / "data" / "sp500_info.json"
STATIC_STOCK_INFO = {}

if STATIC_INFO_PATH.exists():
    with open(STATIC_INFO_PATH) as f:
        data = json.load(f)
        STATIC_STOCK_INFO = data.get("stocks", {})


class HeatmapService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)

    async def get_heatmap(self, period: str = "1d") -> HeatmapResponse:
        """
        Generate S&P 500 heatmap data grouped by sector.
        """
        cache_key = f"heatmap_sp500_{period}"
        cached = cache_service.get(cache_key)
        if cached:
            return HeatmapResponse(**cached)

        tickers = SP500_TICKERS

        loop = asyncio.get_event_loop()

        def fetch_data():
            # Step 1: Fetch price history for all tickers
            yf_period = PERIOD_MAP.get(period, "2d")

            data = yf.download(
                tickers,
                period=yf_period,
                progress=False,
                threads=True,
                auto_adjust=False,
            )

            if data.empty:
                return {}

            # Calculate changes
            changes = {}
            if isinstance(data.columns, pd.MultiIndex):
                close_data = data["Close"]
                for ticker in tickers:
                    try:
                        if ticker in close_data.columns:
                            prices = close_data[ticker].dropna()
                            if len(prices) >= 2:
                                current = prices.iloc[-1]
                                previous = prices.iloc[0]
                                pct_change = ((current - previous) / previous) * 100
                                changes[ticker] = {
                                    "price": float(current),
                                    "change": float(pct_change),
                                }
                    except (KeyError, IndexError):
                        pass
            else:
                # Single ticker
                prices = data["Close"].dropna()
                if len(prices) >= 2:
                    current = prices.iloc[-1]
                    previous = prices.iloc[0]
                    pct_change = ((current - previous) / previous) * 100
                    changes[tickers[0]] = {
                        "price": float(current),
                        "change": float(pct_change),
                    }

            # Explicitly delete DataFrame to help GC
            del data
            return changes

        def fetch_info(tickers_to_fetch):
            """Fetch sector and market cap info for tickers."""
            info_data = {}

            for ticker in tickers_to_fetch:
                try:
                    t = yf.Ticker(ticker)
                    info = t.info
                    info_data[ticker] = {
                        "sector": info.get("sector", "Other"),
                        "name": info.get("shortName", ticker),
                        "market_cap": info.get("marketCap"),
                    }
                except Exception:
                    info_data[ticker] = {
                        "sector": "Other",
                        "name": ticker,
                        "market_cap": None,
                    }

            return info_data

        # Fetch price changes
        changes = await loop.run_in_executor(self.executor, fetch_data)

        # Force garbage collection to free DataFrame memory
        gc.collect()

        if not changes:
            now = datetime.now()
            return HeatmapResponse(
                sectors=[],
                period=period,
                universe="sp500",
                generated_at=now.isoformat(),
                cached_at=int(now.timestamp() * 1000),
            )

        # Use static info data (loaded from sp500_info.json at startup)
        # Falls back to fetching if static data not available
        info_data = STATIC_STOCK_INFO

        if not info_data:
            # Fallback: fetch info dynamically (slow)
            info_cache_key = "heatmap_info_sp500"
            info_data = cache_service.get(info_cache_key)

            if not info_data:
                info_data = await loop.run_in_executor(
                    self.executor,
                    fetch_info,
                    list(changes.keys())
                )
                cache_service.set(info_cache_key, info_data, ttl=3600)

        # Group by sector
        sectors_dict = defaultdict(list)

        for ticker, price_data in changes.items():
            info = info_data.get(ticker, {})
            sector = info.get("sector", "Other")

            stock = HeatmapStock(
                ticker=ticker,
                name=info.get("name", ticker),
                price=round(price_data["price"], 2),
                change=round(price_data["change"], 2),
                market_cap=info.get("market_cap"),
            )
            sectors_dict[sector].append(stock)

        # Build sector list with averages
        sectors = []
        for sector_name, stocks in sectors_dict.items():
            # Sort stocks by market cap (largest first)
            stocks.sort(key=lambda s: s.market_cap or 0, reverse=True)

            # Calculate average change for sector
            avg_change = sum(s.change for s in stocks) / len(stocks) if stocks else 0

            sectors.append(HeatmapSector(
                name=sector_name,
                change=round(avg_change, 2),
                stocks=stocks,
            ))

        # Sort sectors by total market cap
        sectors.sort(
            key=lambda s: sum(st.market_cap or 0 for st in s.stocks),
            reverse=True
        )

        now = datetime.now()
        cached_at = int(now.timestamp() * 1000)  # Unix timestamp in ms

        response = HeatmapResponse(
            sectors=sectors,
            period=period,
            universe="sp500",
            generated_at=now.isoformat(),
            cached_at=cached_at,
        )

        # Cache for 2 minutes (synced with frontend CACHE_TTL)
        cache_service.set(cache_key, response.model_dump(), ttl=120)

        return response


# Global service instance
heatmap_service = HeatmapService()
