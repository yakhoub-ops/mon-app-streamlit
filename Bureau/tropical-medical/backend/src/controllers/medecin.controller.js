const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const { service, specialite } = req.query;
    let sql = `
      SELECT m.id_medecin, m.specialite, m.service, m.disponible, m.teleconsult_active,
             u.nom, u.prenom, u.telephone, u.email
      FROM medecin m
      JOIN utilisateur u ON u.id_util = m.id_util
      WHERE u.actif = 1
    `;
    const params = [];
    if (service)    { sql += ' AND m.service = ?';    params.push(service); }
    if (specialite) { sql += ' AND m.specialite = ?'; params.push(specialite); }
    sql += ' ORDER BY u.nom, u.prenom';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { specialite, service, disponible, teleconsult_active, biographie, numero_ordre } = req.body;

    if (req.user.role === 'medecin') {
      const [[m]] = await pool.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [req.user.id]);
      if (!m || m.id_medecin !== Number(id))
        return res.status(403).json({ error: 'Accès refusé' });
    }

    const sets = [];
    const vals = [];
    if (specialite         !== undefined) { sets.push('specialite = ?');         vals.push(specialite); }
    if (service            !== undefined) { sets.push('service = ?');            vals.push(service); }
    if (disponible         !== undefined) { sets.push('disponible = ?');         vals.push(disponible); }
    if (teleconsult_active !== undefined) { sets.push('teleconsult_active = ?'); vals.push(teleconsult_active ? 1 : 0); }
    if (biographie         !== undefined) { sets.push('biographie = ?');         vals.push(biographie); }
    if (numero_ordre       !== undefined) { sets.push('numero_ordre = ?');       vals.push(numero_ordre); }

    if (!sets.length) return res.status(400).json({ error: 'Rien à modifier' });
    vals.push(id);
    await pool.query(`UPDATE medecin SET ${sets.join(', ')} WHERE id_medecin = ?`, vals);
    res.json({ message: 'Profil médecin mis à jour' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;
    const [[medecin]] = await pool.query(`
      SELECT m.*, u.nom, u.prenom, u.telephone, u.email
      FROM medecin m JOIN utilisateur u ON u.id_util = m.id_util
      WHERE m.id_medecin = ? AND u.actif = 1
    `, [id]);
    if (!medecin) return res.status(404).json({ error: 'Médecin introuvable' });

    const [dispos] = await pool.query(
      'SELECT * FROM disponibilite WHERE id_medecin = ? ORDER BY jour_semaine, heure_debut',
      [id]
    );
    res.json({ ...medecin, disponibilites: dispos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDisponibilites = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM disponibilite WHERE id_medecin = ? ORDER BY jour_semaine, heure_debut',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDisponibilites = async (req, res) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const { id } = req.params;
    const { disponibilites } = req.body;

    if (req.user.role === 'medecin') {
      const [[m]] = await conn.query('SELECT id_medecin FROM medecin WHERE id_util = ?', [req.user.id]);
      if (!m || m.id_medecin !== Number(id))
        return res.status(403).json({ error: 'Accès refusé' });
    }

    await conn.query('DELETE FROM disponibilite WHERE id_medecin = ?', [id]);
    if (disponibilites?.length > 0) {
      const vals = disponibilites.map(d => [id, d.jour_semaine, d.heure_debut, d.heure_fin]);
      await conn.query(
        'INSERT INTO disponibilite (id_medecin, jour_semaine, heure_debut, heure_fin) VALUES ?',
        [vals]
      );
    }
    await conn.commit();
    res.json({ message: 'Disponibilités mises à jour' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    conn.release();
  }
};

exports.getCreneaux = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Paramètre date requis' });

    const jsDay  = new Date(date + 'T12:00:00').getDay(); // 0=Dim … 6=Sam
    const sqlDay = jsDay === 0 ? 7 : jsDay;               // 1=Lun … 7=Dim

    const [dispos] = await pool.query(
      'SELECT heure_debut, heure_fin FROM disponibilite WHERE id_medecin = ? AND jour_semaine = ?',
      [id, sqlDay]
    );
    if (!dispos.length) return res.json([]);

    const [booked] = await pool.query(`
      SELECT TIME_FORMAT(TIME(date_rdv), '%H:%i') AS heure
      FROM rdv
      WHERE id_medecin = ? AND DATE(date_rdv) = ? AND statut NOT IN ('annule')
    `, [id, date]);
    const bookedSet = new Set(booked.map(b => b.heure));

    const slots = [];
    for (const d of dispos) {
      let cur = timeToMin(d.heure_debut);
      const end = timeToMin(d.heure_fin);
      while (cur + 30 <= end) {
        const slot = minToTime(cur);
        if (!bookedSet.has(slot)) slots.push(slot);
        cur += 30;
      }
    }
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function minToTime(m) {
  return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
}
