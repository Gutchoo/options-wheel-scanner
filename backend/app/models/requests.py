from pydantic import BaseModel, Field, field_validator
from typing import Optional, Literal


class ScanRequest(BaseModel):
    # Stock Filters
    min_stock_price: Optional[float] = Field(None, ge=0, description="Minimum stock price")
    max_stock_price: Optional[float] = Field(None, ge=0, description="Maximum stock price")
    min_pe_ratio: Optional[float] = Field(None, description="Minimum P/E ratio")
    max_pe_ratio: Optional[float] = Field(None, description="Maximum P/E ratio")

    # Options Filters
    available_collateral: Optional[float] = Field(None, ge=0, description="Max collateral (strike * 100)")
    min_volume: Optional[int] = Field(None, ge=0, description="Minimum contract volume")
    min_roi: Optional[float] = Field(None, ge=0, le=100, description="Minimum ROI percentage")
    option_type: Literal["calls", "puts", "both"] = Field(default="both")
    moneyness: Literal["itm", "otm", "both"] = Field(default="both")
    min_dte: Optional[int] = Field(None, ge=0, description="Minimum days to expiration")
    max_dte: Optional[int] = Field(None, ge=0, description="Maximum days to expiration")

    # Universe Selection
    universe: Literal["sp500", "sp100", "custom"] = Field(default="sp100")
    custom_tickers: Optional[str] = Field(None, description="Comma-separated custom tickers")

    @field_validator('custom_tickers')
    @classmethod
    def validate_custom_tickers(cls, v, info):
        if info.data.get('universe') == 'custom' and not v:
            raise ValueError('custom_tickers required when universe is custom')
        return v
