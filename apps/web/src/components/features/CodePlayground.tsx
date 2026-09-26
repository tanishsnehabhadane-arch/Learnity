/**
 * CodePlayground — embedded editor + sandboxed run for CS-track content.
 * STUB: Monaco/CodeMirror + worker-isolated execution land in Phase 8;
 * this scaffold keeps a textarea editor with a Web-Worker eval guard so the
 * demo loop works without heavy deps, and exposes the AI gutter-annotation slot.
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export interface GutterAnnotation {
  line: number;
  message: string;
}

export function CodePlayground({
  initialCode = "// Write your solution here\n",
  annotations = [],
}: {
  initialCode?: string;
  /** AI tutor inline error annotations (line, message). */
  annotations?: GutterAnnotation[];
}): JSX.Element {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [running, setRunning] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  const run = useCallback(() => {
    setRunning(true);
    setOutput([]);
    const blob = new Blob(
      [
        `self.onmessage = (e) => {
          const logs = [];
          const fakeConsole = { log: (...a) => logs.push(a.map(String).join(" ")) };
          try {
            const fn = new Function("console", e.data);
            fn(fakeConsole);
            self.postMessage({ ok: true, logs });
          } catch (err) {
            self.postMessage({ ok: false, logs, error: String(err) });
          }
        };`,
      ],
      { type: "text/javascript" },
    );
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<{ ok: boolean; logs: string[]; error?: string }>) => {
      setOutput([...e.data.logs, ...(e.data.error ? [`Error: ${e.data.error}`] : [])]);
      setRunning(false);
      worker.terminate();
    };
    worker.postMessage(code);
  }, [code]);

  useEffect(() => {
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const annotationLines = new Map(annotations.map((a) => [a.line, a.message]));

  return (
    <div className="border-2 border-black shadow-brutal dark:border-white">
      <div className="flex items-center justify-between border-b-2 border-black bg-white px-4 py-2 dark:border-white dark:bg-neutral-900">
        <p className="font-tech text-xs font-bold uppercase">playground.js</p>
        <Button size="sm" onClick={run} loading={running}>
          Run
        </Button>
      </div>
      <div className="grid gap-0 md:grid-cols-2">
        <div className="relative">
          {code.split("\n").map((_, i) => {
            const note = annotationLines.get(i + 1);
            return note ? (
              <span
                key={i}
                title={note}
                role="img"
                aria-label={`Line ${i + 1}: ${note}`}
                className="absolute left-0 z-10 mt-1 ml-1 h-3 w-3 bg-crimson"
                style={{ top: `${i * 1.5}rem` }}
              />
            ) : null;
          })}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            rows={14}
            className="w-full resize-none bg-white p-3 font-mono text-sm outline-none dark:bg-neutral-900"
            aria-label="Code editor"
          />
        </div>
        <pre
          className="max-h-72 overflow-auto border-t-2 border-black bg-neutral-100 p-3 font-mono text-xs md:border-l-2 md:border-t-0 dark:border-white dark:bg-neutral-950"
          aria-live="polite"
          aria-label="Program output"
        >
          {output.length === 0 ? "▸ Output appears here" : output.join("\n")}
        </pre>
      </div>
    </div>
  );
}


