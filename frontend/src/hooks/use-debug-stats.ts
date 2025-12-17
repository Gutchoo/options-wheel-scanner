"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface DebugStats {
  rss_mb: number;
  cache_keys: string[];
  cache_count: number;
  cache_size_kb: number;
  gc_counts: [number, number, number];
}

interface DebugState {
  stats: DebugStats | null;
  history: number[];
  isLoading: boolean;
  error: string | null;
}

export function useDebugStats(enabled: boolean, pollInterval: number = 2000) {
  const [state, setState] = useState<DebugState>({
    stats: null,
    history: [],
    isLoading: false,
    error: null,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/debug/memory`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data: DebugStats = await response.json();

      setState((prev) => ({
        stats: data,
        history: [...prev.history.slice(-29), data.rss_mb], // Keep last 30 points
        isLoading: false,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : "Failed to fetch stats",
      }));
    }
  }, []);

  const forceGC = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/debug/gc`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      // Refresh stats after GC
      await fetchStats();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to force GC",
      }));
    }
  }, [fetchStats]);

  const clearCache = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/v1/cache/clear`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      // Refresh stats after cache clear
      await fetchStats();
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : "Failed to clear cache",
      }));
    }
  }, [fetchStats]);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchStats();

    // Set up polling
    intervalRef.current = setInterval(fetchStats, pollInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, pollInterval, fetchStats]);

  return {
    ...state,
    forceGC,
    clearCache,
    refetch: fetchStats,
  };
}
