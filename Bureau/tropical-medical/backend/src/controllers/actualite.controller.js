const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// GET /patient/actualites  — publiées seulement
async function listerPubliees(req, res) {
  const { categorie } = req.query
  const where = { publiee: true }
  if (categorie && categorie !== 'TOUT') where.categorie = categorie
  const actualites = await prisma.actualite.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { auteur: { select: { prenom: true, nom: true } } },
  })
  res.json(actualites)
}

// GET /receptionniste/actualites  — toutes
async function listerToutes(req, res) {
  const actualites = await prisma.actualite.findMany({
    orderBy: { createdAt: 'desc' },
    include: { auteur: { select: { prenom: true, nom: true } } },
  })
  res.json(actualites)
}

// POST /receptionniste/actualites
async function creer(req, res) {
  const { titre, contenu, categorie, image } = req.body
  if (!titre?.trim() || !contenu?.trim()) return res.status(400).json({ message: 'Titre et contenu requis' })
  const actu = await prisma.actualite.create({
    data: {
      titre: titre.trim(),
      contenu: contenu.trim(),
      categorie: categorie || 'INFO',
      image: image || null,
      auteurId: req.user.id,
      publiee: true,
    },
    include: { auteur: { select: { prenom: true, nom: true } } },
  })
  res.status(201).json(actu)
}

// PUT /receptionniste/actualites/:id
async function mettreAJour(req, res) {
  const id = parseInt(req.params.id)
  const { titre, contenu, categorie, image, publiee } = req.body
  const actu = await prisma.actualite.update({
    where: { id },
    data: {
      titre: titre?.trim(),
      contenu: contenu?.trim(),
      categorie,
      image: image || null,
      publiee: publiee !== undefined ? publiee : undefined,
    },
    include: { auteur: { select: { prenom: true, nom: true } } },
  })
  res.json(actu)
}

// PATCH /receptionniste/actualites/:id/publier
async function basculerPublication(req, res) {
  const id = parseInt(req.params.id)
  const actuelle = await prisma.actualite.findUnique({ where: { id }, select: { publiee: true } })
  if (!actuelle) return res.status(404).json({ message: 'Actualité introuvable' })
  const actu = await prisma.actualite.update({
    where: { id },
    data: { publiee: !actuelle.publiee },
  })
  res.json({ id: actu.id, publiee: actu.publiee })
}

// DELETE /receptionniste/actualites/:id
async function supprimer(req, res) {
  const id = parseInt(req.params.id)
  await prisma.actualite.delete({ where: { id } })
  res.status(204).end()
}

module.exports = { listerPubliees, listerToutes, creer, mettreAJour, basculerPublication, supprimer }
