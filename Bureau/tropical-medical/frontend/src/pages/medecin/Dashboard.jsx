import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { patientService }   from '../../services/patient.service';
import { rdvService }       from '../../services/rdv.service';
import { urgenceService }   from '../../services/urgence.service';
import { ordonnanceService } from '../../services/ordonnance.service';
import Avatar  from '../../components/ui/Avatar';
import Card    from '../../components/ui/Card';
import Badge   from '../../components/ui/Badge';
import Spinner from '../../components/ui/Spinner';

const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

/* Accès rapides 4x2 */
const QUICK = [
  { icon: '📅', label: 'Mes RDV',          path: '/medecin/rdv' },
  { icon: '📹', label: 'Téléconsult.',     path: '/medecin/teleconsultation' },
  { icon: '💊', label: 'Ordonnance',       path: '/medecin/ordonnance/new' },
  { icon: '🚨', label: 'Urgences',         path: '/medecin/urgences' },
  { icon: '👥', label: 'Patients',         path: null, action: 'scroll' },
  { icon: '💰', label: 'Factures',         path: '/medecin/factures' },
  { icon: '📋', label: 'Disponibilités',   path: '/medecin/rdv', state: { tab: 3 } },
  { icon: '🩺', label: 'Consultation',     path: '/medecin/consultation/new' },
];

const RDV_TAG = {
  confirme:   { color: '#27ae60', bg: '#eafaf1', label: 'Confirmé' },
  en_attente: { color: '#e67e22', bg: '#fef5ec', label: 'En attente' },
  annule:     { color: '#e74c3c', bg: '#fde8e8', label: 'Annulé' },
  termine:    { color: '#7f8c8d', bg: '#f2f3f4', label: 'Terminé' },
  urgent:     { color: '#c0392b', bg: '#fdecea', label: 'Urgent' },
};

export default function MedecinDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();

  const [patients,  setPatients]  = useState([]);
  const [rdvsToday, setRdvsToday] = useState([]);
  const [stats,     setStats]     = useState({ rdvToday: 0, patientsActifs: 0, ordonnances: 0, urgences: 0 });
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const [statsLoad, setStatsLoad] = useState(true);

  /* Chargement stats */
  useEffect(() => {
    Promise.all([
      rdvService.getAll({ date: today() }),
      patientService.getAll(),
      urgenceService.getAll({ statut: 'active' }),
      ordonnanceService.getAll({ statut: 'active' }),
    ]).then(([rdv, pat, urg, ord]) => {
      setRdvsToday(rdv.data.slice(0, 8));
      setStats({
        rdvToday:       rdv.data.length,
        patientsActifs: pat.data.length,
        urgences:       urg.data.length,
        ordonnances:    ord.data.length,
      });
    }).catch(() => {}).finally(() => setStatsLoad(false));
  }, []);

  /* Recherche patients */
  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      patientService.getAll(search)
        .then(r => setPatients(r.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const STAT_CARDS = [
    { label: 'RDV aujourd\'hui',     value: stats.rdvToday,       icon: '📅', color: 'var(--g)',  bg: 'var(--g3)' },
    { label: 'Patients actifs',      value: stats.patientsActifs, icon: '👥', color: '#2980b9',  bg: '#eaf4fb' },
    { label: 'Ordonnances actives',  value: stats.ordonnances,    icon: '💊', color: '#8e44ad',  bg: '#f5eef8' },
    { label: 'Urgences en attente',  value: stats.urgences,       icon: '🚨', color: '#c0392b',  bg: '#fdecea' },
  ];

  return (
    <div className="fade-in" style={{ padding: '1.25rem', maxWidth: 900, margin: '0 auto' }}>

      {/* ── Bannière sénégalaise ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.85rem',
        background: 'linear-gradient(135deg, var(--g3) 0%, var(--g4) 100%)',
        borderRadius: '14px', padding: '0.9rem 1.1rem',
        marginBottom: '1.25rem',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '1.8rem', flexShrink: 0 }}>🇸🇳</span>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem' }}>Plateforme santé sénégalaise</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Teranga bi</p>
        </div>
        <span style={{
          background: 'var(--g)', color: '#fff',
          padding: '0.2rem 0.7rem', borderRadius: '20px',
          fontSize: '0.72rem', fontWeight: '800',
        }}>
          Wolof
        </span>
      </div>

      {/* ── Accès rapides 4x2 ── */}
      <h3 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.85rem', fontSize: '0.95rem' }}>
        Accès rapide
      </h3>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '0.65rem',
        marginBottom: '1.5rem',
      }}>
        {QUICK.map((q, i) => (
          <button
            key={i}
            onClick={() => {
              if (q.action === 'scroll') {
                document.getElementById('patients-section')?.scrollIntoView({ behavior: 'smooth' });
              } else if (q.path) {
                navigate(q.path);
              }
            }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '0.45rem',
              padding: '0.85rem 0.5rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              cursor: (q.path || q.action) ? 'pointer' : 'default',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (q.path || q.action) { e.currentTarget.style.background = 'var(--g3)'; e.currentTarget.style.borderColor = 'var(--g)'; }}}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'var(--g3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem',
            }}>
              {q.icon}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text)', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>
              {q.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Stats cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {STAT_CARDS.map(s => (
          <div key={s.label} style={{
            background: s.bg,
            borderRadius: '14px',
            padding: '1rem 1.1rem',
            border: `1px solid ${s.color}30`,
            display: 'flex', alignItems: 'center', gap: '0.85rem',
          }}>
            <div style={{
              width: 46, height: 46, borderRadius: '12px',
              background: `${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>
                {statsLoad ? '—' : s.value}
              </p>
              <p style={{ fontSize: '0.72rem', color: s.color, fontWeight: '600', opacity: 0.8, marginTop: '0.15rem' }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── RDV du jour ── */}
      {rdvsToday.length > 0 && (
        <Card style={{ marginBottom: '1.25rem', padding: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.85rem', fontSize: '0.95rem' }}>
            RDV du jour ({rdvsToday.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rdvsToday.map(r => {
              const tag = RDV_TAG[r.statut] || RDV_TAG.en_attente;
              const heure = r.date_rdv ? new Date(r.date_rdv).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—';
              return (
                <div key={r.id_rdv} style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.6rem 0.85rem',
                  background: 'var(--surface2)',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ textAlign: 'center', minWidth: 44, flexShrink: 0 }}>
                    <p style={{ fontWeight: '800', color: 'var(--g)', fontSize: '0.95rem', lineHeight: 1 }}>{heure}</p>
                  </div>
                  <Avatar name={`${r.prenom_patient || ''} ${r.nom_patient || ''}`} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.prenom_patient} {r.nom_patient}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{r.motif || 'Consultation'}</p>
                  </div>
                  <span style={{
                    padding: '0.2rem 0.65rem', borderRadius: '20px',
                    fontSize: '0.72rem', fontWeight: '700',
                    background: tag.bg, color: tag.color, flexShrink: 0,
                  }}>
                    {tag.label}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Recherche patients ── */}
      <Card id="patients-section" style={{ padding: '1.1rem' }}>
        <h3 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.85rem', fontSize: '0.95rem' }}>
          Patients ({patients.length})
        </h3>
        <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
          <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', fontSize: '1rem' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un patient…"
            style={{
              width: '100%',
              padding: '0.7rem 1rem 0.7rem 2.5rem',
              border: '1.5px solid var(--border)',
              borderRadius: '10px',
              fontSize: '0.93rem',
              background: 'var(--surface2)',
              outline: 'none',
              color: 'var(--text)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--g)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
            <Spinner />
          </div>
        ) : patients.length === 0 ? (
          <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem', fontSize: '0.88rem' }}>
            {search ? 'Aucun résultat.' : 'Aucun patient enregistré.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            {patients.map(p => (
              <button
                key={p.id_patient}
                onClick={() => navigate(`/medecin/patient/${p.id_patient}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.85rem',
                  padding: '0.65rem 0.85rem',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--g)'; e.currentTarget.style.background = 'var(--g3)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface2)'; }}
              >
                <Avatar name={`${p.prenom} ${p.nom}`} size={38} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.prenom} {p.nom}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{p.telephone}</p>
                </div>
                {p.groupe_sanguin && (
                  <Badge type="danger" style={{ background: '#fdecea', color: '#c0392b' }}>
                    {p.groupe_sanguin}
                  </Badge>
                )}
                <span style={{ color: 'var(--muted)', fontSize: '1rem', flexShrink: 0 }}>›</span>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
