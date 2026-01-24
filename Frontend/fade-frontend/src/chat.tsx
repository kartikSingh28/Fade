import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

type ChatProps = {
  messages: any[];
  onSend: (text: string) => void;
  myName: string;
};

export default function Chat({ messages, onSend, myName }: ChatProps) {
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  function handleSend() {
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
            const isMine = m.from === myName;
            return (
              <div
                key={m.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`
                    max-w-[70%] px-3 py-2 rounded-lg text-sm
                    ${isMine
                      ? "bg-fade-border text-fade-text"
                      : "bg-transparent text-fade-text"}
                  `}
                >
                  {!isMine && (
                    <div className="text-xs text-fade-muted mb-1">
                      {m.from}
                    </div>
                  )}
                  <div>{m.text}</div>
                </div>
              </div>
            );
          }
          return null;
        })}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </div>

      {/* Input + Send */}
      <div className="mt-4 border-t border-fade-border pt-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="flex-1 bg-transparent border border-fade-border rounded-md px-3 py-2 text-sm text-fade-text placeholder-fade-hint focus:outline-none focus:border-fade-accent"
        />

        <button
          onClick={handleSend}
          disabled={!text.trim()}
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
