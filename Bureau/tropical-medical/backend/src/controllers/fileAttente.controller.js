const pool = require('../config/db');

const BASE = `
  SELECT f.*,
         u.nom AS nom_patient, u.prenom AS prenom_patient, u.telephone,
         um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
  FROM file_attente f
  JOIN patient p   ON f.id_patient = p.id_patient
  JOIN utilisateur u  ON p.id_util = u.id_util
  LEFT JOIN medecin med ON f.id_medecin = med.id_medecin
  LEFT JOIN utilisateur um ON med.id_util = um.id_util
`;

exports.getAll = async (req, res) => {
  try {
    const { statut, medecin_id, date, all } = req.query;
    const where = [];
    const vals  = [];

    if (statut) {
      where.push('f.statut = ?'); vals.push(statut);
    } else {
      where.push("f.statut IN ('en_attente','appele')");
    }

    if (medecin_id) { where.push('f.id_medecin = ?'); vals.push(medecin_id); }

    if (date) {
      where.push('DATE(f.heure_arrivee) = ?'); vals.push(date);
    } else if (!all) {
      where.push('DATE(f.heure_arrivee) = CURDATE()');
    }

    const sql = BASE +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY f.priorite ASC, f.heure_arrivee ASC';

    const [rows] = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(BASE + ' WHERE f.id_file = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Non trouvé' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { id_patient, id_medecin, id_rdv, priorite, notes } = req.body;
    if (!id_patient) return res.status(400).json({ error: 'id_patient requis' });

    const [r] = await pool.query(
      'INSERT INTO file_attente (id_patient, id_medecin, id_rdv, priorite, notes) VALUES (?, ?, ?, ?, ?)',
      [id_patient, id_medecin || null, id_rdv || null, priorite ?? 3, notes || null]
    );
    res.status(201).json({ message: 'Patient ajouté à la file', id_file: r.insertId });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { statut, priorite, notes, id_medecin } = req.body;
    const sets = [];
    const vals = [];

    if (statut !== undefined) {
      sets.push('statut = ?'); vals.push(statut);
      if (statut === 'appele') sets.push('heure_appel = NOW()');
    }
    if (priorite  !== undefined) { sets.push('priorite = ?');   vals.push(priorite); }
    if (notes     !== undefined) { sets.push('notes = ?');      vals.push(notes); }
    if (id_medecin !== undefined) { sets.push('id_medecin = ?'); vals.push(id_medecin); }

    if (!sets.length) return res.status(400).json({ error: 'Rien à mettre à jour' });

    vals.push(req.params.id);
    await pool.query(`UPDATE file_attente SET ${sets.join(', ')} WHERE id_file = ?`, vals);
    res.json({ message: 'Mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM file_attente WHERE id_file = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
