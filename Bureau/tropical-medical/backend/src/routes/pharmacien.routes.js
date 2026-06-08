const express   = require('express')
const router    = express.Router()
const auth      = require('../middlewares/auth')
const roleCheck = require('../middlewares/roleCheck')
const c         = require('../controllers/pharmacien.controller')

const guard = [auth, roleCheck('PHARMACIEN')]

router.get('/statistiques',              ...guard, c.statistiques)

// Ordonnances
router.get('/ordonnances',               ...guard, c.listeOrdonnances)
router.put('/ordonnances/:id/delivrer',  ...guard, c.delivrerOrdonnance)

// Stock médicaments
router.get('/medicaments',                        ...guard, c.listeMedicaments)
router.post('/medicaments',                       ...guard, c.creerMedicament)
router.put('/medicaments/:id',                    ...guard, c.mettreAJourMedicament)
router.patch('/medicaments/:id/url-fournisseur',  ...guard, c.enregistrerUrlFournisseur)
router.get('/alertes-stock',                      ...guard, c.alertesStock)

// Lots / Livraisons
router.get('/lots',                      ...guard, c.listeLots)
router.post('/lots',                     ...guard, c.creerLot)

module.exports = router
