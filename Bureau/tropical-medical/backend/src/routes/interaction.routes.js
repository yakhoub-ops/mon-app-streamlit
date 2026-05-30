const router = require('express').Router();
const ctrl   = require('../controllers/interaction.controller');
const auth   = require('../middleware/auth');

router.get('/',          auth, ctrl.getAll);
router.post('/checker',  auth, ctrl.checker);
router.post('/',         auth, ctrl.create);
router.put('/:id',       auth, ctrl.update);
router.delete('/:id',    auth, ctrl.remove);

module.exports = router;
