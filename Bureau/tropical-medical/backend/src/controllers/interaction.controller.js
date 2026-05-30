const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT i.*,
        ma.nom AS nom_medicament_a, ma.dci AS dci_a,
        mb.nom AS nom_medicament_b, mb.dci AS dci_b
      FROM interaction_medicamenteuse i
      JOIN medicament ma ON i.id_medicament_a = ma.id_medicament
      JOIN medicament mb ON i.id_medicament_b = mb.id_medicament
      ORDER BY FIELD(i.niveau, 'contrindication', 'eleve', 'modere', 'faible')
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// RG13 — Vérifier les interactions entre une liste de médicaments
exports.checker = async (req, res) => {
  try {
    const { ids_medicaments } = req.body;
    if (!Array.isArray(ids_medicaments) || ids_medicaments.length < 2)
      return res.json({ interactions: [], bloquant: false });

    const ph = ids_medicaments.map(() => '?').join(',');
    const [rows] = await pool.query(`
      SELECT i.*,
        ma.nom AS nom_medicament_a, mb.nom AS nom_medicament_b
      FROM interaction_medicamenteuse i
      JOIN medicament ma ON i.id_medicament_a = ma.id_medicament
      JOIN medicament mb ON i.id_medicament_b = mb.id_medicament
      WHERE i.id_medicament_a IN (${ph}) AND i.id_medicament_b IN (${ph})
      ORDER BY FIELD(i.niveau, 'contrindication', 'eleve', 'modere', 'faible')
    `, [...ids_medicaments, ...ids_medicaments]);

    const bloquant = rows.some(r => r.niveau === 'contrindication' || r.niveau === 'eleve');
    res.json({ interactions: rows, bloquant });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const { id_medicament_a, id_medicament_b, niveau, description } = req.body;
    if (!id_medicament_a || !id_medicament_b)
      return res.status(400).json({ error: 'Les deux médicaments sont requis' });

    // Assurer l'ordre canonique (id plus petit en premier) pour éviter les doublons inversés
    const [a, b] = Number(id_medicament_a) < Number(id_medicament_b)
      ? [id_medicament_a, id_medicament_b]
      : [id_medicament_b, id_medicament_a];

    const [r] = await pool.query(
      'INSERT INTO interaction_medicamenteuse (id_medicament_a, id_medicament_b, niveau, description) VALUES (?, ?, ?, ?)',
      [a, b, niveau || 'modere', description || null]
    );
    res.status(201).json({ message: 'Interaction enregistrée', id_interaction: r.insertId });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Interaction déjà enregistrée pour ces deux médicaments' });
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { niveau, description } = req.body;
    const sets = [];
    const vals = [];
    if (niveau      !== undefined) { sets.push('niveau = ?');      vals.push(niveau); }
    if (description !== undefined) { sets.push('description = ?'); vals.push(description); }
    if (!sets.length) return res.status(400).json({ error: 'Rien à modifier' });
    vals.push(req.params.id);
    await pool.query(`UPDATE interaction_medicamenteuse SET ${sets.join(', ')} WHERE id_interaction = ?`, vals);
    res.json({ message: 'Interaction mise à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM interaction_medicamenteuse WHERE id_interaction = ?', [req.params.id]);
    res.json({ message: 'Interaction supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
