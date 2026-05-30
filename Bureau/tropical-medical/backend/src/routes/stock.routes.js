const router = require('express').Router();
const ctrl = require('../controllers/stock.controller');
const auth = require('../middleware/auth');
const role = require('../middleware/roleCheck');

// Routes spécifiques AVANT /:id
router.get('/alertes',           auth, role('pharmacien', 'admin', 'medecin'), ctrl.getAlertes);
router.get('/peremptions',       auth, role('pharmacien', 'admin'), ctrl.getPeremptions);
router.get('/mouvements',        auth, role('pharmacien', 'admin'), ctrl.getMouvementsAll);
router.get('/:id/mouvements',    auth, role('pharmacien', 'admin'), ctrl.getMouvements);
router.post('/:id/entree',       auth, role('pharmacien', 'admin'), ctrl.entree);
router.post('/:id/sortie',       auth, role('pharmacien', 'admin'), ctrl.sortie);

router.get('/',      auth, role('pharmacien', 'admin', 'medecin'), ctrl.getAll);
router.get('/:id',   auth, role('pharmacien', 'admin', 'medecin'), ctrl.getOne);
router.post('/',     auth, role('pharmacien', 'admin'), ctrl.create);
router.put('/:id',   auth, role('pharmacien', 'admin'), ctrl.update);
router.delete('/:id',auth, role('pharmacien', 'admin'), ctrl.remove);

module.exports = router;
