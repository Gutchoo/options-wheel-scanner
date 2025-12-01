"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpirationFiltersProps {
  minDte: number | null;
  maxDte: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
}

export function ExpirationFilters({
  minDte,
  maxDte,
  onMinChange,
  onMaxChange,
}: ExpirationFiltersProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">DTE (Days)</Label>
      <div className="flex gap-1 items-center">
        <Input
          type="number"
          placeholder="Min"
          value={minDte ?? ""}
          onChange={(e) =>
            onMinChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
        <span className="text-muted-foreground text-xs">-</span>
        <Input
          type="number"
          placeholder="Max"
          value={maxDte ?? ""}
          onChange={(e) =>
            onMaxChange(e.target.value ? Number(e.target.value) : null)
          }
          className="h-8"
        />
      </div>
    </div>
  );
}
