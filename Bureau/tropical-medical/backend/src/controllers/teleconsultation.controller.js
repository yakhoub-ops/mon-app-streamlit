const pool   = require('../config/db');
const crypto = require('crypto');
const { notify, getPatientUtil } = require('../utils/notify');

async function getMedecinId(id_util) {
  const [[m]] = await pool.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [id_util]);
  return m?.id_medecin;
}
async function getPatientId(id_util) {
  const [[p]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [id_util]);
  return p?.id_patient;
}

const BASE = `
  SELECT t.*,
    up.nom AS nom_patient, up.prenom AS prenom_patient,
    um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite,
    r.date_rdv, r.motif
  FROM teleconsultation t
  JOIN patient     p   ON p.id_patient   = t.id_patient
  JOIN utilisateur up  ON up.id_util     = p.id_util
  JOIN medecin     med ON med.id_medecin = t.id_medecin
  JOIN utilisateur um  ON um.id_util     = med.id_util
  JOIN rdv         r   ON r.id_rdv       = t.id_rdv
`;

exports.getAll = async (req, res) => {
  try {
    const { role, id: id_util } = req.user;
    let sql = BASE + ' WHERE 1=1';
    const params = [];
    if (role === 'medecin') {
      const mid = await getMedecinId(id_util);
      sql += ' AND t.id_medecin = ?'; params.push(mid);
    } else if (role === 'patient') {
      const pid = await getPatientId(id_util);
      sql += ' AND t.id_patient = ?'; params.push(pid);
    }
    sql += ' ORDER BY t.created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(BASE + ' WHERE t.id_teleconsult = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Session introuvable' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// RG11 — Créer une session : uniquement si le médecin a activé la téléconsultation
exports.create = async (req, res) => {
  try {
    const { id_rdv, id_patient } = req.body;
    const { id: id_util } = req.user;
    const id_medecin = await getMedecinId(id_util);
    if (!id_medecin) return res.status(403).json({ error: 'Profil médecin introuvable' });

    const [[med]] = await pool.query(
      'SELECT teleconsult_active FROM medecin WHERE id_medecin = ?', [id_medecin]
    );
    if (!med?.teleconsult_active)
      return res.status(400).json({ error: 'La téléconsultation n\'est pas activée sur votre profil' });

    // Vérifier que le RDV appartient bien à ce médecin et est confirmé
    const [[rdv]] = await pool.query(
      'SELECT * FROM rdv WHERE id_rdv = ? AND id_medecin = ?', [id_rdv, id_medecin]
    );
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable ou accès refusé' });

    const code = crypto.randomBytes(12).toString('hex');
    const lien_session = `https://meet.jit.si/TropicalMed-${code}`;

    const [r] = await pool.query(
      `INSERT INTO teleconsultation (id_rdv, id_medecin, id_patient, lien_session)
       VALUES (?, ?, ?, ?)`,
      [id_rdv, id_medecin, id_patient, lien_session]
    );

    res.status(201).json({ message: 'Session créée', id_teleconsult: r.insertId, lien_session });

    const patUtil = await getPatientUtil(id_patient);
    if (patUtil) {
      notify({
        id_util: patUtil,
        message: 'Votre téléconsultation est prête — cliquez pour rejoindre',
        type: 'rdv',
        lien: '/patient/rdv',
      });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { statut, notes } = req.body;
    const sets = [];
    const vals = [];
    if (statut !== undefined) {
      sets.push('statut = ?'); vals.push(statut);
      if (statut === 'en_cours') sets.push('date_debut = NOW()');
      if (statut === 'terminee') sets.push('date_fin = NOW()');
    }
    if (notes !== undefined) { sets.push('notes = ?'); vals.push(notes); }
    if (!sets.length) return res.status(400).json({ error: 'Rien à modifier' });
    vals.push(req.params.id);
    await pool.query(`UPDATE teleconsultation SET ${sets.join(', ')} WHERE id_teleconsult = ?`, vals);
    res.json({ message: 'Session mise à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.toggleMedecinTeleconsult = async (req, res) => {
  try {
    const { id: id_util } = req.user;
    const { actif } = req.body;
    await pool.query(
      'UPDATE medecin SET teleconsult_active = ? WHERE id_util = ?',
      [actif ? 1 : 0, id_util]
    );
    res.json({ message: `Téléconsultation ${actif ? 'activée' : 'désactivée'}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
