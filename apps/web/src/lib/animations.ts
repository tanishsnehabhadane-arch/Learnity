/**
 * Motion palette — every animation has purpose (spec principle).
 */
import type { Transition, Variants } from "framer-motion";

export const SPRING_INTERACTIVE: Transition = { type: "spring", stiffness: 400, damping: 30, mass: 1.2 };
export const SPRING_SNAPPY: Transition = { type: "spring", stiffness: 600, damping: 20 };
export const SPRING_FLOATY: Transition = { type: "spring", stiffness: 100, damping: 15 };

/** Page transitions: fade+slide out, slide+fade in, 300ms. */
export const pageVariants: Variants = {
  initial: { opacity: 0, x: 24 },
  enter: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, x: -24, transition: { duration: 0.3, ease: "easeIn" } },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: SPRING_INTERACTIVE },
};

/** Incorrect-answer shake: x: [-6,6,-4,4,0], 250ms. */
export const shakeKeyframes = {
  x: [-6, 6, -4, 4, 0],
  transition: { duration: 0.25 },
} as const;

export const countUp = (value: number): Transition => ({
  type: "spring",
  stiffness: 120,
  damping: 20,
  delay: value === 0 ? 0 : 0.05,
});
