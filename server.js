const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

io.on("connection", (socket) => {
  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log("Server running on port " + PORT));
