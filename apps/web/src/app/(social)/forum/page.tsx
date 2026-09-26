"use client";

import Link from "next/link";
import { Card, CardBody } from "@/components/ui/Card";

const THREADS = [
  { id: "1", title: "Why does distributing a negative flip both signs?", replies: 12 },
  { id: "2", title: "How SM-2 intervals actually work", replies: 8 },
  { id: "3", title: "Study group: linear equations before Friday", replies: 21 },
];

export default function ForumPage() {
  return (
    <main id="main" className="mx-auto w-full max-w-4xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Forum</h1>
      <ul className="mt-8 space-y-3">
        {THREADS.map((thread) => (
          <li key={thread.id}>
            <Link href={`/forum/${thread.id}`} className="block border-2 border-black bg-white p-4 shadow-brutal-sm transition-transform hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-neutral-900">
              <p className="font-tech text-sm font-bold uppercase">{thread.title}</p>
              <p className="mt-1 font-tech text-xs opacity-70">{thread.replies} replies</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs opacity-70">
        STUB: backend threads + TanStack infinite query land with the social phase.
      </p>
    </main>
  );
}
