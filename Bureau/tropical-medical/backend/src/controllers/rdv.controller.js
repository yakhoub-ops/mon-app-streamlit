const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
};

exports.getAll = async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};
    if (role === 'medecin') {
      const med = await prisma.medecin.findUnique({ where: { id_util: id } });
      if (med) where.id_medecin = med.id_medecin;
    } else if (role === 'patient') {
      const pat = await prisma.patient.findUnique({ where: { id_util: id } });
      if (pat) where.id_patient = pat.id_patient;
    }
    const rdvs = await prisma.rdv.findMany({
      where,
      include,
      orderBy: { date_rdv: 'desc' },
    });
    res.json(rdvs);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const rdv = await prisma.rdv.findUnique({ where: { id_rdv: +req.params.id }, include });
    if (!rdv) return res.status(404).json({ message: 'RDV introuvable' });
    res.json(rdv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_patient, id_medecin, date_rdv, motif, type_rdv, notes } = req.body;
    const dateRdv = new Date(date_rdv);
    const conflit = await prisma.rdv.findFirst({
      where: {
        id_medecin,
        statut: { in: ['en_attente', 'confirme'] },
        date_rdv: {
          gte: new Date(dateRdv.getTime() - 30 * 60000),
          lte: new Date(dateRdv.getTime() + 30 * 60000),
        },
      },
    });
    if (conflit) return res.status(409).json({ message: 'Créneau déjà occupé' });

    const rdv = await prisma.rdv.create({
      data: { id_patient, id_medecin, date_rdv: dateRdv, motif, type_rdv, notes },
      include,
    });

    const med = rdv.medecin.utilisateur;
    const pat = rdv.patient.utilisateur;
    await notify(med.id_util, `Nouveau RDV de ${pat.prenom} ${pat.nom} le ${dateRdv.toLocaleDateString('fr')}`, 'rdv', `/medecin/rdv`);
    await notify(pat.id_util, `RDV confirmé avec Dr ${med.nom} le ${dateRdv.toLocaleDateString('fr')}`, 'rdv', `/patient/rdv`);

    res.status(201).json(rdv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut, notes } = req.body;
    const rdv = await prisma.rdv.update({
      where: { id_rdv: +req.params.id },
      data: { statut, notes },
      include,
    });
    res.json(rdv);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await prisma.rdv.delete({ where: { id_rdv: +req.params.id } });
    res.json({ message: 'RDV supprimé' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
