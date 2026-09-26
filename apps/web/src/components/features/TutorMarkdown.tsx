/**
 * TutorMarkdown — react-markdown + KaTeX (rehype-katex/remark-math) +
 * rehype-highlight for the tutor's code snippets (JetBrains Mono).
 */
"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import "katex/dist/katex.min.css";

export function TutorMarkdown({ content }: { content: string }): JSX.Element {
  return (
    <div className="prose-sm max-w-none break-words [&_code]:font-mono [&_pre]:overflow-x-auto [&_pre]:border-2 [&_pre]:border-black [&_pre]:p-2 dark:[&_pre]:border-white">
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex, [rehypeHighlight, { detect: true, ignoreMissing: true }]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
