const jwt = require('jsonwebtoken');
const { setIo } = require('./utils/notify');

module.exports = (io) => {
  setIo(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Non authentifié'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const { id, role } = socket.user;
    socket.join(`user:${id}`);
    socket.join(`role:${role}`);

    socket.on('disconnect', () => {});
  });
};
