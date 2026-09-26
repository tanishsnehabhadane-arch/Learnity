/**
 * Hero — neural-particle background, parallax, staggered reveal. Client island;
 * the rest of the landing page stays server-rendered for LCP.
 */
"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { staggerContainer, staggerChild, SPRING_INTERACTIVE } from "@/lib/animations";

const HeroParticles = dynamic(
  () => import("@/components/animations/HeroParticles").then((m) => m.HeroParticles),
  { ssr: false },
);

export function HeroSection(): JSX.Element {
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], [0, 300]); // parallax y: scrollY * 0.5

  return (
    <section className="relative flex min-h-[92dvh] items-center overflow-hidden border-b-2 border-black dark:border-white">
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-100 to-base dark:from-neutral-900 dark:to-base" aria-hidden />
      <HeroParticles />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="mx-auto w-full max-w-5xl px-4 py-24 text-center"
      >
        <motion.p
          variants={staggerChild}
          className="font-tech text-xs font-medium uppercase tracking-[0.3em] text-crimson"
        >
          AI-powered adaptive learning
        </motion.p>

        <motion.h1
          variants={staggerChild}
          className="mt-6 font-display text-6xl font-black uppercase leading-[0.95] tracking-tight sm:text-7xl md:text-8xl"
        >
          Train smarter.
          <br />
          <span className="text-crimson">Learn faster.</span>
        </motion.h1>

        <motion.p variants={staggerChild} className="mx-auto mt-6 max-w-2xl text-base opacity-80 sm:text-lg">
          Learnity calibrates to your exact level, finds your real knowledge gaps at the
          concept level, and rebuilds your path after every single answer.
        </motion.p>

        <motion.div variants={staggerChild} className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/signup"
            className="cursor-target inline-flex h-12 items-center gap-2 border-2 border-black bg-crimson px-6 font-tech text-sm font-bold uppercase text-white shadow-brutal transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white"
          >
            Start calibration <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          <Link
            href="/dashboard"
            className="cursor-target inline-flex h-12 items-center border-2 border-black bg-transparent px-6 font-tech text-sm font-bold uppercase shadow-brutal-sm transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white"
          >
            Explore the platform
          </Link>
        </motion.div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={SPRING_INTERACTIVE}
        className="absolute bottom-0 h-1 w-full origin-left bg-crimson"
      />
    </section>
  );
}
