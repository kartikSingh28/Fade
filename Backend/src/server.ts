import { randomUUID } from "crypto";
import express from "express";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Store nickname per socket
const users = new Map<WebSocket, string>();

// Store timers for messages
const messageTimers = new Map<string, NodeJS.Timeout>();

wss.on("connection", (socket: WebSocket) => {
  console.log("New connection");

  socket.on("message", (data: Buffer) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === "JOIN") {
      users.set(socket, msg.name);
      broadcast(`${msg.name} joined the room`);
      return;
    }

    if (msg.type === "MESSAGE") {
      const name = users.get(socket) || "Anonymous";
      const id = randomUUID();
      const expiresIn = 60;

      const payload = {
        type: "MESSAGE",
        id,
        from: name,
        text: msg.text,
        expiresIn
      };

      broadcastJSON(payload);

      const timer = setTimeout(() => {
        broadcastJSON({ type: "DELETE", id });
        messageTimers.delete(id);
      }, expiresIn * 1000);

      messageTimers.set(id, timer);
    }
  });

  socket.on("close", () => {
    const name = users.get(socket);
    if (name) broadcast(`${name} left the room`);
    users.delete(socket);
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

server.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
