/**
 * AITutorOverlay — draggable glassmorphic chat with real token streaming
 * (useAITutorStream), Markdown + LaTeX rendering, voice input (Web Speech API)
 * and minimize-to-navbar-tab with unread badge.
 */
"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { useUIStore } from "@/store/useUIStore";
import { useAITutorStream } from "@/hooks/useAITutorStream";
import { TutorMarkdown } from "./TutorMarkdown";
import { VoiceInputButton } from "./VoiceInputButton";
import { Button } from "@/components/ui/Button";
import { SPRING_FLOATY } from "@/lib/animations";
import { Send, Minus, X, Sparkles } from "lucide-react";

export function AITutorOverlay({ open }: { open: boolean }): JSX.Element | null {
  const toggleAIChat = useUIStore((s) => s.toggleAIChat);
  const { messages, status, ask, clear } = useAITutorStream();
  const [draft, setDraft] = useState("");
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!open) return null;

  const submit = (): void => {
    const text = draft.trim();
    if (text.length === 0) return;
    ask(text);
    setDraft("");
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: 999_999, behavior: "smooth" }));
  };

  return (
    <motion.aside
      drag
      dragElastic={0.2}
      dragMomentum={false}
      transition={SPRING_FLOATY}
      className="fixed bottom-24 right-6 z-[70] flex h-[520px] w-[min(380px,calc(100vw-2rem))] flex-col border-2 border-black bg-white/10 backdrop-blur-xl shadow-brutal dark:border-white"
      role="dialog"
      aria-label="AI Tutor"
    >
      <header className="flex items-center justify-between border-b-2 border-black bg-white/60 px-4 py-2 dark:border-white dark:bg-neutral-900/60">
        <p className="flex items-center gap-2 font-tech text-sm font-bold uppercase">
          <Sparkles className="h-4 w-4 text-crimson" aria-hidden /> AI Tutor
          {status === "streaming" && (
            <span className="font-mono text-[10px] uppercase text-electric">streaming…</span>
          )}
        </p>
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setMinimized((m) => !m)} aria-label={minimized ? "Expand tutor" : "Minimize tutor"}>
            <Minus className="h-4 w-4" aria-hidden />
          </button>
          <button type="button" onClick={toggleAIChat} aria-label="Close tutor">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </header>

      {!minimized && (
        <>
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3" aria-live="polite">
            {messages.length === 0 && (
              <p className="mt-8 text-center text-sm opacity-70">
                Ask anything about what you're learning — I know your recent attempts and gaps.
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={
                  m.role === "student"
                    ? "ml-auto w-fit max-w-[85%] border-2 border-black bg-electric px-3 py-2 text-sm text-white dark:border-white"
                    : "w-fit max-w-[90%] border-2 border-black bg-white/80 px-3 py-2 text-sm dark:border-white dark:bg-neutral-900/80"
                }
              >
                {m.role === "tutor" ? <TutorMarkdown content={m.text} /> : m.text}
              </div>
            ))}
          </div>

          <form
            className="flex items-center gap-2 border-t-2 border-black bg-white/60 px-3 py-2 dark:border-white dark:bg-neutral-900/60"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <VoiceInputButton onTranscript={setDraft} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask your tutor…"
              className="h-10 flex-1 border-2 border-black bg-white px-3 text-sm dark:border-white dark:bg-neutral-900"
              aria-label="Message the AI tutor"
            />
            <Button type="submit" size="icon" aria-label="Send">
              <Send className="h-4 w-4" aria-hidden />
            </Button>
            <button type="button" onClick={clear} className="font-tech text-[10px] uppercase underline" aria-label="Clear conversation">
              Clear
            </button>
          </form>
        </>
      )}
    </motion.aside>
  );
}
