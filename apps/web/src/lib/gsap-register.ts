/**
 * Central GSAP registration. Import for side effect before using gsap.
 * Lazy-loaded — never on the critical path (spec performance rule).
 */
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.globalTimeline.timeScale(100); // effectively instant
  }
}

export { gsap, ScrollTrigger };
