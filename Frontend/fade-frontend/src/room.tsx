import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  const [roomTitle, setRoomTitle] = useState<string | null>(
    location.state?.roomName ?? null
  );
  function sendMessage(text: string) {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    ws.current.send(
      JSON.stringify({
        type: "MESSAGE",
        text,
      })
    );
  }

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8000");

    ws.current.onopen = () => {
      ws.current?.send(
        JSON.stringify({
          type: "JOIN",
          name,
          room,
        })
      );
    };

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
          setMessages((prev) =>
            prev.filter((m: any) => m.id !== msg.id)
          );
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
    };
  }, [name, room]);
  return (
    <div className="min-h-screen bg-fade-bg flex justify-center">
      <div className="w-full max-w-2xl bg-fade-surface border border-fade-border rounded-xl p-6 shadow-soft mt-6 flex flex-col h-[80vh]">

        {/* Header */}
        <div className="border-b border-fade-border pb-4 mb-4">
          <h2 className="text-lg font-semibold text-fade-text tracking-wide">
            {roomTitle ?? "Fade Room"}
          </h2>

          <p className="text-xs text-fade-muted mt-1">
            Code:{" "}
            <span className="font-mono text-fade-accent">{room}</span>
          </p>
        </div>

        {/* Chat UI */}
        <Chat messages={messages} onSend={sendMessage} />
      </div>
    </div>
  );
}
