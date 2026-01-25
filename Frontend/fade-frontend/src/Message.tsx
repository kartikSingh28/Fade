import { useEffect, useState } from "react";

type MessageProps = {
  text: string;
  from: string;
  isMine: boolean;
  createdAt: number;
};

const TTL = 60_000;
const FADE_TIME = 10_000;

export default function Message({
  text,
  from,
  isMine,
  createdAt,
}: MessageProps) {
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      const age = Date.now() - createdAt;

      // agr age km ho ttl-fade time se
      if (age < TTL - FADE_TIME) {
        setOpacity(1);
      } else {
        const remaining = TTL - age;
        setOpacity(Math.max(remaining / FADE_TIME, 0)); // fade out logic
      }
    }, 500);

    return () => clearInterval(interval);
  }, [createdAt]);

  return (
    <div
      className={`
        flex ${isMine ? "justify-end" : "justify-start"}
        px-2
      `}
      style={{ opacity }}
    >
      <div
        className={`
          max-w-[78%]
          px-4 py-2.5
          rounded-2xl
          text-sm leading-relaxed
          transition-opacity duration-500
          ${
            isMine
              ? "bg-white text-black rounded-br-md"
              : "bg-fade-surface text-fade-text border border-fade-border rounded-bl-md"
          }
        `}
      >
        {!isMine && (
          <div className="text-[11px] text-fade-muted mb-0.5">
            {from}
          </div>
        )}
        <div>{text}</div>
      </div>
    </div>
  );
}
