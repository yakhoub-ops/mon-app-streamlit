const router = require('express').Router();
const ctrl = require('../controllers/dossier.controller');
const auth = require('../middleware/auth');

router.get('/patient/:patientId', auth, ctrl.getByPatient);
router.put('/patient/:patientId', auth, ctrl.update);

module.exports = router;
