"use client";

import { useState, useCallback, useRef } from "react";
import { ScanFilters } from "@/types/scanner";
import { OptionResult } from "@/types/option";

interface ScanState {
  results: OptionResult[];
  isScanning: boolean;
  progress: number;
  message: string;
  error: string | null;
  tickersScanned: number;
  tickersTotal: number;
  currentTicker: string | null;
  priceDataTimestamp: number | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function useScanner() {
  const [state, setState] = useState<ScanState>({
    results: [],
    isScanning: false,
    progress: 0,
    message: "",
    error: null,
    tickersScanned: 0,
    tickersTotal: 0,
    currentTicker: null,
    priceDataTimestamp: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const scan = useCallback(async (filters: ScanFilters) => {
    // Abort any existing scan
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    setState((prev) => ({
      ...prev,
      results: [],
      isScanning: true,
      progress: 0,
      message: "Starting scan...",
      error: null,
      tickersScanned: 0,
      tickersTotal: 0,
      currentTicker: null,
      priceDataTimestamp: null,
    }));

    try {
      const response = await fetch(`${API_URL}/api/v1/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          min_stock_price: filters.minStockPrice,
          max_stock_price: filters.maxStockPrice,
          min_pe_ratio: filters.minPeRatio,
          max_pe_ratio: filters.maxPeRatio,
          available_collateral: filters.availableCollateral,
          min_volume: filters.minVolume,
          min_roi: filters.minRoi,
          option_type: filters.optionType,
          moneyness: filters.moneyness,
          min_dte: filters.minDte,
          max_dte: filters.maxDte,
          universe: filters.universe,
          custom_tickers: filters.customTickers || null,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Scan failed: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.total_results !== undefined) {
                // Complete event (check first since it also has status field)
                setState((prev) => ({
                  ...prev,
                  isScanning: false,
                  progress: 100,
                  message: `Scan complete: ${data.total_results} results in ${data.scan_duration_seconds}s`,
                  priceDataTimestamp: data.price_data_timestamp || null,
                }));
              } else if (data.ticker !== undefined) {
                // Result event
                setState((prev) => ({
                  ...prev,
                  results: [...prev.results, data],
                }));
              } else if (data.status !== undefined) {
                // Progress event
                setState((prev) => ({
                  ...prev,
                  progress: data.progress,
                  message: data.message,
                  tickersScanned: data.tickers_scanned,
                  tickersTotal: data.tickers_total,
                  currentTicker: data.current_ticker,
                }));
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      setState((prev) => ({
        ...prev,
        isScanning: false,
      }));
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        return; // Scan was cancelled
      }

      setState((prev) => ({
        ...prev,
        isScanning: false,
        error: (error as Error).message,
      }));
    }
  }, []);

  const cancelScan = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState((prev) => ({
        ...prev,
        isScanning: false,
        message: "Scan cancelled",
      }));
    }
  }, []);

  const clearResults = useCallback(() => {
    setState((prev) => ({
      ...prev,
      results: [],
      message: "",
      error: null,
    }));
  }, []);

  return {
    ...state,
    scan,
    cancelScan,
    clearResults,
  };
}
