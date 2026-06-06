const prisma = require('../config/prisma');

const include = {
  rdv: true,
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
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
    const list = await prisma.teleconsultation.findMany({ where, include, orderBy: { created_at: 'desc' } });
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_rdv, id_medecin, id_patient, lien_session } = req.body;
    const t = await prisma.teleconsultation.create({
      data: { id_rdv, id_medecin, id_patient, lien_session },
      include,
    });
    res.status(201).json(t);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.updateStatut = async (req, res) => {
  try {
    const { statut, notes } = req.body;
    const t = await prisma.teleconsultation.update({
      where: { id_teleconsult: +req.params.id },
      data: {
        statut,
        notes,
        date_debut: statut === 'en_cours' ? new Date() : undefined,
        date_fin: statut === 'terminee' ? new Date() : undefined,
      },
      include,
    });
    res.json(t);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
