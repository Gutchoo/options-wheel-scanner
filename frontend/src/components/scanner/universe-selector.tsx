"use client";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { StockUniverse } from "@/types/scanner";

interface UniverseSelectorProps {
  value: StockUniverse;
  customTickers: string;
  onChange: (universe: StockUniverse, customTickers: string) => void;
}

export function UniverseSelector({
  value,
  customTickers,
  onChange,
}: UniverseSelectorProps) {
  return (
    <div className="space-y-2">
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as StockUniverse, customTickers)}
        className="flex flex-wrap gap-x-4 gap-y-1"
      >
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="sp100" id="sp100" />
          <Label htmlFor="sp100" className="font-normal text-sm">
            S&P 100
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="sp500" id="sp500" />
          <Label htmlFor="sp500" className="font-normal text-sm">
            S&P 500
          </Label>
        </div>
        <div className="flex items-center space-x-1">
          <RadioGroupItem value="custom" id="custom" />
          <Label htmlFor="custom" className="font-normal text-sm">
            Custom
          </Label>
        </div>
      </RadioGroup>

      <Input
        placeholder={
          value === "custom"
            ? "AAPL, MSFT, GOOGL, ..."
            : "Add extra tickers (optional)..."
        }
        value={customTickers}
        onChange={(e) => onChange(value, e.target.value)}
        className="h-8"
      />
    </div>
  );
}
