const router = require('express').Router();
const ctrl = require('../controllers/fileAttente.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/roleCheck');

router.get('/',      auth, role('receptionniste', 'medecin', 'admin'), ctrl.getAll);
router.get('/:id',   auth, role('receptionniste', 'medecin', 'admin'), ctrl.getOne);
router.post('/',     auth, role('receptionniste', 'admin'), ctrl.create);
router.put('/:id',   auth, role('receptionniste', 'medecin', 'admin'), ctrl.update);
router.delete('/:id',auth, role('receptionniste', 'admin'), ctrl.remove);

module.exports = router;
