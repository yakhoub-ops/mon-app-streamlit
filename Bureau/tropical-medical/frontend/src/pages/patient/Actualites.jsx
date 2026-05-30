import { useState, useEffect, useCallback } from 'react';
import { actualiteService } from '../../services/actualite.service';
import Card from '../../components/ui/Card';

const fmt = d => d
  ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  : '—';

const TYPE_CONFIG = {
  stock_entree:     { label: 'Nouveau stock',   icon: '✅', color: '#27ae60', bg: '#e8f8f0' },
  stock_alerte:     { label: 'Stock faible',    icon: '⚠️', color: '#e67e22', bg: '#fff8e1' },
  stock_peremption: { label: 'Péremption',      icon: '📅', color: '#e74c3c', bg: '#fde8e8' },
  conseil:          { label: 'Conseil santé',   icon: '💡', color: '#2980b9', bg: '#eaf4fb' },
  annonce:          { label: 'Annonce',          icon: '📢', color: '#8e44ad', bg: '#f5eef8' },
};

const FILTRES = [
  { value: '', label: 'Toutes' },
  { value: 'stock_entree', label: '✅ Nouveaux stocks' },
  { value: 'stock_alerte', label: '⚠️ Alertes' },
  { value: 'conseil',      label: '💡 Conseils' },
  { value: 'annonce',      label: '📢 Annonces' },
];

export default function Actualites() {
  const [actualites, setActualites] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtre,     setFiltre]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 50 };
      if (filtre) params.type = filtre;
      const r = await actualiteService.getAll(params);
      setActualites(r.data);
    } catch { setActualites([]); }
    setLoading(false);
  }, [filtre]);

  useEffect(() => { load(); }, [load]);

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.25rem' }}>
          Actualités médicales
        </h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
          Informations de la pharmacie et du centre médical
        </p>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
        {FILTRES.map(f => (
          <button
            key={f.value}
            onClick={() => setFiltre(f.value)}
            style={{
              padding: '0.35rem 0.85rem', borderRadius: '20px', border: 'none',
              cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
              background: filtre === f.value ? 'var(--g)' : 'var(--surface2)',
              color: filtre === f.value ? '#fff' : 'var(--muted)',
              transition: 'all .15s',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Chargement…
        </Card>
      ) : actualites.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📋</p>
          <p>Aucune actualité pour le moment.</p>
          <p style={{ fontSize: '0.82rem', marginTop: '0.4rem' }}>
            Les informations de la pharmacie et du centre apparaîtront ici.
          </p>
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {actualites.map(a => {
            const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.annonce;
            return (
              <Card key={a.id_actualite} style={{ padding: '1rem 1.25rem', borderLeft: `4px solid ${cfg.color}` }}>
                <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'flex-start' }}>
                  {/* Icône */}
                  <div style={{
                    width: 42, height: 42, borderRadius: '10px', flexShrink: 0,
                    background: cfg.bg, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: '1.2rem',
                  }}>
                    {cfg.icon}
                  </div>

                  {/* Contenu */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.3rem', marginBottom: '0.3rem' }}>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: '700', padding: '0.15rem 0.55rem',
                        borderRadius: '20px', background: cfg.bg, color: cfg.color,
                      }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {fmt(a.created_at)}
                      </span>
                    </div>
                    <h4 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                      {a.titre}
                    </h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                      {a.contenu}
                    </p>
                    {a.nom_medicament && (
                      <p style={{ marginTop: '0.35rem', fontSize: '0.78rem', color: cfg.color, fontWeight: '600' }}>
                        Médicament : {a.nom_medicament}{a.forme ? ` (${a.forme})` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
