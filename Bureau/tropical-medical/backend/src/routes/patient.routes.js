const router    = require('express').Router()
const ctrl      = require('../controllers/patient.controller')
const actu      = require('../controllers/actualite.controller')
const auth      = require('../middlewares/auth')
const roleCheck = require('../middlewares/roleCheck')

const garde = [auth, roleCheck('PATIENT')]

router.get('/profil',            ...garde, ctrl.monProfil)
router.put('/profil',            ...garde, ctrl.mettreAJourProfil)
router.put('/avatar',            ...garde, ctrl.mettreAJourAvatar)
router.get('/rdv',               ...garde, ctrl.mesRdv)
router.post('/rdv',              ...garde, ctrl.prendreRdv)
router.put('/rdv/:id/annuler',   ...garde, ctrl.annulerRdv)
router.get('/dossier',           ...garde, ctrl.monDossier)
router.get('/ordonnances',       ...garde, ctrl.mesOrdonnances)
router.get('/factures',               ...garde, ctrl.mesFactures)
router.post('/factures/:id/payer',    ...garde, ctrl.payerFacture)

// Actualités santé (lecture seule)
router.get('/actualites',             ...garde, actu.listerPubliees)

module.exports = router
