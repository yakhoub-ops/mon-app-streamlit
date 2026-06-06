const router = require('express').Router();
const ctrl = require('../controllers/patient.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/me', auth, ctrl.getMePatient);
router.get('/:id', auth, ctrl.getById);
router.put('/:id', auth, ctrl.update);

module.exports = router;
