const bcrypt = require('bcryptjs')
const prisma  = require('../config/prisma')

// ── Statistiques globales ────────────────────────────────────────────────────
async function statistiques(req, res) {
  try {
    const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0,0,0,0)

    const [
      totalUtilisateurs, totalMedecins, totalPatients,
      consultationsMois, rdvMois, facturesTotales,
      litsTotaux, litsLibres, ordoActives,
    ] = await Promise.all([
      prisma.utilisateur.count(),
      prisma.medecin.count(),
      prisma.patient.count(),
      prisma.consultation.count({ where: { createdAt: { gte: debutMois } } }),
      prisma.rendezVous.count({ where: { createdAt: { gte: debutMois }, statut: { not: 'ANNULE' } } }),
      prisma.facture.aggregate({ _sum: { montantTotal: true }, where: { statut: 'PAYEE' } }),
      prisma.lit.count(),
      prisma.lit.count({ where: { statut: 'LIBRE' } }),
      prisma.ordonnance.count({ where: { statut: 'ACTIVE' } }),
    ])

    res.json({
      totalUtilisateurs, totalMedecins, totalPatients,
      consultationsMois, rdvMois,
      revenuMois: facturesTotales._sum.montantTotal || 0,
      litsTotaux, litsLibres, ordoActives,
    })
  } catch (err) {
    console.error('[admin.statistiques]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function statistiquesAvancees(req, res) {
  try {
    // Consultations par mois (6 derniers mois)
    const consultations = await prisma.consultation.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
    })

    const factures = await prisma.facture.findMany({
      where: { statut: 'PAYEE' },
      select: { createdAt: true, montantTotal: true },
    })

    const rdvParStatut = await prisma.rendezVous.groupBy({
      by: ['statut'],
      _count: { _all: true },
    })

    const usersParRole = await prisma.utilisateur.groupBy({
      by: ['role'],
      _count: { _all: true },
    })

    res.json({ consultations, factures, rdvParStatut, usersParRole })
  } catch (err) {
    console.error('[admin.statistiquesAvancees]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Utilisateurs ─────────────────────────────────────────────────────────────
async function listeUtilisateurs(req, res) {
  try {
    const { role, q } = req.query
    const utilisateurs = await prisma.utilisateur.findMany({
      where: {
        ...(role ? { role } : {}),
        ...(q ? { OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { email: { contains: q } }] } : {}),
      },
      select: {
        id: true, nom: true, prenom: true, email: true,
        telephone: true, role: true, actif: true, createdAt: true,
        medecin: { select: { specialite: true, consultationTarif: true } },
        patient:  { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(utilisateurs)
  } catch (err) {
    console.error('[admin.listeUtilisateurs]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function creerUtilisateur(req, res) {
  try {
    const { nom, prenom, email, telephone, role, mot_de_passe } = req.body
    if (!nom || !prenom || !email || !role || !mot_de_passe) {
      return res.status(400).json({ message: 'Champs obligatoires manquants' })
    }

    const existe = await prisma.utilisateur.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existe) return res.status(409).json({ message: 'Email déjà utilisé' })

    const hash = await bcrypt.hash(mot_de_passe, 10)
    const user = await prisma.utilisateur.create({
      data: {
        nom, prenom,
        email: email.toLowerCase().trim(),
        telephone: telephone || undefined,
        role, mot_de_passe: hash,
      },
      select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true, createdAt: true },
    })

    // Créer le profil lié
    if (role === 'MEDECIN') {
      await prisma.medecin.create({
        data: { utilisateurId: user.id, specialite: req.body.specialite || 'Médecine générale', consultationTarif: req.body.consultationTarif ? parseInt(req.body.consultationTarif) : 5000 },
      })
    } else if (role === 'PATIENT') {
      const dossierNum = `DOS-${Date.now()}`
      const patient = await prisma.patient.create({ data: { utilisateurId: user.id } })
      await prisma.dossierMedical.create({ data: { patientId: patient.id, numeroDossier: dossierNum } })
    }

    res.status(201).json(user)
  } catch (err) {
    console.error('[admin.creerUtilisateur]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourUtilisateur(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { nom, prenom, email, telephone, actif } = req.body

    const user = await prisma.utilisateur.update({
      where: { id },
      data: {
        ...(nom       !== undefined && { nom }),
        ...(prenom    !== undefined && { prenom }),
        ...(email     !== undefined && { email: email.toLowerCase().trim() }),
        ...(telephone !== undefined && { telephone }),
        ...(actif     !== undefined && { actif: Boolean(actif) }),
      },
      select: { id: true, nom: true, prenom: true, email: true, role: true, actif: true, telephone: true },
    })
    res.json(user)
  } catch (err) {
    console.error('[admin.mettreAJourUtilisateur]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function toggleActifUtilisateur(req, res) {
  try {
    const id   = parseInt(req.params.id)
    const user = await prisma.utilisateur.findUnique({ where: { id }, select: { actif: true } })
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' })

    const updated = await prisma.utilisateur.update({
      where: { id },
      data:  { actif: !user.actif },
      select: { id: true, actif: true },
    })
    res.json(updated)
  } catch (err) {
    console.error('[admin.toggleActifUtilisateur]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Médecins ─────────────────────────────────────────────────────────────────
async function listeMedecins(req, res) {
  try {
    const medecins = await prisma.medecin.findMany({
      include: {
        utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true, actif: true, createdAt: true } },
        _count: { select: { consultations: true, rendezvous: true } },
      },
      orderBy: { utilisateur: { nom: 'asc' } },
    })
    res.json(medecins)
  } catch (err) {
    console.error('[admin.listeMedecins]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourMedecin(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { specialite, description, consultationTarif, numeroOrdre } = req.body

    const medecin = await prisma.medecin.update({
      where: { id },
      data: {
        ...(specialite        !== undefined && { specialite }),
        ...(description       !== undefined && { description }),
        ...(consultationTarif !== undefined && { consultationTarif: parseInt(consultationTarif) }),
        ...(numeroOrdre       !== undefined && { numeroOrdre }),
      },
    })
    res.json(medecin)
  } catch (err) {
    console.error('[admin.mettreAJourMedecin]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Actualités ───────────────────────────────────────────────────────────────
async function listeActualites(req, res) {
  try {
    const actualites = await prisma.actualite.findMany({ orderBy: { createdAt: 'desc' } })
    res.json(actualites)
  } catch (err) {
    console.error('[admin.listeActualites]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function creerActualite(req, res) {
  try {
    const { titre, contenu, image, publiee } = req.body
    if (!titre || !contenu) return res.status(400).json({ message: 'titre et contenu requis' })

    const actu = await prisma.actualite.create({
      data: {
        titre, contenu,
        image:   image   || undefined,
        auteurId: req.user.id,
        publiee: Boolean(publiee),
      },
    })
    res.status(201).json(actu)
  } catch (err) {
    console.error('[admin.creerActualite]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourActualite(req, res) {
  try {
    const id = parseInt(req.params.id)
    const { titre, contenu, image, publiee } = req.body

    const actu = await prisma.actualite.update({
      where: { id },
      data: {
        ...(titre   !== undefined && { titre }),
        ...(contenu !== undefined && { contenu }),
        ...(image   !== undefined && { image }),
        ...(publiee !== undefined && { publiee: Boolean(publiee) }),
      },
    })
    res.json(actu)
  } catch (err) {
    console.error('[admin.mettreAJourActualite]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function supprimerActualite(req, res) {
  try {
    await prisma.actualite.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Actualité supprimée' })
  } catch (err) {
    console.error('[admin.supprimerActualite]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  statistiques, statistiquesAvancees,
  listeUtilisateurs, creerUtilisateur, mettreAJourUtilisateur, toggleActifUtilisateur,
  listeMedecins, mettreAJourMedecin,
  listeActualites, creerActualite, mettreAJourActualite, supprimerActualite,
}
