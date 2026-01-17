import express from "express";
import http from "http";
import { WebSocket, WebSocketServer } from "ws";

const app = express();
const server = http.createServer(app);

// Correct: use WebSocketServer
const wss = new WebSocketServer({ server });

// Store nickname per socket
const users = new Map<WebSocket, string>();

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
      broadcast(`${name}: ${msg.text}`);
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

server.listen(8000, () => {
  console.log("Server running on http://localhost:8000");
});
