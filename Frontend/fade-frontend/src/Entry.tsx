import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Entry() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  function connectWS() {
    if (wsRef.current) return wsRef.current;

    const ws = new WebSocket("ws://localhost:8000");
    wsRef.current = ws;

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);

      if (msg.type === "ROOM_CREATED") {
        navigate(`/room/${msg.room}`, {
          state: { name, roomName: msg.roomName },
        });
      }

      if (msg.type === "ERROR") {
        alert(msg.message);
      }
    };

    return ws;
  }

  function handleCreateRoom() {
    if (!name.trim()) {
      alert("Enter your name");
      return;
    }

    if (!roomName.trim()) {
      alert("Enter room name");
      return;
    }

    const ws = connectWS();

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "CREATE_ROOM",
          name,
          roomName,
        })
      );
    };
  }

  function handleJoinRoom() {
    if (!name.trim() || !roomCode.trim()) {
      alert("Enter name and room code");
      return;
    }

    const ws = connectWS();

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "JOIN",
          name,
          room: roomCode.toUpperCase(),
        })
      );

      navigate(`/room/${roomCode.toUpperCase()}`, {
        state: { name },
      });
    };
  }

  return (
    <div className="min-h-screen bg-fade-bg flex items-center justify-center">
      <div className="w-full max-w-sm bg-fade-surface border border-fade-border rounded-xl p-8 shadow-soft">

        {/* Title */}
        <h1 className="text-2xl font-semibold text-fade-text text-center">
          Fade
        </h1>
        <p className="text-sm text-fade-muted text-center mt-1">
          ephemeral rooms
        </p>

        {/* Name */}
        <div className="mt-8">
          <input
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-transparent border border-fade-border rounded-md px-3 py-2 text-fade-text placeholder-fade-hint focus:outline-none focus:border-fade-accent"
          />
        </div>

        {/* Room name (create only) */}
        <div className="mt-3">
          <input
            placeholder="Room name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="w-full bg-transparent border border-fade-border rounded-md px-3 py-2 text-fade-text placeholder-fade-hint focus:outline-none focus:border-fade-accent"
          />
        </div>

        {/* Create room */}
        <button
          onClick={handleCreateRoom}
          className="mt-4 w-full border border-fade-border rounded-md py-2 text-fade-text hover:bg-fade-border transition"
        >
          Create Room
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-fade-border" />
          <span className="text-xs text-fade-hint">or</span>
          <div className="flex-1 h-px bg-fade-border" />
        </div>

        {/* Join room */}
        <input
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="w-full bg-transparent border border-fade-border rounded-md px-3 py-2 text-fade-text placeholder-fade-hint focus:outline-none focus:border-fade-accent"
        />

        <button
          onClick={handleJoinRoom}
          className="mt-3 w-full border border-fade-border rounded-md py-2 text-fade-text hover:bg-fade-border transition"
        >
          Join Room
        </button>

        {/* Footer hint */}
        <p className="text-xs text-fade-hint text-center mt-6">
          rooms disappear when empty
        </p>
      </div>
    </div>
  );
}
