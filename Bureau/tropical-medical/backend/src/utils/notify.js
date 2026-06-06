const prisma = require('../config/prisma');

let _io = null;

const setIo = (io) => { _io = io; };

const notify = async (id_util, message, type = 'systeme', lien = null) => {
  const notif = await prisma.notification.create({
    data: { id_util, message, type, lien },
  });
  if (_io) {
    _io.to(`user:${id_util}`).emit('notification', notif);
    _io.to(`role:${type}`).emit('notification:role', notif);
  }
  return notif;
};

module.exports = { notify, setIo };
