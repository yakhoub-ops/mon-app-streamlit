const router = require('express').Router();
const ctrl = require('../controllers/fileAttente.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.post('/', auth, ctrl.add);
router.patch('/:id/appeler', auth, ctrl.appeler);
router.patch('/:id/statut', auth, ctrl.updateStatut);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
