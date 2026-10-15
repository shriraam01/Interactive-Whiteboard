const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const rooms = {};

function getRoom(name) {
  if (!rooms[name]) rooms[name] = { history: [], redo: {} };
  return rooms[name];
}

function sendUserCount(name) {
  const size = io.sockets.adapter.rooms.get(name)?.size || 0;
  io.to(name).emit("users", size);
}

io.on("connection", (socket) => {
  let roomName = null;

  socket.on("join", (name) => {
    roomName = name;
    socket.join(name);
    socket.emit("init", getRoom(name).history);
    sendUserCount(name);
  });

  socket.on("draw", (data) => {
    if (!roomName) return;
    const room = getRoom(roomName);
    data.owner = socket.id;
    room.history.push(data);
    room.redo[socket.id] = [];
    socket.to(roomName).emit("draw", data);
  });

  socket.on("undo", () => {
    if (!roomName) return;
    const room = getRoom(roomName);
    let strokeId = null;
    for (let i = room.history.length - 1; i >= 0; i--) {
      if (room.history[i].owner === socket.id) {
        strokeId = room.history[i].strokeId;
        break;
      }
    }
    if (strokeId === null) return;
    const isMine = (s) => s.owner === socket.id && s.strokeId === strokeId;
    const removed = room.history.filter(isMine);
    room.history = room.history.filter((s) => !isMine(s));
    room.redo[socket.id] = room.redo[socket.id] || [];
    room.redo[socket.id].push(removed);
    io.to(roomName).emit("redraw", room.history);
  });

  socket.on("redo", () => {
    if (!roomName) return;
    const room = getRoom(roomName);
    const stack = room.redo[socket.id];
    if (!stack || stack.length === 0) return;
    room.history.push(...stack.pop());
    io.to(roomName).emit("redraw", room.history);
  });

  socket.on("clear", () => {
    if (!roomName) return;
    const room = getRoom(roomName);
    room.history = [];
    room.redo = {};
    io.to(roomName).emit("clear");
  });

  socket.on("disconnect", () => {
    if (!roomName) return;
    delete getRoom(roomName).redo[socket.id];
    sendUserCount(roomName);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));