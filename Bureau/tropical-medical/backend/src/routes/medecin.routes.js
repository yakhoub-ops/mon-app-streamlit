const router = require('express').Router();
const ctrl   = require('../controllers/medecin.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',        auth, ctrl.getAll);
router.get('/:id',     auth, ctrl.getOne);
router.put('/:id',     auth, ctrl.update);

router.get('/:id/disponibilites', auth, ctrl.getDisponibilites);
router.put('/:id/disponibilites', auth, role('medecin', 'admin'), ctrl.updateDisponibilites);

router.get('/:id/creneaux', auth, ctrl.getCreneaux);

module.exports = router;
