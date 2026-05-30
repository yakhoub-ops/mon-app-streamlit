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

const BASE = `
  SELECT c.*,
    up.nom AS nom_patient, up.prenom AS prenom_patient, up.telephone AS tel_patient,
    um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
  FROM consultation c
  JOIN patient     p   ON p.id_patient   = c.id_patient
  JOIN utilisateur up  ON up.id_util     = p.id_util
  JOIN medecin     med ON med.id_medecin = c.id_medecin
  JOIN utilisateur um  ON um.id_util     = med.id_util
`;

exports.getAll = async (req, res) => {
  try {
    const { role, id: id_util } = req.user;
    const { patient_id, statut } = req.query;
    let sql = BASE + ' WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      const mid = await getMedecinId(id_util);
      sql += ' AND c.id_medecin = ?'; params.push(mid);
    } else if (role === 'patient') {
      const pid = await getPatientId(id_util);
      sql += ' AND c.id_patient = ?'; params.push(pid);
    }
    if (patient_id) { sql += ' AND c.id_patient = ?'; params.push(patient_id); }
    if (statut)     { sql += ' AND c.statut = ?';     params.push(statut); }
    sql += ' ORDER BY c.date_consultation DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [[c]] = await pool.query(BASE + ' WHERE c.id_consultation = ?', [req.params.id]);
    if (!c) return res.status(404).json({ error: 'Consultation introuvable' });

    const [ordonnances] = await pool.query(
      'SELECT id_ordonnance, date_emission, date_expiration, statut FROM ordonnance WHERE id_consultation = ?',
      [req.params.id]
    );
    res.json({ ...c, ordonnances });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id: id_util } = req.user;
    const { id_patient, id_rdv, motif, diagnostic, traitement, notes, statut } = req.body;

    const id_medecin = await getMedecinId(id_util);
    if (!id_medecin) return res.status(403).json({ error: 'Profil médecin introuvable' });

    // Bug 1 — Bloquer doublon : même médecin + même patient + même jour
    const [[existing]] = await conn.query(`
      SELECT id_consultation FROM consultation
      WHERE id_medecin = ? AND id_patient = ?
        AND DATE(date_consultation) = CURDATE()
        AND statut != 'terminee'
    `, [id_medecin, id_patient]);
    if (existing) {
      conn.release();
      return res.status(409).json({
        error: 'Une consultation est déjà en cours ou enregistrée pour ce patient aujourd\'hui. Terminez-la avant d\'en créer une nouvelle.',
      });
    }

    const [[d]] = await conn.query(
      'SELECT id_dossier FROM dossier_medical WHERE id_patient = ?', [id_patient]
    );

    const [result] = await conn.query(
      `INSERT INTO consultation
         (id_patient, id_medecin, id_rdv, id_dossier, motif, diagnostic, traitement, notes, statut)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id_patient, id_medecin, id_rdv || null, d?.id_dossier || null,
       motif || null, diagnostic || null, traitement || null, notes || null,
       statut || 'en_cours']
    );

    if (id_rdv) {
      await conn.query("UPDATE rdv SET statut = 'termine' WHERE id_rdv = ?", [id_rdv]);
    }

    await conn.commit();
    res.status(201).json({ message: 'Consultation créée', id_consultation: result.insertId });

    const patUtil = await getPatientUtil(id_patient);
    if (patUtil) {
      notify({ id_util: patUtil, message: `Consultation enregistrée${motif ? ` : ${motif}` : ''}`, type: 'systeme', lien: '/patient/dossier' });
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
    const { motif, diagnostic, traitement, notes, statut } = req.body;
    await pool.query(
      `UPDATE consultation SET
         motif      = COALESCE(?, motif),
         diagnostic = COALESCE(?, diagnostic),
         traitement = COALESCE(?, traitement),
         notes      = COALESCE(?, notes),
         statut     = COALESCE(?, statut)
       WHERE id_consultation = ?`,
      [motif || null, diagnostic || null, traitement || null,
       notes || null, statut || null, req.params.id]
    );
    res.json({ message: 'Consultation mise à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM consultation WHERE id_consultation = ?', [req.params.id]);
    res.json({ message: 'Consultation supprimée' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
