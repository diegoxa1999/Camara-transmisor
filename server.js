// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static('public'));

// Estructura: rooms = Map<roomId, Set<client>>
// client: { ws, role: 'sender' | 'viewer' }
const rooms = new Map();

function joinRoom(ws, roomId, role) {
  if (!rooms.has(roomId)) rooms.set(roomId, new Set());
  const room = rooms.get(roomId);

  // Reglas 1:1 — solo un sender y un viewer por sala
  const hasSender = [...room].some(c => c.role === 'sender');
  const hasViewer = [...room].some(c => c.role === 'viewer');

  if (role === 'sender' && hasSender) {
    ws.send(JSON.stringify({ type: 'room-error', reason: 'Ya hay un emisor en esta sala.' }));
    return false;
  }
  if (role === 'viewer' && hasViewer) {
    ws.send(JSON.stringify({ type: 'room-error', reason: 'Ya hay un espectador en esta sala.' }));
    return false;
  }

  const client = { ws, role };
  room.add(client);
  ws._roomId = roomId;
  ws._role = role;

  // Notifica al par que alguien se unió
  room.forEach(c => {
    if (c.ws !== ws) {
      c.ws.send(JSON.stringify({ type: 'peer-joined', role }));
    }
  });

  // Estado básico
  const state = {
    type: 'room-state',
    hasSender: [...room].some(c => c.role === 'sender'),
    hasViewer: [...room].some(c => c.role === 'viewer')
  };
  room.forEach(c => c.ws.send(JSON.stringify(state)));

  return true;
}

wss.on('connection', (ws) => {
  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch {}
    if (!msg) return;

    if (msg.type === 'join') {
      const { roomId, role } = msg;
      joinRoom(ws, roomId, role);
      return;
    }

    // Señalización "tonta": reenvía al otro participante de la sala
    const roomId = ws._roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    room.forEach(c => {
      if (c.ws !== ws) {
        c.ws.send(JSON.stringify(msg));
      }
    });
  });

  ws.on('close', () => {
    const roomId = ws._roomId;
    if (!roomId || !rooms.has(roomId)) return;
    const room = rooms.get(roomId);

    // Notifica salida
    room.forEach(c => {
      if (c.ws !== ws) {
        c.ws.send(JSON.stringify({ type: 'peer-left', role: ws._role }));
      }
    });

    // Limpia cliente
    for (const c of room) {
      if (c.ws === ws) room.delete(c);
    }
    if (room.size === 0) rooms.delete(roomId);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor listo en http://localhost:${PORT}`);
});