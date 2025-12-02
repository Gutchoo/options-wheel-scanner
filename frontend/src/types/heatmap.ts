export interface HeatmapStock {
  ticker: string;
  name: string;
  price: number;
  change: number;
  market_cap: number | null;
}

export interface HeatmapSector {
  name: string;
  change: number;
  stocks: HeatmapStock[];
}

export interface HeatmapResponse {
  sectors: HeatmapSector[];
  period: string;
  universe: string;
  generated_at: string;
}

export type HeatmapPeriod = "1d" | "1w" | "1m" | "3m" | "ytd";
export type HeatmapUniverse = "sp100" | "sp500";
