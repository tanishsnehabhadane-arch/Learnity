/**
 * PageWrapper — consistent page container + enter transition.
 */
"use client";

import type { ReactNode } from "react";
import { PageTransition } from "@/components/animations/PageTransition";
import { cn } from "@/lib/cn";

export function PageWrapper({ children, className }: { children: ReactNode; className?: string }): JSX.Element {
  return (
    <main id="main" className={cn("mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-24", className)}>
      <PageTransition>{children}</PageTransition>
    </main>
  );
}
