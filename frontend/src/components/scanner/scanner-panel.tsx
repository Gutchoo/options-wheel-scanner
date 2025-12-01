"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { PriceFilters } from "./price-filters";
import { CollateralInput } from "./collateral-input";
import { PeRatioFilters } from "./pe-ratio-filters";
import { VolumeFilter } from "./volume-filter";
import { RoiFilter } from "./roi-filter";
import { OptionTypeSelector } from "./option-type-selector";
import { MoneynessSelector } from "./moneyness-selector";
import { ExpirationFilters } from "./expiration-filters";
import { UniverseSelector } from "./universe-selector";
import { ScanFilters } from "@/types/scanner";
import { Search, X } from "lucide-react";

interface ScannerPanelProps {
  filters: ScanFilters;
  updateFilter: <K extends keyof ScanFilters>(
    key: K,
    value: ScanFilters[K]
  ) => void;
  resetFilters: () => void;
  onScan: () => void;
  onCancel: () => void;
  isScanning: boolean;
  progress: number;
}

export function ScannerPanel({
  filters,
  updateFilter,
  resetFilters,
  onScan,
  onCancel,
  isScanning,
}: ScannerPanelProps) {
  return (
    <Card className="h-fit bg-transparent backdrop-blur-sm">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Options Scanner</h2>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            Reset
          </Button>
        </div>

        <Separator />

        {/* Universe Selection */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Stock Universe
          </Label>
          <div className="mt-2">
            <UniverseSelector
              value={filters.universe}
              customTickers={filters.customTickers}
              onChange={(universe, customTickers) => {
                updateFilter("universe", universe);
                updateFilter("customTickers", customTickers);
              }}
            />
          </div>
        </div>

        <Separator />

        {/* Stock Filters - Grid Layout */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Stock Filters
          </Label>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <PriceFilters
              minPrice={filters.minStockPrice}
              maxPrice={filters.maxStockPrice}
              onMinChange={(v) => updateFilter("minStockPrice", v)}
              onMaxChange={(v) => updateFilter("maxStockPrice", v)}
            />
            <PeRatioFilters
              minPe={filters.minPeRatio}
              maxPe={filters.maxPeRatio}
              onMinChange={(v) => updateFilter("minPeRatio", v)}
              onMaxChange={(v) => updateFilter("maxPeRatio", v)}
            />
          </div>
        </div>

        <Separator />

        {/* Options Filters */}
        <div>
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Options Filters
          </Label>
          <div className="mt-2 space-y-3">
            {/* Type and Moneyness in a row */}
            <div className="grid grid-cols-2 gap-3">
              <OptionTypeSelector
                value={filters.optionType}
                onChange={(v) => updateFilter("optionType", v)}
              />
              <MoneynessSelector
                value={filters.moneyness}
                onChange={(v) => updateFilter("moneyness", v)}
              />
            </div>

            {/* Numeric filters in a grid */}
            <div className="grid grid-cols-3 gap-3">
              <CollateralInput
                value={filters.availableCollateral}
                onChange={(v) => updateFilter("availableCollateral", v)}
              />
              <VolumeFilter
                value={filters.minVolume}
                onChange={(v) => updateFilter("minVolume", v)}
              />
              <RoiFilter
                value={filters.minRoi}
                onChange={(v) => updateFilter("minRoi", v)}
              />
            </div>

            {/* Expiration */}
            <ExpirationFilters
              minDte={filters.minDte}
              maxDte={filters.maxDte}
              onMinChange={(v) => updateFilter("minDte", v)}
              onMaxChange={(v) => updateFilter("maxDte", v)}
            />
          </div>
        </div>

        <Separator />

        {/* Scan Button */}
        {isScanning ? (
          <Button
            className="w-full"
            size="lg"
            variant="destructive"
            onClick={onCancel}
          >
            <X className="mr-2 h-4 w-4" />
            Cancel Scan
          </Button>
        ) : (
          <Button className="w-full text-base" size="lg" onClick={onScan}>
            Scan Options
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
