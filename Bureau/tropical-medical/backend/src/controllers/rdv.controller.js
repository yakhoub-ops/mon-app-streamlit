const pool = require('../config/db');
const { notify, getPatientUtil, getMedecinUtil } = require('../utils/notify');

async function getMedecinId(id_util) {
  const [[m]] = await pool.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [id_util]);
  return m?.id_medecin;
}
async function getPatientId(id_util) {
  const [[p]] = await pool.query('SELECT id_patient FROM patient WHERE id_util = ?', [id_util]);
  return p?.id_patient;
}

const BASE_SELECT = `
  SELECT r.*,
    up.nom AS nom_patient, up.prenom AS prenom_patient, up.telephone AS tel_patient,
    um.nom AS nom_medecin, um.prenom AS prenom_medecin, med.specialite
  FROM rdv r
  JOIN patient     p   ON p.id_patient   = r.id_patient
  JOIN utilisateur up  ON up.id_util     = p.id_util
  JOIN medecin     med ON med.id_medecin = r.id_medecin
  JOIN utilisateur um  ON um.id_util     = med.id_util
`;

exports.getAll = async (req, res) => {
  try {
    const { role, id: id_util } = req.user;
    const { date, statut, upcoming, past, medecin_id } = req.query;

    let sql = BASE_SELECT + ' WHERE 1=1';
    const params = [];

    if (role === 'medecin') {
      const id_medecin = await getMedecinId(id_util);
      sql += ' AND r.id_medecin = ?'; params.push(id_medecin);
    } else if (role === 'patient') {
      const id_patient = await getPatientId(id_util);
      sql += ' AND r.id_patient = ?'; params.push(id_patient);
    } else if (medecin_id) {
      sql += ' AND r.id_medecin = ?'; params.push(medecin_id);
    }

    if (date)     { sql += ' AND DATE(r.date_rdv) = ?'; params.push(date); }
    if (statut)   { sql += ' AND r.statut = ?'; params.push(statut); }
    if (upcoming) { sql += ' AND r.date_rdv >= NOW()'; }
    if (past)     { sql += ' AND r.date_rdv < NOW()'; }

    sql += ' ORDER BY r.date_rdv ' + (past ? 'DESC' : 'ASC');

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const [[rdv]] = await pool.query(BASE_SELECT + ' WHERE r.id_rdv = ?', [req.params.id]);
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });
    res.json(rdv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { role, id: id_util } = req.user;
    let { id_patient, id_medecin, date_rdv, heure_rdv, motif, notes, type_rdv } = req.body;

    if (role === 'patient') {
      const pid = await getPatientId(id_util);
      if (!pid) return res.status(400).json({ error: 'Profil patient introuvable' });
      id_patient = pid;
    }

    // Vérifier conflit créneau (±30 min, même médecin)
    const [conflicts] = await pool.query(`
      SELECT id_rdv FROM rdv
      WHERE id_medecin = ? AND statut NOT IN ('annule')
        AND ABS(TIMESTAMPDIFF(MINUTE, date_rdv, ?)) < 30
    `, [id_medecin, date_rdv]);
    if (conflicts.length > 0)
      return res.status(409).json({ error: 'Créneau déjà occupé pour ce médecin' });

    const [result] = await pool.query(
      `INSERT INTO rdv (id_patient, id_medecin, date_rdv, motif, notes, statut, type_rdv)
       VALUES (?, ?, ?, ?, ?, 'en_attente', ?)`,
      [id_patient, id_medecin, date_rdv, motif || null, notes || null, type_rdv || 'presentiel']
    );
    res.status(201).json({ message: 'RDV créé', id_rdv: result.insertId });

    // Notifier le médecin du nouveau RDV
    const heureStr = heure_rdv ? heure_rdv.slice(0, 5) : '';
    const dateStr = new Date(date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) + (heureStr ? ` à ${heureStr}` : '');
    const medecinUtil = await getMedecinUtil(id_medecin);
    if (medecinUtil) {
      notify({ id_util: medecinUtil, message: `Nouveau RDV le ${dateStr}${motif ? ` — ${motif}` : ''}`, type: 'rdv', lien: '/medecin/rdv' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: id_util } = req.user;
    const { statut, notes, date_rdv, motif } = req.body;

    const [[rdv]] = await pool.query('SELECT * FROM rdv WHERE id_rdv = ?', [id]);
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });

    if (role === 'patient') {
      const id_patient = await getPatientId(id_util);
      if (rdv.id_patient !== id_patient) return res.status(403).json({ error: 'Accès refusé' });
      if (statut && statut !== 'annule') return res.status(403).json({ error: 'Le patient ne peut qu\'annuler' });
    }

    await pool.query(
      `UPDATE rdv SET
         statut   = COALESCE(?, statut),
         notes    = COALESCE(?, notes),
         date_rdv = COALESCE(?, date_rdv),
         motif    = COALESCE(?, motif)
       WHERE id_rdv = ?`,
      [statut || null, notes || null, date_rdv || null, motif || null, id]
    );
    res.json({ message: 'RDV mis à jour' });

    // Notifier le patient du changement de statut
    if (statut && rdv.id_patient) {
      const patUtil = await getPatientUtil(rdv.id_patient);
      const labels = { confirme: 'confirmé', annule: 'annulé', termine: 'terminé' };
      if (patUtil && labels[statut]) {
        notify({ id_util: patUtil, message: `Votre RDV a été ${labels[statut]}`, type: 'rdv', lien: '/patient/rdv' });
      }
    }

    // RG12 — Si annulation, proposer le créneau au 1er patient en liste d'attente
    if (statut === 'annule' && rdv.id_medecin && rdv.date_rdv) {
      const [[premier]] = await pool.query(`
        SELECT la.*, u.id_util, u.nom, u.prenom
        FROM liste_attente_rdv la
        JOIN patient     p ON la.id_patient = p.id_patient
        JOIN utilisateur u ON p.id_util     = u.id_util
        WHERE la.id_medecin = ? AND la.statut = 'en_attente'
        ORDER BY la.priorite ASC, la.created_at ASC
        LIMIT 1
      `, [rdv.id_medecin]);
      if (premier) {
        await pool.query(
          'UPDATE liste_attente_rdv SET statut = ? WHERE id_liste = ?',
          ['propose', premier.id_liste]
        );
        const dateStr = new Date(rdv.date_rdv).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        notify({
          id_util: premier.id_util,
          message: `Un créneau s'est libéré le ${dateStr} — connectez-vous pour le réserver`,
          type: 'rdv',
          lien: '/patient/rdv',
        });
      }
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: id_util } = req.user;
    const [[rdv]] = await pool.query('SELECT * FROM rdv WHERE id_rdv = ?', [id]);
    if (!rdv) return res.status(404).json({ error: 'RDV introuvable' });

    if (role === 'patient') {
      const id_patient = await getPatientId(id_util);
      if (rdv.id_patient !== id_patient) return res.status(403).json({ error: 'Accès refusé' });
    }
    await pool.query("UPDATE rdv SET statut = 'annule' WHERE id_rdv = ?", [id]);
    res.json({ message: 'RDV annulé' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
