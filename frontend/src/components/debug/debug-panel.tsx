"use client";

import { useState } from "react";
import { useDebugStats } from "@/hooks/use-debug-stats";
import { Button } from "@/components/ui/button";
import { X, Minus, Plus, Trash2, RefreshCw, Bug } from "lucide-react";
import { cn } from "@/lib/utils";

interface DebugPanelProps {
  className?: string;
}

export function DebugPanel({ className }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const { stats, history, error, forceGC, clearCache } = useDebugStats(isOpen);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed top-4 right-4 z-50 p-2 rounded-lg",
          "bg-black/50 backdrop-blur-xl border border-white/10",
          "text-white/70 hover:text-white hover:bg-black/60",
          "transition-all duration-200",
          className
        )}
        title="Open Debug Panel"
      >
        <Bug className="h-4 w-4" />
      </button>
    );
  }

  const minMemory = history.length > 0 ? Math.min(...history) : 0;
  const maxMemory = history.length > 0 ? Math.max(...history) : 100;
  const memoryRange = maxMemory - minMemory || 1;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 w-72",
        "bg-black/50 backdrop-blur-xl rounded-lg",
        "border border-white/10 shadow-2xl",
        "text-white text-sm",
        "transition-all duration-200",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4 text-yellow-400" />
          <span className="font-medium">Debug</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            {isMinimized ? (
              <Plus className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div className="p-3 space-y-3">
          {error ? (
            <div className="text-red-400 text-xs">{error}</div>
          ) : !stats ? (
            <div className="text-white/50 text-xs">Loading...</div>
          ) : (
            <>
              {/* Stats */}
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-white/60">Memory:</span>
                  <span className="font-mono">{stats.rss_mb} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Cache:</span>
                  <span className="font-mono">
                    {stats.cache_count} keys ({stats.cache_size_kb} KB)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">GC:</span>
                  <span className="font-mono text-xs">
                    ({stats.gc_counts.join(", ")})
                  </span>
                </div>
              </div>

              {/* Memory Graph */}
              <div className="pt-2 border-t border-white/10">
                <div className="flex items-end h-12 gap-[2px]">
                  {history.map((value, i) => {
                    const height =
                      ((value - minMemory) / memoryRange) * 100 || 10;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-emerald-500/70 rounded-t transition-all duration-200"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${value} MB`}
                      />
                    );
                  })}
                  {/* Fill empty slots */}
                  {Array.from({ length: 30 - history.length }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="flex-1 bg-white/5 rounded-t"
                      style={{ height: "5%" }}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-white/40 mt-1">
                  <span>{minMemory.toFixed(1)} MB</span>
                  <span>60s</span>
                  <span>{maxMemory.toFixed(1)} MB</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={forceGC}
                  className="flex-1 h-7 text-xs bg-transparent border-white/20 hover:bg-white/10"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Force GC
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearCache}
                  className="flex-1 h-7 text-xs bg-transparent border-white/20 hover:bg-white/10"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear Cache
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
