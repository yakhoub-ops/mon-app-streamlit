/**
 * Rappels automatiques — exécutés toutes les heures.
 * Nécessite : npm install node-cron
 *
 * Rappels envoyés :
 *  - RDV dans 24h
 *  - Factures impayées depuis plus de 7 jours
 *  - Stocks sous seuil d'alerte (résumé quotidien à 8h)
 */

const cron = require('node-cron');
const { genererDepuisStock } = require('./controllers/actualite.controller');

const pool    = require('./config/db');
const { notify, notifyRole } = require('./utils/notify');

async function rappelsRdv() {
  try {
    const [rdvs] = await pool.query(`
      SELECT r.id_rdv, r.date_rdv, r.motif,
             p.id_patient, u.id_util, u.nom, u.prenom
      FROM rdv r
      JOIN patient     p ON r.id_patient = p.id_patient
      JOIN utilisateur u ON p.id_util    = u.id_util
      WHERE r.statut = 'confirme'
        AND r.date_rdv BETWEEN NOW() + INTERVAL 23 HOUR AND NOW() + INTERVAL 25 HOUR
    `);
    for (const rdv of rdvs) {
      const heure = new Date(rdv.date_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      await notify({
        id_util: rdv.id_util,
        message: `Rappel : vous avez un RDV demain à ${heure}${rdv.motif ? ` — ${rdv.motif}` : ''}`,
        type: 'rdv',
        lien: '/patient/rdv',
      });
    }
  } catch {}
}

async function rappelsFactures() {
  try {
    const [factures] = await pool.query(`
      SELECT f.id_facture, f.montant_total, f.montant_paye,
             u.id_util, u.nom, u.prenom
      FROM facture f
      JOIN patient     p ON f.id_patient = p.id_patient
      JOIN utilisateur u ON p.id_util    = u.id_util
      WHERE f.statut IN ('en_attente','partiellement_paye')
        AND f.date_emission <= NOW() - INTERVAL 7 DAY
    `);
    for (const f of factures) {
      const restant = (Number(f.montant_total) - Number(f.montant_paye)).toLocaleString('fr-FR');
      await notify({
        id_util: f.id_util,
        message: `Facture #${f.id_facture} en attente — reste ${restant} F CFA à régler`,
        type: 'facture',
        lien: '/patient/factures',
      });
    }
  } catch {}
}

async function alerteStocks() {
  try {
    const [stocks] = await pool.query(`
      SELECT s.quantite, s.seuil_alerte, m.nom
      FROM stock s
      JOIN medicament m ON s.id_medicament = m.id_medicament
      WHERE s.quantite <= s.seuil_alerte
    `);
    if (stocks.length > 0) {
      const liste = stocks.map(s => `${s.nom} (${s.quantite}/${s.seuil_alerte})`).join(', ');
      await notifyRole({
        role: 'pharmacien',
        message: `Alerte stock — ${stocks.length} médicament(s) sous seuil : ${liste}`,
        type: 'stock',
        lien: '/pharmacien/stock',
      });
    }
  } catch {}
}

// Rappels RDV — toutes les heures
cron.schedule('0 * * * *', rappelsRdv);

// Relance factures — tous les jours à 9h
cron.schedule('0 9 * * *', rappelsFactures);

// Alerte stocks — tous les jours à 8h
cron.schedule('0 8 * * *', alerteStocks);

// Générer actualités depuis stock — tous les jours à 7h30
cron.schedule('30 7 * * *', genererDepuisStock);

module.exports = {};
