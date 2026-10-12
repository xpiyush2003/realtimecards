import { Server } from "socket.io";
import { findBoardForUser } from "./services/access.js";
import { userFromToken } from "./services/auth.js";

let io;

function boardRoom(boardId) {
  return `board:${boardId}`;
}

function userRoom(userId) {
  return `user:${userId}`;
}

// tells everyone on a board who is looking at it right now
async function sendViewers(boardId, leavingSocketId) {
  const sockets = await io.in(boardRoom(boardId)).fetchSockets();
  const viewers = new Map();
  for (const socket of sockets) {
    if (socket.id === leavingSocketId) continue;
    const { id, name } = socket.data.user;
    viewers.set(id, { id, name });
  }
  io.to(boardRoom(boardId)).emit("board:viewers", {
    board_id: boardId,
    viewers: [...viewers.values()],
  });
}

export function attachSockets(server) {
  io = new Server(server, { cors: { origin: process.env.CLIENT_URL } });

  // a socket has to send the same login token as the REST API
  io.use(async (socket, next) => {
    try {
      socket.data.user = await userFromToken(socket.handshake.auth.token);
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user;
    socket.join(userRoom(user.id));

    socket.on("board:join", async (payload, reply) => {
      if (typeof reply !== "function") return;
      try {
        const boardId = Number(payload?.board_id);
        const board =
          Number.isInteger(boardId) && boardId > 0
            ? await findBoardForUser(boardId, user.id)
            : null;
        if (!board) {
          return reply({ ok: false, error: "Board not found" });
        }
        socket.join(boardRoom(board.id));
        reply({ ok: true });
        await sendViewers(board.id);
      } catch (err) {
        console.error(err);
        reply({ ok: false, error: "Something went wrong, please try again" });
      }
    });

    // runs just before the socket leaves its rooms
    socket.on("disconnecting", () => {
      for (const room of socket.rooms) {
        if (room.startsWith("board:")) {
          sendViewers(Number(room.slice(6)), socket.id).catch(console.error);
        }
      }
    });
  });
}

// tells the other browsers on a board that something was saved
export function notifyBoard(boardId, message, exceptSocketId) {
  const payload = { board_id: boardId, message };
  const sender = exceptSocketId && io.sockets.sockets.get(exceptSocketId);
  if (sender) {
    sender.to(boardRoom(boardId)).emit("board:changed", payload);
  } else {
    io.to(boardRoom(boardId)).emit("board:changed", payload);
  }
}

// someone was removed from a team, so they stop watching its boards
export async function removeFromBoards(userId, boardIds, message) {
  const sockets = await io.in(userRoom(userId)).fetchSockets();
  for (const boardId of boardIds) {
    const room = boardRoom(boardId);
    for (const socket of sockets) {
      if (socket.rooms.has(room)) {
        socket.emit("board:changed", { board_id: boardId, message });
        socket.leave(room);
      }
    }
    await sendViewers(boardId);
    notifyBoard(boardId, message);
  }
}
