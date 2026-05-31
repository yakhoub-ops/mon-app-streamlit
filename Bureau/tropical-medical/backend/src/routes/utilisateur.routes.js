const router = require('express').Router();
const ctrl   = require('../controllers/utilisateur.controller');
const auth   = require('../middleware/auth');

router.get('/stats',        auth, ctrl.stats);
router.get('/',             auth, ctrl.getAll);
router.get('/:id',          auth, ctrl.getOne);
router.post('/',            auth, ctrl.create);
router.put('/:id',          auth, ctrl.update);
router.post('/:id/reset-password', auth, ctrl.resetPassword);
router.delete('/:id',       auth, ctrl.remove);

module.exports = router;
