export type StockUniverse = "sp500" | "sp100" | "custom";
export type OptionType = "calls" | "puts" | "both";
export type Moneyness = "itm" | "otm" | "both";

export interface ScanFilters {
  minStockPrice: number | null;
  maxStockPrice: number | null;
  minPeRatio: number | null;
  maxPeRatio: number | null;
  availableCollateral: number | null;
  minVolume: number | null;
  minRoi: number | null;
  optionType: OptionType;
  moneyness: Moneyness;
  minDte: number | null;
  maxDte: number | null;
  universe: StockUniverse;
  customTickers: string;
}
