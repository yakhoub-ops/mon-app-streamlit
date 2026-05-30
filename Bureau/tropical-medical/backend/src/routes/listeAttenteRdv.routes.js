const router = require('express').Router();
const pool   = require('../config/db');
const auth   = require('../middleware/auth');

async function getPatientId(id_util) {
  const [[p]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [id_util]);
  return p?.id_patient;
}

// Lister sa propre liste d'attente (patient) ou toutes (autres rôles)
router.get('/', auth, async (req, res) => {
  try {
    const { id: id_util, role } = req.user;
    const where = [];
    const vals  = [];
    if (role === 'patient') {
      const pid = await getPatientId(id_util);
      where.push('la.id_patient = ?'); vals.push(pid);
    }
    const [rows] = await pool.query(`
      SELECT la.*,
        u.nom AS nom_patient, u.prenom AS prenom_patient,
        um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
      FROM liste_attente_rdv la
      JOIN patient     p   ON la.id_patient = p.id_patient
      JOIN utilisateur u   ON p.id_util     = u.id_util
      JOIN medecin     med ON la.id_medecin = med.id_medecin
      JOIN utilisateur um  ON med.id_util   = um.id_util
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY la.priorite ASC, la.created_at ASC
    `, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// S'inscrire en liste d'attente
router.post('/', auth, async (req, res) => {
  try {
    const { id: id_util, role } = req.user;
    let { id_patient, id_medecin, date_souhaitee, motif, priorite } = req.body;

    if (role === 'patient') {
      id_patient = await getPatientId(id_util);
    }
    if (!id_patient || !id_medecin)
      return res.status(400).json({ error: 'id_patient et id_medecin requis' });

    const [r] = await pool.query(
      `INSERT INTO liste_attente_rdv (id_patient, id_medecin, date_souhaitee, motif, priorite)
       VALUES (?, ?, ?, ?, ?)`,
      [id_patient, id_medecin, date_souhaitee || null, motif || null, priorite ?? 3]
    );
    res.status(201).json({ message: 'Inscrit en liste d\'attente', id_liste: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Retirer de la liste (patient se retire ou réceptionniste)
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM liste_attente_rdv WHERE id_liste = ?', [req.params.id]);
    res.json({ message: 'Retiré de la liste d\'attente' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
