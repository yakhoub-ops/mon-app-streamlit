const router = require('express').Router();
const ctrl = require('../controllers/ordonnance.controller');
const auth = require('../middleware/auth');

router.get('/medicaments', auth, ctrl.getMedicaments);
router.post('/medicaments', auth, ctrl.createMedicament);
router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.patch('/:id/statut', auth, ctrl.updateStatut);

module.exports = router;
