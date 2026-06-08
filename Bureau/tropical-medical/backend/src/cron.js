const cron = require('node-cron')
const prisma = require('./config/prisma')
const { creerNotification } = require('./helpers/notificationHelper')

function fmtDate(d) {
  return new Date(d).toLocaleString('fr-SN', {
    weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtHeure(d) {
  return new Date(d).toLocaleTimeString('fr-SN', { hour: '2-digit', minute: '2-digit' })
}

function simulerSMS(telephone, message) {
  console.log(`[SMS] → ${telephone || 'N/A'} : ${message}`)
}

/**
 * Envoie les rappels RDV pour une fenêtre temporelle donnée.
 * @param {object} io - Instance Socket.IO
 * @param {number} minH - Borne basse en heures
 * @param {number} maxH - Borne haute en heures
 * @param {string} typeRappel - Identifiant unique du type ('24h', '2h', 'matin')
 */
async function envoyerRappelsRdv(io, minH, maxH, typeRappel) {
  const maintenant = new Date()
  const debut      = new Date(maintenant.getTime() + minH * 60 * 60 * 1000)
  const fin        = new Date(maintenant.getTime() + maxH * 60 * 60 * 1000)

  const rdvs = await prisma.rendezVous.findMany({
    where: { date: { gte: debut, lte: fin }, statut: { not: 'ANNULE' } },
    include: {
      patient: { include: { utilisateur: { select: { id: true, nom: true, prenom: true, telephone: true } } } },
      medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
    },
  })

  let count = 0
  for (const rdv of rdvs) {
    const userId = rdv.patient.utilisateurId
    const lien   = `/patient/rdv#${rdv.id}`
    const cle    = `${lien}::${typeRappel}`

    // Éviter les doublons : chercher une notif avec ce lien ET créée récemment (< 2h)
    const existe = await prisma.notification.findFirst({
      where: {
        utilisateurId: userId,
        lien,
        titre: { contains: 'Rappel' },
        envoyeAt: { gte: new Date(maintenant.getTime() - 2 * 60 * 60 * 1000) },
      },
    })
    if (existe) continue

    const medecinNom = `Dr ${rdv.medecin.utilisateur.prenom} ${rdv.medecin.utilisateur.nom}`
    let titre, msg

    if (typeRappel === '2h') {
      titre = '⏰ RDV dans 2 heures !'
      msg   = `Votre rendez-vous avec ${medecinNom} est dans moins de 2 heures (${fmtHeure(rdv.date)}). Préparez-vous !`
    } else if (typeRappel === 'matin') {
      titre = '📅 RDV prévu aujourd\'hui'
      msg   = `Rappel : vous avez un rendez-vous avec ${medecinNom} aujourd\'hui à ${fmtHeure(rdv.date)}. Bonne journée !`
    } else {
      titre = '📆 Rappel de rendez-vous — J-1'
      msg   = `Rappel : vous avez un rendez-vous avec ${medecinNom} demain, ${fmtDate(rdv.date)}.`
    }

    await creerNotification(io, userId, titre, msg, { lien })
    simulerSMS(rdv.patient.utilisateur.telephone, msg)
    count++
  }
  return count
}

function demarrerCron(io) {
  // ── Rappel J-1 : toutes les heures, RDV dans 23-25h ──────────────────────
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Rappels J-1…')
    try {
      const n = await envoyerRappelsRdv(io, 23, 25, '24h')
      console.log(`[CRON] J-1 : ${n} rappel(s) envoyé(s)`)
    } catch (err) {
      console.error('[CRON] Erreur rappels J-1:', err)
    }
  })

  // ── Rappel matin : tous les jours à 07h30, RDV du jour ───────────────────
  cron.schedule('30 7 * * *', async () => {
    console.log('[CRON] Rappels matin (RDV du jour)…')
    try {
      const n = await envoyerRappelsRdv(io, 0.5, 16, 'matin')
      console.log(`[CRON] Matin : ${n} rappel(s) envoyé(s)`)
    } catch (err) {
      console.error('[CRON] Erreur rappels matin:', err)
    }
  })

  // ── Rappel 2h : toutes les 30 min, RDV dans 1h50 – 2h10 ─────────────────
  cron.schedule('*/30 * * * *', async () => {
    try {
      const n = await envoyerRappelsRdv(io, 1.83, 2.17, '2h')
      if (n > 0) console.log(`[CRON] 2h : ${n} rappel(s) envoyé(s)`)
    } catch (err) {
      console.error('[CRON] Erreur rappels 2h:', err)
    }
  })

  // ── Alertes stock bas : quotidien à 08h00 ────────────────────────────────
  cron.schedule('0 8 * * *', async () => {
    console.log('[CRON] Vérification alertes stock…')
    try {
      const ruptures = await prisma.$queryRaw`
        SELECT m.id, m.nom, m."stockActuel", m."stockMinimum"
        FROM "Medicament" m
        WHERE m."stockActuel" <= m."stockMinimum"
        LIMIT 100
      `
      const pharmaciens = await prisma.utilisateur.findMany({ where: { role: 'PHARMACIEN' } })
      for (const pharmacien of pharmaciens) {
        if (ruptures.length > 0) {
          await creerNotification(
            io, pharmacien.id,
            '⚠️ Alertes de stock',
            `${ruptures.length} médicament(s) en rupture ou stock bas. Vérifiez le stock.`,
            { lien: '/pharmacien/stock' }
          )
        }
      }
      console.log(`[CRON] Stock : ${ruptures.length} médicament(s) concerné(s)`)
    } catch (err) {
      console.error('[CRON] Erreur alertes stock:', err)
    }
  })

  console.log('[CRON] ✅ Tâches planifiées démarrées (J-1, matin 7h30, 2h avant, stock 8h)')
}

module.exports = { demarrerCron }
