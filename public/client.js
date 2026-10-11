const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let last = null;

function drawLine({ x0, y0, x1, y1 }) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  last = [e.clientX, e.clientY];
});
canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mouseleave", () => (drawing = false));

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  const data = { x0: last[0], y0: last[1], x1: e.clientX, y1: e.clientY };
  drawLine(data);
  socket.emit("draw", data);
  last = [e.clientX, e.clientY];
});

socket.on("draw", drawLine);
