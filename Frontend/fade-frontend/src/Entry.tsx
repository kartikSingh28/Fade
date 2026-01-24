import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import type { ISourceOptions } from "@tsparticles/engine";

import logo from "./assets/logo.png";

export default function Entry() {
  const [name, setName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [roomName, setRoomName] = useState("");
  const wsRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  // ✅ REQUIRED INIT (THIS WAS MISSING)
  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    });
  }, []);

  const particlesOptions: ISourceOptions = {
    background: { color: "transparent" },
    fpsLimit: 60,
    particles: {
      number: {
        value: 120,
        density: { enable: true, area: 900 },
      },
      color: { value: "#ffffff" },
      opacity: { value: 0.25 },
      size: { value: { min: 1, max: 2 } },
      move: {
        enable: true,
        speed: 0.4,
        outModes: { default: "out" },
      },
    },
    detectRetina: true,
  };

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
    };
    return ws;
  }

  function handleCreateRoom() {
    if (!name || !roomName) return;
    const ws = connectWS();
    ws.onopen = () =>
      ws.send(JSON.stringify({ type: "CREATE_ROOM", name, roomName }));
  }

  function handleJoinRoom() {
    if (!name || !roomCode) return;
    const ws = connectWS();
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: "JOIN", name, room: roomCode }));
      navigate(`/room/${roomCode}`, { state: { name } });
    };
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden flex items-center justify-center">
      {/* PARTICLES */}
      <Particles className="absolute inset-0 z-0" options={particlesOptions} />

      {/* LOGO GLOW */}
      <img
        src={logo}
        className="absolute inset-0 m-auto w-[520px] opacity-[0.08] pointer-events-none"
        style={{ filter: "drop-shadow(0 0 120px rgba(255,255,255,0.25))" }}
      />

      {/* CARD */}
      <div className="relative z-10 w-full max-w-sm bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
        <h1 className="text-3xl text-white text-center mb-2">Fade</h1>
        <p className="text-sm text-white/60 text-center mb-6">
          Say what matters. Let the rest fade.
        </p>

        <input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-3 bg-transparent border border-white/20 rounded-md px-3 py-2 text-white"
        />

        <input
          placeholder="Room name"
          value={roomName}
          onChange={(e) => setRoomName(e.target.value)}
          className="w-full mb-4 bg-transparent border border-white/20 rounded-md px-3 py-2 text-white"
        />

        <button
          onClick={handleCreateRoom}
          className="w-full mb-6 py-2 bg-white/10 hover:bg-white/20 rounded-md text-white"
        >
          Create room
        </button>

        <input
          placeholder="Room code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          className="w-full mb-3 bg-transparent border border-white/20 rounded-md px-3 py-2 text-white"
        />

        <button
          onClick={handleJoinRoom}
          className="w-full py-2 border border-white/20 rounded-md text-white"
        >
          Join room
        </button>
      </div>
    </div>
  );
}
