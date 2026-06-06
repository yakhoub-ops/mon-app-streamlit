const prisma = require('../config/prisma');

exports.getByPatient = async (req, res) => {
  try {
    const dossier = await prisma.dossierMedical.findUnique({
      where: { id_patient: +req.params.patientId },
      include: {
        patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
        consultations: {
          include: {
            medecin: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
            ordonnances: { include: { lignes: { include: { medicament: true } } } },
          },
          orderBy: { date_consultation: 'desc' },
        },
      },
    });
    if (!dossier) return res.status(404).json({ message: 'Dossier introuvable' });
    res.json(dossier);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { observations } = req.body;
    const dossier = await prisma.dossierMedical.upsert({
      where: { id_patient: +req.params.patientId },
      update: { observations },
      create: { id_patient: +req.params.patientId, observations },
    });
    res.json(dossier);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
