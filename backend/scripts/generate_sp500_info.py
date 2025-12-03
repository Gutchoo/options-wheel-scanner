#!/usr/bin/env python3
"""
Generate static SP500 info file with sector, name, and market cap data.

Run this script monthly (or whenever S&P 500 composition changes) to update the static data.

Usage:
    cd backend
    source venv/bin/activate
    python scripts/generate_sp500_info.py
"""

import json
import sys
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

import yfinance as yf


def load_sp500_tickers() -> list[str]:
    """Load S&P 500 tickers from the JSON file."""
    tickers_path = Path(__file__).parent.parent / "app" / "data" / "sp500_tickers.json"

    with open(tickers_path, "r") as f:
        data = json.load(f)

    return data["tickers"]


def fetch_ticker_info(ticker: str) -> dict | None:
    """Fetch info for a single ticker."""
    try:
        t = yf.Ticker(ticker)
        info = t.info

        return {
            # Basic Info
            "ticker": ticker,
            "name": info.get("shortName") or info.get("longName") or ticker,
            "sector": info.get("sector") or "Other",
            "industry": info.get("industry") or "Other",
            "market_cap": info.get("marketCap"),

            # Valuation
            "trailing_pe": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "price_to_book": info.get("priceToBook"),
            "price_to_sales": info.get("priceToSalesTrailing12Months"),

            # Dividends
            "dividend_yield": info.get("dividendYield"),
            "dividend_rate": info.get("dividendRate"),
            "payout_ratio": info.get("payoutRatio"),

            # Financials
            "profit_margins": info.get("profitMargins"),
            "operating_margins": info.get("operatingMargins"),
            "return_on_equity": info.get("returnOnEquity"),
            "return_on_assets": info.get("returnOnAssets"),

            # Growth
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),

            # Volatility & Price
            "beta": info.get("beta"),
            "fifty_two_week_change": info.get("52WeekChange"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),

            # Liquidity
            "average_volume": info.get("averageVolume"),
            "average_volume_10day": info.get("averageVolume10days"),

            # Analyst
            "recommendation_mean": info.get("recommendationMean"),
            "recommendation_key": info.get("recommendationKey"),
            "target_mean_price": info.get("targetMeanPrice"),
            "target_high_price": info.get("targetHighPrice"),
            "target_low_price": info.get("targetLowPrice"),
            "number_of_analyst_opinions": info.get("numberOfAnalystOpinions"),

            # Short Interest
            "short_ratio": info.get("shortRatio"),
            "short_percent_of_float": info.get("shortPercentOfFloat"),

            # Earnings
            "earnings_timestamp": info.get("earningsTimestamp"),

            # Additional
            "current_price": info.get("currentPrice"),
            "book_value": info.get("bookValue"),
            "total_cash": info.get("totalCash"),
            "total_debt": info.get("totalDebt"),
            "total_revenue": info.get("totalRevenue"),
            "ebitda": info.get("ebitda"),
            "free_cashflow": info.get("freeCashflow"),
        }
    except Exception as e:
        print(f"  Error fetching {ticker}: {e}")
        return {
            "ticker": ticker,
            "name": ticker,
            "sector": "Other",
            "industry": "Other",
            "market_cap": None,
        }


def main():
    # Load tickers from JSON file
    tickers = load_sp500_tickers()

    print(f"Fetching info for {len(tickers)} tickers...")
    print("This will take a few minutes...\n")

    results = {}
    start_time = time.time()

    # Use ThreadPoolExecutor for parallel fetching
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_ticker = {
            executor.submit(fetch_ticker_info, ticker): ticker
            for ticker in tickers
        }

        completed = 0
        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            completed += 1

            try:
                info = future.result()
                if info:
                    results[ticker] = info
                    print(f"  [{completed}/{len(tickers)}] {ticker}: {info['sector']}")
            except Exception as e:
                print(f"  [{completed}/{len(tickers)}] {ticker}: ERROR - {e}")

    elapsed = time.time() - start_time
    print(f"\nFetched {len(results)} tickers in {elapsed:.1f} seconds")

    # Save S&P 500 to JSON file
    data_dir = Path(__file__).parent.parent / "app" / "data"
    data_dir.mkdir(parents=True, exist_ok=True)

    sp500_path = data_dir / "sp500_info.json"
    generated_at = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())

    sp500_data = {
        "generated_at": generated_at,
        "count": len(results),
        "stocks": results,
    }

    with open(sp500_path, "w") as f:
        json.dump(sp500_data, f, indent=2)

    print(f"\nSaved S&P 500: {sp500_path}")

    # Derive S&P 100 (top 100 by market cap) and save
    stocks_by_cap = [
        (ticker, info)
        for ticker, info in results.items()
        if info.get("market_cap")
    ]
    stocks_by_cap.sort(key=lambda x: x[1]["market_cap"], reverse=True)
    sp100_stocks = dict(stocks_by_cap[:100])

    sp100_path = data_dir / "sp100_info.json"
    sp100_data = {
        "generated_at": generated_at,
        "count": len(sp100_stocks),
        "stocks": sp100_stocks,
    }

    with open(sp100_path, "w") as f:
        json.dump(sp100_data, f, indent=2)

    print(f"Saved S&P 100: {sp100_path}")

    # Print sector summary
    sectors = {}
    for info in results.values():
        sector = info["sector"]
        sectors[sector] = sectors.get(sector, 0) + 1

    print("\nSector breakdown:")
    for sector, count in sorted(sectors.items(), key=lambda x: -x[1]):
        print(f"  {sector}: {count}")


if __name__ == "__main__":
    main()
