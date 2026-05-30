const pool = require('../config/db');
const { notifyRole } = require('../utils/notify');

const BASE = `
  SELECT urg.*,
         u.nom AS nom_pat_reg, u.prenom AS prenom_pat_reg, u.telephone,
         um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
  FROM urgence urg
  LEFT JOIN patient p   ON urg.id_patient = p.id_patient
  LEFT JOIN utilisateur u  ON p.id_util = u.id_util
  LEFT JOIN medecin med ON urg.id_medecin = med.id_medecin
  LEFT JOIN utilisateur um ON med.id_util = um.id_util
`;

exports.getAll = async (req, res) => {
  try {
    const { statut, niveau, date, all } = req.query;
    const where = [];
    const vals  = [];

    if (statut) {
      where.push('urg.statut = ?'); vals.push(statut);
    } else {
      where.push("urg.statut != 'resolue'");
    }

    if (niveau) { where.push('urg.niveau = ?'); vals.push(niveau); }

    if (date) {
      where.push('DATE(urg.date_arrivee) = ?'); vals.push(date);
    } else if (!all) {
      where.push('DATE(urg.date_arrivee) = CURDATE()');
    }

    const sql = BASE +
      (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      " ORDER BY FIELD(urg.niveau,'critique','urgent','modere','faible'), urg.date_arrivee ASC";

    const [rows] = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(BASE + ' WHERE urg.id_urgence = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Non trouvé' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { id_patient, nom_patient, description, niveau, notes } = req.body;
    if (!description) return res.status(400).json({ error: 'description requise' });
    if (!id_patient && !nom_patient) return res.status(400).json({ error: 'id_patient ou nom_patient requis' });

    const [r] = await pool.query(
      'INSERT INTO urgence (id_patient, nom_patient, description, niveau, notes) VALUES (?, ?, ?, ?, ?)',
      [id_patient || null, id_patient ? null : nom_patient, description, niveau || 'urgent', notes || null]
    );
    res.status(201).json({ message: 'Urgence créée', id_urgence: r.insertId });

    const niveauLabel = { critique: 'CRITIQUE', urgent: 'URGENTE', modere: 'modérée', faible: 'faible' };
    const nomPat = nom_patient || 'patient enregistré';
    notifyRole({ role: 'medecin', message: `Urgence ${niveauLabel[niveau || 'urgent']} — ${nomPat} : ${description.slice(0, 60)}`, type: 'urgence', lien: '/medecin/rdv' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const { statut, niveau, notes, id_medecin } = req.body;
    const sets = [];
    const vals = [];

    if (statut !== undefined) {
      sets.push('statut = ?'); vals.push(statut);
      if (statut === 'prise_en_charge') sets.push('date_prise_en_charge = NOW()');
    }
    if (niveau    !== undefined) { sets.push('niveau = ?');     vals.push(niveau); }
    if (notes     !== undefined) { sets.push('notes = ?');      vals.push(notes); }
    if (id_medecin !== undefined) { sets.push('id_medecin = ?'); vals.push(id_medecin); }

    if (!sets.length) return res.status(400).json({ error: 'Rien à mettre à jour' });

    vals.push(req.params.id);
    await pool.query(`UPDATE urgence SET ${sets.join(', ')} WHERE id_urgence = ?`, vals);
    res.json({ message: 'Mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM urgence WHERE id_urgence = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
