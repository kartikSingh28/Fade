import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import Message from "./Message";

type ChatProps = {
  messages: any[];
  onSend: (text: string) => void;
  myName: string;
  connected: boolean;
};

export default function Chat({ messages, onSend, myName, connected }: ChatProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function handleSend() {
    if (!connected) return;   
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {!connected && (
        <div className="text-xs text-center text-red-400 mb-2">
          Disconnected. Reconnecting…
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.map((m, i) => {
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
              <Message
              key={m.id}
              text={m.text}
            from={m.from}
              isMine={m.from === myName}
              createdAt={m.createdAt}
        />
          );
          }

          return null;
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      <div className="mt-4 border-t border-fade-border pt-3 flex gap-2">
        <input
          value={text}
          disabled={!connected}                             
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && connected && handleSend()     
          }
          placeholder={
            connected ? "Type a message…" : "Disconnected…"
          }
          className="
            flex-1 bg-transparent border border-fade-border rounded-md
            px-3 py-2 text-sm text-fade-text placeholder-fade-hint
            focus:outline-none focus:border-fade-accent
            disabled:opacity-40
          "
        />
        <button
          onClick={handleSend}
          disabled={!connected || !text.trim()}            
          className="
         p-2 rounded-md border
        border-fade-border text-fade-accent
        hover:bg-fade-border transition
        disabled:opacity-40 disabled:cursor-not-allowed
          "
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
