/**
 * Page d'impression d'une ordonnance.
 * URL : /print/ordonnance/:id
 * Cette page est accessible sans layout (aucune nav) pour permettre window.print().
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ordonnanceService } from '../services/ordonnance.service';

const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';

export default function PrintOrdonnance() {
  const { id } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    ordonnanceService.getOne(id).then(r => {
      setData(r.data);
      setTimeout(() => window.print(), 600);
    }).catch(() => {});
  }, [id]);

  if (!data) return <div style={{ padding: '2rem', textAlign: 'center' }}>Chargement…</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2.5rem 2rem', fontFamily: 'Georgia, serif', color: '#222', background: '#fff' }}>

      {/* En-tête */}
      <div style={{ borderBottom: '2px solid #1a7a4a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', color: '#1a7a4a', fontWeight: '900', margin: 0 }}>TROPICAL MEDICAL</h1>
          <p style={{ fontSize: '0.85rem', color: '#555', marginTop: '0.2rem' }}>Centre de Santé</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: '0.8rem', color: '#555' }}>N° {data.id_ordonnance}</p>
          <p style={{ fontSize: '0.8rem', color: '#555' }}>Le {fmt(data.date_emission)}</p>
        </div>
      </div>

      {/* Titre */}
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1a7a4a', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem', display: 'inline-block', padding: '0 2rem 0.5rem' }}>
          ORDONNANCE MÉDICALE
        </h2>
      </div>

      {/* Médecin + Patient */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', fontSize: '0.88rem' }}>
        <div style={{ background: '#f0f7f4', padding: '0.85rem', borderRadius: '8px' }}>
          <p style={{ fontWeight: '700', color: '#1a7a4a', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Prescripteur</p>
          <p style={{ fontWeight: '700' }}>Dr {data.prenom_medecin} {data.nom_medecin}</p>
          <p style={{ color: '#555' }}>{data.specialite}</p>
        </div>
        <div style={{ background: '#f7f7f7', padding: '0.85rem', borderRadius: '8px' }}>
          <p style={{ fontWeight: '700', color: '#555', marginBottom: '0.3rem', fontSize: '0.75rem', textTransform: 'uppercase' }}>Patient</p>
          <p style={{ fontWeight: '700' }}>{data.prenom_patient} {data.nom_patient}</p>
          <p style={{ color: '#555', fontSize: '0.82rem' }}>Validité : {fmt(data.date_expiration)}</p>
        </div>
      </div>

      {/* Médicaments */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
        <thead>
          <tr style={{ background: '#1a7a4a', color: '#fff' }}>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left' }}>Médicament</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left' }}>Posologie</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'center', width: 60 }}>Qté</th>
            <th style={{ padding: '0.55rem 0.75rem', textAlign: 'left', width: 80 }}>Durée</th>
          </tr>
        </thead>
        <tbody>
          {(data.lignes || []).map((l, i) => (
            <tr key={i} style={{ borderBottom: '1px solid #ddd', background: i % 2 === 0 ? '#fff' : '#f9f9f9' }}>
              <td style={{ padding: '0.6rem 0.75rem', fontWeight: '600' }}>
                {l.nom_medicament}
                {l.dci && <span style={{ color: '#666', fontWeight: '400', fontSize: '0.8rem' }}> ({l.dci})</span>}
              </td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{l.posologie}</td>
              <td style={{ padding: '0.6rem 0.75rem', textAlign: 'center' }}>{l.quantite}</td>
              <td style={{ padding: '0.6rem 0.75rem' }}>{l.duree || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Signature */}
      <div style={{ marginTop: '2rem', textAlign: 'right' }}>
        <div style={{ display: 'inline-block', textAlign: 'center', minWidth: '180px' }}>
          <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', marginTop: '2.5rem', fontSize: '0.83rem', color: '#555' }}>
            Signature du médecin
          </div>
          <p style={{ fontWeight: '700', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Dr {data.prenom_medecin} {data.nom_medecin}
          </p>
        </div>
      </div>

      {/* Pied de page */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid #ddd', paddingTop: '0.75rem', fontSize: '0.75rem', color: '#888', textAlign: 'center' }}>
        Tropical Medical · Ordonnance valable jusqu'au {fmt(data.date_expiration)} · Ne pas dépasser les doses prescrites
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
