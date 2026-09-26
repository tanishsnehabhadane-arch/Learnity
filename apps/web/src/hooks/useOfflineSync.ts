/**
 * Offline answer queue — queues quiz/review submissions while offline and
 * syncs on reconnect (PWA requirement).
 */
"use client";

import { useEffect, useState } from "react";

export interface QueuedAnswer {
  kind: "quiz" | "review";
  url: string;
  body: unknown;
  queuedAt: number;
}

const QUEUE_KEY = "learnity.offlineQueue";

function readQueue(): QueuedAnswer[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(QUEUE_KEY) ?? "[]") as QueuedAnswer[];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedAnswer[]): void {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueueAnswer(item: Omit<QueuedAnswer, "queuedAt">): void {
  const queue = readQueue();
  queue.push({ ...item, queuedAt: Date.now() });
  writeQueue(queue);
}

/** STUB: Background Sync API registration lands with the Serwist phase. */
export function useOfflineSync(onSynced?: () => void): { online: boolean; pending: number } {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    setOnline(navigator.onLine);
    setPending(readQueue().length);

    const goOnline = (): void => {
      setOnline(true);
      void syncQueue().then((count) => {
        if (count > 0) onSynced?.();
      });
    };
    const goOffline = (): void => {
      setOnline(false);
    };

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, [onSynced]);

  return { online, pending };
}

async function syncQueue(): Promise<number> {
  const { api } = await import("@/lib/axios-client");
  const queue = readQueue();
  const remaining: QueuedAnswer[] = [];
  let synced = 0;
  for (const item of queue) {
    try {
      await api.post(item.url, item.body);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }
  writeQueue(remaining);
  setPendingSafe(remaining.length);
  return synced;
}

function setPendingSafe(count: number): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("learnity:offline-queue", { detail: count }));
  }
}
