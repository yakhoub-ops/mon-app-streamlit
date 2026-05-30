const router = require('express').Router();
const ctrl   = require('../controllers/teleconsultation.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',                    auth, ctrl.getAll);
router.post('/',                   auth, role('medecin'), ctrl.create);
router.put('/toggle-teleconsult',  auth, role('medecin'), ctrl.toggleMedecinTeleconsult);
router.get('/:id',                 auth, ctrl.getOne);
router.put('/:id',                 auth, ctrl.update);

module.exports = router;
