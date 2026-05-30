const pool = require('../config/db');
const { notify, getPatientUtil } = require('../utils/notify');

async function getMedecinId(id_util) {
  const [[m]] = await pool.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [id_util]);
  return m?.id_medecin;
}
async function getPatientId(id_util) {
  const [[p]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [id_util]);
  return p?.id_patient;
}

exports.getMedicaments = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM medicament ORDER BY nom');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAll = async (req, res) => {
  try {
    const { role, id: id_util } = req.user;
    const { patient_id, consultation_id, statut } = req.query;
    let sql = `
      SELECT o.*,
        up.nom AS nom_patient, up.prenom AS prenom_patient,
        um.nom AS nom_medecin, um.prenom AS prenom_medecin
      FROM ordonnance o
      JOIN patient     p   ON p.id_patient   = o.id_patient
      JOIN utilisateur up  ON up.id_util     = p.id_util
      JOIN medecin     med ON med.id_medecin = o.id_medecin
      JOIN utilisateur um  ON um.id_util     = med.id_util
      WHERE 1=1
    `;
    const params = [];

    if (role === 'medecin') {
      const mid = await getMedecinId(id_util);
      sql += ' AND o.id_medecin = ?'; params.push(mid);
    } else if (role === 'patient') {
      const pid = await getPatientId(id_util);
      sql += ' AND o.id_patient = ?'; params.push(pid);
    }
    if (patient_id)      { sql += ' AND o.id_patient = ?';      params.push(patient_id); }
    if (consultation_id) { sql += ' AND o.id_consultation = ?'; params.push(consultation_id); }
    if (statut)          { sql += ' AND o.statut = ?';          params.push(statut); }
    sql += ' ORDER BY o.date_emission DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [[ordo]] = await pool.query(`
      SELECT o.*,
        up.nom AS nom_patient, up.prenom AS prenom_patient,
        um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
      FROM ordonnance o
      JOIN patient     p   ON p.id_patient   = o.id_patient
      JOIN utilisateur up  ON up.id_util     = p.id_util
      JOIN medecin     med ON med.id_medecin = o.id_medecin
      JOIN utilisateur um  ON um.id_util     = med.id_util
      WHERE o.id_ordonnance = ?
    `, [req.params.id]);
    if (!ordo) return res.status(404).json({ error: 'Ordonnance introuvable' });

    const [lignes] = await pool.query(`
      SELECT lo.*, m.nom AS nom_medicament, m.forme, m.dosage, m.dci
      FROM ligne_ordonnance lo
      JOIN medicament m ON m.id_medicament = lo.id_medicament
      WHERE lo.id_ordonnance = ?
      ORDER BY lo.id_ligne
    `, [req.params.id]);

    res.json({ ...ordo, lignes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id: id_util } = req.user;
    const { id_consultation, id_patient, lignes, date_expiration } = req.body;

    const id_medecin = await getMedecinId(id_util);
    if (!id_medecin) return res.status(403).json({ error: 'Profil médecin introuvable' });

    const expiration = date_expiration ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [result] = await conn.query(
      `INSERT INTO ordonnance (id_consultation, id_medecin, id_patient, date_expiration)
       VALUES (?, ?, ?, ?)`,
      [id_consultation, id_medecin, id_patient, expiration]
    );
    const id_ordonnance = result.insertId;

    if (lignes?.length > 0) {
      const vals = lignes.map(l => [
        id_ordonnance, l.id_medicament, l.posologie,
        l.duree || null, l.quantite || 1, l.instructions || null,
      ]);
      await conn.query(
        `INSERT INTO ligne_ordonnance
           (id_ordonnance, id_medicament, posologie, duree, quantite, instructions)
         VALUES ?`,
        [vals]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Ordonnance créée', id_ordonnance });

    const patUtil = await getPatientUtil(id_patient);
    if (patUtil) {
      notify({ id_util: patUtil, message: 'Votre médecin vous a prescrit une ordonnance', type: 'ordonnance', lien: '/patient/dossier' });
    }
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  try {
    const { statut } = req.body;
    await pool.query('UPDATE ordonnance SET statut = ? WHERE id_ordonnance = ?',
      [statut, req.params.id]);
    res.json({ message: 'Ordonnance mise à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query("UPDATE ordonnance SET statut = 'annulee' WHERE id_ordonnance = ?",
      [req.params.id]);
    res.json({ message: 'Ordonnance annulée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
