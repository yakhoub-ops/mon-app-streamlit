const pool = require('../config/db');
const { notifyRole } = require('../utils/notify');
const { publierEntreeStock, genererDepuisStock } = require('./actualite.controller');

const BASE = `
  SELECT s.*,
         m.nom, m.dci, m.forme, m.dosage, m.description AS desc_medicament,
         (s.quantite <= s.seuil_alerte) AS en_alerte,
         (s.date_peremption IS NOT NULL AND s.date_peremption <= DATE_ADD(CURDATE(), INTERVAL 90 DAY)) AS expiration_proche,
         (s.date_peremption IS NOT NULL AND s.date_peremption < CURDATE()) AS perime
  FROM stock s
  JOIN medicament m ON s.id_medicament = m.id_medicament
`;

exports.getAll = async (req, res) => {
  try {
    const { q, alerte, peremption } = req.query;
    const where = [];
    const vals  = [];

    if (q) {
      where.push('(m.nom LIKE ? OR m.dci LIKE ?)');
      vals.push(`%${q}%`, `%${q}%`);
    }
    if (alerte === '1') {
      where.push('s.quantite <= s.seuil_alerte');
    }
    if (peremption) {
      const days = Number(peremption) || 90;
      where.push('s.date_peremption IS NOT NULL AND s.date_peremption <= DATE_ADD(CURDATE(), INTERVAL ? DAY)');
      vals.push(days);
    }

    const sql = BASE + (where.length ? ' WHERE ' + where.join(' AND ') : '') + ' ORDER BY m.nom ASC';
    const [rows] = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(BASE + ' WHERE s.id_stock = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Non trouvé' });
    const stock = rows[0];

    const [mouvements] = await pool.query(`
      SELECT mv.*, u.nom AS nom_util, u.prenom AS prenom_util
      FROM mouvement_stock mv
      LEFT JOIN utilisateur u ON mv.id_util = u.id_util
      WHERE mv.id_stock = ?
      ORDER BY mv.created_at DESC LIMIT 20
    `, [req.params.id]);

    res.json({ ...stock, mouvements });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getAlertes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      BASE + ' WHERE s.quantite <= s.seuil_alerte ORDER BY (s.quantite / s.seuil_alerte) ASC'
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getPeremptions = async (req, res) => {
  try {
    const days = Number(req.query.days) || 90;
    const [rows] = await pool.query(
      BASE + ' WHERE s.date_peremption IS NOT NULL AND s.date_peremption <= DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY s.date_peremption ASC',
      [days]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMouvements = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT mv.*, u.nom AS nom_util, u.prenom AS prenom_util,
             m.nom AS nom_medicament
      FROM mouvement_stock mv
      JOIN stock s ON mv.id_stock = s.id_stock
      JOIN medicament m ON s.id_medicament = m.id_medicament
      LEFT JOIN utilisateur u ON mv.id_util = u.id_util
      WHERE mv.id_stock = ?
      ORDER BY mv.created_at DESC LIMIT 50
    `, [req.params.id]);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getMouvementsAll = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT mv.*, u.nom AS nom_util, u.prenom AS prenom_util,
             m.nom AS nom_medicament
      FROM mouvement_stock mv
      JOIN stock s ON mv.id_stock = s.id_stock
      JOIN medicament m ON s.id_medicament = m.id_medicament
      LEFT JOIN utilisateur u ON mv.id_util = u.id_util
      ORDER BY mv.created_at DESC LIMIT 100
    `);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.entree = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { quantite, motif } = req.body;
    const qty = Number(quantite);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantité invalide' });

    await conn.query('UPDATE stock SET quantite = quantite + ? WHERE id_stock = ?', [qty, req.params.id]);
    await conn.query(
      'INSERT INTO mouvement_stock (id_stock, type, quantite, motif, id_util) VALUES (?, "entree", ?, ?, ?)',
      [req.params.id, qty, motif || 'Entrée de stock', req.user.id]
    );
    await conn.commit();
    const [[s]] = await conn.query(
      'SELECT s.quantite, m.nom FROM stock s JOIN medicament m ON s.id_medicament=m.id_medicament WHERE s.id_stock = ?',
      [req.params.id]
    );
    res.json({ message: 'Entrée enregistrée', nouvelle_quantite: s.quantite });

    // Générer une actualité "nouveau stock disponible"
    publierEntreeStock({ id_stock: Number(req.params.id), nom_medicament: s.nom, quantite: qty });
    genererDepuisStock();
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

exports.sortie = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { quantite, motif } = req.body;
    const qty = Number(quantite);
    if (!qty || qty <= 0) return res.status(400).json({ error: 'Quantité invalide' });

    const [[s]] = await conn.query('SELECT quantite FROM stock WHERE id_stock = ? FOR UPDATE', [req.params.id]);
    if (!s) return res.status(404).json({ error: 'Stock introuvable' });
    if (s.quantite < qty) return res.status(400).json({ error: `Stock insuffisant (${s.quantite} disponible)` });

    await conn.query('UPDATE stock SET quantite = quantite - ? WHERE id_stock = ?', [qty, req.params.id]);
    await conn.query(
      'INSERT INTO mouvement_stock (id_stock, type, quantite, motif, id_util) VALUES (?, "sortie", ?, ?, ?)',
      [req.params.id, -qty, motif || 'Sortie de stock', req.user.id]
    );
    await conn.commit();
    const [[updated]] = await conn.query(
      'SELECT s.quantite, s.seuil_alerte, m.nom FROM stock s JOIN medicament m ON s.id_medicament=m.id_medicament WHERE s.id_stock = ?',
      [req.params.id]
    );
    res.json({ message: 'Sortie enregistrée', nouvelle_quantite: updated.quantite });

    if (updated && updated.quantite <= updated.seuil_alerte) {
      notifyRole({ role: 'pharmacien', message: `Alerte stock : ${updated.nom} (${updated.quantite} restant, seuil ${updated.seuil_alerte})`, type: 'stock', lien: '/pharmacien/stock?tab=alertes' });
    }
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id_medicament, nom, dci, forme, dosage, description, quantite, seuil_alerte, prix_unitaire, lot, date_peremption } = req.body;

    let medId = id_medicament;
    if (!medId) {
      if (!nom) return res.status(400).json({ error: 'nom du médicament requis' });
      const [r] = await conn.query(
        'INSERT INTO medicament (nom, dci, forme, dosage, description) VALUES (?, ?, ?, ?, ?)',
        [nom, dci || null, forme || 'comprime', dosage || null, description || null]
      );
      medId = r.insertId;
    }

    const [r2] = await conn.query(
      'INSERT INTO stock (id_medicament, quantite, seuil_alerte, prix_unitaire, lot, date_peremption) VALUES (?, ?, ?, ?, ?, ?)',
      [medId, quantite || 0, seuil_alerte || 10, prix_unitaire || 0, lot || null, date_peremption || null]
    );

    if (quantite > 0) {
      await conn.query(
        'INSERT INTO mouvement_stock (id_stock, type, quantite, motif, id_util) VALUES (?, "entree", ?, "Stock initial", ?)',
        [r2.insertId, quantite, req.user.id]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Stock créé', id_stock: r2.insertId });
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

exports.update = async (req, res) => {
  try {
    const { seuil_alerte, prix_unitaire, lot, date_peremption } = req.body;
    const sets = [];
    const vals = [];

    if (seuil_alerte  !== undefined) { sets.push('seuil_alerte = ?');   vals.push(seuil_alerte); }
    if (prix_unitaire !== undefined) { sets.push('prix_unitaire = ?');  vals.push(prix_unitaire); }
    if (lot           !== undefined) { sets.push('lot = ?');            vals.push(lot); }
    if (date_peremption !== undefined) { sets.push('date_peremption = ?'); vals.push(date_peremption || null); }

    if (!sets.length) return res.status(400).json({ error: 'Rien à mettre à jour' });
    vals.push(req.params.id);
    await pool.query(`UPDATE stock SET ${sets.join(', ')} WHERE id_stock = ?`, vals);
    res.json({ message: 'Mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query('DELETE FROM stock WHERE id_stock = ?', [req.params.id]);
    res.json({ message: 'Supprimé' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
