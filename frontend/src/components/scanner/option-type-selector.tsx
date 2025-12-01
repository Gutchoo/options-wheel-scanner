"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OptionType } from "@/types/scanner";

interface OptionTypeSelectorProps {
  value: OptionType;
  onChange: (value: OptionType) => void;
}

export function OptionTypeSelector({
  value,
  onChange,
}: OptionTypeSelectorProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Option Type</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as OptionType)}
        className="flex flex-wrap gap-x-3 gap-y-1"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="puts" id="puts" />
          <Label htmlFor="puts" className="font-normal text-sm">
            Puts
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="calls" id="calls" />
          <Label htmlFor="calls" className="font-normal text-sm">
            Calls
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="both" id="both-type" />
          <Label htmlFor="both-type" className="font-normal text-sm">
            Both
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
