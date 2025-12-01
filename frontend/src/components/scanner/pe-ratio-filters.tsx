"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PeRatioFiltersProps {
  minPe: number | null;
  maxPe: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export function PeRatioFilters({
  minPe,
  maxPe,
  onMinChange,
  onMaxChange,
}: PeRatioFiltersProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">P/E Ratio</Label>
      <div className="flex gap-1 items-center">
        <Input
          type="number"
          placeholder="Min"
          value={minPe ?? ""}
          onChange={(e) =>
            onMinChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
        <span className="text-muted-foreground text-xs">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPe ?? ""}
          onChange={(e) =>
            onMaxChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
      </div>
    </div>
  );
}
