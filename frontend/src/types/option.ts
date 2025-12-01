export interface OptionResult {
  ticker: string;
  stock_price: number;
  strike: number;
  expiration: string;
  dte: number;
  option_type: "call" | "put";
  premium: number;
  bid: number | null;
  ask: number | null;
  volume: number;
  open_interest: number;
  implied_volatility: number | null;
  collateral: number;
  roi: number;
  annualized_roi: number;
  moneyness: "ITM" | "OTM";
  pe_ratio: number | null;
  next_earnings_date: string | null;
}
