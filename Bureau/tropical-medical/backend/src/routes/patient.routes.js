const router = require('express').Router();
const ctrl   = require('../controllers/patient.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

// Lecture : médecin, réceptionniste, admin
const canRead = role('medecin', 'receptionniste', 'admin');
// Écriture : réceptionniste, admin
const canWrite = role('receptionniste', 'admin');

router.get('/',      auth, canRead,  ctrl.getAll);
router.get('/:id',   auth, canRead,  ctrl.getOne);
router.post('/',     auth, canWrite, ctrl.create);
router.put('/:id',   auth, canWrite, ctrl.update);
router.delete('/:id',auth, canWrite, ctrl.remove);

module.exports = router;
