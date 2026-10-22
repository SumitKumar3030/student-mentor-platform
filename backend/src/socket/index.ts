import type { Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { supabase } from "../lib/supabase.js";

interface JoinPayload {
  sessionId: string;
  userId: string;
  name: string;
  role: "mentor" | "student";
}

interface CodeChangePayload {
  sessionId: string;
  code: string;
}

interface CursorMovePayload {
  sessionId: string;
  userId: string;
  name: string;
  position: { lineNumber: number; column: number };
}

interface ChatMessagePayload {
  sessionId: string;
  userId: string;
  name: string;
  content: string;
}

interface LanguageChangePayload {
  sessionId: string;
  language: string;
  code: string;
}

export function setupSocket(server: HTTPServer) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Track active users per room:  sessionId -> Map<socketId, userInfo>
  const rooms = new Map<
    string,
    Map<string, { userId: string; name: string; role: string }>
  >();

  io.on("connection", (socket: Socket) => {
    console.log("🔌 socket connected:", socket.id);

    // ------------------------------------------------
    // JOIN ROOM
    // ------------------------------------------------

    socket.on("join_room", async (payload: JoinPayload) => {
      const { sessionId, userId, name, role } = payload;

      socket.join(sessionId);
          // Tell everyone else in the room that a new user joined
    socket.to(sessionId).emit('user_joined', { userId, name, role })

      if (!rooms.has(sessionId)) rooms.set(sessionId, new Map());
      rooms.get(sessionId)!.set(socket.id, { userId, name, role });

      // Send current participants to the new joiner
      const participants = Array.from(rooms.get(sessionId)!.entries()).map(
        ([socketId, info]) => ({ socketId, ...info }),
      );

      io.to(sessionId).emit("room_participants", participants);

      // Notify others
      socket.to(sessionId).emit("user_joined", { userId, name, role });

      console.log(`👤 ${name} (${role}) joined room ${sessionId}`);
    });

    // ------------------------------------------------
    // CODE CHANGE
    // ------------------------------------------------
    socket.on("code_change", (payload: CodeChangePayload) => {
      const { sessionId, code } = payload;
      socket.to(sessionId).emit("code_update", { code });
    });

    // ------------------------------------------------
    // CURSOR MOVE
    // ------------------------------------------------
    socket.on("cursor_move", (payload: CursorMovePayload) => {
      const { sessionId, userId, name, position } = payload;
      socket.to(sessionId).emit("cursor_update", { userId, name, position });
    });

    // ------------------------------------------------
    // LANGUAGE CHANGE
    // ------------------------------------------------
    socket.on("language_change", (payload: LanguageChangePayload) => {
      const { sessionId, language, code } = payload;
      socket.to(sessionId).emit("language_update", { language, code });
    });

    // ------------------------------------------------
    // CHAT MESSAGE
    // ------------------------------------------------
    socket.on("chat_message", async (payload: ChatMessagePayload) => {
      const { sessionId, userId, name, content } = payload;
      if (!content.trim()) return;

      // Persist to DB
      const { data, error } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          user_id: userId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error("chat insert error:", error);
        return;
      }

      // Broadcast to everyone in room (including sender for confirmation)
      io.to(sessionId).emit("chat_message", {
        id: data.id,
        sessionId: data.session_id,
        userId: data.user_id,
        name,
        content: data.content,
        createdAt: data.created_at,
      });
    });


    // ------------------------------------------------
// WEBRTC SIGNALING
// ------------------------------------------------
socket.on('webrtc_offer', (payload: { sessionId: string; sdp: unknown }) => {
  console.log(`📥 Backend got OFFER from ${socket.id} for room ${payload.sessionId}`);
  socket.to(payload.sessionId).emit('webrtc_offer', {
    sdp: payload.sdp,
    from: socket.id,
  })
})

socket.on('webrtc_answer', (payload: { sessionId: string; sdp: unknown }) => {
  console.log(`📥 Backend got ANSWER from ${socket.id} for room ${payload.sessionId}`);
  socket.to(payload.sessionId).emit('webrtc_answer', {
    sdp: payload.sdp,
    from: socket.id,
  })
})

socket.on('webrtc_ice', (payload: { sessionId: string; candidate: unknown }) => {
  // console.log(`📥 Backend got ICE from ${socket.id}`); // Too spammy, leave commented
  socket.to(payload.sessionId).emit('webrtc_ice', {
    candidate: payload.candidate,
    from: socket.id,
  })
})

        // ------------------------------------------------
    // SESSION ENDED (mentor triggers)
    // ------------------------------------------------
    socket.on('session_ended', ({ sessionId }: { sessionId: string }) => {
      io.to(sessionId).emit('session_ended')
    })

    // ------------------------------------------------
    // DISCONNECT
    // ------------------------------------------------
    socket.on("disconnect", () => {
      console.log("🔌 socket disconnected:", socket.id);

      // Find which room this socket was in
      for (const [sessionId, members] of rooms.entries()) {
        if (members.has(socket.id)) {
          const info = members.get(socket.id)!;
          members.delete(socket.id);

          io.to(sessionId).emit("user_left", {
            userId: info.userId,
            name: info.name,
          });

          // Update participants list
          const participants = Array.from(members.entries()).map(
            ([socketId, info]) => ({ socketId, ...info }),
          );
          io.to(sessionId).emit("room_participants", participants);

          if (members.size === 0) {
            // Room empty → mark session as ended if still active
            supabase
              .from("sessions")
              .update({ status: "ended", ended_at: new Date().toISOString() })
              .eq("id", sessionId)
              .eq("status", "active")
              .then(({ error }) => {
                if (error) console.error("auto-end session error:", error);
              });

            rooms.delete(sessionId);
          }

          if (members.size === 0) rooms.delete(sessionId);
          break;
        }
      }
    });
  });

  return io;
}
