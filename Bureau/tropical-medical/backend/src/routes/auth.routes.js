const router = require('express').Router()
const { connexion, me, changerMotDePasse } = require('../controllers/auth.controller')
const authMiddleware = require('../middlewares/auth')

router.post('/connexion', connexion)
router.get('/me', authMiddleware, me)
router.put('/mot-de-passe', authMiddleware, changerMotDePasse)

module.exports = router
