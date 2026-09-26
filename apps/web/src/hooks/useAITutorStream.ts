/**
 * WebSocket streaming hook for AI tutor replies — reveals actual streamed
 * tokens (never simulated char-reveal, per spec).
 */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { env } from "@/env";
import { getAccessToken } from "@/lib/axios-client";

export type TutorStatus = "idle" | "connecting" | "streaming" | "error";

export interface TutorMessage {
  role: "student" | "tutor";
  text: string;
}

export function useAITutorStream() {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [status, setStatus] = useState<TutorStatus>("idle");
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const socket = io(env.NEXT_PUBLIC_WS_URL + "/ws/tutor", {
      auth: { token: getAccessToken() ?? "" },
      autoConnect: false,
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => setStatus((s) => (s === "streaming" ? s : "idle")));
    socket.on("disconnect", () => setStatus("idle"));
    socket.on("connect_error", () => setStatus("error"));

    socket.on("tutor:start", () => {
      setStatus("streaming");
      setMessages((prev) => [...prev, { role: "tutor", text: "" }]);
    });

    socket.on("tutor:token", (payload: { text: string }) => {
      setMessages((prev) => {
        const next = [...prev];
        const last = next[next.length - 1];
        if (last && last.role === "tutor") {
          next[next.length - 1] = { ...last, text: last.text + payload.text };
        }
        return next;
      });
    });

    socket.on("tutor:done", () => {
      setStatus("idle");
      setUnreadCount((c) => c + 0); // unread counting handled by overlay minimize
    });

    socket.on("tutor:error", (payload: { message?: string }) => {
      setStatus("error");
      setMessages((prev) => [
        ...prev,
        { role: "tutor", text: payload.message ?? "The tutor is unavailable right now." },
      ]);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const ask = useCallback((message: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    setMessages((prev) => [...prev, { role: "student", text: message }]);
    setStatus((s) => (s === "streaming" ? s : "connecting"));
    if (!socket.connected) socket.connect();
    socket.emit("tutor:ask", { message });
  }, []);

  const clear = useCallback(() => {
    setMessages([]);
    setUnreadCount(0);
    setStatus("idle");
  }, []);

  return { messages, status, unreadCount, ask, clear, markRead: () => setUnreadCount(0) };
}
