const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /messagerie/conversations — liste des interlocuteurs avec le dernier message
async function conversations(req, res) {
  const moi = req.user.id

  // Tous les messages impliquant cet utilisateur
  const msgs = await prisma.interaction.findMany({
    where: { OR: [{ expediteurId: moi }, { destinataireId: moi }] },
    orderBy: { createdAt: 'desc' },
    include: {
      expediteur:   { select: { id: true, prenom: true, nom: true, role: true, avatar: true } },
      destinataire: { select: { id: true, prenom: true, nom: true, role: true, avatar: true } },
    },
  })

  // Dédupliquer : un objet par interlocuteur unique
  const vus = new Set()
  const convs = []
  for (const m of msgs) {
    const autreId = m.expediteurId === moi ? m.destinataireId : m.expediteurId
    if (vus.has(autreId)) continue
    vus.add(autreId)
    const autre = m.expediteurId === moi ? m.destinataire : m.expediteur
    const nonLus = await prisma.interaction.count({
      where: { expediteurId: autreId, destinataireId: moi, lu: false },
    })
    convs.push({ utilisateur: autre, dernierMessage: m, nonLus })
  }

  res.json(convs)
}

// GET /messagerie/messages/:userId — échange complet avec un utilisateur
async function messages(req, res) {
  const moi = req.user.id
  const autreId = parseInt(req.params.userId)

  const liste = await prisma.interaction.findMany({
    where: {
      OR: [
        { expediteurId: moi, destinataireId: autreId },
        { expediteurId: autreId, destinataireId: moi },
      ],
    },
    orderBy: { createdAt: 'asc' },
    include: {
      expediteur: { select: { id: true, prenom: true, nom: true, role: true } },
    },
  })

  // Marquer comme lus les messages reçus de l'autre
  await prisma.interaction.updateMany({
    where: { expediteurId: autreId, destinataireId: moi, lu: false },
    data: { lu: true },
  })

  res.json(liste)
}

// POST /messagerie/envoyer
async function envoyer(req, res) {
  const { destinataireId, message } = req.body
  if (!message?.trim() || !destinataireId) return res.status(400).json({ message: 'Destinataire et message requis' })

  const dest = await prisma.utilisateur.findUnique({ where: { id: parseInt(destinataireId) }, select: { id: true } })
  if (!dest) return res.status(404).json({ message: 'Destinataire introuvable' })

  const msg = await prisma.interaction.create({
    data: {
      expediteurId:   req.user.id,
      destinataireId: parseInt(destinataireId),
      message:        message.trim(),
    },
    include: { expediteur: { select: { id: true, prenom: true, nom: true, role: true } } },
  })

  // Notifier via socket.io si connecté
  const io = req.app.get('io')
  if (io) io.to(`user:${destinataireId}`).emit('nouveau_message', msg)

  res.status(201).json(msg)
}

// GET /messagerie/contacts — utilisateurs disponibles à contacter
async function contacts(req, res) {
  const moi = req.user.id
  const utilisateurs = await prisma.utilisateur.findMany({
    where: { id: { not: moi }, actif: true },
    select: { id: true, prenom: true, nom: true, role: true, avatar: true },
    orderBy: [{ role: 'asc' }, { nom: 'asc' }],
  })
  res.json(utilisateurs)
}

// GET /messagerie/non-lus — total messages non lus
async function nonLus(req, res) {
  const count = await prisma.interaction.count({
    where: { destinataireId: req.user.id, lu: false },
  })
  res.json({ count })
}

module.exports = { conversations, messages, envoyer, contacts, nonLus }
