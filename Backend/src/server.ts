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

// Message storage
type Message = {
  id: string;
  socket: WebSocket;
};

const messages = new Map<string, Message>();

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
      if (!users.has(socket)) return;

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

      // save ownership
      messages.set(id, { id, socket });

      broadcastJSON(payload);

      const timer = setTimeout(() => {
        deleteMessage(id);
      }, expiresIn * 1000);

      messageTimers.set(id, timer);
    }
  });

  socket.on("close", () => {
    const name = users.get(socket);
    if (name) broadcast(`${name} left the room`);
    users.delete(socket);

    // delete all messages from this socket
    for (const [id, msg] of messages) {
      if (msg.socket === socket) {
        deleteMessage(id);
      }
    }

    // if room empty, delete everything
    if (users.size === 0) {
      for (const id of messages.keys()) {
        deleteMessage(id);
      }
    }
  });
});

// central delete
function deleteMessage(id: string) {
  if (!messages.has(id)) return;

  messages.delete(id);

  const timer = messageTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    messageTimers.delete(id);
  }

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

server.listen(5050, () => {
  console.log("Server running on http://localhost:5050");
});
