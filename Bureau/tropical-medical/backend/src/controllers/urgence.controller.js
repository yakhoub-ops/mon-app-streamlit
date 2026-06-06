const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
};

exports.getAll = async (req, res) => {
  try {
    const urgences = await prisma.urgence.findMany({
      include,
      orderBy: [{ niveau: 'asc' }, { date_arrivee: 'asc' }],
    });
    res.json(urgences);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_patient, nom_patient, description, niveau, id_medecin, notes } = req.body;
    const u = await prisma.urgence.create({
      data: { id_patient, nom_patient, description, niveau: niveau || 'urgent', id_medecin, notes },
      include,
    });

    // Notifier tous les médecins via room role
    const io = require('../utils/notify');
    // notify médecin assigné si présent
    if (id_medecin) {
      const med = await prisma.medecin.findUnique({ where: { id_medecin }, include: { utilisateur: true } });
      if (med) await notify(med.id_util, `Urgence ${niveau} signalée : ${description.slice(0, 60)}`, 'urgence');
    }

    res.status(201).json(u);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut, id_medecin, notes } = req.body;
    const u = await prisma.urgence.update({
      where: { id_urgence: +req.params.id },
      data: {
        statut,
        id_medecin,
        notes,
        date_prise_en_charge: statut === 'prise_en_charge' ? new Date() : undefined,
      },
      include,
    });
    res.json(u);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
