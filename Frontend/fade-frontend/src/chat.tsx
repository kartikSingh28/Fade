import { useState } from "react";

type ChatProps = {
  messages: any[];
  onSend: (text: string) => void;
};
export default function Chat({ messages, onSend }: ChatProps) {
  const [text, setText] = useState("");

  function handleSend() {
    if (!text.trim()) return;
    onSend(text.trim());
    setText("");
  }
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

      {/* Input */}
      <div className="mt-4 border-t border-fade-border pt-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message…"
          className="w-full bg-transparent border border-fade-border rounded-md px-3 py-2 text-sm text-fade-text placeholder-fade-hint focus:outline-none focus:border-fade-accent"
        />
      </div>
    </div>
  );
}
