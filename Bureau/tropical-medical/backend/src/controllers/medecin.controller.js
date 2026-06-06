const prisma = require('../config/prisma');

exports.getAll = async (req, res) => {
  try {
    const medecins = await prisma.medecin.findMany({
      include: {
        utilisateur: { omit: { mot_de_passe: true } },
        disponibilites: true,
      },
      orderBy: { utilisateur: { nom: 'asc' } },
    });
    res.json(medecins);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const m = await prisma.medecin.findUnique({
      where: { id_medecin: +req.params.id },
      include: {
        utilisateur: { omit: { mot_de_passe: true } },
        disponibilites: true,
      },
    });
    if (!m) return res.status(404).json({ message: 'Médecin introuvable' });
    res.json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const { specialite, service, biographie, disponible, teleconsult_active } = req.body;
    const m = await prisma.medecin.update({
      where: { id_medecin: +req.params.id },
      data: { specialite, service, biographie, disponible, teleconsult_active },
    });
    res.json(m);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getDisponibilites = async (req, res) => {
  try {
    const dispos = await prisma.disponibilite.findMany({
      where: { id_medecin: +req.params.id },
      orderBy: [{ jour_semaine: 'asc' }, { heure_debut: 'asc' }],
    });
    res.json(dispos);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.setDisponibilites = async (req, res) => {
  try {
    const id_medecin = +req.params.id;
    const { disponibilites } = req.body;
    await prisma.disponibilite.deleteMany({ where: { id_medecin } });
    const created = await prisma.disponibilite.createMany({
      data: disponibilites.map((d) => ({
        id_medecin,
        jour_semaine: d.jour_semaine,
        heure_debut: new Date(`1970-01-01T${d.heure_debut}`),
        heure_fin: new Date(`1970-01-01T${d.heure_fin}`),
        duree_slot: d.duree_slot || 30,
      })),
    });
    res.json({ count: created.count });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getCreneaux = async (req, res) => {
  try {
    const { date } = req.query;
    const id_medecin = +req.params.id;
    if (!date) return res.status(400).json({ message: 'Date requise' });

    const d = new Date(date);
    const jour = d.getDay() || 7; // 1=Lun..7=Dim
    const dispos = await prisma.disponibilite.findMany({
      where: { id_medecin, jour_semaine: jour },
    });

    const rdvs = await prisma.rdv.findMany({
      where: {
        id_medecin,
        date_rdv: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
        statut: { in: ['en_attente', 'confirme'] },
      },
      select: { date_rdv: true },
    });
    const occupes = rdvs.map((r) => r.date_rdv.toISOString().slice(11, 16));

    const creneaux = [];
    for (const dispo of dispos) {
      const debut = new Date(dispo.heure_debut);
      const fin = new Date(dispo.heure_fin);
      const slot = dispo.duree_slot;
      let cur = debut;
      while (cur < fin) {
        const h = cur.toISOString().slice(11, 16);
        const dt = new Date(`${date}T${h}:00`);
        if (dt > new Date()) {
          creneaux.push({ heure: h, disponible: !occupes.includes(h) });
        }
        cur = new Date(cur.getTime() + slot * 60000);
      }
    }
    res.json(creneaux);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
