const pool = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notification WHERE id_util = ? ORDER BY created_at DESC LIMIT 60',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const [[{ count }]] = await pool.query(
      'SELECT COUNT(*) AS count FROM notification WHERE id_util = ? AND lu = 0',
      [req.user.id]
    );
    res.json({ count: Number(count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notification SET lu = 1 WHERE id_notification = ? AND id_util = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Marquée comme lue' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.markAllRead = async (req, res) => {
  try {
    await pool.query(
      'UPDATE notification SET lu = 1 WHERE id_util = ? AND lu = 0',
      [req.user.id]
    );
    res.json({ message: 'Toutes marquées comme lues' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notification WHERE id_notification = ? AND id_util = ?',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Supprimée' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
