"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface VolumeFilterProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

export function VolumeFilter({ value, onChange }: VolumeFilterProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Min Volume</Label>
      <Input
        type="number"
        placeholder="100"
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        className="h-8"
      />
    </div>
  );
}
