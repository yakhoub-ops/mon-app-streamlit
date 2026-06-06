const prisma = require('../config/prisma');

const include = { medicament: true, mouvements: { orderBy: { created_at: 'desc' }, take: 10 } };

exports.getAll = async (req, res) => {
  try {
    const stocks = await prisma.stock.findMany({
      include: { medicament: true },
      orderBy: { medicament: { nom: 'asc' } },
    });
    res.json(stocks);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const s = await prisma.stock.findUnique({ where: { id_stock: +req.params.id }, include });
    if (!s) return res.status(404).json({ message: 'Stock introuvable' });
    res.json(s);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_medicament, quantite, seuil_alerte, prix_unitaire, lot, date_peremption } = req.body;
    const s = await prisma.stock.create({
      data: {
        id_medicament,
        quantite,
        seuil_alerte: seuil_alerte || 10,
        prix_unitaire: prix_unitaire || 0,
        lot,
        date_peremption: date_peremption ? new Date(date_peremption) : undefined,
      },
      include: { medicament: true },
    });
    await prisma.mouvementStock.create({
      data: { id_stock: s.id_stock, type: 'entree', quantite, motif: 'Entrée initiale', id_util: req.user.id },
    });
    res.status(201).json(s);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.mouvement = async (req, res) => {
  try {
    const { type, quantite, motif } = req.body;
    const id_stock = +req.params.id;
    const delta = type === 'sortie' ? -Math.abs(quantite) : Math.abs(quantite);

    const [s] = await prisma.$transaction([
      prisma.stock.update({ where: { id_stock }, data: { quantite: { increment: delta } }, include: { medicament: true } }),
      prisma.mouvementStock.create({ data: { id_stock, type, quantite: delta, motif, id_util: req.user.id } }),
    ]);
    res.json(s);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getAlertes = async (req, res) => {
  try {
    const alertes = await prisma.stock.findMany({
      where: {
        OR: [
          { quantite: { lte: prisma.stock.fields.seuil_alerte } },
          { date_peremption: { lte: new Date(Date.now() + 30 * 24 * 3600000) } },
        ],
      },
      include: { medicament: true },
    });
    res.json(alertes);
  } catch (e) {
    // fallback: raw query
    try {
      const alertes = await prisma.$queryRaw`
        SELECT s.*, m.nom as medicament_nom FROM stock s
        JOIN medicament m ON s.id_medicament = m.id_medicament
        WHERE s.quantite <= s.seuil_alerte
           OR s.date_peremption <= DATE_ADD(NOW(), INTERVAL 30 DAY)
      `;
      res.json(alertes);
    } catch (e2) {
      res.status(500).json({ message: e2.message });
    }
  }
};
