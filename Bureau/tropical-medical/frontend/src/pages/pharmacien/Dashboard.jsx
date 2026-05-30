import { useState, useEffect } from 'react';
import { useNavigate }       from 'react-router-dom';
import { stockService }      from '../../services/stock.service';
import { ordonnanceService } from '../../services/ordonnance.service';
import Card    from '../../components/ui/Card';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';

const fmt     = d => d ? new Date(d).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' }) : '—';
const fmtHeur = d => d ? new Date(d).toLocaleString('fr-FR',    { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

const TYPE_SIGN  = { entree: '+', sortie: '−', ajustement: '±' };
const TYPE_COLOR = { entree: '#27ae60', sortie: '#e74c3c', ajustement: '#f39c12' };
const TYPE_BADGE = { entree: 'success', sortie: 'danger', ajustement: 'warning' };

function StockBar({ quantite, seuil_alerte, stock_max }) {
  const max   = stock_max || Math.max(seuil_alerte * 3, quantite * 1.5) || 100;
  const pct   = Math.min(100, Math.round((quantite / max) * 100));
  const color = quantite <= seuil_alerte ? '#e74c3c'
              : quantite <= seuil_alerte * 2 ? '#f39c12'
              : '#07f113';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1, minWidth: 80 }}>
      <div style={{ flex: 1, height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize: '0.75rem', fontWeight: '700', color, flexShrink: 0, minWidth: 28 }}>
        {quantite}
      </span>
    </div>
  );
}

export default function PharmaDashboard() {
  const navigate = useNavigate();
  const [alertes,     setAlertes]     = useState([]);
  const [peremptions, setPeremptions] = useState([]);
  const [mouvements,  setMouvements]  = useState([]);
  const [ordonnances, setOrdonnances] = useState([]);
  const [stock,       setStock]       = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      stockService.getAlertes(),
      stockService.getPeremptions(30),
      stockService.getMouvementsAll(),
      ordonnanceService.getAll({ statut: 'active' }),
      stockService.getAll ? stockService.getAll() : Promise.resolve({ data: [] }),
    ]).then(([a, p, mv, o, s]) => {
      setAlertes(a.data);
      setPeremptions(p.data);
      setMouvements(mv.data.slice(0, 8));
      setOrdonnances(o.data.slice(0, 6));
      setStock(s.data?.slice(0, 8) || []);
    }).catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
      <Spinner size={40} />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Chargement du tableau de bord…</p>
    </div>
  );

  const statCards = [
    { label: 'Total médicaments',    val: stock.length || '—',       icon: '💊', color: 'var(--g)',  bg: 'var(--g3)' },
    { label: 'Alertes stock bas',    val: alertes.length,            icon: '📦', color: '#c0392b',  bg: '#fdecea' },
    { label: 'Lots expirant < 30j',  val: peremptions.length,        icon: '⏰', color: '#e67e22',  bg: '#fef5ec' },
    { label: 'Ordonnances actives',  val: ordonnances.length,        icon: '📋', color: '#2980b9',  bg: '#eaf4fb' },
  ];

  return (
    <div className="fade-in" style={{ padding: '1.25rem', maxWidth: 960, margin: '0 auto' }}>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {statCards.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            borderRadius: '14px',
            padding: '1rem 1.1rem',
            border: `1px solid ${s.color}25`,
            display: 'flex', alignItems: 'center', gap: '0.85rem',
            cursor: 'pointer',
            transition: 'box-shadow 0.15s',
          }}
          onClick={() => navigate('/pharmacien/stock')}
          onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'}
          onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{
              width: 46, height: 46, borderRadius: '12px',
              background: `${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: '0.71rem', color: s.color, opacity: 0.8, fontWeight: '600', marginTop: '0.15rem' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Alertes critiques ── */}
      {alertes.length > 0 && (
        <Card style={{ marginBottom: '1.25rem', padding: '1.1rem', borderLeft: '4px solid #c0392b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontWeight: '800', color: '#c0392b', fontSize: '0.95rem' }}>
              ⚠ Alertes de stock ({alertes.length})
            </h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/pharmacien/stock')}>Voir tout</Button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {alertes.slice(0, 5).map(a => (
              <div key={a.id_stock} style={{
                display: 'flex', alignItems: 'center', gap: '0.85rem',
                padding: '0.6rem 0.85rem',
                background: '#fdecea', borderRadius: '10px',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.nom}
                  </p>
                  {a.dosage && a.dosage !== '—' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{a.dosage}</p>
                  )}
                </div>
                <StockBar quantite={a.quantite} seuil_alerte={a.seuil_alerte} />
                <Badge type="danger">Alerte</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Deux colonnes : mouvements & ordonnances ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Derniers mouvements */}
        <Card style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>Derniers mouvements</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/pharmacien/stock')}>Tout voir</Button>
          </div>
          {mouvements.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Aucun mouvement.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {mouvements.map(mv => (
                <div key={mv.id_mouvement} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.5rem 0.75rem', background: 'var(--surface2)', borderRadius: '8px',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.83rem', fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mv.nom_medicament}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{fmtHeur(mv.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontWeight: '800', color: TYPE_COLOR[mv.type], fontSize: '0.88rem' }}>
                      {TYPE_SIGN[mv.type]}{Math.abs(mv.quantite)}
                    </span>
                    <Badge type={TYPE_BADGE[mv.type]}>{mv.type}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ordonnances actives */}
        <Card style={{ padding: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>Ordonnances actives</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/pharmacien/ordonnances')}>Tout voir</Button>
          </div>
          {ordonnances.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '1rem' }}>Aucune ordonnance.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {ordonnances.map(o => (
                <div key={o.id_ordonnance} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '0.55rem 0.75rem',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)' }}>
                      {o.prenom_patient} {o.nom_patient}
                    </p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                      Exp. {fmt(o.date_expiration)}
                    </p>
                  </div>
                  <Badge type="success">active</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Bouton ajouter stock */}
      <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'center' }}>
        <Button
          onClick={() => navigate('/pharmacien/stock')}
          style={{ padding: '0.85rem 2rem', fontSize: '1rem' }}
        >
          📦 Gérer le stock
        </Button>
      </div>
    </div>
  );
}
