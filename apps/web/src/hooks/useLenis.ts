/**
 * Lenis smooth-scroll provider hook — lazily initialized, skipped for
 * reduced-motion users (spec accessibility rule).
 */
"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis(): void {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    let rafId = 0;
    function raf(time: number): void {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);
}
