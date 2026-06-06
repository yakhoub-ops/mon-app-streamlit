const router = require('express').Router();
const ctrl = require('../controllers/interaction.controller');
const auth = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);
router.post('/check', auth, ctrl.check);
router.post('/', auth, ctrl.create);
router.delete('/:id', auth, ctrl.remove);

module.exports = router;
