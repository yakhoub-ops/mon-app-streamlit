const pool = require('../config/db');

exports.getByPatient = async (req, res) => {
  try {
    const { id_patient } = req.params;
    const [[dossier]] = await pool.query(
      'SELECT * FROM dossier_medical WHERE id_patient = ?', [id_patient]
    );
    if (!dossier) return res.status(404).json({ error: 'Dossier introuvable' });

    const [consultations] = await pool.query(`
      SELECT c.id_consultation, c.date_consultation, c.motif, c.diagnostic,
             c.traitement, c.notes, c.statut,
             u.nom AS nom_medecin, u.prenom AS prenom_medecin, med.specialite
      FROM consultation c
      JOIN medecin med ON med.id_medecin = c.id_medecin
      JOIN utilisateur u ON u.id_util = med.id_util
      WHERE c.id_patient = ?
      ORDER BY c.date_consultation DESC
    `, [id_patient]);

    res.json({ ...dossier, consultations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateByPatient = async (req, res) => {
  try {
    const { id_patient } = req.params;
    const { observations } = req.body;

    const [result] = await pool.query(
      'UPDATE dossier_medical SET observations = ? WHERE id_patient = ?',
      [observations, id_patient]
    );

    if (result.affectedRows === 0) {
      await pool.query(
        'INSERT INTO dossier_medical (id_patient, observations) VALUES (?, ?)',
        [id_patient, observations]
      );
    }
    res.json({ message: 'Dossier mis à jour' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
