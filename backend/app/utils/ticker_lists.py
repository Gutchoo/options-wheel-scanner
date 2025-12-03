import json
from pathlib import Path

# Load S&P 500 tickers from JSON file (single source of truth)
_TICKERS_PATH = Path(__file__).parent.parent / "data" / "sp500_tickers.json"
_SP500_TICKERS = []

if _TICKERS_PATH.exists():
    with open(_TICKERS_PATH) as f:
        data = json.load(f)
        _SP500_TICKERS = data.get("tickers", [])

# S&P 100 Components (subset of S&P 500 - top 100 by market cap)
SP100_TICKERS = [
    "AAPL", "ABBV", "ABT", "ACN", "ADBE", "AIG", "AMD", "AMGN", "AMT", "AMZN",
    "AVGO", "AXP", "BA", "BAC", "BK", "BKNG", "BLK", "BMY", "BRK.B", "C",
    "CAT", "CHTR", "CL", "CMCSA", "COF", "COP", "COST", "CRM", "CSCO", "CVS",
    "CVX", "DE", "DHR", "DIS", "DOW", "DUK", "EMR", "EXC", "F", "FDX",
    "GD", "GE", "GILD", "GM", "GOOG", "GOOGL", "GS", "HD", "HON", "IBM",
    "INTC", "JNJ", "JPM", "KHC", "KO", "LIN", "LLY", "LMT", "LOW", "MA",
    "MCD", "MDLZ", "MDT", "MET", "META", "MMM", "MO", "MRK", "MS", "MSFT",
    "NEE", "NFLX", "NKE", "NVDA", "ORCL", "PEP", "PFE", "PG", "PM", "PYPL",
    "QCOM", "RTX", "SBUX", "SCHW", "SO", "SPG", "T", "TGT", "TMO", "TMUS",
    "TSLA", "TXN", "UNH", "UNP", "UPS", "USB", "V", "VZ", "WFC", "WMT", "XOM"
]

# S&P 500 - loaded from JSON file
SP500_TICKERS = _SP500_TICKERS


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
