"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceFiltersProps {
  minPrice: number | null;
  maxPrice: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export function PriceFilters({
  minPrice,
  maxPrice,
  onMinChange,
  onMaxChange,
}: PriceFiltersProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Price ($)</Label>
      <div className="flex gap-1 items-center">
        <Input
          type="number"
          placeholder="Min"
          value={minPrice ?? ""}
          onChange={(e) =>
            onMinChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
        <span className="text-muted-foreground text-xs">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxPrice ?? ""}
          onChange={(e) =>
            onMaxChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
      </div>
    </div>
  );
}
