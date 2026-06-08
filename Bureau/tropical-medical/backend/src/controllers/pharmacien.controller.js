const prisma = require('../config/prisma')

// ── Statistiques ─────────────────────────────────────────────────────────────
async function statistiques(req, res) {
  try {
    const today    = new Date()
    const dans30j  = new Date(today); dans30j.setDate(dans30j.getDate() + 30)

    const [ordoEnAttente, ruptures, lotsExpirant, totalMeds] = await Promise.all([
      prisma.ordonnance.count({ where: { statut: 'ACTIVE' } }),
      prisma.medicament.count({ where: { actif: true, stockActuel: { lte: prisma.medicament.fields?.stockMinimum ?? 0 } } }),
      prisma.lotMedicament.count({ where: { dateExpiration: { lte: dans30j }, quantiteRestante: { gt: 0 } } }),
      prisma.medicament.count({ where: { actif: true } }),
    ])

    // Ruptures : stockActuel <= stockMinimum
    const rupturesReelle = await prisma.$queryRaw`
      SELECT COUNT(*) as cnt FROM "Medicament"
      WHERE actif = 1 AND stockActuel <= stockMinimum
    `
    const nbRuptures = Number(rupturesReelle[0]?.cnt ?? 0)

    res.json({ ordoEnAttente, ruptures: nbRuptures, lotsExpirant, totalMeds })
  } catch (err) {
    console.error('[pharma.statistiques]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Ordonnances ───────────────────────────────────────────────────────────────
async function listeOrdonnances(req, res) {
  try {
    const { statut } = req.query
    const ordonnances = await prisma.ordonnance.findMany({
      where: statut ? { statut } : undefined,
      include: {
        dossier: {
          include: {
            patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
          },
        },
        lignes: {
          include: { medicament: { select: { id: true, nom: true, forme: true, dosage: true, stockActuel: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(ordonnances)
  } catch (err) {
    console.error('[pharma.listeOrdonnances]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function delivrerOrdonnance(req, res) {
  try {
    const id = parseInt(req.params.id)
    const ordonnance = await prisma.ordonnance.findUnique({
      where: { id },
      include: { lignes: true },
    })
    if (!ordonnance) return res.status(404).json({ message: 'Ordonnance introuvable' })
    if (ordonnance.statut !== 'ACTIVE') {
      return res.status(400).json({ message: 'Cette ordonnance a déjà été traitée' })
    }

    // Décrémenter le stock pour chaque ligne
    const updates = ordonnance.lignes.map(l =>
      prisma.medicament.update({
        where: { id: l.medicamentId },
        data: { stockActuel: { decrement: l.quantite } },
      })
    )

    await prisma.$transaction([
      ...updates,
      prisma.ordonnance.update({ where: { id }, data: { statut: 'DELIVREE' } }),
    ])

    const updated = await prisma.ordonnance.findUnique({
      where: { id },
      include: {
        dossier: { include: { patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } } } },
        lignes: { include: { medicament: true } },
      },
    })
    res.json(updated)
  } catch (err) {
    console.error('[pharma.delivrerOrdonnance]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Stock ─────────────────────────────────────────────────────────────────────
async function listeMedicaments(req, res) {
  try {
    const { q } = req.query
    const meds = await prisma.medicament.findMany({
      where: {
        ...(q ? { OR: [{ nom: { contains: q } }, { dci: { contains: q } }] } : {}),
      },
      include: { lots: { where: { quantiteRestante: { gt: 0 } }, orderBy: { dateExpiration: 'asc' } } },
      orderBy: { nom: 'asc' },
    })
    res.json(meds)
  } catch (err) {
    console.error('[pharma.listeMedicaments]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function creerMedicament(req, res) {
  try {
    const { nom, dci, forme, dosage, categorie, prixUnitaire, stockMinimum, description, urlFournisseur } = req.body
    if (!nom) return res.status(400).json({ message: 'Le nom est requis' })

    const med = await prisma.medicament.create({
      data: {
        nom,
        dci:           dci           || undefined,
        forme:         forme         || undefined,
        dosage:        dosage        || undefined,
        categorie:     categorie     || undefined,
        prixUnitaire:  prixUnitaire  ? parseInt(prixUnitaire) : 0,
        stockMinimum:  stockMinimum  ? parseInt(stockMinimum) : 10,
        stockActuel:   0,
        description:   description   || undefined,
        urlFournisseur: urlFournisseur || undefined,
      },
    })
    res.status(201).json(med)
  } catch (err) {
    console.error('[pharma.creerMedicament]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourMedicament(req, res) {
  try {
    const id  = parseInt(req.params.id)
    const { nom, dci, forme, dosage, categorie, prixUnitaire, stockMinimum, description, actif, urlFournisseur } = req.body

    const med = await prisma.medicament.update({
      where: { id },
      data: {
        ...(nom            !== undefined && { nom }),
        ...(dci            !== undefined && { dci }),
        ...(forme          !== undefined && { forme }),
        ...(dosage         !== undefined && { dosage }),
        ...(categorie      !== undefined && { categorie }),
        ...(prixUnitaire   !== undefined && { prixUnitaire: parseInt(prixUnitaire) }),
        ...(stockMinimum   !== undefined && { stockMinimum: parseInt(stockMinimum) }),
        ...(description    !== undefined && { description }),
        ...(actif          !== undefined && { actif: Boolean(actif) }),
        ...(urlFournisseur !== undefined && { urlFournisseur: urlFournisseur || null }),
      },
    })
    res.json(med)
  } catch (err) {
    console.error('[pharma.mettreAJourMedicament]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PATCH /api/pharmacien/medicaments/:id/url-fournisseur
async function enregistrerUrlFournisseur(req, res) {
  try {
    const id  = parseInt(req.params.id)
    const { urlFournisseur } = req.body
    const med = await prisma.medicament.update({
      where: { id },
      data:  { urlFournisseur: urlFournisseur || null },
    })
    res.json({ id: med.id, urlFournisseur: med.urlFournisseur })
  } catch (err) {
    console.error('[pharma.enregistrerUrlFournisseur]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function alertesStock(req, res) {
  try {
    const meds = await prisma.$queryRaw`
      SELECT * FROM "Medicament"
      WHERE actif = 1 AND stockActuel <= stockMinimum
      ORDER BY stockActuel ASC
    `
    res.json(meds)
  } catch (err) {
    console.error('[pharma.alertesStock]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Lots / Livraisons ─────────────────────────────────────────────────────────
async function listeLots(req, res) {
  try {
    const { medicamentId } = req.query
    const lots = await prisma.lotMedicament.findMany({
      where: medicamentId ? { medicamentId: parseInt(medicamentId) } : undefined,
      include: { medicament: { select: { nom: true, forme: true, dosage: true } } },
      orderBy: { createdAt: 'desc' },
    })
    res.json(lots)
  } catch (err) {
    console.error('[pharma.listeLots]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function creerLot(req, res) {
  try {
    const { medicamentId, numeroLot, dateExpiration, quantite, fournisseur, prixAchat } = req.body
    if (!medicamentId || !dateExpiration || !quantite) {
      return res.status(400).json({ message: 'medicamentId, dateExpiration et quantite sont requis' })
    }

    const qte = parseInt(quantite)
    const [lot] = await prisma.$transaction([
      prisma.lotMedicament.create({
        data: {
          medicamentId:  parseInt(medicamentId),
          numeroLot:     numeroLot    || `LOT-${Date.now()}`,
          dateExpiration: new Date(dateExpiration),
          quantite:      qte,
          quantiteRestante: qte,
          fournisseur:   fournisseur  || undefined,
          prixAchat:     prixAchat    ? parseInt(prixAchat) : undefined,
        },
      }),
      prisma.medicament.update({
        where: { id: parseInt(medicamentId) },
        data:  { stockActuel: { increment: qte } },
      }),
    ])

    const lotFull = await prisma.lotMedicament.findUnique({
      where: { id: lot.id },
      include: { medicament: { select: { nom: true, forme: true } } },
    })
    res.status(201).json(lotFull)
  } catch (err) {
    console.error('[pharma.creerLot]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  statistiques,
  listeOrdonnances, delivrerOrdonnance,
  listeMedicaments, creerMedicament, mettreAJourMedicament, alertesStock,
  enregistrerUrlFournisseur,
  listeLots, creerLot,
}
