import { BrowserRouter, Routes, Route, useLocation, useParams } from "react-router-dom";
import Entry from "./Entry";
import Room from "./Room";

function RoomWrapper() {
  const { roomId } = useParams();
  const location = useLocation();

  const name = (location.state as any)?.name;

  if (!roomId || !name) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-fade-bg text-fade-text">
        Invalid room access
      </div>
    );
  }

  return <Room name={name} room={roomId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Entry />} />
        <Route path="/room/:roomId" element={<RoomWrapper />} />
      </Routes>
    </BrowserRouter>
  );
}
