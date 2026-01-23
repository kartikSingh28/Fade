import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

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
  // 👇 room name source of truth
  const [roomTitle, setRoomTitle] = useState<string | null>(
    location.state?.roomName ?? null
  );
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

        // ✅ room meta (sent once on join)
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
        // fallback for raw text system messages
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
      <div className="w-full max-w-2xl bg-fade-surface border border-fade-border rounded-xl p-6 shadow-soft mt-6">

        {/* Header */}
        <div className="border-b border-fade-border pb-4 mb-6">
          <h2 className="text-lg font-semibold text-fade-text tracking-wide">
            {roomTitle ?? "Fade Room"}
          </h2>

          <p className="text-xs text-fade-muted mt-1">
            Code:{" "}
            <span className="font-mono text-fade-accent">{room}</span>
          </p>
        </div>

        {/* Messages */}
        <div className="space-y-2">
          {messages.map((m: any, i: number) => {
            if (m.type === "SYSTEM") {
              return (
                <div
                  key={`system-${i}`}
                  className="flex justify-center my-3"
                >
                  <div className="px-3 py-1 rounded-full text-xs text-fade-muted bg-fade-surface border border-fade-border">
                    {m.text}
                  </div>
                </div>
              );
            }

            if (m.type === "MESSAGE") {
              return (
                <div key={m.id} className="text-sm leading-relaxed">
                  <span className="text-fade-accent font-medium">
                    {m.from}
                  </span>
                  <span className="text-fade-text">
                    : {m.text}
                  </span>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>
    </div>
  );
}
