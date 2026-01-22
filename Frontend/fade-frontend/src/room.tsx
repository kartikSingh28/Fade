import { useEffect, useRef, useState } from "react";

type WsMessage =
  | { type: "MESSAGE"; id: string; from: string; text: string }
  | { type: "DELETE"; id: string }
  | { type: "ERROR"; message: string };

export default function Room({ name, room }: { name: string; room: string }) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<WsMessage[]>([]);

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
      const msg = JSON.parse(e.data);

      if (msg.type ==="MESSAGE") {
        setMessages((prev) => [...prev, msg]);
      }

      if (msg.type ==="DELETE") {
        setMessages((prev) =>
          prev.filter((m: any) => m.id !== msg.id)
        );
      }
    };

    return () => ws.current?.close();
  }, []);

  return (
    <div className="min-h-screen bg-fade-bg text-fade-text p-4">
      <h2 className="text-lg font-semibold">Room: {room}</h2>

      <div className="mt-4 space-y-2">
        {messages.map((m: any) => (
          <div key={m.id}>
            <b>{m.from}</b>: {m.text}
          </div>
        ))}
      </div>
    </div>
  );
}
