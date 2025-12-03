import json
from pathlib import Path

# Load S&P 500 and S&P 100 data from JSON files (single source of truth)
_DATA_DIR = Path(__file__).parent.parent / "data"
_SP500_INFO_PATH = _DATA_DIR / "sp500_info.json"
_SP100_INFO_PATH = _DATA_DIR / "sp100_info.json"

_SP500_INFO: dict = {}
_SP100_INFO: dict = {}

if _SP500_INFO_PATH.exists():
    with open(_SP500_INFO_PATH) as f:
        data = json.load(f)
        _SP500_INFO = data.get("stocks", {})

if _SP100_INFO_PATH.exists():
    with open(_SP100_INFO_PATH) as f:
        data = json.load(f)
        _SP100_INFO = data.get("stocks", {})

# S&P 100 - loaded from sp100_info.json (top 100 by market cap)
SP100_TICKERS = list(_SP100_INFO.keys())

# S&P 500 - loaded from sp500_info.json
SP500_TICKERS = list(_SP500_INFO.keys())


def get_tickers(universe: str, custom_tickers: str | None = None) -> list[str]:
    """Get list of tickers based on universe selection."""
    base_tickers = []

    if universe == "sp100":
        base_tickers = SP100_TICKERS.copy()
    elif universe == "sp500":
        base_tickers = SP500_TICKERS.copy()
    elif universe == "custom":
        # Custom only - no base tickers
        pass

    # Parse custom tickers if provided
    extra_tickers = []
    if custom_tickers:
        extra_tickers = [t.strip().upper() for t in custom_tickers.split(",") if t.strip()]

    # For custom universe, just return the custom tickers
    if universe == "custom":
        return extra_tickers

    # For sp100/sp500, combine with custom tickers and dedupe
    if extra_tickers:
        base_set = set(base_tickers)
        for ticker in extra_tickers:
            if ticker not in base_set:
                base_tickers.append(ticker)

    return base_tickers
