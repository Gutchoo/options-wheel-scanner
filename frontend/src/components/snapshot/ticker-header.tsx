"use client";

import { useState, FormEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Loader2, TrendingUp, TrendingDown } from "lucide-react";
import { TickerSnapshot } from "@/types/snapshot";

interface TickerHeaderProps {
  ticker: string;
  snapshot: TickerSnapshot | null;
  isLoading: boolean;
  error: string | null;
  onSubmit: (ticker: string) => void;
}

export function TickerHeader({
  ticker,
  snapshot,
  isLoading,
  error,
  onSubmit,
}: TickerHeaderProps) {
  const [inputValue, setInputValue] = useState(ticker);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSubmit(inputValue.trim().toUpperCase());
    }
  };

  // Update input when ticker changes externally (e.g., from heatmap click)
  if (ticker && ticker !== inputValue && !isLoading) {
    setInputValue(ticker);
  }

  const price = snapshot?.price;
  const isPositive = (price?.change_percent ?? 0) >= 0;

  return (
    <div className="flex items-center gap-6 px-4 py-3 rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm">
      {/* Ticker Search */}
      <form onSubmit={handleSubmit} className="flex gap-2 shrink-0">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value.toUpperCase())}
          placeholder="AAPL"
          className="w-24 uppercase bg-white/5 border-white/10 text-center font-medium"
          maxLength={5}
        />
        <Button type="submit" size="icon" variant="ghost" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </form>

      {/* Company Info */}
      {isLoading ? (
        <div className="flex-1 flex items-center gap-4">
          <Skeleton className="h-7 w-48 bg-white/10" />
          <Skeleton className="h-5 w-32 bg-white/10" />
          <div className="ml-auto flex items-center gap-4">
            <Skeleton className="h-8 w-24 bg-white/10" />
            <Skeleton className="h-6 w-20 bg-white/10" />
          </div>
        </div>
      ) : error ? (
        <div className="flex-1 text-destructive text-sm">{error}</div>
      ) : snapshot ? (
        <div className="flex-1 flex items-center gap-6">
          {/* Company Name & Sector */}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-white truncate">
              {snapshot.profile.name}
            </h1>
            <span className="text-xs text-white/50">
              {snapshot.profile.sector}
              {snapshot.profile.industry && ` / ${snapshot.profile.industry}`}
            </span>
          </div>

          {/* Price & Change */}
          <div className="ml-auto flex items-center gap-4 shrink-0">
            <span className="text-2xl font-bold text-white">
              ${price?.current?.toFixed(2) ?? "—"}
            </span>
            {price?.change !== null && price?.change_percent !== null && (
              <div className={`flex items-center gap-1 ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span className="text-sm font-medium">
                  {isPositive ? "+" : ""}{price?.change?.toFixed(2)} ({isPositive ? "+" : ""}{price?.change_percent?.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>

          {/* 52-Week Range */}
          {price?.fifty_two_week_low && price?.fifty_two_week_high && (
            <div className="shrink-0 text-xs text-white/50 hidden xl:block">
              <div>52W: ${price.fifty_two_week_low.toFixed(0)} - ${price.fifty_two_week_high.toFixed(0)}</div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 text-white/50 text-sm">
          Enter a ticker symbol to view financial snapshot
        </div>
      )}
    </div>
  );
}
