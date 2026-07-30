const path = require('path');
const http = require('http');
const express = require('express');
const { WebSocketServer } = require('ws');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

// Friendly default route -> the presentation deck
app.get('/', (req, res) => {
  res.redirect('/present.html' + (req.url.includes('?') ? '?' + req.url.split('?')[1] : ''));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// In-memory per-room state. Fine for a live presentation; resets on redeploy/restart.
const rooms = Object.create(null);

function getRoom(name) {
  if (!rooms[name]) {
    rooms[name] = { idx: 0, total: 0, clients: new Set() };
  }
  return rooms[name];
}

function broadcast(room) {
  const payload = JSON.stringify({ type: 'state', idx: room.idx, total: room.total });
  for (const client of room.clients) {
    if (client.readyState === 1) client.send(payload);
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, 'http://placeholder');
  const roomName = url.searchParams.get('room') || 'main';
  const room = getRoom(roomName);
  room.clients.add(ws);
  ws.roomName = roomName;

  // Send current state immediately so a newly-opened page is in sync.
  ws.send(JSON.stringify({ type: 'state', idx: room.idx, total: room.total }));

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch (e) { return; }
    const room = getRoom(ws.roomName);

    if (msg.type === 'total' && typeof msg.total === 'number') {
      room.total = msg.total;
      if (room.idx > room.total - 1) room.idx = Math.max(0, room.total - 1);
      broadcast(room);
      return;
    }
    if (msg.type === 'next') {
      if (room.total === 0 || room.idx < room.total - 1) room.idx += 1;
    } else if (msg.type === 'prev') {
      if (room.idx > 0) room.idx -= 1;
    } else if (msg.type === 'goto' && typeof msg.idx === 'number') {
      let target = msg.idx;
      if (room.total > 0) target = Math.min(target, room.total - 1);
      room.idx = Math.max(0, target);
    } else {
      return;
    }
    broadcast(room);
  });

  ws.on('close', () => {
    room.clients.delete(ws);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
