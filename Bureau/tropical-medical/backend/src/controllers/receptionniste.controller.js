const prisma = require('../config/prisma')
const { creerNotification } = require('../helpers/notificationHelper')

// ── Statistiques ────────────────────────────────────────────────────────────
async function statistiques(req, res) {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const demain = new Date(today); demain.setDate(demain.getDate() + 1)

    const [rdvAujourdhui, enAttente, litsLibres, litsTotaux, facImpayees] = await Promise.all([
      prisma.rendezVous.count({ where: { date: { gte: today, lt: demain }, statut: { not: 'ANNULE' } } }),
      prisma.passageFileAttente.count({ where: { statut: { in: ['EN_ATTENTE', 'APPELE'] } } }),
      prisma.lit.count({ where: { statut: 'LIBRE' } }),
      prisma.lit.count(),
      prisma.facture.count({ where: { statut: 'EN_ATTENTE' } }),
    ])

    res.json({ rdvAujourdhui, enAttente, litsLibres, litsTotaux, facImpayees })
  } catch (err) {
    console.error('[recep.statistiques]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Rendez-vous ─────────────────────────────────────────────────────────────
async function listeRdv(req, res) {
  try {
    const { statut, date } = req.query
    const where = {}
    if (statut) where.statut = statut
    if (date) {
      const d = new Date(date); d.setHours(0, 0, 0, 0)
      const d2 = new Date(d); d2.setDate(d2.getDate() + 1)
      where.date = { gte: d, lt: d2 }
    }

    const rdvs = await prisma.rendezVous.findMany({
      where,
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
        medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        teleconsultation: { select: { id: true, urlVisio: true, statut: true } },
      },
      orderBy: { date: 'asc' },
    })
    res.json(rdvs)
  } catch (err) {
    console.error('[recep.listeRdv]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function creerRdv(req, res) {
  try {
    const { patientId, medecinId, date, type, motif } = req.body
    if (!patientId || !medecinId || !date) {
      return res.status(400).json({ message: 'patientId, medecinId et date sont requis' })
    }

    const rdv = await prisma.rendezVous.create({
      data: {
        patientId: parseInt(patientId),
        medecinId: parseInt(medecinId),
        date: new Date(date),
        type: type || 'PRESENTIEL',
        motif: motif || undefined,
        statut: 'CONFIRME',
      },
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      },
    })

    // Créer téléconsultation si besoin
    if (type === 'TELECONSULTATION') {
      const roomId = `tm-${Date.now()}`
      await prisma.teleconsultation.create({
        data: {
          rendezvousId: rdv.id,
          medecinId: parseInt(medecinId),
          urlVisio: `https://meet.jit.si/${roomId}`,
          plateforme: 'JITSI',
          statut: 'PLANIFIEE',
        },
      })
    }

    // Notification patient
    const io = req.app.get('io')
    const dateStr = new Date(date).toLocaleString('fr-SN', { weekday:'long', day:'numeric', month:'long', hour:'2-digit', minute:'2-digit' })
    const patientUserId = rdv.patient.utilisateurId
    if (patientUserId) {
      await creerNotification(io, patientUserId,
        'Rendez-vous confirmé',
        `Votre RDV avec Dr ${rdv.medecin.utilisateur.prenom} ${rdv.medecin.utilisateur.nom} le ${dateStr} est confirmé.`,
        { lien: '/patient/rdv' }
      )
    }

    res.status(201).json(rdv)
  } catch (err) {
    console.error('[recep.creerRdv]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourRdv(req, res) {
  try {
    const { statut, notes } = req.body
    const rdv = await prisma.rendezVous.update({
      where: { id: parseInt(req.params.id) },
      data: { ...(statut && { statut }), ...(notes && { notes }) },
    })

    const io = req.app.get('io')
    const full = await prisma.rendezVous.findUnique({
      where: { id: rdv.id },
      include: { patient: { select: { utilisateurId: true } } },
    })
    if (full?.patient) {
      io.to(`user:${full.patient.utilisateurId}`).emit('rdv_update', { rdvId: rdv.id, statut: rdv.statut })
    }

    res.json(rdv)
  } catch (err) {
    console.error('[recep.mettreAJourRdv]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── File d'attente ─────────────────────────────────────────────────────────
async function fileAttente(req, res) {
  try {
    const passages = await prisma.passageFileAttente.findMany({
      where: { statut: { in: ['EN_ATTENTE', 'APPELE'] } },
      include: {
        patient: {
          include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } },
        },
        medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        rendezvous: { select: { id: true, type: true } },
      },
      orderBy: { heureArrivee: 'asc' },
    })
    res.json(passages)
  } catch (err) {
    console.error('[recep.fileAttente]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function ajouterFileAttente(req, res) {
  try {
    const { patientId, medecinId, niveauUrgence, motif, rendezvousId } = req.body
    if (!patientId) return res.status(400).json({ message: 'patientId requis' })

    const passage = await prisma.passageFileAttente.create({
      data: {
        patientId: parseInt(patientId),
        ...(medecinId && { medecinId: parseInt(medecinId) }),
        niveauUrgence: niveauUrgence || 'FAIBLE',
        motif: motif || undefined,
        ...(rendezvousId && { rendezvousId: parseInt(rendezvousId) }),
      },
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } } },
        medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      },
    })

    const io = req.app.get('io')
    io.to('role:MEDECIN').emit('nouveau_patient', { passageId: passage.id })

    res.status(201).json(passage)
  } catch (err) {
    console.error('[recep.ajouterFileAttente]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function retirerFileAttente(req, res) {
  try {
    const passage = await prisma.passageFileAttente.update({
      where: { id: parseInt(req.params.id) },
      data: { statut: 'PARTI' },
    })
    res.json(passage)
  } catch (err) {
    console.error('[recep.retirerFileAttente]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Lits ────────────────────────────────────────────────────────────────────
async function listeLits(req, res) {
  try {
    const lits = await prisma.lit.findMany({
      include: {
        hospitalisations: {
          where: { statut: 'EN_COURS' },
          include: {
            patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
          take: 1,
        },
      },
      orderBy: [{ etage: 'asc' }, { numero: 'asc' }],
    })
    res.json(lits)
  } catch (err) {
    console.error('[recep.listeLits]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function mettreAJourLit(req, res) {
  try {
    const { statut, notes } = req.body
    const lit = await prisma.lit.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(statut && { statut }),
        ...(notes !== undefined && { notes }),
      },
    })
    res.json(lit)
  } catch (err) {
    console.error('[recep.mettreAJourLit]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function hospitaliser(req, res) {
  try {
    const { litId, patientId, medecinId, motif, coutParJour } = req.body
    if (!litId || !patientId) return res.status(400).json({ message: 'litId et patientId requis' })

    // Transaction : créer hospitalisation + mettre lit OCCUPE
    const [hospitalisation] = await prisma.$transaction([
      prisma.hospitalisation.create({
        data: {
          patientId: parseInt(patientId),
          litId: parseInt(litId),
          ...(medecinId && { medecinId: parseInt(medecinId) }),
          motif: motif || undefined,
          coutParJour: coutParJour ? parseInt(coutParJour) : 15000,
        },
      }),
      prisma.lit.update({
        where: { id: parseInt(litId) },
        data: { statut: 'OCCUPE' },
      }),
    ])

    res.status(201).json(hospitalisation)
  } catch (err) {
    console.error('[recep.hospitaliser]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function sortieHospitalisation(req, res) {
  try {
    const hospitalisation = await prisma.hospitalisation.findUnique({
      where: { id: parseInt(req.params.id) },
    })
    if (!hospitalisation) return res.status(404).json({ message: 'Hospitalisation introuvable' })

    const [updated] = await prisma.$transaction([
      prisma.hospitalisation.update({
        where: { id: hospitalisation.id },
        data: { statut: 'TERMINEE', dateSortie: new Date() },
      }),
      prisma.lit.update({
        where: { id: hospitalisation.litId },
        data: { statut: 'LIBRE' },
      }),
    ])

    res.json(updated)
  } catch (err) {
    console.error('[recep.sortieHospitalisation]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Patients ────────────────────────────────────────────────────────────────
async function listePatients(req, res) {
  try {
    const { q } = req.query
    const patients = await prisma.patient.findMany({
      where: q ? {
        utilisateur: {
          OR: [
            { nom:    { contains: q } },
            { prenom: { contains: q } },
            { email:  { contains: q } },
          ],
        },
      } : undefined,
      include: {
        utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true, createdAt: true } },
        assurance: { select: { organisme: true, type: true } },
        dossier: { select: { id: true, numeroDossier: true } },
      },
      orderBy: { utilisateur: { nom: 'asc' } },
    })
    res.json(patients)
  } catch (err) {
    console.error('[recep.listePatients]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Factures ────────────────────────────────────────────────────────────────
async function listeFactures(req, res) {
  try {
    const { statut } = req.query
    const factures = await prisma.facture.findMany({
      where: statut ? { statut } : undefined,
      include: {
        patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
        lignes: true,
        paiements: true,
        consultation: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    res.json(factures)
  } catch (err) {
    console.error('[recep.listeFactures]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

async function encaisserFacture(req, res) {
  try {
    const { mode, montant, reference } = req.body
    const factureId = parseInt(req.params.id)
    if (!mode || !montant) return res.status(400).json({ message: 'mode et montant requis' })

    const facture = await prisma.facture.findUnique({ where: { id: factureId } })
    if (!facture) return res.status(404).json({ message: 'Facture introuvable' })

    await prisma.$transaction([
      prisma.paiement.create({
        data: {
          factureId,
          montant: parseInt(montant),
          mode,
          statut: 'PAYE',
          reference: reference || undefined,
        },
      }),
      prisma.facture.update({
        where: { id: factureId },
        data: { statut: 'PAYEE' },
      }),
    ])

    const updated = await prisma.facture.findUnique({
      where: { id: factureId },
      include: { patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } }, lignes: true, paiements: true },
    })

    const io = req.app.get('io')
    if (facture) {
      const pat = await prisma.patient.findUnique({ where: { id: facture.patientId } })
      if (pat) {
        io.to(`user:${pat.utilisateurId}`).emit('facture_payee', { factureId })
        await creerNotification(io, pat.utilisateurId,
          'Facture réglée',
          `Votre facture de ${facture.montantTotal?.toLocaleString('fr-SN') || ''} FCFA a bien été encaissée. Merci.`,
          { lien: '/patient/factures' }
        )
      }
    }

    res.json(updated)
  } catch (err) {
    console.error('[recep.encaisserFacture]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Paiements récents (patient en ligne) ────────────────────────────────────
async function paiementsRecents(req, res) {
  try {
    const paiements = await prisma.paiement.findMany({
      take: 15,
      orderBy: { createdAt: 'desc' },
      include: {
        facture: {
          include: {
            patient: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
          },
        },
      },
    })
    res.json(paiements)
  } catch (err) {
    console.error('[recep.paiementsRecents]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// ── Ressources partagées ────────────────────────────────────────────────────
async function listeMedecins(req, res) {
  try {
    const medecins = await prisma.medecin.findMany({
      include: { utilisateur: { select: { nom: true, prenom: true } } },
      orderBy: { utilisateur: { nom: 'asc' } },
    })
    res.json(medecins)
  } catch (err) {
    console.error('[recep.listeMedecins]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  statistiques,
  listeRdv, creerRdv, mettreAJourRdv,
  fileAttente, ajouterFileAttente, retirerFileAttente,
  listeLits, mettreAJourLit, hospitaliser, sortieHospitalisation,
  listePatients,
  listeFactures, encaisserFacture, paiementsRecents,
  listeMedecins,
}
