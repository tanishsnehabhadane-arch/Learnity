/**
 * TargetCursor — mix-blend difference reticle with 1-2px spring lag and
 * magnetic snap on .cursor-target elements. Auto-disables on touch devices
 * and for reduced-motion users (spec §3).
 */
"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { SPRING_INTERACTIVE } from "@/lib/animations";

export function TargetCursor(): JSX.Element | null {
  const [enabled, setEnabled] = useState(false);
  const [magnetic, setMagnetic] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, SPRING_INTERACTIVE);
  const springY = useSpring(y, SPRING_INTERACTIVE);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    setEnabled(true);
    document.documentElement.classList.add("has-custom-cursor");

    const onMove = (e: MouseEvent): void => {
      const target = (e.target as HTMLElement | null)?.closest<HTMLElement>(".cursor-target");
      if (target) {
        // Magnetic snap: spring toward the element's center
        const r = target.getBoundingClientRect();
        x.set(r.left + r.width / 2);
        y.set(r.top + r.height / 2);
        setMagnetic(true);
      } else {
        x.set(e.clientX);
        y.set(e.clientY);
        setMagnetic(false);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.classList.remove("has-custom-cursor");
    };
  }, [x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-[100] h-6 w-6 rounded-full border-2 border-white mix-blend-difference"
      style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      animate={{ scale: magnetic ? 1.6 : 1 }}
      transition={SPRING_INTERACTIVE}
    />
  );
}
