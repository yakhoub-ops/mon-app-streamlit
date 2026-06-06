const cron = require('node-cron');
const prisma = require('./config/prisma');
const { notify } = require('./utils/notify');
const { genererDepuisStock } = require('./controllers/actualite.controller');

// Rappels RDV à 8h
cron.schedule('0 8 * * *', async () => {
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  const debut = new Date(demain); debut.setHours(0, 0, 0, 0);
  const fin = new Date(demain); fin.setHours(23, 59, 59, 999);

  const rdvs = await prisma.rdv.findMany({
    where: { date_rdv: { gte: debut, lte: fin }, statut: { in: ['en_attente', 'confirme'] } },
    include: {
      patient: { include: { utilisateur: true } },
      medecin: { include: { utilisateur: true } },
    },
  });

  for (const r of rdvs) {
    const heure = r.date_rdv.toLocaleTimeString('fr', { hour: '2-digit', minute: '2-digit' });
    await notify(r.patient.utilisateur.id_util, `Rappel : RDV demain à ${heure} avec Dr ${r.medecin.utilisateur.nom}`, 'rdv');
  }
});

// Alertes stock à 8h
cron.schedule('0 8 * * *', async () => {
  const alertes = await prisma.$queryRaw`
    SELECT s.id_stock, m.nom, s.quantite, s.seuil_alerte
    FROM stock s JOIN medicament m ON s.id_medicament = m.id_medicament
    WHERE s.quantite <= s.seuil_alerte
  `;
  const pharmaciens = await prisma.utilisateur.findMany({ where: { role: 'pharmacien', actif: true } });
  for (const a of alertes) {
    for (const p of pharmaciens) {
      await notify(p.id_util, `Stock faible : ${a.nom} (${a.quantite} unités)`, 'stock');
    }
  }
});

// Actualités depuis stock à 7h30
cron.schedule('30 7 * * *', genererDepuisStock);

// Rappels factures impayées à 9h
cron.schedule('0 9 * * *', async () => {
  const factures = await prisma.facture.findMany({
    where: { statut: { in: ['en_attente', 'partiellement_paye'] } },
    include: { patient: { include: { utilisateur: true } } },
  });
  for (const f of factures) {
    await notify(
      f.patient.utilisateur.id_util,
      `Facture en attente de ${Number(f.part_patient).toLocaleString('fr')} FCFA`,
      'facture',
      '/patient/factures'
    );
  }
});
