const express = require('express')
const router  = express.Router()
const auth    = require('../middlewares/auth')
const c       = require('../controllers/notifications.controller')

router.get('/',                auth, c.mesNotifications)
router.put('/lire-toutes',     auth, c.marquerToutesLues)
router.put('/:id/lire',        auth, c.marquerLue)

module.exports = router
