import "dotenv/config";
import Redis from "ioredis";
import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing.");
}

// Redis connections
const redis = new Redis(process.env.REDIS_URL);
const redisSub = new Redis(process.env.REDIS_URL);

redis.ping().then(() => console.log("Redis connected"));

// expiry events
redis.config("SET", "notify-keyspace-events", "Ex");
redisSub.psubscribe("__keyevent@*__:expired");

// When Redis expires a message, notify only that room
redisSub.on("pmessage", (_p, _c, key) => {
  if (key.startsWith("room:")) {
    const parts = key.split(":"); // room:ROOMID:message:ID
    const room = parts[1];
    const id = parts[3];
    broadcastJSONToRoom(room, { type: "DELETE", id });
  }
});


const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Inmemory user + room
const users = new Map<WebSocket, string>();
const userRooms = new Map<WebSocket, string>();

// WebSocket 
wss.on("connection", (socket: WebSocket) => {
  console.log("New connection");

  socket.on("message", async (data: Buffer) => {
    let msg;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (msg.type === "JOIN") {
      const room = msg.room;
      const name = msg.name;

      users.set(socket, name);
      userRooms.set(socket, room);

      broadcastToRoom(room, `${name} joined room ${room}`);
      return;
    }

    if (msg.type === "MESSAGE") {
      if (!users.has(socket)) return;

      const name = users.get(socket)!;
      const room = userRooms.get(socket);
      if (!room) return;

      const id = randomUUID();
      const expiresIn = 60;

      const payload = {
        type: "MESSAGE",
        id,
        from: name,
        text: msg.text,
        expiresIn,
        room
      };

      // Save in Redis per room
      await redis.set(
        `room:${room}:message:${id}`,
        JSON.stringify({
          id,
          from: name,
          text: msg.text,
          createdAt: Date.now()
        }),
        "EX",
        expiresIn
      );

      broadcastJSONToRoom(room, payload);
    }
  });

  socket.on("close", async () => {
    const name = users.get(socket);
    const room = userRooms.get(socket);

    if (name && room) {
      broadcastToRoom(room, `${name} left room ${room}`);
    }

    users.delete(socket);
    userRooms.delete(socket);

    if (room) {
      let stillInRoom = false;
      for (const r of userRooms.values()) {
        if (r === room) {
          stillInRoom = true;
          break;
        }
      }

      // If room empty delete all its messages
      if (!stillInRoom) {
        const keys = await redis.keys(`room:${room}:message:*`);
        for (const key of keys) {
          await redis.del(key);
        }
        console.log(`Room ${room} empty, cleaned Redis`);
      }
    }
  });
});

// Helpers
function broadcastToRoom(roomId: string, text: string) {
  for (const [sock, r] of userRooms) {
    if (r === roomId && sock.readyState === WebSocket.OPEN) {
      sock.send(text);
    }
  }
}

function broadcastJSONToRoom(roomId: string, obj: any) {
  const data = JSON.stringify(obj);
  for (const [sock, r] of userRooms) {
    if (r === roomId && sock.readyState === WebSocket.OPEN) {
      sock.send(data);
    }
  }
}

server.listen(8000, () => {
  console.log("Server running on http://localhost:5050");
});
