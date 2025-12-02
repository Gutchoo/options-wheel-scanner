"use client";

import { motion } from "framer-motion";

export type Route = "scanner" | "heatmap" | "snapshot";

interface NavbarProps {
  activeRoute: Route;
  onRouteChange: (route: Route) => void;
}

const routes: { id: Route; label: string }[] = [
  { id: "scanner", label: "Options Scanner" },
  { id: "heatmap", label: "Sector Heatmap" },
  { id: "snapshot", label: "Ticker Snapshot" },
];

export function Navbar({ activeRoute, onRouteChange }: NavbarProps) {
  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-1 px-2 py-2 rounded-full border border-white/10 bg-black/30 backdrop-blur-xl shadow-lg">
        {routes.map((route) => (
          <button
            key={route.id}
            onClick={() => onRouteChange(route.id)}
            className="relative px-5 py-2 text-sm font-medium transition-colors"
          >
            {activeRoute === route.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 rounded-full bg-white/10"
                transition={{ type: "spring", stiffness: 500, damping: 35 }}
              />
            )}
            <span
              className={`relative z-10 ${
                activeRoute === route.id
                  ? "text-white"
                  : "text-white/60 hover:text-white/80"
              }`}
            >
              {route.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
}
