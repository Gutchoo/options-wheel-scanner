"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { HeatmapResponse, HeatmapPeriod } from "@/types/heatmap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CACHE_TTL = 3 * 60 * 60 * 1000; // 3 hours - synced with backend

interface CacheEntry {
  data: HeatmapResponse;
}

interface UseHeatmapReturn {
  data: HeatmapResponse | null;
  isLoading: boolean;
  error: string | null;
  secondsUntilRefresh: number;
}

// Module-level cache persists across hook instances and period changes
const cache: Map<HeatmapPeriod, CacheEntry> = new Map();

export function useHeatmap(period: HeatmapPeriod): UseHeatmapReturn {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(CACHE_TTL / 1000);

  const cachedAtRef = useRef<number>(0); // Tracks backend's cached_at timestamp
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Check if cached data is still valid using backend's cached_at
  const getCachedData = useCallback((p: HeatmapPeriod): CacheEntry | null => {
    const entry = cache.get(p);
    if (entry && Date.now() - entry.data.cached_at < CACHE_TTL) {
      return entry;
    }
    return null;
  }, []);

  // Fetch data from API
  const fetchFromApi = useCallback(async (p: HeatmapPeriod): Promise<HeatmapResponse> => {
    const response = await fetch(`${API_URL}/api/v1/heatmap?period=${p}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch heatmap: ${response.statusText}`);
    }
    return response.json();
  }, []);

  // Main fetch function - checks cache first
  const fetchHeatmap = useCallback(async (p: HeatmapPeriod, forceRefresh = false) => {
    setError(null);

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCachedData(p);
      if (cached) {
        setData(cached.data);
        cachedAtRef.current = cached.data.cached_at;
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(true);

    try {
      const result = await fetchFromApi(p);

      // Update cache using backend's cached_at
      cache.set(p, { data: result });
      cachedAtRef.current = result.cached_at;

      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch heatmap");
    } finally {
      setIsLoading(false);
    }
  }, [getCachedData, fetchFromApi]);

  // Handle period changes - use cache if available
  useEffect(() => {
    const cached = getCachedData(period);
    if (cached) {
      // Use cached data instantly, use backend's cached_at for countdown
      setData(cached.data);
      cachedAtRef.current = cached.data.cached_at;
      setIsLoading(false);
    } else {
      // No valid cache, fetch from API
      fetchHeatmap(period);
    }
  }, [period, getCachedData, fetchHeatmap]);

  // Auto-refresh timer - refreshes when backend cache would expire
  useEffect(() => {
    const checkAndRefresh = () => {
      const age = Date.now() - cachedAtRef.current;
      if (age >= CACHE_TTL) {
        fetchHeatmap(period, true); // Force refresh
      }
    };

    // Check every second if we need to refresh
    intervalRef.current = setInterval(checkAndRefresh, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [period, fetchHeatmap]);

  // Countdown timer - shows time until backend cache expires
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - cachedAtRef.current;
      const remaining = Math.max(0, Math.ceil((CACHE_TTL - elapsed) / 1000));
      setSecondsUntilRefresh(remaining);
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    secondsUntilRefresh,
  };
}
