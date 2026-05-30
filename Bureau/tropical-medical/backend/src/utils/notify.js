const pool = require('../config/db');

/**
 * Crée une notification en base et l'émet en temps réel via Socket.io.
 * Ne propage jamais d'erreur — la logique métier n'est jamais bloquée.
 */
async function notify({ id_util, message, type = 'systeme', lien = null }) {
  try {
    const [r] = await pool.query(
      'INSERT INTO notification (id_util, message, type, lien) VALUES (?, ?, ?, ?)',
      [id_util, message, type, lien]
    );
    const { getIO } = require('../socket');
    const io = getIO();
    if (io) {
      io.to(`user:${id_util}`).emit('notification', {
        id_notification: r.insertId,
        id_util,
        message,
        type,
        lien,
        lu: 0,
        created_at: new Date(),
      });
    }
  } catch {}
}

/**
 * Notifie tous les utilisateurs d'un rôle donné.
 * Émet aussi sur la room de rôle pour les connectés sans notification individuelle.
 */
async function notifyRole({ role, message, type = 'systeme', lien = null }) {
  try {
    const [users] = await pool.query(
      'SELECT id_util FROM utilisateur WHERE role = ?', [role]
    );
    for (const u of users) {
      await notify({ id_util: u.id_util, message, type, lien });
    }
  } catch {}
}

/**
 * Récupère l'id_util d'un patient via son id_patient.
 */
async function getPatientUtil(id_patient) {
  const [[r]] = await pool.query(
    'SELECT p.id_util FROM patient p WHERE p.id_patient = ?', [id_patient]
  );
  return r?.id_util || null;
}

/**
 * Récupère l'id_util d'un médecin via son id_medecin.
 */
async function getMedecinUtil(id_medecin) {
  const [[r]] = await pool.query(
    'SELECT m.id_util FROM medecin m WHERE m.id_medecin = ?', [id_medecin]
  );
  return r?.id_util || null;
}

module.exports = { notify, notifyRole, getPatientUtil, getMedecinUtil };
