// Types for the Ticker Snapshot page

export interface SnapshotProfile {
  name: string;
  sector: string | null;
  industry: string | null;
  description: string | null;
  website: string | null;
  hq: string | null;
  employees: number | null;
}

export interface SnapshotPrice {
  current: number | null;
  change: number | null;
  change_percent: number | null;
  day_high: number | null;
  day_low: number | null;
  prev_close: number | null;
  market_cap: number | null;
  volume: number | null;
  avg_volume: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
}

export interface SnapshotValuation {
  pe_ratio: number | null;
  forward_pe: number | null;
  peg_ratio: number | null;
  ps_ratio: number | null;
  pb_ratio: number | null;
  ev_ebitda: number | null;
  ev_revenue: number | null;
}

export interface SnapshotProfitability {
  gross_margin: number | null;
  operating_margin: number | null;
  profit_margin: number | null;
  ebitda_margin: number | null;
  roe: number | null;
  roa: number | null;
}

export interface SnapshotGrowth {
  revenue_growth: number | null;
  earnings_growth: number | null;
  earnings_quarterly_growth: number | null;
  eps_trailing: number | null;
  eps_forward: number | null;
  eps_current_year: number | null;
}

export interface SnapshotBalanceSheet {
  cash: number | null;
  cash_per_share: number | null;
  debt: number | null;
  debt_equity: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  book_value: number | null;
}

export interface SnapshotCashFlow {
  operating_cf: number | null;
  free_cf: number | null;
}

export interface SnapshotAnalyst {
  rating: string | null;
  rating_score: number | null;
  target_low: number | null;
  target_mean: number | null;
  target_high: number | null;
  target_median: number | null;
  num_analysts: number | null;
}

export interface SnapshotRisk {
  beta: number | null;
  short_ratio: number | null;
  short_percent: number | null;
  insider_ownership: number | null;
  institutional_ownership: number | null;
  audit_risk: number | null;
  board_risk: number | null;
  overall_risk: number | null;
}

export interface SnapshotDividend {
  yield: number | null;
  rate: number | null;
  payout_ratio: number | null;
  ex_date: number | null;
}

export interface EarningsBeat {
  date: string;
  eps_estimate: number | null;
  reported_eps: number | null;
  surprise_pct: number | null;
}

export interface SnapshotEarnings {
  next_date: string | null;
  beat_history: EarningsBeat[];
}

export interface TickerSnapshot {
  ticker: string;
  profile: SnapshotProfile;
  price: SnapshotPrice;
  valuation: SnapshotValuation;
  profitability: SnapshotProfitability;
  growth: SnapshotGrowth;
  balance_sheet: SnapshotBalanceSheet;
  cash_flow: SnapshotCashFlow;
  analyst: SnapshotAnalyst;
  risk: SnapshotRisk;
  dividend: SnapshotDividend;
  earnings: SnapshotEarnings;
  error?: string;
}

export interface PriceHistoryPoint {
  date: string;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface PriceHistoryResponse {
  ticker: string;
  period: string;
  history: PriceHistoryPoint[];
  error?: string;
}

export interface NewsArticle {
  id: string;
  title: string | null;
  summary: string | null;
  publisher: string | null;
  link: string | null;
  published_at: string | null;
  thumbnail: string | null;
}

export interface NewsResponse {
  ticker: string;
  news: NewsArticle[];
  error?: string;
}

export interface SecFiling {
  type: string;
  date: string;
  title: string;
  edgar_url: string;
  exhibits: Record<string, string>;
}

export interface SecFilingsResponse {
  ticker: string;
  filings: SecFiling[];
  error?: string;
}

export type ChartPeriod = "1d" | "1w" | "1m" | "3m" | "1y" | "5y";
