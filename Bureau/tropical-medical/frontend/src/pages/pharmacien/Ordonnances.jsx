import { useState, useEffect, useCallback } from 'react';
import { ordonnanceService } from '../../services/ordonnance.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const fmt = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const STATUT_BADGE = { active: 'success', dispensee: 'info', expiree: 'default', annulee: 'error' };
const STATUT_LABEL = { active: 'Active', dispensee: 'Dispensée', expiree: 'Expirée', annulee: 'Annulée' };

/* ── Détail lignes d'une ordonnance ── */
function OrdonnanceDetail({ id_ordonnance, onClose, onDispenser }) {
  const [data,   setData]   = useState(null);
  const [busy,   setBusy]   = useState(false);
  const [notes,  setNotes]  = useState('');

  useEffect(() => {
    ordonnanceService.getOne(id_ordonnance).then(r => setData(r.data)).catch(() => setData({}));
  }, [id_ordonnance]);

  const dispenser = async () => {
    setBusy(true);
    try {
      await ordonnanceService.updateStatut(id_ordonnance, 'dispensee');
      onDispenser();
    } catch { setBusy(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>
            Ordonnance #{id_ordonnance}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>

        {!data ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Chargement…</p>
        ) : (
          <>
            {/* Infos patient / médecin */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Patient</p>
                <p style={{ fontWeight: '700', color: 'var(--text)' }}>{data.prenom_patient} {data.nom_patient}</p>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Médecin</p>
                <p style={{ fontWeight: '700', color: 'var(--text)' }}>Dr {data.prenom_medecin} {data.nom_medecin}</p>
                {data.specialite && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{data.specialite}</p>}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.25rem', fontSize: '0.83rem', color: 'var(--muted)' }}>
              <span>Émise le {fmt(data.date_emission)}</span>
              <span>·</span>
              <span style={{ color: new Date(data.date_expiration) < new Date() ? '#c0392b' : 'inherit' }}>
                Expire le {fmt(data.date_expiration)}
              </span>
              <span>·</span>
              <Badge type={STATUT_BADGE[data.statut]}>{STATUT_LABEL[data.statut]}</Badge>
            </div>

            {/* Lignes */}
            <div style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Médicaments prescrits</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {(data.lignes || []).map((l, i) => (
                  <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', background: 'var(--surface2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.92rem' }}>
                          {l.nom_medicament || l.nom}
                          {l.dosage && <span style={{ fontWeight: '400', color: 'var(--muted)', fontSize: '0.82rem', marginLeft: '0.35rem' }}>({l.dosage})</span>}
                        </p>
                        {l.dci && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>DCI : {l.dci}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                        {l.forme && <Badge type="default">{l.forme}</Badge>}
                        <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text)' }}>Qté : {l.quantite}</span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.83rem', color: 'var(--text)' }}>{l.posologie}</p>
                    {l.duree && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Durée : {l.duree}</p>}
                    {l.instructions && <p style={{ fontSize: '0.78rem', color: '#e67e22', marginTop: '0.25rem' }}>⚠ {l.instructions}</p>}
                  </div>
                ))}
              </div>
            </div>

            {/* Action dispenser */}
            {data.statut === 'active' && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <Button onClick={dispenser} disabled={busy} style={{ background: 'var(--g)' }}>
                    {busy ? 'Traitement…' : '✓ Marquer comme dispensée'}
                  </Button>
                  <Button variant="ghost" onClick={onClose}>Fermer</Button>
                </div>
              </div>
            )}
            {data.statut !== 'active' && (
              <Button variant="ghost" onClick={onClose} style={{ marginTop: '0.5rem' }}>Fermer</Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Carte ordonnance ── */
function OrdonnanceCard({ o, onView }) {
  const isExpired = new Date(o.date_expiration) < new Date();

  return (
    <div style={{ border: `1px solid ${o.statut === 'active' && !isExpired ? 'var(--g)' + '44' : 'var(--border)'}`, borderRadius: '10px', padding: '1rem 1.1rem', background: 'var(--surface)', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer', transition: 'box-shadow .15s' }}
      onClick={() => onView(o.id_ordonnance)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = ''}>

      <Avatar name={`${o.prenom_patient} ${o.nom_patient}`} size={42} />

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.2rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>
            {o.prenom_patient} {o.nom_patient}
          </span>
          <Badge type={STATUT_BADGE[o.statut]}>{STATUT_LABEL[o.statut]}</Badge>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Dr {o.prenom_medecin} {o.nom_medecin}
          {o.specialite ? ` · ${o.specialite}` : ''}
          {' · '}Émise le {fmt(o.date_emission)}
        </p>
        <p style={{ fontSize: '0.78rem', color: isExpired ? '#c0392b' : 'var(--muted)', marginTop: '0.15rem' }}>
          {isExpired ? '⚠ Expirée le ' : 'Expire le '}{fmt(o.date_expiration)}
        </p>
      </div>

      <div style={{ flexShrink: 0 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--g)', fontWeight: '600' }}>Voir →</span>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function PharmaOrdonnances() {
  const [tab,         setTab]         = useState('active');
  const [ordonnances, setOrdonnances] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [viewId,      setViewId]      = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await ordonnanceService.getAll({ statut: tab });
      setOrdonnances(r.data);
    } catch { setOrdonnances([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const filtered = ordonnances.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      `${o.prenom_patient} ${o.nom_patient}`.toLowerCase().includes(q) ||
      `${o.prenom_medecin} ${o.nom_medecin}`.toLowerCase().includes(q)
    );
  });

  const TABS = [
    { k: 'active',    label: 'Actives' },
    { k: 'dispensee', label: 'Dispensées' },
    { k: 'expiree',   label: 'Expirées' },
    { k: 'annulee',   label: 'Annulées' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Ordonnances</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>{filtered.length} ordonnance{filtered.length > 1 ? 's' : ''}</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)}
            style={{ padding: '0.6rem 1.1rem', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.k ? 'var(--g)' : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', fontWeight: tab === t.k ? '700' : '400', color: tab === t.k ? 'var(--g)' : 'var(--muted)', fontSize: '0.9rem' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div style={{ marginBottom: '1rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par patient ou médecin…"
          style={{ padding: '0.6rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', width: '100%', maxWidth: 360, outline: 'none', background: 'var(--surface)' }} />
      </div>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {!loading && filtered.length === 0 && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Aucune ordonnance {tab === 'active' ? 'active' : tab}.</p>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {filtered.map(o => (
            <OrdonnanceCard key={o.id_ordonnance} o={o} onView={setViewId} />
          ))}
        </div>
      )}

      {viewId && (
        <OrdonnanceDetail
          id_ordonnance={viewId}
          onClose={() => setViewId(null)}
          onDispenser={() => { setViewId(null); load(); }}
        />
      )}
    </div>
  );
}
