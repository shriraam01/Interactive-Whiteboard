const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

const history = [];

io.on("connection", (socket) => {
  socket.emit("init", history);

  socket.on("draw", (data) => {
    history.push(data);
    socket.broadcast.emit("draw", data);
  });

  socket.on("clear", () => {
    history.length = 0;
    io.emit("clear");
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));