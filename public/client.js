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

const room = new URLSearchParams(location.search).get("room") || "main";
document.getElementById("room").textContent = "Room: " + room;

// join on first connect and again after any reconnect
socket.on("connect", () => socket.emit("join", room));

let drawing = false;
let erasing = false;
let last = null;
let strokeId = null;
let localHistory = []; // local copy so the board can be redrawn after a resize

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
  localHistory = history;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  history.forEach(drawLine);
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw(localHistory);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// pointer events work for mouse, touch and pen
canvas.addEventListener("pointerdown", (e) => {
  drawing = true;
  last = [e.clientX, e.clientY];
  strokeId = Date.now() + "-" + Math.random().toString(36).slice(2, 8);
});
canvas.addEventListener("pointerup", () => (drawing = false));
canvas.addEventListener("pointercancel", () => (drawing = false));
canvas.addEventListener("pointerleave", () => (drawing = false));

canvas.addEventListener("pointermove", (e) => {
  if (!drawing) return;
  const data = {
    x0: last[0],
    y0: last[1],
    x1: e.clientX,
    y1: e.clientY,
    color: erasing ? "#ffffff" : colorInput.value,
    size: erasing ? 20 : sizeInput.value,
    strokeId: strokeId,
  };
  drawLine(data);
  localHistory.push(data);
  socket.emit("draw", data);
  last = [e.clientX, e.clientY];
});

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.classList.toggle("active", erasing);
});

undoBtn.addEventListener("click", () => socket.emit("undo"));
redoBtn.addEventListener("click", () => socket.emit("redo"));
clearBtn.addEventListener("click", () => socket.emit("clear"));

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
  if (e.key === "z") socket.emit("undo");
  if (e.key === "y") socket.emit("redo");
});

socket.on("draw", (data) => {
  localHistory.push(data);
  drawLine(data);
});
socket.on("init", redraw);
socket.on("redraw", redraw);
socket.on("clear", () => {
  localHistory = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
socket.on("users", (count) => {
  usersLabel.textContent = "Users: " + count;
});