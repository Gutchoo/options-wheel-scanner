"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Moneyness } from "@/types/scanner";

interface MoneynessSelectorProps {
  value: Moneyness;
  onChange: (value: Moneyness) => void;
}

export function MoneynessSelector({ value, onChange }: MoneynessSelectorProps) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">Moneyness</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as Moneyness)}
        className="flex flex-wrap gap-x-3 gap-y-1"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="otm" id="otm" />
          <Label htmlFor="otm" className="font-normal text-sm">
            OTM
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="itm" id="itm" />
          <Label htmlFor="itm" className="font-normal text-sm">
            ITM
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="both" id="both-money" />
          <Label htmlFor="both-money" className="font-normal text-sm">
            Both
          </Label>
        </div>
      </RadioGroup>
    </div>
  );
}
