const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  ordonnances: { include: { lignes: { include: { medicament: true } } } },
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
    const consultations = await prisma.consultation.findMany({
      where,
      include,
      orderBy: { date_consultation: 'desc' },
    });
    res.json(consultations);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const c = await prisma.consultation.findUnique({
      where: { id_consultation: +req.params.id },
      include,
    });
    if (!c) return res.status(404).json({ message: 'Consultation introuvable' });
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { id_patient, id_medecin, id_rdv, motif, diagnostic, traitement, notes } = req.body;

    const dossier = await prisma.dossierMedical.upsert({
      where: { id_patient },
      update: {},
      create: { id_patient },
    });

    const c = await prisma.consultation.create({
      data: { id_patient, id_medecin, id_rdv, id_dossier: dossier.id_dossier, motif, diagnostic, traitement, notes },
      include,
    });

    if (id_rdv) {
      await prisma.rdv.update({ where: { id_rdv }, data: { statut: 'en_cours' } }).catch(() => {});
    }

    const patUtil = c.patient.utilisateur;
    await notify(patUtil.id_util, `Consultation démarrée par Dr ${c.medecin.utilisateur.nom}`, 'systeme');

    res.status(201).json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { diagnostic, traitement, notes, statut } = req.body;
    const c = await prisma.consultation.update({
      where: { id_consultation: +req.params.id },
      data: { diagnostic, traitement, notes, statut },
      include,
    });
    if (statut === 'terminee' && c.id_rdv) {
      await prisma.rdv.update({ where: { id_rdv: c.id_rdv }, data: { statut: 'termine' } }).catch(() => {});
    }
    res.json(c);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
