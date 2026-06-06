const router = require('express').Router();
const ctrl = require('../controllers/consultation.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.get('/:id', auth, ctrl.getById);
router.post('/', auth, ctrl.create);
router.put('/:id', auth, ctrl.update);

module.exports = router;
