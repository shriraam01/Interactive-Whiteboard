# Interactive Whiteboard

A real-time collaborative whiteboard where multiple users can draw on a shared canvas from different devices, and every stroke appears instantly for everyone in the same room.

## Technologies

- Node.js and Express
- Socket.IO (WebSocket over TCP)
- HTML5 Canvas, HTML, CSS, JavaScript

## Features

- Real-time drawing sync using a client-server model
- Room-based sessions (join with ?room=name in the URL)
- Color picker, brush size and eraser
- Undo and redo (per user), clear board
- Late joiners receive the current board
- Live user count per room
- Touch and mouse support
- Save the board as a PNG image
- Stroke batching to reduce network overhead

## Run

    npm install
    npm start

Open http://localhost:3000 in two tabs. To join a specific room, use http://localhost:3000/?room=cn

To use it across devices, connect them to the same Wi-Fi and open http://<your-laptop-ip>:3000

## Networking concepts covered

Socket programming, client-server communication, message serialization (JSON), broadcasting, room management, concurrent clients, and the trade-off between latency and bandwidth through batching.
