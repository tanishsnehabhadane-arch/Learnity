import type { Metadata } from "next";

export const metadata: Metadata = { title: "Offline" };

export default function OfflinePage() {
  return (
    <main id="main" className="mx-auto flex min-h-[70dvh] max-w-2xl flex-col items-center justify-center px-4 text-center">
      <p className="font-tech text-xs font-bold uppercase tracking-[0.3em] text-crimson">Offline</p>
      <h1 className="mt-4 font-display text-6xl font-black uppercase">You're offline</h1>
      <p className="mt-4 opacity-75">
        Your queued answers will sync automatically when you reconnect. Your last lesson is
        available for review below.
      </p>
    </main>
  );
}
