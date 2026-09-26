/**
 * AppShell — client boundary wiring global providers per spec §2:
 * Lenis smooth scroll, React Query, TargetCursor, AI tutor overlay,
 * Toaster, offline sync.
 */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { useLenis } from "@/hooks/useLenis";
import { TargetCursor } from "@/components/animations/TargetCursor";
import { AITutorOverlay } from "@/components/features/AITutorOverlay";
import { useUIStore } from "@/store/useUIStore";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useUserStore } from "@/store/useUserStore";
import { usePlannerStore } from "@/store/usePlannerStore";
import { toast } from "sonner";

export function AppShell({ children }: { children: ReactNode }): JSX.Element {
  useLenis();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  const aiChatOpen = useUIStore((s) => s.aiChatOpen);
  const { online, pending } = useOfflineSync();
  const loadProfile = useUserStore((s) => s.loadProfile);
  const loadDueReviews = usePlannerStore((s) => s.loadDueReviews);

  useEffect(() => {
    void loadProfile();
    void loadDueReviews();
  }, [loadProfile, loadDueReviews]);

  useEffect(() => {
    if (!online) toast.info("You're offline — answers are queued and will sync automatically.");
  }, [online]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <TargetCursor />
      <AITutorOverlay open={aiChatOpen} />
      <Toaster
        position="bottom-right"
        toastOptions={{
          className:
            "border-2 border-black bg-white font-body text-ink shadow-brutal dark:border-white dark:bg-neutral-900",
        }}
      />
      {pending > 0 && (
        <div
          role="status"
          className="fixed bottom-4 left-4 border-2 border-black bg-gap px-3 py-2 font-tech text-xs font-bold uppercase shadow-brutal-sm dark:border-white"
        >
          {pending} answer{pending === 1 ? "" : "s"} queued offline
        </div>
      )}
    </QueryClientProvider>
  );
}
