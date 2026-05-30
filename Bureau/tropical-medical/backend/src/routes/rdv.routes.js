const router = require('express').Router();
const ctrl   = require('../controllers/rdv.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

router.get('/',     auth, ctrl.getAll);
router.get('/:id',  auth, ctrl.getOne);

// Création : patient, réceptionniste, admin
router.post('/', auth, role('patient', 'receptionniste', 'admin'), ctrl.create);

// Mise à jour statut / données (droits fins gérés dans le controller)
router.put('/:id',    auth, ctrl.update);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
