from pydantic import BaseModel
from typing import Optional
from datetime import date
from enum import Enum


class ScanStatus(str, Enum):
    FILTERING_STOCKS = "filtering_stocks"
    SCANNING_OPTIONS = "scanning_options"
    COMPLETE = "complete"
    ERROR = "error"


class OptionResult(BaseModel):
    ticker: str
    stock_price: float
    strike: float
    expiration: date
    dte: int
    option_type: str  # "call" or "put"
    premium: float  # Last price
    bid: Optional[float] = None
    ask: Optional[float] = None
    volume: int
    open_interest: int
    implied_volatility: Optional[float] = None
    collateral: float  # strike * 100 for puts, stock_price * 100 for calls
    roi: float  # (premium / collateral) * 100
    annualized_roi: float  # ROI * (365 / dte)
    moneyness: str  # "ITM" or "OTM"
    pe_ratio: Optional[float] = None
    next_earnings_date: Optional[date] = None


class ScanProgressEvent(BaseModel):
    status: ScanStatus
    message: str
    progress: int  # 0-100
    tickers_scanned: int
    tickers_total: int
    results_found: int
    current_ticker: Optional[str] = None


class ScanResultEvent(BaseModel):
    result: OptionResult


class ScanCompleteEvent(BaseModel):
    status: ScanStatus
    total_results: int
    scan_duration_seconds: float


# Heatmap models
class HeatmapStock(BaseModel):
    ticker: str
    name: str
    price: float
    change: float  # Percentage change
    market_cap: Optional[float] = None


class HeatmapSector(BaseModel):
    name: str
    change: float  # Average sector change
    stocks: list[HeatmapStock]


class HeatmapResponse(BaseModel):
    sectors: list[HeatmapSector]
    period: str
    universe: str
    generated_at: str
