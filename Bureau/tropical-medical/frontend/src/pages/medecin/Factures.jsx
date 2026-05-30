import { useState, useEffect, useCallback } from 'react';
import { factureService } from '../../services/facture.service';
import Card  from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';

const fmt    = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtMnt = n => Number(n || 0).toLocaleString('fr-FR') + ' F CFA';

const STATUT = {
  en_attente:         { label: 'En attente',  type: 'warning' },
  partiellement_paye: { label: 'Partiel',     type: 'info'    },
  paye:               { label: 'Payée',       type: 'success' },
  annule:             { label: 'Annulée',     type: 'default' },
};

export default function MedecinFactures() {
  const [factures, setFactures] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail,   setDetail]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        factureService.getAll(),
        factureService.getStats(),
      ]);
      setFactures(fRes.data);
      setStats(sRes.data);
    } catch { setFactures([]); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setSelected(id);
    try {
      const r = await factureService.getOne(id);
      setDetail(r.data);
    } catch { setDetail(null); }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '1.25rem' }}>Factures patients</h2>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {[
            { label: 'Total facturé',   val: fmtMnt(stats.total_facture),  color: 'var(--g)',  bg: 'var(--g3)' },
            { label: 'Encaissé',        val: fmtMnt(stats.total_encaisse), color: '#2980b9',  bg: '#eaf4fb' },
            { label: 'Reste à payer',   val: fmtMnt(stats.total_restant),  color: '#c0392b',  bg: '#fdecea' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: '12px', padding: '0.85rem 1rem', border: `1px solid ${s.color}30` }}>
              <p style={{ fontWeight: '900', color: s.color, fontSize: '1.1rem' }}>{s.val}</p>
              <p style={{ fontSize: '0.72rem', color: s.color, fontWeight: '600', opacity: 0.8 }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Chargement…</Card>
      ) : factures.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Aucune facture.</Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {factures.map(f => (
            <Card key={f.id_facture}
              onClick={() => openDetail(f.id_facture)}
              style={{ padding: '0.85rem 1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.prenom_patient} {f.nom_patient}
                </p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{fmt(f.date_emission)}</p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontWeight: '800', color: 'var(--text)', fontSize: '0.95rem' }}>{fmtMnt(f.montant_total)}</p>
                {Number(f.montant_restant) > 0 && (
                  <p style={{ fontSize: '0.75rem', color: '#c0392b' }}>Reste : {fmtMnt(f.montant_restant)}</p>
                )}
              </div>
              <Badge type={STATUT[f.statut]?.type}>{STATUT[f.statut]?.label || f.statut}</Badge>
            </Card>
          ))}
        </div>
      )}

      {/* Modal détail */}
      {selected && (
        <>
          <div onClick={() => { setSelected(null); setDetail(null); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 301, padding: '1rem', pointerEvents: 'none' }}>
            <div style={{ background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: 480, maxHeight: '85vh', display: 'flex', flexDirection: 'column', pointerEvents: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflowY: 'auto' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '800', color: 'var(--text)' }}>Facture #{selected}</h3>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <a href={`/print/facture/${selected}`} target="_blank" rel="noreferrer"
                    style={{ fontSize: '0.8rem', color: 'var(--g2)', fontWeight: '700', textDecoration: 'none', padding: '0.3rem 0.75rem', border: '1px solid var(--g)', borderRadius: '6px' }}>
                    PDF
                  </a>
                  <button onClick={() => { setSelected(null); setDetail(null); }} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
                </div>
              </div>
              {!detail ? (
                <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Chargement…</p>
              ) : (
                <div style={{ padding: '1.25rem' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {detail.prenom_patient} {detail.nom_patient}
                  </p>
                  {(detail.lignes || []).map((l, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.88rem' }}>
                      <span style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{l.description}</span>
                      <span style={{ fontWeight: '600', color: 'var(--text)', flexShrink: 0 }}>{fmtMnt(l.montant)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.85rem', textAlign: 'right' }}>
                    <p style={{ fontWeight: '900', color: 'var(--text)' }}>Total : {fmtMnt(detail.montant_total)}</p>
                    {Number(detail.montant_restant) > 0 && (
                      <p style={{ color: '#c0392b', fontWeight: '700' }}>Reste : {fmtMnt(detail.montant_restant)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
