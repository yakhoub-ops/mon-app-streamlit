const router = require('express').Router();
const ctrl = require('../controllers/rdv.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.patch('/:id/statut', auth, ctrl.updateStatut);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
