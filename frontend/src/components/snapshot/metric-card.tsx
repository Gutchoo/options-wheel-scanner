"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface MetricCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function MetricCard({ title, icon, children, className = "" }: MetricCardProps) {
  return (
    <Card className={`bg-transparent backdrop-blur-sm border-white/10 ${className}`}>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-xs font-medium text-white/60 uppercase tracking-wide flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {children}
      </CardContent>
    </Card>
  );
}

interface MetricRowProps {
  label: string;
  value: string | number | null | undefined;
  format?: "number" | "percent" | "currency" | "ratio" | "compact";
  colorCode?: boolean;
  suffix?: string;
}

export function MetricRow({ label, value, format = "number", colorCode = false, suffix = "" }: MetricRowProps) {
  const formatted = formatValue(value, format);
  const numValue = typeof value === "number" ? value : null;
  const colorClass = colorCode && numValue !== null
    ? numValue >= 0 ? "text-green-400" : "text-red-400"
    : "text-white";

  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-xs text-white/50">{label}</span>
      <span className={`text-sm font-medium ${colorClass}`}>
        {formatted}{suffix}
      </span>
    </div>
  );
}

function formatValue(value: string | number | null | undefined, format: string): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") return value;

  switch (format) {
    case "percent":
      return `${(value * 100).toFixed(1)}%`;
    case "currency":
      return formatCurrency(value);
    case "compact":
      return formatCompact(value);
    case "ratio":
      return value.toFixed(2);
    default:
      return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(1)}T`;
  if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}
