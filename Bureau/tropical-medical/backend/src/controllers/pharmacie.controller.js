// Controller pharmacie — à implémenter
exports.getAll = async (req, res) => res.json([]);
exports.getOne = async (req, res) => res.json({});
exports.create = async (req, res) => res.status(201).json({ message: 'Créé' });
exports.update = async (req, res) => res.json({ message: 'Mis à jour' });
exports.remove = async (req, res) => res.json({ message: 'Supprimé' });
