import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Chat from "./Chat";

type WsMessage =
  | { type: "MESSAGE"; id: string; from: string; text: string }
  | { type: "DELETE"; id: string }
  | { type: "SYSTEM"; text: string }
  | { type: "ROOM_META"; roomName: string }
  | { type: "ERROR"; message: string };

export default function Room({ name, room }: { name: string; room: string }) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [roomTitle, setRoomTitle] = useState<string | null>(
    location.state?.roomName ?? null
  );

  function sendMessage(text: string) {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;
    ws.current.send(JSON.stringify({ type: "MESSAGE", text }));
  }

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000");

    ws.current.onopen = () => {
      setConnected(true);
      ws.current?.send(
        JSON.stringify({
          type: "JOIN",
          name,
          room,
        })
      );
    };

    ws.current.onclose = () => setConnected(false);
    ws.current.onerror = () => setConnected(false);

    ws.current.onmessage = (e) => {
      try {
        const msg: WsMessage = JSON.parse(e.data);

        if (msg.type === "ROOM_META") {
          setRoomTitle(msg.roomName);
          return;
        }

        if (msg.type === "MESSAGE") {
          setMessages((prev) => [...prev, msg]);
          return;
        }

        if (msg.type === "DELETE") {
          setMessages((prev) => prev.filter((m: any) => m.id !== msg.id));
          return;
        }

        if (msg.type === "SYSTEM") {
          setMessages((prev) => [...prev, msg]);
          return;
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { type: "SYSTEM", text: e.data },
        ]);
      }
    };

    return () => {
      ws.current?.close();
      setConnected(false);
    };
  }, [name, room]);

  return (
    <div className="h-screen w-screen bg-fade-bg flex flex-col">

      {/* HEADER (full width, centered content) */}
      <div className="border-b border-fade-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-fade-text">
              {roomTitle ?? "Fade Room"}
            </h1>
            <p className="text-xs text-fade-muted mt-1">
              Code · <span className="font-mono text-fade-accent">{room}</span>
            </p>
          </div>

          <button
            onClick={() => {
              ws.current?.close();
              navigate("/");
            }}
            className="text-sm text-fade-muted hover:text-red-400 transition"
          >
            Leave
          </button>
        </div>
      </div>

      {/* CHAT (centered column) */}
      <div className="flex-1 overflow-hidden">
        <Chat
          messages={messages}
          onSend={sendMessage}
          myName={name}
          connected={connected}
        />
      </div>
    </div>
  );
}
