const router = require('express').Router();
const ctrl   = require('../controllers/actualite.controller');
const auth   = require('../middleware/auth');

router.get('/', auth, ctrl.getAll);

// Déclenchement manuel de la génération (admin)
router.post('/generer', auth, async (req, res) => {
  await ctrl.genererDepuisStock();
  res.json({ message: 'Actualités générées' });
});

module.exports = router;
