const router = require('express').Router();
const ctrl   = require('../controllers/dossier.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

const canRead  = role('medecin', 'receptionniste', 'admin', 'patient');
const canWrite = role('medecin', 'admin');

// /api/dossiers/patient/:id_patient
router.get('/patient/:id_patient',  auth, canRead,  ctrl.getByPatient);
router.put('/patient/:id_patient',  auth, canWrite, ctrl.updateByPatient);

module.exports = router;
