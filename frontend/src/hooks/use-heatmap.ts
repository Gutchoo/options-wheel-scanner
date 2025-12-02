"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  HeatmapResponse,
  HeatmapPeriod,
  HeatmapUniverse,
} from "@/types/heatmap";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes in ms

interface UseHeatmapOptions {
  universe: HeatmapUniverse;
  period: HeatmapPeriod;
}

interface UseHeatmapReturn {
  data: HeatmapResponse | null;
  isLoading: boolean;
  error: string | null;
  secondsUntilRefresh: number;
  refresh: () => void;
}

export function useHeatmap({
  universe,
  period,
}: UseHeatmapOptions): UseHeatmapReturn {
  const [data, setData] = useState<HeatmapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(
    REFRESH_INTERVAL / 1000
  );

  const lastFetchRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHeatmap = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/api/v1/heatmap?universe=${universe}&period=${period}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch heatmap: ${response.statusText}`);
      }

      const result: HeatmapResponse = await response.json();
      setData(result);
      lastFetchRef.current = Date.now();
      setSecondsUntilRefresh(REFRESH_INTERVAL / 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch heatmap");
    } finally {
      setIsLoading(false);
    }
  }, [universe, period]);

  // Initial fetch and refetch on params change
  useEffect(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  // Auto-refresh interval
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      fetchHeatmap();
    }, REFRESH_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchHeatmap]);

  // Countdown timer
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      const elapsed = Date.now() - lastFetchRef.current;
      const remaining = Math.max(
        0,
        Math.ceil((REFRESH_INTERVAL - elapsed) / 1000)
      );
      setSecondsUntilRefresh(remaining);
    }, 1000);

    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  const refresh = useCallback(() => {
    fetchHeatmap();
  }, [fetchHeatmap]);

  return {
    data,
    isLoading,
    error,
    secondsUntilRefresh,
    refresh,
  };
}
