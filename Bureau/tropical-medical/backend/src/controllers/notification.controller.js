const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const notifs = await prisma.notification.findMany({
      where: { id_util: req.user.id },
      orderBy: { created_at: 'desc' },
      take: 50,
    });
    res.json(notifs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { id_util: req.user.id, lu: false },
    });
    res.json({ count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.markRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id_notification: +req.params.id },
      data: { lu: true },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { id_util: req.user.id, lu: false },
      data: { lu: true },
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.notification.delete({ where: { id_notification: +req.params.id } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
