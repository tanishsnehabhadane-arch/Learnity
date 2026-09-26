/**
 * Socket.IO tutor namespace — bidirectional streamed chat.
 * Each turn receives the student's live learner context (path position,
 * recent attempts, detected gaps) as system context — not just chat history.
 */
import { type Server as HttpServer } from "node:http";
import { Server as IOServer, type Socket } from "socket.io";
import { verifyAccessToken } from "../../lib/auth.ts";
import { logger } from "../../lib/logger.ts";
import { streamTutorReply } from "./tutor.ts";

interface AuthResult {
  studentId: string;
}

function authenticate(socket: Socket): AuthResult | null {
  const token = socket.handshake.auth?.["token"] as string | undefined;
  if (!token) return null;
  const claims = verifyAccessToken(token);
  return claims ? { studentId: claims.sub } : null;
}

export function attachTutorNamespace(httpServer: HttpServer) {
  const io = new IOServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  const tutor = io.of("/ws/tutor");

  tutor.use((socket, next) => {
    const auth = authenticate(socket);
    if (!auth) return next(new Error("unauthorized"));
    socket.data.studentId = auth.studentId;
    next();
  });

  tutor.on("connection", (socket) => {
    const studentId = socket.data.studentId as string;

    socket.on("tutor:ask", async (payload: { message: string }) => {
      try {
        const message = typeof payload?.message === "string" ? payload.message : "";
        if (message.trim().length === 0) {
          socket.emit("tutor:error", { message: "empty message" });
          return;
        }
        socket.emit("tutor:start", {});
        for await (const token of streamTutorReply({ studentId, message })) {
          socket.emit("tutor:token", { text: token });
        }
        socket.emit("tutor:done", {});
      } catch (err) {
        logger.error({ err, studentId }, "tutor stream failed");
        socket.emit("tutor:error", { message: "tutor unavailable" });
      }
    });

    socket.on("disconnect", () => {
      logger.debug({ studentId }, "tutor disconnected");
    });
  });

  return io;
}
