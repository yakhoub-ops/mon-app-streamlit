const prisma = require('../config/prisma')

async function mesNotifications(req, res) {
  try {
    const notifs = await prisma.notification.findMany({
      where: { utilisateurId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    res.json(notifs)
  } catch (err) {
    console.error('[notif.mesNotifications]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function marquerLue(req, res) {
  try {
    const id = parseInt(req.params.id)
    const notif = await prisma.notification.findUnique({ where: { id } })
    if (!notif || notif.utilisateurId !== req.user.id) {
      return res.status(404).json({ message: 'Notification introuvable' })
    }
    const updated = await prisma.notification.update({ where: { id }, data: { lu: true } })
    res.json(updated)
  } catch (err) {
    console.error('[notif.marquerLue]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function marquerToutesLues(req, res) {
  try {
    await prisma.notification.updateMany({
      where: { utilisateurId: req.user.id, lu: false },
      data: { lu: true },
    })
    res.json({ message: 'Toutes marquées lues' })
  } catch (err) {
    console.error('[notif.marquerToutesLues]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = { mesNotifications, marquerLue, marquerToutesLues }
