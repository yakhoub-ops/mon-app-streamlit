const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM assurance WHERE actif = 1 ORDER BY nom'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { nom, code, taux_prise_en_charge, description } = req.body;
    if (!nom || taux_prise_en_charge === undefined)
      return res.status(400).json({ error: 'nom et taux_prise_en_charge requis' });
    const [r] = await pool.query(
      'INSERT INTO assurance (nom, code, taux_prise_en_charge, description) VALUES (?, ?, ?, ?)',
      [nom, code || null, taux_prise_en_charge, description || null]
    );
    res.status(201).json({ message: 'Assurance créée', id_assurance: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Code déjà utilisé' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { nom, code, taux_prise_en_charge, description, actif } = req.body;
    const sets = [];
    const vals = [];
    if (nom                  !== undefined) { sets.push('nom = ?');                  vals.push(nom); }
    if (code                 !== undefined) { sets.push('code = ?');                 vals.push(code); }
    if (taux_prise_en_charge !== undefined) { sets.push('taux_prise_en_charge = ?'); vals.push(taux_prise_en_charge); }
    if (description          !== undefined) { sets.push('description = ?');          vals.push(description); }
    if (actif                !== undefined) { sets.push('actif = ?');                vals.push(actif); }
    if (!sets.length) return res.status(400).json({ error: 'Rien à modifier' });
    vals.push(req.params.id);
    await pool.query(`UPDATE assurance SET ${sets.join(', ')} WHERE id_assurance = ?`, vals);
    res.json({ message: 'Assurance mise à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('UPDATE assurance SET actif = 0 WHERE id_assurance = ?', [req.params.id]);
    res.json({ message: 'Assurance désactivée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
