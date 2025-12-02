"use client";

import { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Route } from "./navbar";

// Context to tell child pages when animation is complete and if they've been visited
interface TransitionContextValue {
  isReady: boolean;
  hasVisited: Record<Route, boolean>;
  markVisited: (route: Route) => void;
}

const TransitionContext = createContext<TransitionContextValue>({
  isReady: true,
  hasVisited: { scanner: false, heatmap: false, snapshot: false },
  markVisited: () => {},
});

export function useTransitionReady() {
  return useContext(TransitionContext);
}

interface PageCarouselProps {
  activeRoute: Route;
  children: Record<Route, React.ReactNode>;
}

const routeOrder: Route[] = ["scanner", "heatmap", "snapshot"];

export function PageCarousel({ activeRoute, children }: PageCarouselProps) {
  const [direction, setDirection] = useState(0);
  const [isTransitionComplete, setIsTransitionComplete] = useState(true);
  const [hasVisited, setHasVisited] = useState<Record<Route, boolean>>({
    scanner: true, // Scanner is the default, so mark as visited
    heatmap: false,
    snapshot: false,
  });
  const prevRouteRef = useRef(activeRoute);

  useEffect(() => {
    const prevIndex = routeOrder.indexOf(prevRouteRef.current);
    const newIndex = routeOrder.indexOf(activeRoute);
    setDirection(newIndex > prevIndex ? 1 : -1);
    prevRouteRef.current = activeRoute;
    // Mark transition as starting
    setIsTransitionComplete(false);
  }, [activeRoute]);

  const markVisited = (route: Route) => {
    setHasVisited((prev) => ({ ...prev, [route]: true }));
  };

  const contextValue: TransitionContextValue = {
    isReady: isTransitionComplete,
    hasVisited,
    markVisited,
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <TransitionContext.Provider value={contextValue}>
        <AnimatePresence mode="popLayout" initial={false} custom={direction}>
          <motion.div
            key={activeRoute}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            onAnimationComplete={() => setIsTransitionComplete(true)}
            className="absolute inset-0"
          >
            {children[activeRoute]}
          </motion.div>
        </AnimatePresence>
      </TransitionContext.Provider>
    </div>
  );
}
