const express   = require('express')
const router    = express.Router()
const auth      = require('../middlewares/auth')
const roleCheck = require('../middlewares/roleCheck')
const c         = require('../controllers/admin.controller')

const guard = [auth, roleCheck('ADMIN')]

router.get('/statistiques',                    ...guard, c.statistiques)
router.get('/statistiques/avancees',           ...guard, c.statistiquesAvancees)

// Utilisateurs
router.get('/utilisateurs',                    ...guard, c.listeUtilisateurs)
router.post('/utilisateurs',                   ...guard, c.creerUtilisateur)
router.put('/utilisateurs/:id',                ...guard, c.mettreAJourUtilisateur)
router.put('/utilisateurs/:id/toggle-actif',   ...guard, c.toggleActifUtilisateur)

// Médecins
router.get('/medecins',                        ...guard, c.listeMedecins)
router.put('/medecins/:id',                    ...guard, c.mettreAJourMedecin)

// Actualités
router.get('/actualites',                      ...guard, c.listeActualites)
router.post('/actualites',                     ...guard, c.creerActualite)
router.put('/actualites/:id',                  ...guard, c.mettreAJourActualite)
router.delete('/actualites/:id',               ...guard, c.supprimerActualite)

module.exports = router
