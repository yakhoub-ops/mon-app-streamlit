const router = require('express').Router()
const auth   = require('../middlewares/auth')
const c      = require('../controllers/messagerie.controller')

// Accessible à tout utilisateur connecté
router.get('/conversations',        auth, c.conversations)
router.get('/messages/:userId',     auth, c.messages)
router.post('/envoyer',             auth, c.envoyer)
router.get('/contacts',             auth, c.contacts)
router.get('/non-lus',              auth, c.nonLus)

module.exports = router
