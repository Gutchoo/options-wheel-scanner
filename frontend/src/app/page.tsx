"use client";

import { useState, useEffect } from "react";
import { Navbar, Route } from "@/components/nav/navbar";
import { PageCarousel } from "@/components/nav/page-carousel";
import { ScannerPage } from "@/components/pages/scanner-page";
import { HeatmapPage } from "@/components/pages/heatmap-page";
import { SnapshotPage } from "@/components/pages/snapshot-page";

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

  return (
    <div className="h-screen w-screen relative overflow-hidden">
      {/* Background - Unicorn Studio */}
      <div
        data-us-project="3PUNkFT2KzQv6nUIMoNa"
        className="absolute inset-0 w-full h-full"
      />

      {/* Navbar */}
      <Navbar activeRoute={activeRoute} onRouteChange={setActiveRoute} />

      {/* Content with top padding for navbar */}
      <div className="relative z-10 h-full w-full pt-20">
        <PageCarousel activeRoute={activeRoute}>
          {{
            scanner: <ScannerPage />,
            heatmap: <HeatmapPage />,
            snapshot: <SnapshotPage />,
          }}
        </PageCarousel>
      </div>
    </div>
  );
}
