<p align="center">
  <img src="Frontend/fade-frontend/src/assets/logo2.png" width="180" alt="Fade Logo" />
</p>

<h1 align="center">Fade</h1>

<p align="center">
  Real-time anonymous chat where messages disappear by time and presence.
</p>



## What Fade Is

Fade is a real-time anonymous group chat application where messages disappear based on time and presence. Messages can fade automatically after a short duration, when the sender leaves, or when the room becomes empty. Fade focuses on privacy, simplicity, and real-time interaction.

---

## What Fade Does

- Real-time group chat  
- Anonymous joining using nicknames  
- Time-based disappearing messages  
- Presence-based disappearing messages  
- Smooth UI with fade animations  
- Shared state using Redis  

Messages in Fade are not permanent — they are meant to appear, live briefly, and vanish.

---

## Core Behavior

- Users join a room with a nickname  
- Messages are delivered instantly to all connected users  
- Each message has a limited life  
- A message disappears when:
  - Its time expires  
  - The sender disconnects  
  - The room becomes empty  
- All connected clients update in real time  

Fade is designed around the idea that **presence controls logic**.

---

## Tech Stack

### Backend
- Node.js  
- Express  
- WebSocket (ws)  
- TypeScript  
- Redis (shared state and TTL)  

### Frontend
- React (Vite + TypeScript)  
- Native WebSocket API  
- CSS animations for fade effects  

---

## Architecture Summary

- Clients connect via WebSocket  
- Server manages presence and message lifecycle  
- Messages are stored in Redis with TTL  
- Redis automatically expires messages  
- Server broadcasts delete events when messages expire or presence changes  
- Clients remove messages with fade animations  

---

## Running Locally

### Backend

```bash
cd Backend
npm install
npm run dev
Frontend
bash
Copy code
cd Frontend/fade-frontend
npm install
npm run dev
