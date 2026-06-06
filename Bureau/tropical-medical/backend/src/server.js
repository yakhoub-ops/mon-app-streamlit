const http = require('http');
const { Server } = require('socket.io');
const app = require('./app');

require('./cron');

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', credentials: true },
});

require('./socket')(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Serveur démarré sur http://localhost:${PORT}`));
