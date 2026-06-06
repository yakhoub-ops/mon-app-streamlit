const router = require('express').Router();
const ctrl = require('../controllers/facture.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/stats', auth, ctrl.getStats);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.patch('/:id/payer', auth, ctrl.payer);

module.exports = router;
