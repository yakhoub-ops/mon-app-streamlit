const prisma = require('../config/prisma');

const include = {
  utilisateur: { omit: { mot_de_passe: true } },
  dossier: true,
};

exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;
    const patients = await prisma.patient.findMany({
      where: search
        ? {
            OR: [
              { utilisateur: { nom: { contains: search } } },
              { utilisateur: { prenom: { contains: search } } },
              { numero_dossier: { contains: search } },
            ],
          }
        : {},
      include,
      orderBy: { utilisateur: { nom: 'asc' } },
    });
    res.json(patients);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const p = await prisma.patient.findUnique({
      where: { id_patient: +req.params.id },
      include,
    });
    if (!p) return res.status(404).json({ message: 'Patient introuvable' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { date_naissance, sexe, adresse, groupe_sanguin, allergies, antecedents } = req.body;
    const p = await prisma.patient.update({
      where: { id_patient: +req.params.id },
      data: { date_naissance: date_naissance ? new Date(date_naissance) : undefined, sexe, adresse, groupe_sanguin, allergies, antecedents },
      include,
    });
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getMePatient = async (req, res) => {
  try {
    const p = await prisma.patient.findUnique({
      where: { id_util: req.user.id },
      include,
    });
    if (!p) return res.status(404).json({ message: 'Profil patient introuvable' });
    res.json(p);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
