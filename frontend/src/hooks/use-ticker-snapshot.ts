"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  TickerSnapshot,
  PriceHistoryPoint,
  NewsArticle,
  SecFiling,
  ChartPeriod,
} from "@/types/snapshot";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: TickerSnapshot;
  fetchedAt: number;
}

interface UseTickerSnapshotReturn {
  ticker: string;
  snapshot: TickerSnapshot | null;
  priceHistory: PriceHistoryPoint[];
  news: NewsArticle[];
  filings: SecFiling[];
  chartPeriod: ChartPeriod;
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  loadTicker: (ticker: string) => Promise<void>;
  setChartPeriod: (period: ChartPeriod) => void;
  clearData: () => void;
}

// Module-level cache persists across component remounts
const snapshotCache: Map<string, CacheEntry> = new Map();

export function useTickerSnapshot(initialTicker?: string): UseTickerSnapshotReturn {
  const [ticker, setTicker] = useState<string>(initialTicker?.toUpperCase() || "");
  const [snapshot, setSnapshot] = useState<TickerSnapshot | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryPoint[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [filings, setFilings] = useState<SecFiling[]>([]);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>("1m");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch main snapshot data
  const fetchSnapshot = useCallback(async (t: string, signal: AbortSignal) => {
    const upperTicker = t.toUpperCase();

    // Check cache
    const cached = snapshotCache.get(upperTicker);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(
      `${API_URL}/api/v1/stock/${upperTicker}/snapshot`,
      { signal }
    );

    if (!response.ok) {
      throw new Error(
        response.status === 404
          ? `Ticker "${upperTicker}" not found`
          : `Failed to fetch snapshot: ${response.statusText}`
      );
    }

    const data: TickerSnapshot = await response.json();

    // Check for API-level error
    if (data.error) {
      throw new Error(data.error);
    }

    // Update cache
    snapshotCache.set(upperTicker, { data, fetchedAt: Date.now() });

    return data;
  }, []);

  // Fetch price history
  const fetchPriceHistory = useCallback(async (t: string, period: ChartPeriod) => {
    try {
      setIsLoadingHistory(true);
      const response = await fetch(
        `${API_URL}/api/v1/stock/${t.toUpperCase()}/history?period=${period}`
      );
      if (!response.ok) return;
      const data = await response.json();
      setPriceHistory(data.history || []);
    } catch {
      // Silently fail - chart will show empty
      setPriceHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  // Fetch news
  const fetchNews = useCallback(async (t: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/stock/${t.toUpperCase()}/news?limit=5`
      );
      if (!response.ok) return;
      const data = await response.json();
      setNews(data.news || []);
    } catch {
      setNews([]);
    }
  }, []);

  // Fetch SEC filings
  const fetchFilings = useCallback(async (t: string) => {
    try {
      const response = await fetch(
        `${API_URL}/api/v1/stock/${t.toUpperCase()}/sec-filings?limit=5`
      );
      if (!response.ok) return;
      const data = await response.json();
      setFilings(data.filings || []);
    } catch {
      setFilings([]);
    }
  }, []);

  // Main function to load all ticker data
  const loadTicker = useCallback(
    async (t: string) => {
      const trimmed = t.trim();
      if (!trimmed) return;

      const upperTicker = trimmed.toUpperCase();

      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setTicker(upperTicker);
      setIsLoading(true);
      setError(null);

      try {
        // Fetch snapshot first (main data)
        const snapshotData = await fetchSnapshot(
          upperTicker,
          abortControllerRef.current.signal
        );
        setSnapshot(snapshotData);

        // Fetch supplementary data in parallel (don't block on these)
        Promise.all([
          fetchPriceHistory(upperTicker, chartPeriod),
          fetchNews(upperTicker),
          fetchFilings(upperTicker),
        ]);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError((err as Error).message);
        setSnapshot(null);
      } finally {
        setIsLoading(false);
      }
    },
    [fetchSnapshot, fetchPriceHistory, fetchNews, fetchFilings, chartPeriod]
  );

  // Re-fetch history when chart period changes
  useEffect(() => {
    if (ticker) {
      fetchPriceHistory(ticker, chartPeriod);
    }
  }, [ticker, chartPeriod, fetchPriceHistory]);

  // Clear all data
  const clearData = useCallback(() => {
    setTicker("");
    setSnapshot(null);
    setPriceHistory([]);
    setNews([]);
    setFilings([]);
    setError(null);
  }, []);

  return {
    ticker,
    snapshot,
    priceHistory,
    news,
    filings,
    chartPeriod,
    isLoading,
    isLoadingHistory,
    error,
    loadTicker,
    setChartPeriod,
    clearData,
  };
}
