const prisma = require('../config/prisma')

async function creerNotification(io, utilisateurId, titre, message, options = {}) {
  try {
    const notif = await prisma.notification.create({
      data: {
        utilisateurId,
        titre,
        message,
        canal:     options.canal || 'IN_APP',
        lien:      options.lien  || undefined,
        statut:    'ENVOYE',
        envoyeAt:  new Date(),
      },
    })
    if (io) {
      io.to(`user:${utilisateurId}`).emit('notification', notif)
    }
    return notif
  } catch (err) {
    console.error('[notifHelper.creerNotification]', err)
  }
}

module.exports = { creerNotification }
