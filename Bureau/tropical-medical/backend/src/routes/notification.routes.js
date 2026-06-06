const router = require('express').Router();
const ctrl = require('../controllers/notification.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/unread-count', auth, ctrl.getUnreadCount);
router.patch('/:id/read', auth, ctrl.markRead);
router.patch('/read-all', auth, ctrl.markAllRead);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
