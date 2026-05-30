const router = require('express').Router();
const ctrl   = require('../controllers/ordonnance.controller');
const auth   = require('../middleware/auth');
const role   = require('../middleware/roleCheck');

// Liste des médicaments (pour formulaire ordonnance)
// Placé AVANT /:id pour ne pas être capturé
router.get('/medicaments', auth, ctrl.getMedicaments);

router.get('/',      auth, ctrl.getAll);
router.get('/:id',   auth, ctrl.getOne);
router.post('/',     auth, role('medecin'), ctrl.create);
router.put('/:id',   auth, role('medecin', 'pharmacien', 'admin'), ctrl.update);
router.delete('/:id',auth, role('medecin', 'admin'), ctrl.remove);

module.exports = router;
