"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RoiFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function RoiFilter({ value, onChange }: RoiFilterProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Min ROI (%)</Label>
      <Input
        type="number"
        step="0.1"
        placeholder="1.0"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        className="h-8"
      />
    </div>
  );
}
