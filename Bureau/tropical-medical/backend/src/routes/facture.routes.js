const router = require('express').Router();
const ctrl = require('../controllers/facture.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/roleCheck');

router.get('/stats',  auth, role('receptionniste', 'admin'), ctrl.getStats);
router.get('/',       auth, ctrl.getAll);
router.get('/:id',    auth, ctrl.getOne);
router.post('/',      auth, role('receptionniste', 'admin'), ctrl.create);
router.put('/:id',    auth, role('receptionniste', 'admin'), ctrl.update);
router.delete('/:id', auth, role('receptionniste', 'admin'), ctrl.remove);

module.exports = router;
