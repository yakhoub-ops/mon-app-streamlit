const pool   = require('../config/db');
const bcrypt = require('bcryptjs');

/* ── Liste tous les utilisateurs ── */
exports.getAll = async (req, res) => {
  try {
    const { q, role } = req.query;
    let sql = `
      SELECT id_util, nom, prenom, email, telephone, role, actif, created_at
      FROM utilisateur WHERE 1=1
    `;
    const params = [];
    if (role) { sql += ' AND role = ?'; params.push(role); }
    if (q) {
      sql += ' AND (nom LIKE ? OR prenom LIKE ? OR email LIKE ? OR telephone LIKE ?)';
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }
    sql += ' ORDER BY created_at DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Détail d'un utilisateur ── */
exports.getOne = async (req, res) => {
  try {
    const [[u]] = await pool.query(
      'SELECT id_util, nom, prenom, email, telephone, role, actif, created_at FROM utilisateur WHERE id_util = ?',
      [req.params.id]
    );
    if (!u) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(u);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Créer un utilisateur ── */
exports.create = async (req, res) => {
  try {
    const { nom, prenom, email, telephone, mot_de_passe, role } = req.body;
    if (!nom || !prenom || !email || !telephone || !role)
      return res.status(400).json({ error: 'Champs obligatoires manquants' });
    const hash = await bcrypt.hash(mot_de_passe || 'tropical123', 10);
    const [result] = await pool.query(
      'INSERT INTO utilisateur (nom, prenom, email, telephone, mot_de_passe, role) VALUES (?,?,?,?,?,?)',
      [nom, prenom, email, telephone, hash, role]
    );
    res.status(201).json({ id_util: result.insertId, message: 'Utilisateur créé' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
};

/* ── Modifier (actif / rôle / infos) ── */
exports.update = async (req, res) => {
  try {
    const { actif, role, nom, prenom, telephone } = req.body;
    const fields = [];
    const params = [];
    if (actif     !== undefined) { fields.push('actif = ?');     params.push(actif ? 1 : 0); }
    if (role      !== undefined) { fields.push('role = ?');      params.push(role); }
    if (nom       !== undefined) { fields.push('nom = ?');       params.push(nom); }
    if (prenom    !== undefined) { fields.push('prenom = ?');    params.push(prenom); }
    if (telephone !== undefined) { fields.push('telephone = ?'); params.push(telephone); }
    if (!fields.length) return res.status(400).json({ error: 'Aucun champ à modifier' });
    params.push(req.params.id);
    await pool.query(`UPDATE utilisateur SET ${fields.join(', ')} WHERE id_util = ?`, params);
    res.json({ message: 'Utilisateur mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Réinitialiser le mot de passe ── */
exports.resetPassword = async (req, res) => {
  try {
    const { nouveau_mot_de_passe } = req.body;
    if (!nouveau_mot_de_passe) return res.status(400).json({ error: 'Mot de passe requis' });
    const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
    await pool.query('UPDATE utilisateur SET mot_de_passe = ? WHERE id_util = ?', [hash, req.params.id]);
    res.json({ message: 'Mot de passe réinitialisé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Désactiver (soft-delete) ── */
exports.remove = async (req, res) => {
  try {
    await pool.query('UPDATE utilisateur SET actif = 0 WHERE id_util = ?', [req.params.id]);
    res.json({ message: 'Utilisateur désactivé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ── Stats globales pour le dashboard admin ── */
exports.stats = async (req, res) => {
  try {
    const [[{ total_utilisateurs }]] = await pool.query(
      'SELECT COUNT(*) AS total_utilisateurs FROM utilisateur WHERE actif = 1'
    );
    const [[{ total_patients }]] = await pool.query(
      'SELECT COUNT(*) AS total_patients FROM utilisateur WHERE role = "patient" AND actif = 1'
    );
    const [[{ total_medecins }]] = await pool.query(
      'SELECT COUNT(*) AS total_medecins FROM utilisateur WHERE role = "medecin" AND actif = 1'
    );
    const [[{ rdv_aujourd_hui }]] = await pool.query(
      'SELECT COUNT(*) AS rdv_aujourd_hui FROM rdv WHERE DATE(date_rdv) = CURDATE() AND statut != "annule"'
    );
    const [[{ consultations_mois }]] = await pool.query(
      'SELECT COUNT(*) AS consultations_mois FROM consultation WHERE MONTH(date_consultation) = MONTH(CURDATE()) AND YEAR(date_consultation) = YEAR(CURDATE())'
    );
    const [[{ factures_impayees }]] = await pool.query(
      "SELECT COUNT(*) AS factures_impayees FROM facture WHERE statut IN ('en_attente','partiellement_paye')"
    );
    const [[{ urgences_actives }]] = await pool.query(
      "SELECT COUNT(*) AS urgences_actives FROM urgence WHERE statut IN ('en_attente','prise_en_charge')"
    );
    const [[{ medicaments_alerte }]] = await pool.query(
      'SELECT COUNT(*) AS medicaments_alerte FROM stock WHERE quantite <= seuil_alerte'
    );
    const [par_role] = await pool.query(
      'SELECT role, COUNT(*) AS nb FROM utilisateur WHERE actif = 1 GROUP BY role'
    );
    const [inscriptions_semaine] = await pool.query(`
      SELECT DATE(created_at) AS jour, COUNT(*) AS nb
      FROM utilisateur
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY DATE(created_at)
      ORDER BY jour
    `);

    res.json({
      total_utilisateurs, total_patients, total_medecins,
      rdv_aujourd_hui, consultations_mois,
      factures_impayees, urgences_actives, medicaments_alerte,
      par_role, inscriptions_semaine,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
