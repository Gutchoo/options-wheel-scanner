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

# Add parent directory to path to import from app
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.utils.ticker_lists import SP500_TICKERS


def fetch_ticker_info(ticker: str) -> dict | None:
    """Fetch info for a single ticker."""
    try:
        t = yf.Ticker(ticker)
        info = t.info

        return {
            "ticker": ticker,
            "name": info.get("shortName") or info.get("longName") or ticker,
            "sector": info.get("sector") or "Other",
            "industry": info.get("industry") or "Other",
            "market_cap": info.get("marketCap"),
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
    print(f"Fetching info for {len(SP500_TICKERS)} tickers...")
    print("This will take a few minutes...\n")

    results = {}
    start_time = time.time()

    # Use ThreadPoolExecutor for parallel fetching
    with ThreadPoolExecutor(max_workers=10) as executor:
        future_to_ticker = {
            executor.submit(fetch_ticker_info, ticker): ticker
            for ticker in SP500_TICKERS
        }

        completed = 0
        for future in as_completed(future_to_ticker):
            ticker = future_to_ticker[future]
            completed += 1

            try:
                info = future.result()
                if info:
                    results[ticker] = info
                    print(f"  [{completed}/{len(SP500_TICKERS)}] {ticker}: {info['sector']}")
            except Exception as e:
                print(f"  [{completed}/{len(SP500_TICKERS)}] {ticker}: ERROR - {e}")

    elapsed = time.time() - start_time
    print(f"\nFetched {len(results)} tickers in {elapsed:.1f} seconds")

    # Save to JSON file
    output_path = Path(__file__).parent.parent / "app" / "data" / "sp500_info.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    output_data = {
        "generated_at": time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime()),
        "count": len(results),
        "stocks": results,
    }

    with open(output_path, "w") as f:
        json.dump(output_data, f, indent=2)

    print(f"\nSaved to: {output_path}")

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
