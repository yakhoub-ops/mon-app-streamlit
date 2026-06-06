const prisma = require('../config/prisma');

const include = {
  medicament_a: true,
  medicament_b: true,
};

exports.getAll = async (req, res) => {
  try {
    const list = await prisma.interactionMedicamenteuse.findMany({ include });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.check = async (req, res) => {
  try {
    const ids = req.body.medicaments; // tableau d'id_medicament
    const interactions = [];
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const inter = await prisma.interactionMedicamenteuse.findFirst({
          where: {
            OR: [
              { id_medicament_a: ids[i], id_medicament_b: ids[j] },
              { id_medicament_a: ids[j], id_medicament_b: ids[i] },
            ],
          },
          include,
        });
        if (inter) interactions.push(inter);
      }
    }
    res.json(interactions);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const i = await prisma.interactionMedicamenteuse.create({ data: req.body, include });
    res.status(201).json(i);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ message: 'Interaction déjà enregistrée' });
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.interactionMedicamenteuse.delete({ where: { id_interaction: +req.params.id } });
    res.json({ message: 'Supprimée' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
