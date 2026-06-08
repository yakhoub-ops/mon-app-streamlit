const prisma = require('../config/prisma')

async function getPatient(utilisateurId) {
  return prisma.patient.findUnique({
    where: { utilisateurId },
    include: { utilisateur: { select: { nom:true, prenom:true, email:true, telephone:true } }, assurance: true },
  })
}

async function monProfil(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    res.json(p)
  } catch (e) { console.error('[patient.monProfil]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function mettreAJourProfil(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const { telephone, adresse, groupeSanguin, allergies, antecedents } = req.body
    const updated = await prisma.patient.update({
      where: { id: p.id },
      data: { ...(telephone && {}), adresse, groupeSanguin, allergies, antecedents },
    })
    if (telephone) {
      await prisma.utilisateur.update({ where: { id: req.user.id }, data: { telephone } })
    }
    res.json(updated)
  } catch (e) { console.error('[patient.mettreAJourProfil]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function mesRdv(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const rdvs = await prisma.rendezVous.findMany({
      where: { patientId: p.id },
      include: {
        medecin: { include: { utilisateur: { select: { nom:true, prenom:true } } } },
        teleconsultation: true,
      },
      orderBy: { date: 'desc' },
    })
    res.json(rdvs)
  } catch (e) { console.error('[patient.mesRdv]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function prendreRdv(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const { medecinId, date, type, motif } = req.body
    if (!medecinId || !date || !type) return res.status(400).json({ message: 'medecinId, date et type sont requis' })
    const med = await prisma.medecin.findUnique({ where: { id: parseInt(medecinId) } })
    if (!med) return res.status(404).json({ message: 'Médecin introuvable' })

    const rdv = await prisma.rendezVous.create({
      data: { patientId: p.id, medecinId: parseInt(medecinId), date: new Date(date), type, motif: motif || null, statut: 'EN_ATTENTE' },
      include: { medecin: { include: { utilisateur: { select: { nom:true, prenom:true } } } } },
    })

    if (type === 'TELECONSULTATION') {
      const rnd = Math.random().toString(36).substring(2, 8)
      await prisma.teleconsultation.create({
        data: { rendezvousId: rdv.id, medecinId: parseInt(medecinId), urlVisio: `https://meet.jit.si/tropical-rdv-${rdv.id}-${rnd}`, plateforme: 'JITSI', statut: 'PLANIFIEE' },
      })
    }
    res.status(201).json(rdv)
  } catch (e) { console.error('[patient.prendreRdv]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function annulerRdv(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const rdv = await prisma.rendezVous.findFirst({ where: { id: parseInt(req.params.id), patientId: p.id } })
    if (!rdv) return res.status(404).json({ message: 'Rendez-vous introuvable' })
    if (['ANNULE', 'TERMINE'].includes(rdv.statut)) return res.status(400).json({ message: 'Impossible d\'annuler ce RDV' })
    const updated = await prisma.rendezVous.update({ where: { id: rdv.id }, data: { statut: 'ANNULE' } })
    res.json(updated)
  } catch (e) { console.error('[patient.annulerRdv]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function monDossier(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const dossier = await prisma.dossierMedical.findUnique({
      where: { patientId: p.id },
      include: {
        consultations: {
          include: {
            medecin: { include: { utilisateur: { select: { nom:true, prenom:true } } } },
            ordonnances: { include: { lignes: { include: { medicament: { select: { nom:true, forme:true } } } } } },
          },
          orderBy: { date: 'desc' },
        },
      },
    })
    if (!dossier) return res.status(404).json({ message: 'Dossier médical introuvable' })
    res.json({ patient: p, dossier })
  } catch (e) { console.error('[patient.monDossier]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function mesOrdonnances(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const dos = await prisma.dossierMedical.findUnique({ where: { patientId: p.id } })
    if (!dos) return res.json([])
    const ordos = await prisma.ordonnance.findMany({
      where: { dossierId: dos.id },
      include: {
        lignes: {
          include: {
            medicament: { select: { nom: true, forme: true, description: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    })
    res.json(ordos)
  } catch (e) { console.error('[patient.mesOrdonnances]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function mesFactures(req, res) {
  try {
    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' })
    const factures = await prisma.facture.findMany({
      where: { patientId: p.id },
      include: { lignes: true, paiements: { include: { transactionMobile: true } } },
      orderBy: { date: 'desc' },
    })
    res.json(factures)
  } catch (e) { console.error('[patient.mesFactures]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function payerFacture(req, res) {
  try {
    const factureId = parseInt(req.params.id)
    const { mode, operateur, telephone } = req.body

    const p = await getPatient(req.user.id)
    if (!p) return res.status(404).json({ message: 'Patient introuvable' })

    const facture = await prisma.facture.findUnique({ where: { id: factureId } })
    if (!facture)                       return res.status(404).json({ message: 'Facture introuvable' })
    if (facture.patientId !== p.id)     return res.status(403).json({ message: 'Non autorisé' })
    if (facture.statut === 'PAYEE')     return res.status(409).json({ message: 'Facture déjà payée' })

    const reference = `TM-${Date.now().toString(36).toUpperCase()}`

    const paiement = await prisma.$transaction(async (tx) => {
      const pay = await tx.paiement.create({
        data: { factureId, montant: facture.montantTotal, mode: mode || 'MOBILE_MONEY', statut: 'REUSSI', reference },
      })
      if (mode === 'MOBILE_MONEY' && operateur) {
        await tx.transactionMobile.create({
          data: { paiementId: pay.id, operateur, telephone: telephone || '', statut: 'REUSSI', reference },
        })
      }
      await tx.facture.update({ where: { id: factureId }, data: { statut: 'PAYEE' } })
      return pay
    })

    const io = req.app.get('io')
    const { creerNotification } = require('../helpers/notificationHelper')

    // Notification patient
    await creerNotification(io, req.user.id,
      '✅ Paiement confirmé',
      `Votre paiement de ${facture.montantTotal.toLocaleString('fr-SN')} FCFA a été enregistré. Réf. : ${reference}`,
      { lien: '/patient/factures' }
    )

    // Notification + événement temps-réel pour les réceptionnistes
    const receptionnistes = await prisma.utilisateur.findMany({ where: { role: 'RECEPTIONNISTE', actif: true } })
    const nomPatient = `${p.utilisateur.prenom} ${p.utilisateur.nom}`
    const payloadSocket = {
      factureId,
      reference,
      montant:    facture.montantTotal,
      mode:       mode || 'MOBILE_MONEY',
      nomPatient,
      payeAt:     new Date().toISOString(),
    }
    if (io) io.to('role:RECEPTIONNISTE').emit('paiement_patient', payloadSocket)
    for (const r of receptionnistes) {
      await creerNotification(io, r.id,
        '💳 Paiement reçu d\'un patient',
        `${nomPatient} vient de payer sa facture #${String(factureId).padStart(5,'0')} — ${facture.montantTotal.toLocaleString('fr-SN')} FCFA (${mode || 'Mobile Money'}).`,
        { lien: '/receptionniste/factures' }
      )
    }

    res.json({ paiement, reference, message: 'Paiement effectué avec succès' })
  } catch (err) {
    console.error('[patient.payerFacture]', err)
    res.status(500).json({ message: 'Erreur lors du paiement' })
  }
}

async function mettreAJourAvatar(req, res) {
  try {
    const { avatar } = req.body
    if (avatar === undefined) return res.status(400).json({ message: 'Champ avatar requis' })
    if (avatar !== '' && !avatar.startsWith('data:image/')) return res.status(400).json({ message: 'Format invalide — data URL attendu' })
    const updated = await prisma.utilisateur.update({
      where: { id: req.user.id },
      data: { avatar },
      select: { id: true, nom: true, prenom: true, email: true, role: true, avatar: true },
    })
    res.json(updated)
  } catch (e) { console.error('[patient.mettreAJourAvatar]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

async function listeMedecins(req, res) {
  try {
    const medecins = await prisma.medecin.findMany({
      where: { utilisateur: { actif: true } },
      include: { utilisateur: { select: { nom:true, prenom:true, telephone:true } } },
      orderBy: { specialite: 'asc' },
    })
    res.json(medecins)
  } catch (e) { console.error('[listeMedecins]', e); res.status(500).json({ message: 'Erreur serveur' }) }
}

module.exports = { monProfil, mettreAJourProfil, mettreAJourAvatar, mesRdv, prendreRdv, annulerRdv, monDossier, mesOrdonnances, mesFactures, payerFacture, listeMedecins }
