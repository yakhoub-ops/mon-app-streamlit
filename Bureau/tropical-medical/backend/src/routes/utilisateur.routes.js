const router = require('express').Router();
const ctrl = require('../controllers/utilisateur.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/roleCheck');

router.get('/', auth, role('admin', 'receptionniste'), ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('admin'), ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.patch('/:id/toggle', auth, role('admin'), ctrl.toggleActif);

module.exports = router;
