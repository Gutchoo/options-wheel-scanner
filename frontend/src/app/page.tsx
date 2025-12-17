"use client";

import { useState, useEffect, useCallback } from "react";
import { Navbar, Route } from "@/components/nav/navbar";
import { PageCarousel } from "@/components/nav/page-carousel";
import { ScannerPage } from "@/components/pages/scanner-page";
import { HeatmapPage } from "@/components/pages/heatmap-page";
import { SnapshotPage } from "@/components/pages/snapshot-page";
import { DebugPanel } from "@/components/debug/debug-panel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

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
  const [showDisclaimer, setShowDisclaimer] = useState(false);

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

      {/* Disclaimer Button */}
      <button
        onClick={() => setShowDisclaimer(true)}
        className="fixed top-4 right-4 z-50 px-3 py-1.5 text-xs font-medium rounded-full border border-white/10 bg-black/30 backdrop-blur-xl text-white/60 hover:text-white hover:bg-black/50 transition-colors"
      >
        ⚠ Disclaimer
      </button>

      {/* Disclaimer Modal */}
      <Dialog open={showDisclaimer} onOpenChange={setShowDisclaimer}>
        <DialogContent className="bg-black/90 backdrop-blur-xl border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Disclaimer</DialogTitle>
            <DialogDescription className="text-white/70 space-y-4 pt-4">
              <p>
                This website is a personal project created for educational and
                informational purposes only. The data, analysis, and information
                provided on this site should not be considered as financial advice,
                investment recommendations, or a solicitation to buy or sell any
                securities.
              </p>
              <p>
                <strong className="text-white/90">No Investment Advice:</strong> Nothing
                on this website constitutes professional financial, investment, legal,
                or tax advice. Always consult with a qualified financial advisor before
                making any investment decisions.
              </p>
              <p>
                <strong className="text-white/90">Your Responsibility:</strong> Any
                trading decisions you make are solely your own responsibility. The
                creator of this website assumes no liability for any losses incurred
                from actions taken based on information presented here.
              </p>
              <p className="text-white/50 text-xs pt-2">
                By using this website, you acknowledge that you have read and understood
                this disclaimer.
              </p>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

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
