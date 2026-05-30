const router = require('express').Router();
const ctrl   = require('../controllers/consultation.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',      auth, ctrl.getAll);
router.get('/:id',   auth, ctrl.getOne);
router.post('/',     auth, role('medecin'), ctrl.create);
router.put('/:id',   auth, role('medecin', 'admin'), ctrl.update);
router.delete('/:id',auth, role('medecin', 'admin'), ctrl.remove);

module.exports = router;
