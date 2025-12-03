"use client";

import { Loader2 } from "lucide-react";
import { useHeatmap } from "@/hooks/use-heatmap";
import { Treemap } from "@/components/heatmap/treemap";

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface HeatmapPageProps {
  onTickerSelect?: (ticker: string) => void;
}

export function HeatmapPage({ onTickerSelect }: HeatmapPageProps) {
  const { data, isLoading, error, secondsUntilRefresh } = useHeatmap("1d");

  return (
    <div className="h-full w-full p-4">
      <div className="h-full w-full flex flex-col rounded-lg border border-white/10 bg-transparent backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30 shrink-0">
          <h2 className="text-sm font-medium text-white/90">S&P 500 Heatmap</h2>

          <span className="text-xs text-muted-foreground">
            {isLoading ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Loading...
              </span>
            ) : (
              `Refreshes in ${formatTime(secondsUntilRefresh)}`
            )}
          </span>
        </div>

        {/* Heatmap content */}
        <div className="flex-1 min-h-0">
          {error ? (
            <div className="h-full flex items-center justify-center text-destructive">
              {error}
            </div>
          ) : isLoading && !data ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data ? (
            <Treemap sectors={data.sectors} onTickerClick={onTickerSelect} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
