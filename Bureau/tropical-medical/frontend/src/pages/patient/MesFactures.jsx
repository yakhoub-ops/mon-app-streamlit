import { useState, useEffect } from 'react';
import { factureService } from '../../services/facture.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';

const fmt    = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMnt = n => Number(n || 0).toLocaleString('fr-FR') + ' F CFA';

const STATUT = {
  en_attente:        { label: 'En attente',       type: 'warning' },
  partiellement_paye: { label: 'Partiel',          type: 'info'    },
  paye:              { label: 'Payée',             type: 'success' },
  annule:            { label: 'Annulée',           type: 'default' },
};

const MODE = {
  especes:      'Espèces',
  wave:         'Wave',
  orange_money: 'Orange Money',
  carte:        'Carte bancaire',
  assurance:    'Assurance',
  cheque:       'Chèque',
};

/* ── Détail facture ── */
function FactureDetail({ id, onClose }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    factureService.getOne(id).then(r => setData(r.data)).catch(() => setData({}));
  }, [id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '500px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>Facture #{id}</h3>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <a
              href={`/print/facture/${id}`}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.8rem', color: 'var(--g2)', fontWeight: '700', textDecoration: 'none', padding: '0.3rem 0.75rem', border: '1px solid var(--g)', borderRadius: '6px' }}
            >
              Télécharger PDF
            </a>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
          </div>
        </div>

        {!data ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Chargement…</p>
        ) : (
          <>
            {/* Infos */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Émise le</p>
                <p style={{ fontWeight: '600', color: 'var(--text)' }}>{fmt(data.date_emission)}</p>
              </div>
              {data.date_echeance && (
                <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem 1rem' }}>
                  <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Échéance</p>
                  <p style={{ fontWeight: '600', color: new Date(data.date_echeance) < new Date() && data.statut !== 'paye' ? '#c0392b' : 'var(--text)' }}>{fmt(data.date_echeance)}</p>
                </div>
              )}
              <div style={{ flex: 1, background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem 1rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Statut</p>
                <Badge type={STATUT[data.statut]?.type}>{STATUT[data.statut]?.label}</Badge>
              </div>
            </div>

            {/* Lignes */}
            <div style={{ marginBottom: '1.1rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Détail des prestations</p>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Prestation</th>
                    <th style={{ textAlign: 'center', padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Qté</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>P.U.</th>
                    <th style={{ textAlign: 'right', padding: '0.4rem 0.5rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.lignes || []).map((l, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.5rem', color: 'var(--text)' }}>{l.description}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'center', color: 'var(--muted)' }}>{l.quantite}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--muted)' }}>{fmtMnt(l.prix_unitaire)}</td>
                      <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600', color: 'var(--text)' }}>{fmtMnt(l.montant)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totaux */}
            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.85rem 1rem', marginBottom: data.mode_paiement ? '0.75rem' : 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Total</span>
                <span style={{ fontWeight: '700', color: 'var(--text)' }}>{fmtMnt(data.montant_total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Payé</span>
                <span style={{ fontWeight: '700', color: '#27ae60' }}>{fmtMnt(data.montant_paye)}</span>
              </div>
              {Number(data.montant_restant) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.4rem' }}>
                  <span style={{ fontWeight: '700', color: '#c0392b', fontSize: '0.92rem' }}>Reste à payer</span>
                  <span style={{ fontWeight: '800', color: '#c0392b', fontSize: '1rem' }}>{fmtMnt(data.montant_restant)}</span>
                </div>
              )}
            </div>

            {/* Mode de paiement */}
            {data.mode_paiement && (
              <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Mode : <strong style={{ color: 'var(--text)' }}>{MODE[data.mode_paiement] || data.mode_paiement}</strong>
                {data.reference_assurance && ` · Réf. assurance : ${data.reference_assurance}`}
              </p>
            )}
            {data.notes && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.4rem', fontStyle: 'italic' }}>{data.notes}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function MesFactures() {
  const [factures, setFactures] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('toutes');
  const [viewId,   setViewId]   = useState(null);

  useEffect(() => {
    const params = tab !== 'toutes' ? { statut: tab } : {};
    factureService.getAll(params)
      .then(r => setFactures(r.data))
      .catch(() => setFactures([]))
      .finally(() => setLoading(false));
  }, [tab]);

  const totalDu = factures
    .filter(f => f.statut === 'en_attente' || f.statut === 'partiellement_paye')
    .reduce((sum, f) => sum + Number(f.montant_restant || 0), 0);

  const TABS = [
    { k: 'toutes',             label: 'Toutes' },
    { k: 'en_attente',         label: 'En attente' },
    { k: 'partiellement_paye', label: 'Partielles' },
    { k: 'paye',               label: 'Payées' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Mes factures</h2>
        {totalDu > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#fdecea', borderRadius: '8px', padding: '0.4rem 0.85rem', marginTop: '0.3rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#c0392b', fontWeight: '600' }}>Solde dû :</span>
            <span style={{ fontWeight: '800', color: '#c0392b', fontSize: '1rem' }}>{fmtMnt(totalDu)}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.k ? 'var(--g)' : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', fontWeight: tab === t.k ? '700' : '400', color: tab === t.k ? 'var(--g)' : 'var(--muted)', fontSize: '0.88rem' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {!loading && factures.length === 0 && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Aucune facture.</p>
        </Card>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
        {factures.map(f => {
          const s = STATUT[f.statut] || { label: f.statut, type: 'default' };
          const enRetard = f.date_echeance && new Date(f.date_echeance) < new Date() && f.statut !== 'paye';
          return (
            <div key={f.id_facture}
              onClick={() => setViewId(f.id_facture)}
              style={{ border: `1px solid ${enRetard ? '#f5c6c6' : 'var(--border)'}`, borderLeft: `4px solid ${f.statut === 'paye' ? '#27ae60' : f.statut === 'annule' ? 'var(--border)' : '#e67e22'}`, borderRadius: '10px', padding: '1rem 1.1rem', background: 'var(--surface)', cursor: 'pointer', transition: 'box-shadow .15s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.07)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>Facture #{f.id_facture}</span>
                    <Badge type={s.type}>{s.label}</Badge>
                    {enRetard && <Badge type="error">En retard</Badge>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
                    {fmt(f.date_emission)}
                    {f.consultation_motif ? ` · ${f.consultation_motif}` : ''}
                    {f.date_echeance ? ` · Échéance ${fmt(f.date_echeance)}` : ''}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: '800', fontSize: '1.05rem', color: f.statut === 'paye' ? '#27ae60' : 'var(--text)' }}>
                    {fmtMnt(f.montant_total)}
                  </p>
                  {Number(f.montant_restant) > 0 && (
                    <p style={{ fontSize: '0.78rem', color: '#c0392b', fontWeight: '600' }}>
                      Reste : {fmtMnt(f.montant_restant)}
                    </p>
                  )}
                </div>
              </div>
              {f.statut !== 'en_attente' && f.mode_paiement && (
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  {MODE[f.mode_paiement] || f.mode_paiement}
                  {f.reference_assurance ? ` · Réf. ${f.reference_assurance}` : ''}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {viewId && <FactureDetail id={viewId} onClose={() => setViewId(null)} />}
    </div>
  );
}
