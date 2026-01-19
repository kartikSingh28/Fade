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

// Enable expiry events
redis.config("SET", "notify-keyspace-events", "Ex");
redisSub.psubscribe("__keyevent@*__:expired");

// When Redis expires a message, notify clients
redisSub.on("pmessage", (_p, _c, key) => {
  if (key.startsWith("message:")) {
    const id = key.replace("message:", "");
    broadcastJSON({ type: "DELETE", id });
  }
});

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Only users kept in memory
const users = new Map<WebSocket, string>();

// WebSocket logic
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
      users.set(socket, msg.name);
      broadcast(`${msg.name} joined the room`);
      return;
    }

    if (msg.type === "MESSAGE") {
      if (!users.has(socket)) return;

      const name = users.get(socket) || "Anonymous";
      const id = randomUUID();
      const expiresIn = 60;

      const payload = {
        type: "MESSAGE",
        id,
        from: name,
        text: msg.text,
        expiresIn,
      };

      // Save only in Redis
      await redis.set(
        `message:${id}`,
        JSON.stringify({
          id,
          from: name,
          text: msg.text,
          createdAt: Date.now(),
        }),
        "EX",
        expiresIn
      );

      broadcastJSON(payload);
    }
  });

  socket.on("close", async () => {
    const name = users.get(socket);
    if (name) broadcast(`${name} left the room`);
    users.delete(socket);

  
    if (users.size === 0) {
      const keys = await redis.keys("message:*");
      for (const key of keys) {
        await redis.del(key);
      }
    }
  });
});


function broadcast(text: string) {
  for (const client of users.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(text);
    }
  }
}

function broadcastJSON(obj: any) {
  const data = JSON.stringify(obj);
  for (const client of users.keys()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}

// Start server
server.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
