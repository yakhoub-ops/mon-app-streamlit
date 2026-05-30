const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

// Spécifiques AVANT /:id
router.get('/unread-count',   auth, ctrl.getUnreadCount);
router.put('/mark-all-read',  auth, ctrl.markAllRead);

router.get('/',      auth, ctrl.getAll);
router.put('/:id',   auth, ctrl.markRead);
router.delete('/:id',auth, ctrl.remove);

module.exports = router;
