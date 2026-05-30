const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { type, limit = 20 } = req.query;
    let sql = `
      SELECT a.*, s.quantite AS stock_quantite, s.seuil_alerte,
             m.nom AS nom_medicament, m.forme
      FROM actualite a
      LEFT JOIN stock      s ON a.id_stock = s.id_stock
      LEFT JOIN medicament m ON s.id_medicament = m.id_medicament
      WHERE a.publie = 1
    `;
    const params = [];
    if (type) { sql += ' AND a.type = ?'; params.push(type); }
    sql += ' ORDER BY a.created_at DESC LIMIT ?';
    params.push(Number(limit));

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

// Générer automatiquement des actualités depuis les événements stock
exports.genererDepuisStock = async () => {
  try {
    // 1. Alertes stock bas
    const [alertes] = await pool.query(`
      SELECT s.id_stock, m.nom, s.quantite, s.seuil_alerte
      FROM stock s
      JOIN medicament m ON s.id_medicament = m.id_medicament
      WHERE s.quantite <= s.seuil_alerte AND s.quantite > 0
    `);
    for (const a of alertes) {
      // Éviter les doublons : pas d'actualité du même type pour ce stock depuis 24h
      const [[existing]] = await pool.query(`
        SELECT id_actualite FROM actualite
        WHERE id_stock = ? AND type = 'stock_alerte'
          AND created_at >= NOW() - INTERVAL 24 HOUR
      `, [a.id_stock]);
      if (!existing) {
        await pool.query(
          `INSERT INTO actualite (titre, contenu, type, id_stock) VALUES (?, ?, 'stock_alerte', ?)`,
          [
            `Stock faible : ${a.nom}`,
            `La pharmacie signale un stock bas de ${a.nom} (${a.quantite} unités restantes, seuil d'alerte : ${a.seuil_alerte}). Veuillez vous renseigner auprès de la pharmacie pour la disponibilité.`,
            a.id_stock,
          ]
        );
      }
    }

    // 2. Péremptions proches (< 30 jours)
    const [peremptions] = await pool.query(`
      SELECT s.id_stock, m.nom, s.date_peremption, s.quantite
      FROM stock s
      JOIN medicament m ON s.id_medicament = m.id_medicament
      WHERE s.date_peremption IS NOT NULL
        AND s.date_peremption BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
        AND s.quantite > 0
    `);
    for (const p of peremptions) {
      const [[existing]] = await pool.query(`
        SELECT id_actualite FROM actualite
        WHERE id_stock = ? AND type = 'stock_peremption'
          AND created_at >= NOW() - INTERVAL 48 HOUR
      `, [p.id_stock]);
      if (!existing) {
        const dateExp = new Date(p.date_peremption).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
        await pool.query(
          `INSERT INTO actualite (titre, contenu, type, id_stock) VALUES (?, ?, 'stock_peremption', ?)`,
          [
            `Médicament bientôt périmé : ${p.nom}`,
            `Le médicament ${p.nom} (${p.quantite} unités en stock) expire le ${dateExp}. La pharmacie procède au renouvellement.`,
            p.id_stock,
          ]
        );
      }
    }
  } catch {}
};

// Générer une actualité à l'entrée d'un nouveau lot
exports.publierEntreeStock = async ({ id_stock, nom_medicament, quantite }) => {
  try {
    await pool.query(
      `INSERT INTO actualite (titre, contenu, type, id_stock) VALUES (?, ?, 'stock_entree', ?)`,
      [
        `Nouveau stock disponible : ${nom_medicament}`,
        `La pharmacie vient de réapprovisionner ${nom_medicament} (${quantite} unités). Ce médicament est de nouveau disponible.`,
        id_stock,
      ]
    );
  } catch {}
};
