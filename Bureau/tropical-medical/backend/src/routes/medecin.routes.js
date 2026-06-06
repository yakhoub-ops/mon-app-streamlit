const router = require('express').Router();
const ctrl = require('../controllers/medecin.controller');
const auth = require('../middleware/auth');

router.get('/', ctrl.getAll);
router.get('/:id', ctrl.getById);
router.put('/:id', auth, ctrl.update);
router.get('/:id/disponibilites', ctrl.getDisponibilites);
router.put('/:id/disponibilites', auth, ctrl.setDisponibilites);
router.get('/:id/creneaux', ctrl.getCreneaux);

module.exports = router;
