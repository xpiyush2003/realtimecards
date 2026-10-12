import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import {
  getToken,
  logOutEverywhere,
  setSocketId,
  SERVER_URL,
} from "../api/client.js";

// keeps a live connection open while a board page is on screen
// onChanged(message) runs when the board should be loaded again
export function useBoardSocket(boardId, onChanged) {
  const [viewers, setViewers] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SERVER_URL, { auth: { token: getToken() } });

    // runs on the first connection and after every reconnect
    socket.on("connect", () => {
      setSocketId(socket.id);
      setConnected(true);
      socket.emit("board:join", { board_id: boardId }, () => onChanged(""));
    });

    socket.on("disconnect", () => {
      setSocketId(null);
      setConnected(false);
    });

    socket.on("connect_error", (err) => {
      if (err.message === "unauthorized") logOutEverywhere();
    });

    socket.on("board:changed", (payload) => onChanged(payload.message));
    socket.on("board:viewers", (payload) => setViewers(payload.viewers));

    return () => {
      setSocketId(null);
      socket.disconnect();
    };
  }, [boardId, onChanged]);

  return { viewers, connected };
}
