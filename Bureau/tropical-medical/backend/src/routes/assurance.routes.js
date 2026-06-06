const router = require('express').Router();
const ctrl = require('../controllers/assurance.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/roleCheck');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, role('admin'), ctrl.create);
router.put('/:id', auth, role('admin'), ctrl.update);
router.delete('/:id', auth, role('admin'), ctrl.remove);

module.exports = router;
