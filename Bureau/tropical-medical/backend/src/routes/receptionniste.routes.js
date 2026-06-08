const express   = require('express')
const router    = express.Router()
const auth      = require('../middlewares/auth')
const roleCheck = require('../middlewares/roleCheck')
const c         = require('../controllers/receptionniste.controller')
const actu      = require('../controllers/actualite.controller')

const guard = [auth, roleCheck('RECEPTIONNISTE')]

router.get('/statistiques',                  ...guard, c.statistiques)

// RDV
router.get('/rdv',                           ...guard, c.listeRdv)
router.post('/rdv',                          ...guard, c.creerRdv)
router.put('/rdv/:id',                       ...guard, c.mettreAJourRdv)

// File d'attente
router.get('/file-attente',                  ...guard, c.fileAttente)
router.post('/file-attente',                 ...guard, c.ajouterFileAttente)
router.put('/file-attente/:id/retirer',      ...guard, c.retirerFileAttente)

// Lits & Hospitalisations
router.get('/lits',                          ...guard, c.listeLits)
router.put('/lits/:id',                      ...guard, c.mettreAJourLit)
router.post('/hospitalisations',             ...guard, c.hospitaliser)
router.put('/hospitalisations/:id/sortie',   ...guard, c.sortieHospitalisation)

// Patients
router.get('/patients',                      ...guard, c.listePatients)

// Factures
router.get('/factures',                      ...guard, c.listeFactures)
router.post('/factures/:id/encaisser',       ...guard, c.encaisserFacture)
router.get('/paiements-recents',             ...guard, c.paiementsRecents)

// Ressources partagées
router.get('/medecins',                      ...guard, c.listeMedecins)

// Actualités
router.get('/actualites',                    ...guard, actu.listerToutes)
router.post('/actualites',                   ...guard, actu.creer)
router.put('/actualites/:id',                ...guard, actu.mettreAJour)
router.patch('/actualites/:id/publier',      ...guard, actu.basculerPublication)
router.delete('/actualites/:id',             ...guard, actu.supprimer)

module.exports = router
