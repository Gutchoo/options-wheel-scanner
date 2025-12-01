"use client";

import { ScannerPanel } from "@/components/scanner/scanner-panel";
import { ResultsTable } from "@/components/results/results-table";
import { useScanFilters } from "@/hooks/use-scan-filters";
import { useScanner } from "@/hooks/use-scanner";
import { useEffect } from "react";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => void;
    };
  }
}

export default function HomePage() {
  useEffect(() => {
    if (!window.UnicornStudio) {
      window.UnicornStudio = { isInitialized: false, init: () => {} };
      const script = document.createElement("script");
      script.src =
        "https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v1.4.36/dist/unicornStudio.umd.js";
      script.onload = () => {
        if (window.UnicornStudio && !window.UnicornStudio.isInitialized) {
          window.UnicornStudio.init();
          window.UnicornStudio.isInitialized = true;
        }
      };
      document.head.appendChild(script);
    }
  }, []);
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
    scan,
    cancelScan,
  } = useScanner();

  const handleScan = () => {
    scan(filters);
  };

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Background - Unicorn Studio */}
      <div
        data-us-project="3PUNkFT2KzQv6nUIMoNa"
        className="absolute inset-0 w-full h-full"
      />

      {/* Content */}
      <div className="relative z-10 h-full w-full flex items-center justify-center p-[1vw]">
        <div className="flex items-stretch gap-[0.5vw] w-[96vw] h-[92vh]">
          {/* Left: Scanner Panel - Proportional width (~22% of viewport) */}
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

          {/* Right: Results Table - Takes remaining width */}
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
            />
          </main>
        </div>
      </div>
    </div>
  );
}
