const prisma = require('../config/prisma');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
};

exports.getAll = async (req, res) => {
  try {
    const list = await prisma.listeAttenteRdv.findMany({
      include,
      orderBy: [{ priorite: 'asc' }, { created_at: 'asc' }],
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { id_patient, id_medecin, date_souhaitee, motif, priorite } = req.body;
    const item = await prisma.listeAttenteRdv.create({
      data: {
        id_patient,
        id_medecin,
        date_souhaitee: date_souhaitee ? new Date(date_souhaitee) : undefined,
        motif,
        priorite: priorite || 3,
      },
      include,
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const item = await prisma.listeAttenteRdv.update({
      where: { id_liste: +req.params.id },
      data: { statut: req.body.statut },
      include,
    });
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.listeAttenteRdv.delete({ where: { id_liste: +req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
