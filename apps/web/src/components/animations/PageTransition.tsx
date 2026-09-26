/**
 * PageTransition — fade + slide, 300ms, AnimatePresence mode="wait".
 */
"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { pageVariants } from "@/lib/animations";

export function PageTransition({ children }: { children: ReactNode }): JSX.Element {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="enter"
      className="contents"
    >
      {children}
    </motion.div>
  );
}
