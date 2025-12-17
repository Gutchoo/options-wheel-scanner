"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar, Route } from "@/components/nav/navbar";
import { PageCarousel } from "@/components/nav/page-carousel";
import { ScannerPage } from "@/components/pages/scanner-page";
import { HeatmapPage } from "@/components/pages/heatmap-page";
import { SnapshotPage } from "@/components/pages/snapshot-page";
import { DebugPanel } from "@/components/debug/debug-panel";

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => void;
    };
  }
}

export default function HomePage() {
  const [activeRoute, setActiveRoute] = useState<Route>("scanner");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [showUnicornBg, setShowUnicornBg] = useState(false);

  // Navigate to snapshot page with a specific ticker
  const handleTickerSelect = useCallback((ticker: string) => {
    setSelectedTicker(ticker);
    setActiveRoute("snapshot");
  }, []);

  // Clear selected ticker (used when user searches for a different ticker)
  const handleTickerClear = useCallback(() => {
    setSelectedTicker(null);
  }, []);

  useEffect(() => {
    if (!showUnicornBg) return;

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
    } else if (window.UnicornStudio.isInitialized) {
      // Re-init if script already loaded but we're toggling back on
      window.UnicornStudio.init();
    }
  }, [showUnicornBg]);

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Background Toggle */}
      <button
        onClick={() => setShowUnicornBg(!showUnicornBg)}
        className="fixed top-4 left-4 z-50 px-3 py-1.5 text-xs font-medium rounded-full border border-white/10 bg-black/30 backdrop-blur-xl text-white/60 hover:text-white hover:bg-black/50 transition-colors"
      >
        {showUnicornBg ? "◈ Unicorn" : "■ Plain"}
      </button>

      {/* Background - Plain black (base layer) */}
      <div className="absolute inset-0 w-full h-full bg-black" />

      {/* Background - Unicorn Studio (only rendered when enabled) */}
      {showUnicornBg && (
        <div
          data-us-project="3PUNkFT2KzQv6nUIMoNa"
          className="absolute inset-0 w-full h-full"
        />
      )}

      {/* Navbar */}
      <Navbar activeRoute={activeRoute} onRouteChange={setActiveRoute} />

      {/* Debug Panel (dev only) */}
      {process.env.NODE_ENV === "development" &&
        process.env.NEXT_PUBLIC_DEBUG === "true" && <DebugPanel />}

      {/* Content with top padding for navbar */}
      <div className="relative z-10 h-full w-full pt-20">
        <PageCarousel activeRoute={activeRoute}>
          {{
            scanner: <ScannerPage onTickerSelect={handleTickerSelect} />,
            heatmap: <HeatmapPage onTickerSelect={handleTickerSelect} />,
            snapshot: (
              <SnapshotPage
                initialTicker={selectedTicker}
                onTickerClear={handleTickerClear}
              />
            ),
          }}
        </PageCarousel>
      </div>
    </div>
  );
}
