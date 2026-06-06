const router = require('express').Router();
const ctrl = require('../controllers/stock.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/alertes', auth, ctrl.getAlertes);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.post('/:id/mouvement', auth, ctrl.mouvement);

module.exports = router;
