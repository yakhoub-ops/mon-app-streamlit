const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe, role } = req.body;
    const hash = await bcrypt.hash(mot_de_passe, 10);
    const [result] = await pool.query(
      `INSERT INTO utilisateur (nom, prenom, telephone, email, mot_de_passe, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nom, prenom, telephone, email, hash, role]
    );
    res.status(201).json({ message: 'Compte créé', id_util: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    const [[user]] = await pool.query(
      'SELECT * FROM utilisateur WHERE email = ?', [email]
    );
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valid) return res.status(401).json({ error: 'Mot de passe incorrect' });
    const token = jwt.sign(
      { id: user.id_util, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id_util, nom: user.nom, prenom: user.prenom, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { nom, prenom, telephone, email, mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;
    const [[user]] = await pool.query('SELECT * FROM utilisateur WHERE id_util = ?', [req.user.id]);
    if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

    if (nouveau_mot_de_passe) {
      if (!mot_de_passe_actuel) return res.status(400).json({ error: 'Mot de passe actuel requis' });
      const valid = await bcrypt.compare(mot_de_passe_actuel, user.mot_de_passe);
      if (!valid) return res.status(401).json({ error: 'Mot de passe actuel incorrect' });
    }

    const sets = [];
    const vals = [];
    if (nom)       { sets.push('nom = ?');       vals.push(nom); }
    if (prenom)    { sets.push('prenom = ?');     vals.push(prenom); }
    if (telephone) { sets.push('telephone = ?');  vals.push(telephone); }
    if (email)     { sets.push('email = ?');      vals.push(email); }
    if (nouveau_mot_de_passe) {
      const hash = await bcrypt.hash(nouveau_mot_de_passe, 10);
      sets.push('mot_de_passe = ?'); vals.push(hash);
    }
    if (!sets.length) return res.status(400).json({ error: 'Rien à modifier' });
    vals.push(req.user.id);
    await pool.query(`UPDATE utilisateur SET ${sets.join(', ')} WHERE id_util = ?`, vals);
    res.json({ message: 'Profil mis à jour' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  const [[user]] = await pool.query(
    'SELECT id_util, nom, prenom, email, role FROM utilisateur WHERE id_util = ?',
    [req.user.id]
  );
  if (!user) return res.status(404).json({ error: 'Utilisateur introuvable' });

  if (user.role === 'medecin') {
    const [[m]] = await pool.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [req.user.id]);
    user.id_medecin = m?.id_medecin || null;
  } else if (user.role === 'patient') {
    const [[p]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [req.user.id]);
    user.id_patient = p?.id_patient || null;
  }

  res.json(user);
};
