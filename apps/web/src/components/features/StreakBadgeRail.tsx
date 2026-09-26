/**
 * StreakBadgeRail — daily streak flame, XP progress bar, badge chips.
 * Count-up animation on change; static for reduced motion.
 */
"use client";

import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import type { BadgeDto } from "@/types";
import { SPRING_SNAPPY } from "@/lib/animations";

export function StreakBadgeRail({
  streak,
  xp,
  badges,
}: {
  streak: { current: number; longest: number };
  xp: number;
  badges: BadgeDto[];
}): JSX.Element {
  const xpToNextLevel = 500;
  const xpProgress = (xp % xpToNextLevel) / xpToNextLevel;

  return (
    <section aria-label="Progress and achievements" className="border-2 border-black bg-white p-6 shadow-brutal dark:border-white dark:bg-neutral-900">
      <div className="flex items-center gap-6">
        <motion.div
          key={streak.current}
          initial={{ scale: 1.3, rotate: -8 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={SPRING_SNAPPY}
          className="flex items-center gap-2"
        >
          <Flame className="h-8 w-8 text-crimson" aria-hidden />
          <div>
            <p className="font-display text-3xl font-black leading-none">{streak.current}</p>
            <p className="font-tech text-[10px] uppercase tracking-widest opacity-70">day streak</p>
          </div>
        </motion.div>

        <div className="flex-1">
          <div className="flex justify-between font-tech text-xs uppercase">
            <span>{xp.toLocaleString()} XP</span>
            <span>level {Math.floor(xp / xpToNextLevel) + 1}</span>
          </div>
          <div className="mt-1 h-3 border-2 border-black bg-white dark:border-white">
            <motion.div
              className="h-full bg-electric"
              initial={false}
              animate={{ width: `${xpProgress * 100}%` }}
              transition={SPRING_SNAPPY}
            />
          </div>
        </div>
      </div>

      {badges.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Badges">
          {badges.map((badge) => (
            <li
              key={badge.key}
              title={badge.description}
              className="border-2 border-black px-2 py-1 font-tech text-[10px] font-bold uppercase dark:border-white"
            >
              {badge.name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
