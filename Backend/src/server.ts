import "dotenv/config";
import Redis from "ioredis";
import { z } from "zod";
import { randomUUID } from "crypto";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing.");
}

const redis = new Redis(process.env.REDIS_URL);
const redisSub = new Redis(process.env.REDIS_URL);

redis.ping().then(() => console.log("Redis connected"));

redis.config("SET", "notify-keyspace-events", "Ex");
redisSub.psubscribe("__keyevent@*__:expired");

redisSub.on("pmessage", (_p, _c, key) => {
  if (!key.startsWith("room:")) return;

  const parts = key.split(":");
  if (parts.length < 4) return;

  const room = parts[1];
  const id = parts[3];

  broadcastJSONToRoom(room, { type: "DELETE", id });
});

const server = http.createServer();
const wss = new WebSocketServer({ server });
const JoinSchema = z.object({
  type: z.literal("JOIN"),
  name: z.string().min(1).max(20),
  room: z.string().min(1).max(50),
});

const MessageSchema = z.object({
  type: z.literal("MESSAGE"),
  text: z.string().min(1).max(500),
});

const CreateRoomSchema = z.object({
  type: z.literal("CREATE_ROOM"),
  name: z.string().min(1).max(20),
  roomName: z.string().min(1).max(50),
});

const ClientSchema = z.union([
  JoinSchema,
  MessageSchema,
  CreateRoomSchema,
]);

//STATE 
const users = new Map<WebSocket, string>();
const userRooms = new Map<WebSocket, string>();

//Ws
wss.on("connection", (socket) => {
  socket.on("message", async (data) => {
    let raw;
    try {
      raw = JSON.parse(data.toString());
    } catch {
      sendError(socket, "Invalid JSON");
      return;
    }

    const parsed = ClientSchema.safeParse(raw);
    if (!parsed.success) {
      sendError(socket, "Invalid format");
      return;
    }
    const msg = parsed.data;
    if (msg.type === "CREATE_ROOM") {
      const room = generateRoomCode();

      await redis.set(
        `room:${room}:meta`,
        JSON.stringify({
          owner: msg.name,
          roomName: msg.roomName,
          createdAt: Date.now(),
        }),
        "EX",
        600
      );

      users.set(socket, msg.name);
      userRooms.set(socket, room);

      socket.send(JSON.stringify({
        type: "ROOM_CREATED",
        room,
        roomName: msg.roomName,
      }));
      return;
    }
    if (msg.type === "JOIN") {
      const metaRaw = await redis.get(`room:${msg.room}:meta`);
      if (!metaRaw) {
        sendError(socket, "Room not found");
        return;
      }

      const meta = JSON.parse(metaRaw);
      users.set(socket, msg.name);
      userRooms.set(socket, msg.room);
      await redis.expire(`room:${msg.room}:meta`, 600);
      socket.send(JSON.stringify({
        type: "ROOM_META",
        roomName: meta.roomName,
      }));
      for (const [sock, r] of userRooms) {
        if (
          r === msg.room &&
          sock !== socket &&
          sock.readyState === WebSocket.OPEN
        ) {
          sock.send(JSON.stringify({
            type: "SYSTEM",
            text: `${msg.name} joined`,
          }));
        }
      }
      return;
    }
    if (msg.type === "MESSAGE") {
      const name = users.get(socket);
      const room = userRooms.get(socket);
      if (!name || !room) return;

      const id = randomUUID();
      const createdAt = Date.now();


      await redis.set(
        `room:${room}:message:${id}`,
        JSON.stringify({
          id,
          from: name,
          text: msg.text,
          createdAt,
        }),
        "EX",
        60
      );
      broadcastJSONToRoom(room, {
        type: "MESSAGE",
        id,
        from: name,
        text: msg.text,
        createdAt,
      });
    }
  });
  socket.on("close", async () => {
    const name = users.get(socket);
    const room = userRooms.get(socket);

    users.delete(socket);
    userRooms.delete(socket);

    if (!name || !room) return;
    // notify remaining users only
    for (const [sock, r] of userRooms) {
      if (r === room && sock.readyState === WebSocket.OPEN) {
        sock.send(JSON.stringify({
          type: "SYSTEM",
          text: `${name} left`,
        }));
      }
    }
    // cleanup redis if empty
    if (![...userRooms.values()].includes(room)) {
      const keys = await redis.keys(`room:${room}:message:*`);
      for (const k of keys) await redis.del(k);
    }
  });
});
function broadcastJSONToRoom(roomId: string, obj: any) {
  const data = JSON.stringify(obj);
  for (const [sock, r] of userRooms) {
    if (r === roomId && sock.readyState === WebSocket.OPEN) {
      sock.send(data);
    }
  }
}
function sendError(socket: WebSocket, message: string) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "ERROR", message }));
  }
}
function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}
server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
