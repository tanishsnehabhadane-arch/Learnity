/**
 * Mouse position hook (rAF-throttled) for the custom cursor.
 */
"use client";

import { useEffect, useState } from "react";

export interface MousePosition {
  x: number;
  y: number;
}

export function useMousePosition(): MousePosition {
  const [position, setPosition] = useState<MousePosition>({ x: -100, y: -100 });

  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent): void => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setPosition({ x: e.clientX, y: e.clientY }));
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return position;
}
