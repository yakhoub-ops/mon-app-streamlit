/**
 * Page d'impression d'une facture.
 * URL : /print/facture/:id
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { factureService } from '../services/facture.service';

const fmt    = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
const fmtMnt = n => Number(n || 0).toLocaleString('fr-FR') + ' F CFA';

const STATUT_LABEL = {
  en_attente:         'En attente de paiement',
  partiellement_paye: 'Partiellement payée',
  paye:               'Soldée',
  annule:             'Annulée',
};

export default function PrintFacture() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    factureService.getOne(id).then(r => {
      setData(r.data);
      setTimeout(() => window.print(), 600);
    }).catch(() => {});
  }, [id]);

  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement…</div>;

  const restant = Number(data.montant_total) - Number(data.montant_paye);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 2rem', fontFamily: 'Arial, sans-serif', color: '#222', background: '#fff' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', borderBottom: '2px solid #1a7a4a', paddingBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#1a7a4a', fontWeight: '900', margin: 0 }}>TROPICAL MEDICAL</h1>
          <p style={{ fontSize: '0.85rem', color: '#555', margin: '0.2rem 0 0' }}>Centre de Santé</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontWeight: '900', fontSize: '1.1rem', color: '#1a7a4a', margin: 0 }}>FACTURE</p>
          <p style={{ fontSize: '0.82rem', color: '#555' }}>N° {data.id_facture}</p>
          <p style={{ fontSize: '0.82rem', color: '#555' }}>Émise le {fmt(data.date_emission)}</p>
          {data.date_echeance && <p style={{ fontSize: '0.82rem', color: '#555' }}>Échéance : {fmt(data.date_echeance)}</p>}
        </div>
      </div>

      {/* Patient */}
      <div style={{ marginBottom: '1.5rem', background: '#f7f7f7', padding: '0.85rem 1rem', borderRadius: '8px', fontSize: '0.88rem' }}>
        <p style={{ fontWeight: '700', color: '#555', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Facturé à</p>
        <p style={{ fontWeight: '700', fontSize: '1rem' }}>{data.prenom_patient} {data.nom_patient}</p>
        {data.telephone && <p style={{ color: '#555' }}>{data.telephone}</p>}
      </div>

      {/* Lignes */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1rem' }}>
        <thead>
          <tr style={{ background: '#1a7a4a', color: '#fff' }}>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: 50 }}>Qté</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', width: 120 }}>Prix unit.</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'right', width: 120 }}>Montant</th>
          </tr>
        </thead>
        <tbody>
          {(data.lignes || []).map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #ddd', background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '0.6rem 0.75rem' }}>{l.description}</td>
              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>{l.quantite}</td>
              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right' }}>{fmtMnt(l.prix_unitaire)}</td>
              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'right', fontWeight: '600' }}>{fmtMnt(l.montant)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totaux */}
      <div style={{ marginLeft: 'auto', maxWidth: '260px', fontSize: '0.88rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderTop: '1px solid #ddd' }}>
          <span style={{ color: '#555' }}>Total</span>
          <span style={{ fontWeight: '700' }}>{fmtMnt(data.montant_total)}</span>
        </div>
        {Number(data.part_assurance) > 0 && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', color: '#2980b9' }}>
              <span>Part assurance ({data.taux_assurance}%)</span>
              <span style={{ fontWeight: '700' }}>- {fmtMnt(data.part_assurance)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderTop: '1px solid #ddd' }}>
              <span style={{ fontWeight: '700' }}>Reste à charge</span>
              <span style={{ fontWeight: '800', fontSize: '1rem' }}>{fmtMnt(data.part_patient)}</span>
            </div>
          </>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0.6rem', background: restant > 0 ? '#fde8e8' : '#e8f5e9', borderRadius: '6px', marginTop: '0.4rem' }}>
          <span style={{ fontWeight: '700', color: restant > 0 ? '#c0392b' : '#2e7d32' }}>
            {restant > 0 ? 'Reste à payer' : 'Soldée'}
          </span>
          <span style={{ fontWeight: '900', color: restant > 0 ? '#c0392b' : '#2e7d32' }}>{fmtMnt(restant)}</span>
        </div>
        <div style={{ marginTop: '0.3rem', textAlign: 'right', fontSize: '0.78rem', color: '#888' }}>
          Statut : {STATUT_LABEL[data.statut] || data.statut}
          {data.mode_paiement && ` · ${data.mode_paiement}`}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div style={{ marginTop: '1.5rem', padding: '0.7rem 0.9rem', background: '#f7f7f7', borderRadius: '7px', fontSize: '0.83rem', color: '#555' }}>
          <strong>Notes :</strong> {data.notes}
        </div>
      )}

      {/* Pied */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '0.75rem', fontSize: '0.73rem', color: '#888', textAlign: 'center' }}>
        Tropical Medical · Merci de votre confiance · Paiement à l'échéance indiquée
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          button { display: none !important; }
        }
      `}</style>

      <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
        <button onClick={() => window.print()}
          style={{ padding: '0.6rem 1.5rem', background: '#1a7a4a', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}>
          Imprimer / Télécharger PDF
        </button>
      </div>
    </div>
  );
}
