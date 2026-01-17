import { useEffect, useRef, useState } from "react";

type Msg =
  | { type: "MESSAGE"; id: string; from: string; text: string }
  | { type: "DELETE"; id: string }
  | string;

export default function App() {
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!joined) return;

    ws.current = new WebSocket("ws://localhost:5050");

    ws.current.onopen = () => {
      ws.current?.send(JSON.stringify({ type: "JOIN", name }));
    };

    ws.current.onmessage = (e) => {
      const data = e.data;
      try {
        const msg = JSON.parse(data);

        if (msg.type === "MESSAGE") {
          setMessages((prev) => [...prev, msg]);
        }

        if (msg.type === "DELETE") {
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        }
      } catch {
        setMessages((prev) => [...prev, { text: data, system: true }]);
      }
    };

    return () => ws.current?.close();
  }, [joined]);

  if (!joined) {
    return (
      <div style={{ padding: 20 }}>
        <h2>Fade</h2>
        <input
          placeholder="Enter nickname"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button onClick={() => setJoined(true)}>Join</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h3>Fade Room</h3>
      <div style={{ minHeight: 200 }}>
        {messages.map((m, i) =>
          m.system ? (
            <div key={i}><i>{m.text}</i></div>
          ) : (
            <div key={m.id}>
              <b>{m.from}:</b> {m.text}
            </div>
          )
        )}
      </div>

      <ChatInput ws={ws} />
    </div>
  );
}

function ChatInput({ ws }: { ws: any }) {
  const [text, setText] = useState("");

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type..."
      />
      <button
        onClick={() => {
          ws.current?.send(
            JSON.stringify({ type: "MESSAGE", text })
          );
          setText("");
        }}
      >
        Send
      </button>
    </div>
  );
}
