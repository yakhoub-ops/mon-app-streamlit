const prisma = require('../config/prisma')
const { creerNotification } = require('../helpers/notificationHelper')

const URGENCE_PRIO = { CRITIQUE: 4, URGENT: 3, MODERE: 2, FAIBLE: 1 }

async function getMedecin(userId) {
  return prisma.medecin.findUnique({
    where: { utilisateurId: userId },
    include: { utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } } },
  })
}

// GET /api/medecin/profil
async function monProfil(req, res) {
  try {
    const medecin = await getMedecin(req.user.id)
    if (!medecin) return res.status(404).json({ message: 'Profil médecin introuvable' })
    res.json(medecin)
  } catch (err) {
    console.error('[medecin.monProfil]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/medecin/teleconsultation/statut
async function toggleTeleconsultation(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const { actif } = req.body
    const nouvelEtat = typeof actif === 'boolean' ? actif : !medecin.teleconsultationActive

    const updated = await prisma.medecin.update({
      where: { id: medecin.id },
      data: { teleconsultationActive: nouvelEtat },
    })

    res.json({ teleconsultationActive: updated.teleconsultationActive })
  } catch (err) {
    console.error('[medecin.toggleTeleconsultation]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/medecin/profil
async function mettreAJourProfil(req, res) {
  try {
    const { nom, prenom, telephone, specialite, description, consultationTarif } = req.body
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Profil médecin introuvable' })

    await prisma.utilisateur.update({
      where: { id: req.user.id },
      data: { ...(nom && { nom }), ...(prenom && { prenom }), ...(telephone && { telephone }) },
    })

    const updated = await prisma.medecin.update({
      where: { id: medecin.id },
      data: {
        ...(specialite && { specialite }),
        ...(description !== undefined && { description }),
        ...(consultationTarif && { consultationTarif: parseInt(consultationTarif) }),
      },
      include: { utilisateur: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } } },
    })
    res.json(updated)
  } catch (err) {
    console.error('[medecin.mettreAJourProfil]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/statistiques
async function mesStatistiques(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
    const debutMois = new Date(today.getFullYear(), today.getMonth(), 1)

    const [rdvAujourdhui, rdvSemaine, consultationsMois, enAttente] = await Promise.all([
      prisma.rendezVous.count({
        where: { medecinId: medecin.id, date: { gte: today, lt: tomorrow }, statut: { not: 'ANNULE' } },
      }),
      prisma.rendezVous.count({
        where: { medecinId: medecin.id, date: { gte: today }, statut: { not: 'ANNULE' } },
      }),
      prisma.consultation.count({
        where: { medecinId: medecin.id, createdAt: { gte: debutMois } },
      }),
      prisma.passageFileAttente.count({
        where: { medecinId: medecin.id, statut: { in: ['EN_ATTENTE', 'APPELE'] } },
      }),
    ])

    res.json({ rdvAujourdhui, rdvSemaine, consultationsMois, enAttente })
  } catch (err) {
    console.error('[medecin.mesStatistiques]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/agenda
async function monAgenda(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const rdvs = await prisma.rendezVous.findMany({
      where: { medecinId: medecin.id, statut: { not: 'ANNULE' } },
      include: {
        patient: {
          include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } },
        },
        teleconsultation: { select: { id: true, urlVisio: true, statut: true } },
      },
      orderBy: { date: 'asc' },
    })
    res.json(rdvs)
  } catch (err) {
    console.error('[medecin.monAgenda]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/file-attente
async function fileAttente(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const passages = await prisma.passageFileAttente.findMany({
      where: { medecinId: medecin.id, statut: { in: ['EN_ATTENTE', 'APPELE'] } },
      include: {
        patient: {
          include: {
            utilisateur: { select: { nom: true, prenom: true, telephone: true } },
            dossier: { select: { id: true, numeroDossier: true } },
          },
        },
        rendezvous: { select: { id: true, type: true, motif: true } },
      },
    })

    passages.sort((a, b) => {
      const pA = URGENCE_PRIO[a.niveauUrgence] || 1
      const pB = URGENCE_PRIO[b.niveauUrgence] || 1
      if (pB !== pA) return pB - pA
      return new Date(a.heureArrivee) - new Date(b.heureArrivee)
    })

    res.json(passages)
  } catch (err) {
    console.error('[medecin.fileAttente]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/medecin/file-attente/:id/appeler
async function appellerPatient(req, res) {
  try {
    const passage = await prisma.passageFileAttente.update({
      where: { id: parseInt(req.params.id) },
      data: { statut: 'APPELE', heureAppel: new Date() },
      include: {
        patient: { include: { utilisateur: { select: { id: true, nom: true, prenom: true } } } },
      },
    })

    const io = req.app.get('io')
    io.to(`user:${passage.patient.utilisateurId}`).emit('appel_patient', {
      message: 'Le médecin vous appelle, veuillez vous présenter',
      passageId: passage.id,
    })
    await creerNotification(io, passage.patient.utilisateurId,
      'Vous êtes appelé(e)',
      'Le médecin vous appelle. Veuillez vous présenter en salle de consultation.',
      { lien: '/patient/tableau-bord' }
    )

    res.json(passage)
  } catch (err) {
    console.error('[medecin.appellerPatient]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/medecin/consultations
async function creerConsultation(req, res) {
  try {
    const {
      passageId, dossierId, motif, anamnese, examenClinique,
      diagnostic, traitement, notes, prochainRdv, ordonnance,
    } = req.body

    if (!dossierId) return res.status(400).json({ message: 'dossierId requis' })

    const medecin = await getMedecin(req.user.id)
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const consultation = await prisma.consultation.create({
      data: {
        dossierId: parseInt(dossierId),
        medecinId: medecin.id,
        ...(passageId && { passageId: parseInt(passageId) }),
        ...(motif && { motif }),
        ...(anamnese && { anamnese }),
        ...(examenClinique && { examenClinique }),
        ...(diagnostic && { diagnostic }),
        ...(traitement && { traitement }),
        ...(notes && { notes }),
        ...(prochainRdv && { prochainRdv: new Date(prochainRdv) }),
      },
    })

    // Mettre à jour le passage + créer facture
    if (passageId) {
      const passage = await prisma.passageFileAttente.update({
        where: { id: parseInt(passageId) },
        data: { statut: 'CONSULTE' },
        include: { rendezvous: true },
      })

      if (passage.rendezvousId) {
        await prisma.rendezVous.update({
          where: { id: passage.rendezvousId },
          data: { statut: 'TERMINE' },
        })
      }

      const dossier = await prisma.dossierMedical.findUnique({
        where: { id: parseInt(dossierId) },
        include: { patient: { include: { assurance: true } } },
      })

      if (dossier) {
        const tarif = medecin.consultationTarif || 5000
        const taux = dossier.patient.assurance ? dossier.patient.assurance.tauxCouverture : 0
        const montantAssurance = Math.round(tarif * taux / 100)
        const montantPatient = tarif - montantAssurance

        await prisma.facture.create({
          data: {
            patientId: dossier.patient.id,
            consultationId: consultation.id,
            numero: `FAC-${Date.now()}`,
            montantTotal: tarif,
            montantAssurance,
            montantPatient,
            lignes: {
              create: [{
                description: `Consultation Dr. ${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`,
                quantite: 1,
                prixUnitaire: tarif,
                montant: tarif,
              }],
            },
          },
        })
      }
    }

    // Créer ordonnance
    if (ordonnance && ordonnance.lignes && ordonnance.lignes.length > 0) {
      await prisma.ordonnance.create({
        data: {
          dossierId: parseInt(dossierId),
          consultationId: consultation.id,
          medecinNom: `${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`,
          ...(ordonnance.instructions && { instructions: ordonnance.instructions }),
          ...(ordonnance.expirationDate && { expirationDate: new Date(ordonnance.expirationDate) }),
          lignes: {
            create: ordonnance.lignes.map(l => ({
              medicamentId: parseInt(l.medicamentId),
              posologie: l.posologie,
              ...(l.duree && { duree: l.duree }),
              quantite: parseInt(l.quantite) || 1,
            })),
          },
        },
      })
    }

    res.status(201).json(consultation)
  } catch (err) {
    console.error('[medecin.creerConsultation]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/dossiers
async function mesDossiers(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const { q } = req.query

    const consultations = await prisma.consultation.findMany({
      where: { medecinId: medecin.id },
      include: {
        dossier: {
          include: {
            patient: {
              include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Dédupliquer par dossierId
    const seen = new Set()
    let dossiers = []
    for (const c of consultations) {
      if (!seen.has(c.dossier.id)) {
        seen.add(c.dossier.id)
        dossiers.push(c.dossier)
      }
    }

    // Filtre recherche
    if (q) {
      const ql = q.toLowerCase()
      dossiers = dossiers.filter(d =>
        d.patient.utilisateur.nom.toLowerCase().includes(ql) ||
        d.patient.utilisateur.prenom.toLowerCase().includes(ql) ||
        d.numeroDossier.toLowerCase().includes(ql)
      )
    }

    res.json(dossiers)
  } catch (err) {
    console.error('[medecin.mesDossiers]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/dossiers/:dossierId
async function dossierPatient(req, res) {
  try {
    const dossier = await prisma.dossierMedical.findUnique({
      where: { id: parseInt(req.params.dossierId) },
      include: {
        patient: {
          include: {
            utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } },
            assurance: true,
            hospitalisations: {
              include: { lit: true },
              orderBy: { dateAdmission: 'desc' },
            },
          },
        },
        consultations: {
          include: {
            medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
            ordonnances: { include: { lignes: { include: { medicament: true } } } },
            examens: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        ordonnances: {
          include: { lignes: { include: { medicament: true } } },
          orderBy: { createdAt: 'desc' },
        },
        vaccinations: { orderBy: { dateAdministration: 'desc' } },
        examens: { orderBy: { date: 'desc' } },
      },
    })

    if (!dossier) return res.status(404).json({ message: 'Dossier introuvable' })

    // Inclure les RDVs du patient
    const rdvs = await prisma.rendezVous.findMany({
      where: { patientId: dossier.patient.id },
      include: {
        medecin: { include: { utilisateur: { select: { nom: true, prenom: true } } } },
      },
      orderBy: { date: 'desc' },
    })

    res.json({ ...dossier, rdvs })
  } catch (err) {
    console.error('[medecin.dossierPatient]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// PUT /api/medecin/dossiers/:dossierId
async function mettreAJourDossier(req, res) {
  try {
    const dossierId = parseInt(req.params.dossierId)
    const dossier = await prisma.dossierMedical.findUnique({
      where: { id: dossierId },
      include: { patient: true },
    })
    if (!dossier) return res.status(404).json({ message: 'Dossier introuvable' })

    const {
      // Infos utilisateur
      nom, prenom, telephone, adresse,
      // Infos patient
      dateNaissance, sexe, groupeSanguin, numeroIdentification,
      contactUrgenceNom, contactUrgenceTelephone,
      // Antécédents
      allergies, antecedents, maladiesChroniques,
      antecedentsFamiliaux, chirurgies, hospitalisationsPrecedentes,
    } = req.body

    // Mise à jour utilisateur
    const dataUser = {}
    if (nom !== undefined) dataUser.nom = nom
    if (prenom !== undefined) dataUser.prenom = prenom
    if (telephone !== undefined) dataUser.telephone = telephone
    if (Object.keys(dataUser).length) {
      await prisma.utilisateur.update({ where: { id: dossier.patient.utilisateurId }, data: dataUser })
    }

    // Mise à jour patient
    const dataPatient = {}
    if (dateNaissance !== undefined) dataPatient.dateNaissance = dateNaissance ? new Date(dateNaissance) : null
    if (sexe !== undefined) dataPatient.sexe = sexe
    if (adresse !== undefined) dataPatient.adresse = adresse
    if (groupeSanguin !== undefined) dataPatient.groupeSanguin = groupeSanguin
    if (numeroIdentification !== undefined) dataPatient.numeroIdentification = numeroIdentification
    if (contactUrgenceNom !== undefined) dataPatient.contactUrgenceNom = contactUrgenceNom
    if (contactUrgenceTelephone !== undefined) dataPatient.contactUrgenceTelephone = contactUrgenceTelephone
    if (allergies !== undefined) dataPatient.allergies = allergies
    if (antecedents !== undefined) dataPatient.antecedents = antecedents
    if (maladiesChroniques !== undefined) dataPatient.maladiesChroniques = maladiesChroniques
    if (antecedentsFamiliaux !== undefined) dataPatient.antecedentsFamiliaux = antecedentsFamiliaux
    if (chirurgies !== undefined) dataPatient.chirurgies = chirurgies
    if (hospitalisationsPrecedentes !== undefined) dataPatient.hospitalisationsPrecedentes = hospitalisationsPrecedentes

    if (Object.keys(dataPatient).length) {
      await prisma.patient.update({ where: { id: dossier.patient.id }, data: dataPatient })
    }

    const updated = await prisma.dossierMedical.findUnique({
      where: { id: dossierId },
      include: {
        patient: {
          include: { utilisateur: { select: { nom: true, prenom: true, email: true, telephone: true } }, assurance: true },
        },
      },
    })
    res.json(updated)
  } catch (err) {
    console.error('[medecin.mettreAJourDossier]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/medecin/dossiers/:dossierId/vaccinations
async function ajouterVaccination(req, res) {
  try {
    const { nom, dateAdministration, rappelPrevu, notes } = req.body
    if (!nom || !dateAdministration) return res.status(400).json({ message: 'nom et dateAdministration requis' })

    const vaccination = await prisma.vaccination.create({
      data: {
        dossierId: parseInt(req.params.dossierId),
        nom,
        dateAdministration: new Date(dateAdministration),
        ...(rappelPrevu && { rappelPrevu: new Date(rappelPrevu) }),
        ...(notes && { notes }),
      },
    })
    res.status(201).json(vaccination)
  } catch (err) {
    console.error('[medecin.ajouterVaccination]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// DELETE /api/medecin/vaccinations/:id
async function supprimerVaccination(req, res) {
  try {
    await prisma.vaccination.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Vaccination supprimée' })
  } catch (err) {
    console.error('[medecin.supprimerVaccination]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/medecin/dossiers/:dossierId/examens
async function ajouterExamen(req, res) {
  try {
    const { type, titre, description, resultats, date, consultationId } = req.body
    if (!titre) return res.status(400).json({ message: 'titre requis' })

    const examen = await prisma.examenMedical.create({
      data: {
        dossierId: parseInt(req.params.dossierId),
        type: type || 'AUTRE',
        titre,
        ...(description && { description }),
        ...(resultats && { resultats }),
        ...(date && { date: new Date(date) }),
        ...(consultationId && { consultationId: parseInt(consultationId) }),
      },
    })
    res.status(201).json(examen)
  } catch (err) {
    console.error('[medecin.ajouterExamen]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// DELETE /api/medecin/examens/:id
async function supprimerExamen(req, res) {
  try {
    await prisma.examenMedical.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Examen supprimé' })
  } catch (err) {
    console.error('[medecin.supprimerExamen]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/medicaments
async function listeMedicaments(req, res) {
  try {
    const { q } = req.query
    const meds = await prisma.medicament.findMany({
      where: {
        actif: true,
        ...(q ? { nom: { contains: q } } : {}),
      },
      orderBy: { nom: 'asc' },
      take: 50,
    })
    res.json(meds)
  } catch (err) {
    console.error('[medecin.listeMedicaments]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/consultations
async function mesConsultations(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const { q } = req.query
    const consultations = await prisma.consultation.findMany({
      where: { medecinId: medecin.id },
      include: {
        dossier: {
          include: {
            patient: {
              include: { utilisateur: { select: { nom: true, prenom: true, telephone: true } } },
            },
          },
        },
        ordonnances: { select: { id: true, statut: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (q) {
      const ql = q.toLowerCase()
      return res.json(consultations.filter(c =>
        c.dossier.patient.utilisateur.nom.toLowerCase().includes(ql) ||
        c.dossier.patient.utilisateur.prenom.toLowerCase().includes(ql)
      ))
    }

    res.json(consultations)
  } catch (err) {
    console.error('[medecin.mesConsultations]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/ordonnances
async function mesOrdonnances(req, res) {
  try {
    const medecin = await getMedecin(req.user.id)
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const medecinNom = `${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`

    const ordonnances = await prisma.ordonnance.findMany({
      where: {
        OR: [
          { consultation: { medecinId: medecin.id } },
          { consultationId: null, medecinNom: medecinNom },
        ],
      },
      include: {
        dossier: {
          include: {
            patient: {
              include: { utilisateur: { select: { nom: true, prenom: true } } },
            },
          },
        },
        lignes: { include: { medicament: { select: { nom: true, forme: true, dosage: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    })

    res.json(ordonnances)
  } catch (err) {
    console.error('[medecin.mesOrdonnances]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// POST /api/medecin/ordonnances
async function creerOrdonnanceDirecte(req, res) {
  try {
    const medecin = await getMedecin(req.user.id)
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const { dossierId, instructions, expirationDate, lignes } = req.body
    if (!dossierId) return res.status(400).json({ message: 'dossierId requis' })
    if (!lignes || lignes.length === 0) return res.status(400).json({ message: 'Au moins un médicament requis' })

    const ordonnance = await prisma.ordonnance.create({
      data: {
        dossierId: parseInt(dossierId),
        medecinNom: `${medecin.utilisateur.prenom} ${medecin.utilisateur.nom}`,
        ...(instructions && { instructions }),
        ...(expirationDate && { expirationDate: new Date(expirationDate) }),
        lignes: {
          create: lignes.map(l => ({
            medicamentId: parseInt(l.medicamentId),
            posologie: l.posologie,
            ...(l.duree && { duree: l.duree }),
            quantite: parseInt(l.quantite) || 1,
          })),
        },
      },
      include: {
        lignes: { include: { medicament: true } },
      },
    })

    res.status(201).json(ordonnance)
  } catch (err) {
    console.error('[medecin.creerOrdonnanceDirecte]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

// GET /api/medecin/urgences
async function mesUrgences(req, res) {
  try {
    const medecin = await prisma.medecin.findUnique({ where: { utilisateurId: req.user.id } })
    if (!medecin) return res.status(404).json({ message: 'Médecin introuvable' })

    const passages = await prisma.passageFileAttente.findMany({
      where: {
        medecinId: medecin.id,
        statut: { in: ['EN_ATTENTE', 'APPELE'] },
        niveauUrgence: { in: ['CRITIQUE', 'URGENT'] },
      },
      include: {
        patient: {
          include: {
            utilisateur: { select: { nom: true, prenom: true, telephone: true } },
            dossier: { select: { id: true, numeroDossier: true } },
          },
        },
        rendezvous: { select: { id: true, type: true, motif: true } },
      },
      orderBy: [{ niveauUrgence: 'desc' }, { heureArrivee: 'asc' }],
    })

    res.json(passages)
  } catch (err) {
    console.error('[medecin.mesUrgences]', err)
    res.status(500).json({ message: 'Erreur serveur' })
  }
}

module.exports = {
  monProfil,
  toggleTeleconsultation,
  mettreAJourProfil,
  mesStatistiques,
  monAgenda,
  fileAttente,
  appellerPatient,
  creerConsultation,
  mesDossiers,
  dossierPatient,
  mettreAJourDossier,
  ajouterVaccination,
  supprimerVaccination,
  ajouterExamen,
  supprimerExamen,
  listeMedicaments,
  mesConsultations,
  mesOrdonnances,
  creerOrdonnanceDirecte,
  mesUrgences,
}
