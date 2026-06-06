const router = require('express').Router();
const ctrl = require('../controllers/urgence.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.create);
router.patch('/:id/statut', auth, ctrl.updateStatut);

module.exports = router;
