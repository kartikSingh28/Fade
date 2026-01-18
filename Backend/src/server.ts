import "dotenv/config";
import Redis from "ioredis";
import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL is missing.");
}

const redis = new Redis(process.env.REDIS_URL);
const redisSub = new Redis(process.env.REDIS_URL);

redis.ping().then(() => console.log("Redis connected"));

// Enable expiry events
redis.config("SET", "notify-keyspace-events", "Ex");
redisSub.psubscribe("__keyevent@*__:expired");

redisSub.on("pmessage", (_p, _c, key) => {
  if (key.startsWith("message:")) {
    const id = key.replace("message:", "");
    messages.delete(id);
    broadcastJSON({ type: "DELETE", id });
  }
});

// Server Setup 
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const users = new Map<WebSocket, string>();

type Message = {
  id: string;
  socket: WebSocket;
};

const messages = new Map<string, Message>();

//  WebSocket Logic 
wss.on("connection", (socket: WebSocket) => {
  console.log("New connection");

  socket.on("message", async (data: Buffer) => {
    const msg = JSON.parse(data.toString());

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

      // Save in Redis with TTL
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

      messages.set(id, { id, socket });
      broadcastJSON(payload);
    }
  });

  socket.on("close", () => {
    const name = users.get(socket);
    if (name) broadcast(`${name} left the room`);
    users.delete(socket);

    
    for (const [id, msg] of messages) {
      if (msg.socket === socket) {
        deleteMessage(id);
      }
    }

    // If room empty delete all
    if (users.size === 0) {
      for (const id of messages.keys()) {
        deleteMessage(id);
      }
    }
  });
});

function deleteMessage(id: string) {
  if (!messages.has(id)) return;
  messages.delete(id);
  redis.del(`message:${id}`);
  broadcastJSON({ type: "DELETE", id });
}

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

// Start Server
server.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
