const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const eraserBtn = document.getElementById("eraser");
const undoBtn = document.getElementById("undo");
const redoBtn = document.getElementById("redo");
const clearBtn = document.getElementById("clear");
const saveBtn = document.getElementById("save");
const usersLabel = document.getElementById("users");

// fixed logical board size, scaled by CSS to fit any screen
canvas.width = 1280;
canvas.height = 720;

const room = new URLSearchParams(location.search).get("room") || "main";
document.getElementById("room").textContent = "Room: " + room;

// join on first connect and again after any reconnect
socket.on("connect", () => socket.emit("join", room));

let drawing = false;
let erasing = false;
let last = null;
let strokeId = null;
let buffer = []; // segments waiting to be sent

// convert screen position to board position
function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return [
    (e.clientX - rect.left) * (canvas.width / rect.width),
    (e.clientY - rect.top) * (canvas.height / rect.height),
  ];
}

function drawLine({ x0, y0, x1, y1, color, size }) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

function redraw(history) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history.forEach(drawLine);
}

// send buffered segments as one batch
function flush() {
  if (buffer.length === 0) return;
  socket.emit("draw", buffer);
  buffer = [];
}
setInterval(flush, 30);

// flush pending strokes first so events reach the server in order
function send(event) {
  flush();
  socket.emit(event);
}

function stopDrawing() {
  flush();
  drawing = false;
}

// pointer events work for mouse, touch and pen
canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  last = getPos(e);
  strokeId = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
});
canvas.addEventListener("pointerup", stopDrawing);
canvas.addEventListener("pointercancel", stopDrawing);
canvas.addEventListener("pointerleave", stopDrawing);

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const pos = getPos(e);
  const data = {
    x0: last[0],
    y0: last[1],
    x1: pos[0],
    y1: pos[1],
    color: erasing ? "#ffffff" : colorInput.value,
    size: erasing ? 20 : sizeInput.value,
    strokeId: strokeId,
  };
  drawLine(data);
  buffer.push(data);
  last = pos;
});

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.classList.toggle("active", erasing);
});

undoBtn.addEventListener("click", () => send("undo"));
redoBtn.addEventListener("click", () => send("redo"));
clearBtn.addEventListener("click", () => send("clear"));

saveBtn.addEventListener("click", () => {
  // draw on a white background so the saved image is not transparent
  const temp = document.createElement("canvas");
  temp.width = canvas.width;
  temp.height = canvas.height;
  const tctx = temp.getContext("2d");
  tctx.fillStyle = "#ffffff";
  tctx.fillRect(0, 0, temp.width, temp.height);
  tctx.drawImage(canvas, 0, 0);

  const link = document.createElement("a");
  link.download = "whiteboard-" + room + ".png";
  link.href = temp.toDataURL("image/png");
  link.click();
});

document.addEventListener("keydown", (e) => {
  if (!e.ctrlKey) return;
  if (e.key === "z") send("undo");
  if (e.key === "y") send("redo");
});

socket.on("draw", (segments) => segments.forEach(drawLine));
socket.on("init", redraw);
socket.on("redraw", redraw);
socket.on("clear", () => ctx.clearRect(0, 0, canvas.width, canvas.height));
socket.on("users", (count) => {
  usersLabel.textContent = "Users: " + count;
});