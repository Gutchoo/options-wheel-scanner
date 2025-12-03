"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useHeatmap } from "@/hooks/use-heatmap";
import { Treemap } from "@/components/heatmap/treemap";
import { HeatmapPeriod } from "@/types/heatmap";

const periodOptions: { value: HeatmapPeriod; label: string }[] = [
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "ytd", label: "YTD" },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function HeatmapPage() {
  const [period, setPeriod] = useState<HeatmapPeriod>("1d");

  const { data, isLoading, error, secondsUntilRefresh } = useHeatmap(period);

  return (
    <div className="h-full w-full p-4">
      <div className="h-full w-full flex flex-col rounded-lg border border-white/10 bg-transparent backdrop-blur-sm overflow-hidden">
        {/* Header with controls */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-black/30 shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-white/90">S&P 500 Heatmap</h2>
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as HeatmapPeriod)}
            >
              <SelectTrigger className="w-[100px] h-7 text-xs bg-white/5 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <Treemap sectors={data.sectors} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
