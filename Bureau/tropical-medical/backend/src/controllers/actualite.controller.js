const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const actualites = await prisma.actualite.findMany({
      where: { publie: true },
      include: { stock: { include: { medicament: true } } },
      orderBy: { created_at: 'desc' },
      take: 30,
    });
    res.json(actualites);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { titre, contenu, type, id_stock } = req.body;
    const a = await prisma.actualite.create({ data: { titre, contenu, type, id_stock } });
    res.status(201).json(a);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.genererDepuisStock = async () => {
  try {
    const alertes = await prisma.$queryRaw`
      SELECT s.id_stock, m.nom, s.quantite, s.seuil_alerte, s.date_peremption
      FROM stock s JOIN medicament m ON s.id_medicament = m.id_medicament
      WHERE s.quantite <= s.seuil_alerte
         OR (s.date_peremption IS NOT NULL AND s.date_peremption <= DATE_ADD(NOW(), INTERVAL 30 DAY))
    `;
    for (const a of alertes) {
      if (a.quantite <= a.seuil_alerte) {
        await prisma.actualite.create({
          data: {
            titre: `Alerte stock : ${a.nom}`,
            contenu: `Stock faible : ${a.quantite} unités restantes (seuil : ${a.seuil_alerte})`,
            type: 'stock_alerte',
            id_stock: a.id_stock,
          },
        });
      } else if (a.date_peremption) {
        await prisma.actualite.create({
          data: {
            titre: `Péremption imminente : ${a.nom}`,
            contenu: `Le lot expire le ${new Date(a.date_peremption).toLocaleDateString('fr')}`,
            type: 'stock_peremption',
            id_stock: a.id_stock,
          },
        });
      }
    }
  } catch (e) {
    console.error('Cron actualites:', e.message);
  }
};
