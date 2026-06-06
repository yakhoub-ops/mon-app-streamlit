const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  lignes: { include: { medicament: true } },
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
    const ordos = await prisma.ordonnance.findMany({ where, include, orderBy: { date_emission: 'desc' } });
    res.json(ordos);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const o = await prisma.ordonnance.findUnique({ where: { id_ordonnance: +req.params.id }, include });
    if (!o) return res.status(404).json({ message: 'Ordonnance introuvable' });
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_consultation, id_medecin, id_patient, date_expiration, lignes } = req.body;
    const o = await prisma.ordonnance.create({
      data: {
        id_consultation,
        id_medecin,
        id_patient,
        date_expiration: date_expiration ? new Date(date_expiration) : undefined,
        lignes: {
          create: lignes.map((l) => ({
            id_medicament: l.id_medicament,
            posologie: l.posologie,
            duree: l.duree,
            quantite: l.quantite || 1,
            instructions: l.instructions,
          })),
        },
      },
      include,
    });

    const patUtil = o.patient.utilisateur;
    await notify(patUtil.id_util, `Ordonnance créée par Dr ${o.medecin.utilisateur.nom}`, 'ordonnance', `/patient/ordonnances`);

    res.status(201).json(o);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const o = await prisma.ordonnance.update({
      where: { id_ordonnance: +req.params.id },
      data: { statut: req.body.statut },
      include,
    });
    res.json(o);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getMedicaments = async (req, res) => {
  try {
    const { search } = req.query;
    const meds = await prisma.medicament.findMany({
      where: search ? { OR: [{ nom: { contains: search } }, { dci: { contains: search } }] } : {},
      orderBy: { nom: 'asc' },
    });
    res.json(meds);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.createMedicament = async (req, res) => {
  try {
    const m = await prisma.medicament.create({ data: req.body });
    res.status(201).json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
