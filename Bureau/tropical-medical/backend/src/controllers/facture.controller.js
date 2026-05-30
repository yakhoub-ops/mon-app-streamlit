const pool = require('../config/db');
const { notify, getPatientUtil } = require('../utils/notify');

const BASE = `
  SELECT f.*,
         u.nom AS nom_patient, u.prenom AS prenom_patient, u.telephone,
         c.motif AS consultation_motif, c.diagnostic,
         (f.montant_total - f.montant_paye) AS montant_restant
  FROM facture f
  JOIN patient p   ON f.id_patient = p.id_patient
  JOIN utilisateur u ON p.id_util = u.id_util
  LEFT JOIN consultation c ON f.id_consultation = c.id_consultation
`;

async function getPatientId(id_util) {
  const [[row]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [id_util]);
  return row?.id_patient || null;
}

exports.getAll = async (req, res) => {
  try {
    const { statut, patient_id, q } = req.query;
    const where = [];
    const vals  = [];

    if (req.user.role === 'patient') {
      const pid = await getPatientId(req.user.id);
      if (!pid) return res.json([]);
      where.push('f.id_patient = ?'); vals.push(pid);
    } else if (patient_id) {
      where.push('f.id_patient = ?'); vals.push(patient_id);
    }

    if (statut) { where.push('f.statut = ?'); vals.push(statut); }

    if (q) {
      where.push('(u.nom LIKE ? OR u.prenom LIKE ? OR u.telephone LIKE ?)');
      vals.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    const sql = BASE + (where.length ? ' WHERE ' + where.join(' AND ') : '') +
      ' ORDER BY f.date_emission DESC';
    const [rows] = await pool.query(sql, vals);
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const [rows] = await pool.query(BASE + ' WHERE f.id_facture = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Non trouvée' });

    const facture = rows[0];

    // Guard: patient ne peut voir que ses propres factures
    if (req.user.role === 'patient') {
      const pid = await getPatientId(req.user.id);
      if (facture.id_patient !== pid) return res.status(403).json({ error: 'Accès refusé' });
    }

    const [lignes] = await pool.query(
      'SELECT * FROM ligne_facture WHERE id_facture = ? ORDER BY id_ligne_facture',
      [req.params.id]
    );

    res.json({ ...facture, lignes });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const {
      id_patient, id_consultation, lignes, date_echeance, notes,
      mode_paiement, reference_assurance,
      id_assurance, taux_assurance,
    } = req.body;
    if (!id_patient) return res.status(400).json({ error: 'id_patient requis' });
    if (!lignes || !lignes.length) return res.status(400).json({ error: 'Au moins une ligne requise' });

    const [r] = await conn.query(
      `INSERT INTO facture
         (id_patient, id_consultation, date_echeance, notes, mode_paiement,
          reference_assurance, id_assurance, taux_assurance, montant_total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [id_patient, id_consultation || null, date_echeance || null, notes || null,
       mode_paiement || null, reference_assurance || null,
       id_assurance || null, taux_assurance || null]
    );
    const id_facture = r.insertId;

    for (const l of lignes) {
      if (!l.description || !l.prix_unitaire) continue;
      await conn.query(
        'INSERT INTO ligne_facture (id_facture, description, quantite, prix_unitaire) VALUES (?, ?, ?, ?)',
        [id_facture, l.description, l.quantite || 1, l.prix_unitaire]
      );
    }

    const [[{ total }]] = await conn.query(
      'SELECT COALESCE(SUM(montant), 0) AS total FROM ligne_facture WHERE id_facture = ?',
      [id_facture]
    );

    // RG14 — Calcul tiers-payant assurance
    let part_assurance = 0;
    let part_patient   = Number(total);
    let taux = taux_assurance;

    if (!taux && id_assurance) {
      const [[ass]] = await conn.query(
        'SELECT taux_prise_en_charge FROM assurance WHERE id_assurance = ?', [id_assurance]
      );
      taux = ass?.taux_prise_en_charge;
    }
    if (taux) {
      part_assurance = Math.round((Number(total) * Number(taux)) / 100 * 100) / 100;
      part_patient   = Math.round((Number(total) - part_assurance) * 100) / 100;
    }

    await conn.query(
      `UPDATE facture SET montant_total = ?, part_assurance = ?, part_patient = ?,
         taux_assurance = ? WHERE id_facture = ?`,
      [total, part_assurance, part_patient, taux || null, id_facture]
    );

    await conn.commit();
    res.status(201).json({ message: 'Facture créée', id_facture, montant_total: total, part_assurance, part_patient });

    const patUtil = await getPatientUtil(id_patient);
    if (patUtil) {
      const montantStr = Number(total).toLocaleString('fr-FR');
      notify({ id_util: patUtil, message: `Nouvelle facture de ${montantStr} F CFA émise`, type: 'facture', lien: '/patient/factures' });
    }
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

exports.update = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { montant_paye, mode_paiement, reference_assurance, statut, notes, date_echeance } = req.body;

    const [[facture]] = await conn.query(
      'SELECT montant_total, montant_paye, statut FROM facture WHERE id_facture = ? FOR UPDATE',
      [req.params.id]
    );
    if (!facture) return res.status(404).json({ error: 'Non trouvée' });

    const sets = [];
    const vals = [];

    // Paiement
    if (montant_paye !== undefined) {
      const newPaye = Number(montant_paye);
      sets.push('montant_paye = ?'); vals.push(newPaye);

      // Statut auto selon montant
      if (statut !== 'annule') {
        let autoStatut;
        if (newPaye >= Number(facture.montant_total))      autoStatut = 'paye';
        else if (newPaye > 0)                              autoStatut = 'partiellement_paye';
        else                                               autoStatut = 'en_attente';
        sets.push('statut = ?'); vals.push(autoStatut);
      }
    }

    if (mode_paiement       !== undefined) { sets.push('mode_paiement = ?');       vals.push(mode_paiement); }
    if (reference_assurance !== undefined) { sets.push('reference_assurance = ?'); vals.push(reference_assurance); }
    if (statut              !== undefined && montant_paye === undefined) { sets.push('statut = ?'); vals.push(statut); }
    if (notes               !== undefined) { sets.push('notes = ?');               vals.push(notes); }
    if (date_echeance       !== undefined) { sets.push('date_echeance = ?');       vals.push(date_echeance); }

    if (!sets.length) return res.status(400).json({ error: 'Rien à mettre à jour' });
    vals.push(req.params.id);
    await conn.query(`UPDATE facture SET ${sets.join(', ')} WHERE id_facture = ?`, vals);

    await conn.commit();
    res.json({ message: 'Facture mise à jour' });

    // Notifier le patient si paiement enregistré
    if (montant_paye !== undefined) {
      const [[f]] = await pool.query('SELECT id_patient, montant_paye, statut FROM facture WHERE id_facture = ?', [req.params.id]);
      if (f) {
        const patUtil = await getPatientUtil(f.id_patient);
        if (patUtil) {
          const payeStr = Number(montant_paye).toLocaleString('fr-FR');
          const msg = f.statut === 'paye' ? `Facture #${req.params.id} soldée — merci` : `Paiement de ${payeStr} F CFA enregistré`;
          notify({ id_util: patUtil, message: msg, type: 'facture', lien: '/patient/factures' });
        }
      }
    }
  } catch (err) { await conn.rollback(); res.status(500).json({ error: err.message }); }
  finally { conn.release(); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query("UPDATE facture SET statut = 'annule' WHERE id_facture = ?", [req.params.id]);
    res.json({ message: 'Facture annulée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getStats = async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS nb_en_attente,
        SUM(CASE WHEN statut = 'partiellement_paye' THEN 1 ELSE 0 END) AS nb_partiel,
        SUM(CASE WHEN statut = 'paye' THEN 1 ELSE 0 END) AS nb_paye,
        SUM(CASE WHEN statut != 'annule' THEN montant_total ELSE 0 END) AS total_facture,
        SUM(montant_paye) AS total_encaisse,
        SUM(CASE WHEN statut != 'annule' THEN montant_total - montant_paye ELSE 0 END) AS total_restant,
        SUM(CASE WHEN DATE(date_emission) = CURDATE() AND statut = 'paye' THEN montant_paye ELSE 0 END) AS encaisse_jour
      FROM facture
    `);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
};
