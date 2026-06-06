const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  rdv: true,
};

exports.getAll = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const list = await prisma.fileAttente.findMany({
      where: { heure_arrivee: { gte: today } },
      include,
      orderBy: [{ priorite: 'asc' }, { heure_arrivee: 'asc' }],
    });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.add = async (req, res) => {
  try {
    const { id_patient, id_medecin, id_rdv, priorite, notes } = req.body;
    const item = await prisma.fileAttente.create({
      data: { id_patient, id_medecin, id_rdv, priorite: priorite || 3, notes },
      include,
    });
    const patUtil = item.patient.utilisateur;
    await notify(patUtil.id_util, `Vous êtes en file d'attente`, 'systeme');
    res.status(201).json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.appeler = async (req, res) => {
  try {
    const item = await prisma.fileAttente.update({
      where: { id_file: +req.params.id },
      data: { statut: 'appele', heure_appel: new Date() },
      include,
    });
    const patUtil = item.patient.utilisateur;
    await notify(patUtil.id_util, `C'est votre tour ! Présentez-vous à la salle de consultation.`, 'systeme');
    res.json(item);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const item = await prisma.fileAttente.update({
      where: { id_file: +req.params.id },
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
    await prisma.fileAttente.delete({ where: { id_file: +req.params.id } });
    res.json({ message: 'Supprimé' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
