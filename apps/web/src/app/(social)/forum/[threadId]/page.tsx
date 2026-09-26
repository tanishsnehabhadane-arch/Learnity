"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

const POSTS = [
  { author: "Ada L.", body: "Think of the minus sign as multiplying everything by -1." },
  { author: "Grace H.", body: "The tooltip on the path tree finally made it click for me." },
];

export default function ThreadPage() {
  const params = useParams<{ threadId: string }>();
  const [replies, setReplies] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-4 pb-24 pt-24">
      <p className="font-tech text-xs uppercase tracking-widest opacity-70">Thread #{params.threadId}</p>
      <h1 className="font-display text-4xl font-black uppercase">Discussion</h1>

      <div className="mt-8 space-y-3">
        {POSTS.map((post, i) => (
          <Card key={i}>
            <CardBody className="p-4">
              <p className="font-tech text-xs font-bold uppercase">{post.author}</p>
              <p className="mt-1 text-sm">{post.body}</p>
            </CardBody>
          </Card>
        ))}
        {replies.map((reply, i) => (
          <Card key={`reply-${i}`}>
            <CardBody className="p-4">
              <p className="font-tech text-xs font-bold uppercase">You</p>
              <p className="mt-1 text-sm">{reply}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <form
        className="mt-6 flex gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) {
            setReplies((r) => [...r, draft.trim()]);
            setDraft("");
          }
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="h-11 flex-1 border-2 border-black bg-white px-3 text-sm dark:border-white dark:bg-neutral-900"
          aria-label="Reply"
          placeholder="Add a reply…"
        />
        <Button type="submit">Reply</Button>
      </form>
    </main>
  );
}
