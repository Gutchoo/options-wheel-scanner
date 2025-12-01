"use client";

import { useState, useCallback } from "react";
import { ScanFilters, StockUniverse, OptionType, Moneyness } from "@/types/scanner";

const defaultFilters: ScanFilters = {
  minStockPrice: null,
  maxStockPrice: null,
  minPeRatio: null,
  maxPeRatio: null,
  availableCollateral: null,
  minVolume: null,
  minRoi: null,
  optionType: "both",
  moneyness: "both",
  minDte: null,
  maxDte: null,
  universe: "sp100",
  customTickers: "",
};

export function useScanFilters() {
  const [filters, setFilters] = useState<ScanFilters>(defaultFilters);

  const updateFilter = useCallback(
    <K extends keyof ScanFilters>(key: K, value: ScanFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
