import asyncio
import json
from typing import AsyncGenerator, Optional
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, date
from pathlib import Path
import time

import yfinance as yf
import pandas as pd

from app.models.requests import ScanRequest
from app.models.responses import (
    OptionResult,
    ScanProgressEvent,
    ScanCompleteEvent,
    ScanStatus,
)
from app.utils.ticker_lists import get_tickers
from app.services.cache_service import cache_service

# Load pre-cached S&P 500 stock info (PE ratios, names, etc.)
_INFO_PATH = Path(__file__).parent.parent / "data" / "sp500_info.json"
_SP500_INFO: dict = {}

if _INFO_PATH.exists():
    with open(_INFO_PATH) as f:
        data = json.load(f)
        _SP500_INFO = data.get("stocks", {})


class ScannerService:
    def __init__(self):
        self.executor = ThreadPoolExecutor(max_workers=10)

    async def scan_options(
        self, request: ScanRequest
    ) -> AsyncGenerator[dict, None]:
        """
        Progressive filtering pipeline:
        1. Get ticker universe
        2. Batch fetch prices (single yfinance call)
        3. Filter by price/collateral (no API calls)
        4. Fetch P/E ratios for remaining tickers only
        5. Filter by P/E
        6. Fetch options for final filtered tickers
        7. Stream results as found
        """
        start_time = time.time()

        # Step 1: Get ticker list
        tickers = get_tickers(request.universe, request.custom_tickers)

        if not tickers:
            yield {
                "type": "error",
                "data": {"message": "No tickers to scan"}
            }
            return

        yield {
            "type": "progress",
            "data": ScanProgressEvent(
                status=ScanStatus.FILTERING_STOCKS,
                message=f"Fetching prices for {len(tickers)} tickers...",
                progress=5,
                tickers_scanned=0,
                tickers_total=len(tickers),
                results_found=0,
                current_ticker=None,
            ).model_dump(),
        }

        # Step 2: Batch fetch prices only (1 API call)
        prices, price_data_timestamp = await self._fetch_prices_batch(tickers)

        # Step 3: Filter by price/collateral BEFORE expensive .info calls
        price_filtered = self._filter_by_price(prices, request)

        yield {
            "type": "progress",
            "data": ScanProgressEvent(
                status=ScanStatus.FILTERING_STOCKS,
                message=f"Price filter: {len(tickers)} → {len(price_filtered)} tickers. Fetching P/E ratios...",
                progress=10,
                tickers_scanned=0,
                tickers_total=len(price_filtered),
                results_found=0,
                current_ticker=None,
            ).model_dump(),
        }

        # Step 4: Fetch P/E ratios only for price-filtered tickers
        stock_data = await self._fetch_stock_info(price_filtered, prices)

        # Step 5: Filter by P/E ratio
        filtered_tickers = self._filter_stocks(stock_data, request)

        yield {
            "type": "progress",
            "data": ScanProgressEvent(
                status=ScanStatus.SCANNING_OPTIONS,
                message=f"Scanning options for {len(filtered_tickers)} stocks...",
                progress=20,
                tickers_scanned=0,
                tickers_total=len(filtered_tickers),
                results_found=0,
                current_ticker=None,
            ).model_dump(),
        }

        if not filtered_tickers:
            yield {
                "type": "complete",
                "data": ScanCompleteEvent(
                    status=ScanStatus.COMPLETE,
                    total_results=0,
                    scan_duration_seconds=round(time.time() - start_time, 2),
                    price_data_timestamp=price_data_timestamp,
                ).model_dump(),
            }
            return

        # Step 4: Scan options with concurrency control
        results_count = 0
        scanned_count = 0

        # Process in batches to avoid rate limiting
        batch_size = 3
        for i in range(0, len(filtered_tickers), batch_size):
            batch = filtered_tickers[i : i + batch_size]

            # Concurrent options fetch within batch
            tasks = [
                self._scan_ticker_options(ticker, stock_data.get(ticker, {}), request)
                for ticker in batch
            ]

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            for ticker, result in zip(batch, batch_results):
                scanned_count += 1

                if isinstance(result, Exception):
                    continue

                for option in result:
                    results_count += 1
                    yield {"type": "result", "data": self._serialize_result(option)}

                # Progress update per ticker
                progress = 20 + int((scanned_count / len(filtered_tickers)) * 75)
                yield {
                    "type": "progress",
                    "data": ScanProgressEvent(
                        status=ScanStatus.SCANNING_OPTIONS,
                        message=f"Scanning {ticker}...",
                        progress=progress,
                        tickers_scanned=scanned_count,
                        tickers_total=len(filtered_tickers),
                        results_found=results_count,
                        current_ticker=ticker,
                    ).model_dump(),
                }

            # Small delay between batches to be respectful to Yahoo
            await asyncio.sleep(0.2)

        yield {
            "type": "complete",
            "data": ScanCompleteEvent(
                status=ScanStatus.COMPLETE,
                total_results=results_count,
                scan_duration_seconds=round(time.time() - start_time, 2),
                price_data_timestamp=price_data_timestamp,
            ).model_dump(),
        }

    async def _fetch_prices_batch(self, tickers: list[str]) -> tuple[dict, float]:
        """
        Fetch only prices using bulk yf.download().
        This is fast and allows early filtering before expensive .info calls.
        Returns (prices_dict, timestamp_ms) where timestamp is when data was fetched.
        """
        cache_key = f"prices_{hash(tuple(sorted(tickers)))}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached["prices"], cached["timestamp"]

        loop = asyncio.get_event_loop()

        def fetch():
            result = {}
            timestamp = time.time() * 1000  # Current time in ms
            try:
                data = yf.download(
                    tickers,
                    period="1d",
                    progress=False,
                    threads=True,
                    auto_adjust=False,
                )

                if data.empty:
                    return result, timestamp

                # Handle MultiIndex columns (multiple tickers)
                if isinstance(data.columns, pd.MultiIndex):
                    close_data = data["Close"]
                    for ticker in tickers:
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
                    result[tickers[0]] = float(price) if pd.notna(price) else None

            except Exception as e:
                print(f"Error in fetch: {e}")

            return result, timestamp

        result, timestamp = await loop.run_in_executor(self.executor, fetch)
        cache_service.set(cache_key, {"prices": result, "timestamp": timestamp}, ttl=600)  # 10 minute cache
        return result, timestamp

    def _filter_by_price(self, prices: dict, request: ScanRequest) -> list[str]:
        """
        Filter tickers by stock price only.
        Collateral filtering happens later at the option level (depends on strike, not stock price).
        """
        filtered = []

        for ticker, price in prices.items():
            if price is None:
                continue

            # Price filters only
            if request.min_stock_price and price < request.min_stock_price:
                continue
            if request.max_stock_price and price > request.max_stock_price:
                continue

            filtered.append(ticker)

        return filtered

    async def _fetch_stock_info(self, tickers: list[str], prices: dict) -> dict:
        """
        Get P/E ratios, names, and earnings dates from cached sp500_info.json.
        Falls back to yfinance API only for tickers not in cache (custom tickers).
        """
        result = {}
        uncached_tickers = []

        # First pass: use cached data where available
        for ticker in tickers:
            if ticker in _SP500_INFO:
                info = _SP500_INFO[ticker]
                # Convert earnings_timestamp to date if present
                next_earnings = None
                if info.get("earnings_timestamp"):
                    try:
                        next_earnings = datetime.fromtimestamp(info["earnings_timestamp"]).date()
                    except Exception:
                        pass

                result[ticker] = {
                    "price": prices.get(ticker),
                    "pe_ratio": info.get("trailing_pe"),
                    "name": info.get("name", ticker),
                    "next_earnings_date": next_earnings,
                }
            else:
                uncached_tickers.append(ticker)

        # Second pass: fetch from yfinance only for uncached tickers
        if uncached_tickers:
            loop = asyncio.get_event_loop()

            def fetch_uncached():
                uncached_result = {}
                for ticker in uncached_tickers:
                    try:
                        t = yf.Ticker(ticker)
                        info = t.info

                        next_earnings = None
                        try:
                            calendar = t.calendar
                            if calendar and isinstance(calendar, dict):
                                earnings_dates = calendar.get("Earnings Date")
                                if earnings_dates and isinstance(earnings_dates, list) and len(earnings_dates) > 0:
                                    next_earnings = earnings_dates[0]
                        except Exception:
                            pass

                        uncached_result[ticker] = {
                            "price": prices.get(ticker),
                            "pe_ratio": float(info.get("trailingPE")) if info.get("trailingPE") else None,
                            "name": info.get("shortName", ticker),
                            "next_earnings_date": next_earnings,
                        }
                    except Exception:
                        uncached_result[ticker] = {
                            "price": prices.get(ticker),
                            "pe_ratio": None,
                            "name": ticker,
                            "next_earnings_date": None,
                        }
                return uncached_result

            uncached_data = await loop.run_in_executor(self.executor, fetch_uncached)
            result.update(uncached_data)

        return result

    def _filter_stocks(self, stock_data: dict, request: ScanRequest) -> list[str]:
        """
        Filter stocks by P/E ratio.
        Price/collateral filtering already done in _filter_by_price().
        """
        filtered = []

        for ticker, data in stock_data.items():
            pe = data.get("pe_ratio")

            # P/E filters (only if user specified them)
            if pe is not None:
                if request.min_pe_ratio and pe < request.min_pe_ratio:
                    continue
                if request.max_pe_ratio and pe > request.max_pe_ratio:
                    continue
            elif request.min_pe_ratio or request.max_pe_ratio:
                # Skip if P/E filter is set but P/E is unavailable
                continue

            filtered.append(ticker)

        return filtered

    async def _scan_ticker_options(
        self, ticker: str, stock_data: dict, request: ScanRequest
    ) -> list[OptionResult]:
        """Scan options for a single ticker."""

        loop = asyncio.get_event_loop()

        def fetch_options():
            results = []
            t = yf.Ticker(ticker)

            # Get available expiration dates
            try:
                expirations = t.options
            except Exception:
                return results

            stock_price = stock_data.get("price")
            if not stock_price:
                return results

            pe_ratio = stock_data.get("pe_ratio")
            next_earnings_date = stock_data.get("next_earnings_date")

            for exp_date in expirations:
                # Calculate DTE
                exp = datetime.strptime(exp_date, "%Y-%m-%d").date()
                dte = (exp - datetime.now().date()).days

                if dte < 0:
                    continue

                # DTE filter
                if request.min_dte and dte < request.min_dte:
                    continue
                if request.max_dte and dte > request.max_dte:
                    continue

                try:
                    chain = t.option_chain(exp_date)
                except Exception:
                    continue

                # Process calls and/or puts based on filter
                frames_to_process = []
                if request.option_type in ["calls", "both"]:
                    frames_to_process.append(("call", chain.calls))
                if request.option_type in ["puts", "both"]:
                    frames_to_process.append(("put", chain.puts))

                for opt_type, df in frames_to_process:
                    for _, row in df.iterrows():
                        # Apply all filters
                        option = self._process_option_row(
                            row,
                            ticker,
                            stock_price,
                            exp,
                            dte,
                            opt_type,
                            pe_ratio,
                            next_earnings_date,
                            request,
                        )
                        if option:
                            results.append(option)

            return results

        return await loop.run_in_executor(self.executor, fetch_options)

    def _serialize_result(self, option: OptionResult) -> dict:
        """Convert OptionResult to JSON-serializable dict."""
        data = option.model_dump()
        # Convert dates to strings
        if isinstance(data.get("expiration"), date):
            data["expiration"] = data["expiration"].isoformat()
        if isinstance(data.get("next_earnings_date"), date):
            data["next_earnings_date"] = data["next_earnings_date"].isoformat()
        return data

    def _process_option_row(
        self, row, ticker, stock_price, exp, dte, opt_type, pe_ratio, next_earnings_date, request
    ) -> Optional[OptionResult]:
        """Process a single option and apply filters."""

        strike = row["strike"]
        premium = row.get("lastPrice", 0) or 0
        volume = row.get("volume", 0) or 0
        oi = row.get("openInterest", 0) or 0
        iv = row.get("impliedVolatility")
        bid = row.get("bid")
        ask = row.get("ask")

        if premium <= 0:
            return None

        # Calculate moneyness
        if opt_type == "call":
            is_itm = stock_price > strike
        else:
            is_itm = stock_price < strike
        moneyness = "ITM" if is_itm else "OTM"

        # Moneyness filter
        if request.moneyness == "itm" and not is_itm:
            return None
        if request.moneyness == "otm" and is_itm:
            return None

        # Volume filter
        if request.min_volume and volume < request.min_volume:
            return None

        # Calculate collateral and ROI
        if opt_type == "put":
            collateral = strike * 100
        else:
            # For calls, collateral is 100 shares at current price (covered call)
            collateral = stock_price * 100

        # Collateral filter
        if request.available_collateral and collateral > request.available_collateral:
            return None

        # ROI calculation
        roi = (premium * 100 / collateral) * 100 if collateral > 0 else 0
        annualized_roi = roi * (365 / dte) if dte > 0 else 0

        # ROI filter
        if request.min_roi and roi < request.min_roi:
            return None

        return OptionResult(
            ticker=ticker,
            stock_price=round(stock_price, 2),
            strike=round(strike, 2),
            expiration=exp,
            dte=dte,
            option_type=opt_type,
            premium=round(premium, 2),
            bid=round(bid, 2) if bid else None,
            ask=round(ask, 2) if ask else None,
            volume=int(volume),
            open_interest=int(oi),
            implied_volatility=round(iv, 4) if iv else None,
            collateral=round(collateral, 2),
            roi=round(roi, 2),
            annualized_roi=round(annualized_roi, 2),
            moneyness=moneyness,
            pe_ratio=round(pe_ratio, 2) if pe_ratio else None,
            next_earnings_date=next_earnings_date,
        )


# Global service instance
scanner_service = ScannerService()
