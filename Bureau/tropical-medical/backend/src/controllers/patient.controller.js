const pool = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAll = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `
      SELECT p.id_patient, p.date_naissance, p.sexe, p.adresse, p.groupe_sanguin,
             p.allergies, p.antecedents,
             u.id_util, u.nom, u.prenom, u.telephone, u.email, u.created_at
      FROM patient p
      JOIN utilisateur u ON u.id_util = p.id_util
      WHERE u.actif = 1
    `;
    const params = [];
    if (q) {
      sql += ` AND (u.nom LIKE ? OR u.prenom LIKE ? OR u.telephone LIKE ? OR u.email LIKE ?)`;
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY u.nom, u.prenom';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [[patient]] = await pool.query(`
      SELECT p.*, u.nom, u.prenom, u.telephone, u.email, u.created_at
      FROM patient p
      JOIN utilisateur u ON u.id_util = p.id_util
      WHERE p.id_patient = ? AND u.actif = 1
    `, [id]);
    if (!patient) return res.status(404).json({ error: 'Patient introuvable' });

    const [[dossier]] = await pool.query(
      'SELECT * FROM dossier_medical WHERE id_patient = ?', [id]
    );
    res.json({ ...patient, dossier: dossier || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      nom, prenom, telephone, email,
      mot_de_passe, date_naissance, sexe,
      adresse, groupe_sanguin, allergies, antecedents,
    } = req.body;

    const hash = await bcrypt.hash(mot_de_passe || 'tropical123', 10);
    const [userResult] = await conn.query(
      `INSERT INTO utilisateur (nom, prenom, telephone, email, mot_de_passe, role)
       VALUES (?, ?, ?, ?, ?, 'patient')`,
      [nom, prenom, telephone, email || null, hash]
    );

    const [patientResult] = await conn.query(
      `INSERT INTO patient (id_util, date_naissance, sexe, adresse, groupe_sanguin, allergies, antecedents)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userResult.insertId, date_naissance || null, sexe || null, adresse || null,
       groupe_sanguin || null, allergies || null, antecedents || null]
    );

    // Générer le numéro de dossier unique (TM-000001)
    const numeroDossier = `TM-${String(patientResult.insertId).padStart(6, '0')}`;
    await conn.query('UPDATE patient SET numero_dossier = ? WHERE id_patient = ?',
      [numeroDossier, patientResult.insertId]);

    await conn.query(
      'INSERT INTO dossier_medical (id_patient) VALUES (?)',
      [patientResult.insertId]
    );

    await conn.commit();
    res.status(201).json({ message: 'Patient créé', id_patient: patientResult.insertId, numero_dossier: numeroDossier });
  } catch (err) {
    await conn.rollback();
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.update = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const {
      nom, prenom, telephone, email,
      date_naissance, sexe, adresse,
      groupe_sanguin, allergies, antecedents,
    } = req.body;

    const [[p]] = await conn.query('SELECT id_util FROM patient WHERE id_patient = ?', [id]);
    if (!p) return res.status(404).json({ error: 'Patient introuvable' });

    await conn.query(
      `UPDATE utilisateur SET nom=?, prenom=?, telephone=?, email=? WHERE id_util=?`,
      [nom, prenom, telephone, email || null, p.id_util]
    );
    await conn.query(
      `UPDATE patient SET date_naissance=?, sexe=?, adresse=?, groupe_sanguin=?,
       allergies=?, antecedents=? WHERE id_patient=?`,
      [date_naissance || null, sexe || null, adresse || null, groupe_sanguin || null,
       allergies || null, antecedents || null, id]
    );

    await conn.commit();
    res.json({ message: 'Patient mis à jour' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const [[p]] = await pool.query('SELECT id_util FROM patient WHERE id_patient = ?', [id]);
    if (!p) return res.status(404).json({ error: 'Patient introuvable' });
    await pool.query('UPDATE utilisateur SET actif = 0 WHERE id_util = ?', [p.id_util]);
    res.json({ message: 'Patient désactivé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
