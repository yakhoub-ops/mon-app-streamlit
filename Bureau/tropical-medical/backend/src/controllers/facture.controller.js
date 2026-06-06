const prisma = require('../config/prisma');
const { notify } = require('../utils/notify');

const include = {
  patient: { include: { utilisateur: { omit: { mot_de_passe: true } } } },
  consultation: true,
  assurance: true,
  lignes: true,
};

exports.getAll = async (req, res) => {
  try {
    const { role, id } = req.user;
    const where = {};
    if (role === 'patient') {
      const pat = await prisma.patient.findUnique({ where: { id_util: id } });
      if (pat) where.id_patient = pat.id_patient;
    }
    const factures = await prisma.facture.findMany({ where, include, orderBy: { date_emission: 'desc' } });
    res.json(factures);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const f = await prisma.facture.findUnique({ where: { id_facture: +req.params.id }, include });
    if (!f) return res.status(404).json({ message: 'Facture introuvable' });
    res.json(f);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      id_patient, id_consultation, date_echeance, lignes,
      id_assurance, taux_assurance, mode_paiement, reference_assurance, notes,
    } = req.body;

    const montant_total = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0);
    const part_assurance = id_assurance && taux_assurance ? montant_total * taux_assurance / 100 : 0;
    const part_patient = montant_total - part_assurance;

    const f = await prisma.facture.create({
      data: {
        id_patient,
        id_consultation,
        date_echeance: date_echeance ? new Date(date_echeance) : undefined,
        montant_total,
        part_assurance,
        part_patient,
        id_assurance,
        taux_assurance,
        mode_paiement,
        reference_assurance,
        notes,
        lignes: { create: lignes.map((l) => ({ ...l, montant: l.quantite * l.prix_unitaire })) },
      },
      include,
    });

    await notify(f.patient.utilisateur.id_util, `Facture de ${montant_total.toLocaleString('fr')} FCFA émise`, 'facture', `/patient/factures`);

    res.status(201).json(f);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.payer = async (req, res) => {
  try {
    const { montant_paye, mode_paiement } = req.body;
    const facture = await prisma.facture.findUnique({ where: { id_facture: +req.params.id } });
    const total_paye = Number(facture.montant_paye) + montant_paye;
    const statut = total_paye >= Number(facture.part_patient) ? 'paye' : 'partiellement_paye';
    const f = await prisma.facture.update({
      where: { id_facture: +req.params.id },
      data: { montant_paye: total_paye, statut, mode_paiement },
      include,
    });
    res.json(f);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, paye, en_attente] = await Promise.all([
      prisma.facture.aggregate({ _sum: { montant_total: true } }),
      prisma.facture.aggregate({ where: { statut: 'paye' }, _sum: { montant_paye: true } }),
      prisma.facture.count({ where: { statut: 'en_attente' } }),
    ]);
    res.json({
      montant_total: total._sum.montant_total || 0,
      montant_paye: paye._sum.montant_paye || 0,
      en_attente,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};
