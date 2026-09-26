/**
 * Footer — brutalist top border, collegiate wordmark, minimal link columns.
 */
import Link from "next/link";

export function Footer(): JSX.Element {
  return (
    <footer className="border-t-2 border-black dark:border-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:flex-row">
        <div>
          <p className="font-display text-3xl font-black uppercase">Learnity</p>
          <p className="mt-1 font-tech text-xs uppercase tracking-widest opacity-70">
            Adaptive learning, engineered.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-8 gap-y-2 font-tech text-sm uppercase">
            <li><Link className="hover:text-crimson" href="/analytics">Analytics</Link></li>
            <li><Link className="hover:text-crimson" href="/planner">Planner</Link></li>
            <li><Link className="hover:text-crimson" href="/forum">Forum</Link></li>
            <li><Link className="hover:text-crimson" href="/settings">Settings</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}
