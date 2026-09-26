"use client";

import { useState } from "react";
import { CodePlayground, type GutterAnnotation } from "@/components/features/CodePlayground";
import { Button } from "@/components/ui/Button";

export default function PlaygroundPage() {
  const [annotations, setAnnotations] = useState<GutterAnnotation[]>([]);

  const requestHelp = (): void => {
    // STUB: posts code to /api/ai/explain-style endpoint and maps errors to lines.
    setAnnotations([{ line: 2, message: "AI: this line throws when x is negative — consider Math.sign()" }]);
  };

  return (
    <main id="main" className="mx-auto w-full max-w-5xl px-4 pb-24 pt-24">
      <h1 className="font-display text-5xl font-black uppercase">Code playground</h1>
      <p className="mt-2 max-w-2xl text-sm opacity-75">
        Sandboxed execution in a Web Worker. The AI tutor can annotate errors directly in the gutter.
      </p>
      <div className="mt-8">
        <CodePlayground annotations={annotations} />
      </div>
      <Button className="mt-4" variant="secondary" onClick={requestHelp}>
        Ask AI about my code
      </Button>
    </main>
  );
}
