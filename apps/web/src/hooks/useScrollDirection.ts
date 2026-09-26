/**
 * Scroll-direction hook for the navbar (hide-on-scroll-down, show-on-up).
 */
"use client";

import { useEffect, useState } from "react";

export type ScrollDirection = "up" | "down" | "static";

export function useScrollDirection(threshold = 8): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>("static");

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = (): void => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (Math.abs(delta) > threshold) {
          setDirection(delta > 0 ? "down" : "up");
          lastY = y;
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return direction;
}
