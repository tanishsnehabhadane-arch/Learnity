/**
 * Navbar — fixed, scroll-direction-aware, glass over brutalist border.
 * Streak flame + XP chip animate on change; review badge shows due count.
 */

"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Flame, GraduationCap, Menu, X, Zap } from "lucide-react";

import { useUIStore } from "@/store/useUIStore";
import { useUserStore } from "@/store/useUserStore";
import { usePlannerStore } from "@/store/usePlannerStore";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { SPRING_SNAPPY } from "@/lib/animations";

const NAV_LINKS = [
  { href: "/dashboard", label: "Home" },
  { href: "/analytics", label: "Analytics" },
  { href: "/planner", label: "Planner" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/forum", label: "Forum" },
] as const;

export function Navbar(): JSX.Element {
  const direction = useScrollDirection();

  const {
    isMobileMenuOpen,
    toggleMobileMenu,
    toggleAIChat,
  } = useUIStore();

  const { streak, xp } = useUserStore();

  const dueReviews = usePlannerStore(
    (s) => s.dueReviews.length
  );

  const hidden = direction === "down";

  return (
    <>
      <motion.header
        initial={false}
        animate={{ y: hidden ? -96 : 0 }}
        transition={SPRING_SNAPPY}
        className="fixed inset-x-0 top-0 z-50 border-b-2 border-black bg-slate-50/80 backdrop-blur-xl dark:border-white dark:bg-neutral-950/80"
      >
        <nav
          aria-label="Primary"
          className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4"
        >
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2"
            aria-label="Learnity home"
          >
            <GraduationCap
              className="h-6 w-6"
              aria-hidden
            />

            <span className="font-display text-2xl font-black uppercase tracking-tight">
              Learnity
            </span>
          </Link>

          {/* Desktop navigation */}
          <ul className="hidden items-center gap-6 md:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <NavLink
                  href={link.href}
                  label={link.label}
                />
              </li>
            ))}
          </ul>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* XP */}
            <motion.span
              key={`xp-${xp}`}
              initial={{
                scale: 1.2,
                color: "#ef4444",
              }}
              animate={{
                scale: 1,
                color: "inherit",
              }}
              className="hidden items-center gap-1 font-tech text-sm font-bold sm:flex"
              aria-label={`${xp} XP`}
            >
              <Zap
                className="h-4 w-4 text-crimson"
                aria-hidden
              />

              {xp.toLocaleString()} XP
            </motion.span>

            {/* Streak */}
            <motion.span
              key={`streak-${streak.current}`}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={SPRING_SNAPPY}
              className="hidden items-center gap-1 font-tech text-sm font-bold sm:flex"
              aria-label={`${streak.current} day streak`}
            >
              <Flame
                className="h-4 w-4 text-crimson"
                aria-hidden
              />

              {streak.current}
            </motion.span>

            {/* Reviews */}
            <ReviewBadge count={dueReviews} />

            {/* AI Tutor */}
            <button
              type="button"
              onClick={toggleAIChat}
              className="cursor-target hidden border-2 border-black px-3 py-1 font-tech text-xs font-bold uppercase shadow-brutal-sm hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none dark:border-white md:block"
              aria-label="Toggle AI tutor"
            >
              AI Tutor
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            className="md:hidden"
            aria-expanded={isMobileMenuOpen}
            aria-label={
              isMobileMenuOpen
                ? "Close menu"
                : "Open menu"
            }
          >
            {isMobileMenuOpen ? (
              <X
                className="h-6 w-6"
                aria-hidden
              />
            ) : (
              <Menu
                className="h-6 w-6"
                aria-hidden
              />
            )}
          </button>
        </nav>

        {/* Crimson bottom border */}
        <span
          className="block h-[2px] w-full bg-crimson"
          aria-hidden
        />
      </motion.header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={SPRING_SNAPPY}
            className="fixed inset-0 z-[60] flex flex-col gap-2 bg-slate-50 p-6 dark:bg-neutral-950 md:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="self-end"
              aria-label="Close menu"
            >
              <X
                className="h-8 w-8"
                aria-hidden
              />
            </button>

            {/* Mobile navigation */}
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={toggleMobileMenu}
                className="border-b-2 border-black py-4 font-display text-3xl font-black uppercase dark:border-white"
              >
                {link.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* Desktop navigation link */
function NavLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): JSX.Element {
  return (
    <Link
      href={href}
      className="cursor-target group relative font-tech text-sm font-medium uppercase tracking-wide hover:text-crimson"
    >
      {label}

      <span
        className="absolute -bottom-1 left-0 h-[3px] w-0 bg-crimson transition-all duration-150 group-hover:w-full"
        aria-hidden
      />
    </Link>
  );
}

/* Review badge */
function ReviewBadge({
  count,
}: {
  count: number;
}): JSX.Element | null {
  if (count === 0) return null;

  return (
    <span
      className="flex h-6 min-w-6 items-center justify-center rounded-full bg-crimson px-1.5 font-tech text-xs font-bold text-white"
      aria-label={`${count} reviews due today`}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}