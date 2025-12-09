import { createServer } from 'http';
import { Server } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: { origin: "*" },
  pingTimeout: 60000,
});

const connectedUsers = new Set<string>();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  connectedUsers.add(socket.id);
  io.emit('live-users-update', connectedUsers.size);

  socket.on('heartbeat', (data) => {
    socket.broadcast.emit('live-activity', { userId: socket.id, ...data });
  });

  socket.on('manager-notification', (payload) => {
    io.emit('manager-notification', payload);
  });

  socket.on('disconnect', () => {
    connectedUsers.delete(socket.id);
    io.emit('live-users-update', connectedUsers.size);
  });
});

httpServer.listen(3001, () => console.log('Socket.io → :3001'));