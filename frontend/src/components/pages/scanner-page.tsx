"use client";

import { ScannerPanel } from "@/components/scanner/scanner-panel";
import { ResultsTable } from "@/components/results/results-table";
import { useScanFilters } from "@/hooks/use-scan-filters";
import { useScanner } from "@/hooks/use-scanner";

interface ScannerPageProps {
  onTickerSelect?: (ticker: string) => void;
}

export function ScannerPage({ onTickerSelect }: ScannerPageProps) {
  const { filters, updateFilter, resetFilters } = useScanFilters();
  const {
    results,
    isScanning,
    progress,
    message,
    error,
    tickersScanned,
    tickersTotal,
    currentTicker,
    priceDataTimestamp,
    scan,
    cancelScan,
  } = useScanner();

  const handleScan = () => {
    scan(filters);
  };

  return (
    <div className="h-full w-full flex items-center justify-center p-[1vw]">
      <div className="flex items-stretch gap-[0.5vw] w-full h-full">
        {/* Left: Scanner Panel */}
        <aside className="w-[22vw] shrink-0">
          <ScannerPanel
            filters={filters}
            updateFilter={updateFilter}
            resetFilters={resetFilters}
            onScan={handleScan}
            onCancel={cancelScan}
            isScanning={isScanning}
            progress={progress}
          />
        </aside>

        {/* Right: Results Table */}
        <main className="flex-1 overflow-hidden flex flex-col">
          <ResultsTable
            results={results}
            isScanning={isScanning}
            progress={progress}
            message={message}
            error={error}
            tickersScanned={tickersScanned}
            tickersTotal={tickersTotal}
            currentTicker={currentTicker}
            priceDataTimestamp={priceDataTimestamp}
            onTickerClick={onTickerSelect}
          />
        </main>
      </div>
    </div>
  );
}
