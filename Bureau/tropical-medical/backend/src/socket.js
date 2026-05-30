const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let _io = null;

function init(httpServer) {
  _io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
  });

  _io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  _io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);
    socket.join(`role:${socket.user.role}`);
    socket.on('disconnect', () => {});
  });

  return _io;
}

function getIO() {
  return _io;
}

module.exports = { init, getIO };
