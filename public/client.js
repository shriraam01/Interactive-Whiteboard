const socket = io();
const canvas = document.getElementById("board");
const ctx = canvas.getContext("2d");
const colorInput = document.getElementById("color");
const sizeInput = document.getElementById("size");
const eraserBtn = document.getElementById("eraser");
const clearBtn = document.getElementById("clear");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let drawing = false;
let erasing = false;
let last = null;

function drawLine({ x0, y0, x1, y1, color, size }) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
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
  const data = {
    x0: last[0],
    y0: last[1],
    x1: e.clientX,
    y1: e.clientY,
    color: erasing ? "#ffffff" : colorInput.value,
    size: erasing ? 20 : sizeInput.value,
  };
  drawLine(data);
  socket.emit("draw", data);
  last = [e.clientX, e.clientY];
});

eraserBtn.addEventListener("click", () => {
  erasing = !erasing;
  eraserBtn.classList.toggle("active", erasing);
});

clearBtn.addEventListener("click", () => socket.emit("clear"));

socket.on("draw", drawLine);
socket.on("init", (history) => history.forEach(drawLine));
socket.on("clear", () => ctx.clearRect(0, 0, canvas.width, canvas.height));