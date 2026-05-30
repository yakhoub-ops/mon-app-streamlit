import { useState, useEffect } from 'react';
import { useNavigate }  from 'react-router-dom';
import { rdvService }   from '../../services/rdv.service';
import { useAuth }      from '../../context/AuthContext';
import Card    from '../../components/ui/Card';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatDate';

const BADGE = { en_attente: 'warning', confirme: 'success', annule: 'danger', termine: 'default' };
const LABEL = { en_attente: 'En attente', confirme: 'Confirmé', annule: 'Annulé', termine: 'Terminé' };

const QUICK = [
  { label: 'Mes RDV',         path: '/patient/rdv',      icon: '📅', desc: 'Rendez-vous' },
  { label: 'Mon dossier',     path: '/patient/dossier',  icon: '📋', desc: 'Médical' },
  { label: 'Mes factures',    path: '/patient/factures', icon: '💰', desc: 'Facturation' },
  { label: 'Ordonnances',     path: '/patient/dossier',  icon: '💊', desc: 'Traitements' },
];

export default function PatientDashboard() {
  const { user }  = useAuth();
  const navigate  = useNavigate();
  const [rdvs, setRdvs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    rdvService.getAll({ upcoming: 1 })
      .then(r => setRdvs(r.data))
      .finally(() => setLoading(false));
  }, []);

  const prochain = rdvs[0] || null;

  return (
    <div className="fade-in" style={{ padding: '1.25rem', maxWidth: 700, margin: '0 auto' }}>

      {/* ── Prochain RDV mis en avant ── */}
      <h3 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
        📅 Prochain rendez-vous
      </h3>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Spinner />
        </div>
      ) : !prochain ? (
        <Card style={{ padding: '1.5rem', marginBottom: '1.25rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
            Aucun rendez-vous à venir. Prenez soin de vous ! 🌿
          </p>
          <Button onClick={() => navigate('/patient/rdv')}>Prendre un rendez-vous</Button>
        </Card>
      ) : (
        <div className="slide-up" style={{
          background: 'linear-gradient(135deg, var(--g) 0%, var(--g2) 100%)',
          borderRadius: '16px',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          boxShadow: '0 4px 20px rgba(7,241,19,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Cercle décoratif */}
          <div style={{
            position: 'absolute', right: -20, top: -20,
            width: 100, height: 100, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
            <div>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.35rem' }}>
                PROCHAIN RDV
              </p>
              <p style={{ fontWeight: '900', color: '#fff', fontSize: '1.1rem', marginBottom: '0.2rem' }}>
                Dr {prochain.prenom_medecin} {prochain.nom_medecin}
              </p>
              {prochain.specialite && (
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>
                  {prochain.specialite}
                </p>
              )}
              <p style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                🕐 {formatDateTime(prochain.date_rdv)}
              </p>
              {prochain.motif && (
                <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>
                  {prochain.motif}
                </p>
              )}
            </div>
            <span style={{
              background: BADGE[prochain.statut] === 'success' ? 'rgba(255,255,255,0.25)' : '#fff',
              color: BADGE[prochain.statut] === 'success' ? '#fff' : 'var(--g)',
              padding: '0.25rem 0.75rem', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: '800',
            }}>
              {LABEL[prochain.statut]}
            </span>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => navigate('/patient/rdv')}
              style={{
                padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)',
                color: '#fff', border: '1.5px solid rgba(255,255,255,0.5)',
                borderRadius: '8px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer',
              }}
            >
              Tous mes RDV
            </button>
          </div>
        </div>
      )}

      {/* ── Accès rapide ── */}
      <h3 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.75rem', fontSize: '0.95rem' }}>
        Accès rapide
      </h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {QUICK.map(q => (
          <button
            key={q.path + q.label}
            onClick={() => navigate(q.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.85rem',
              padding: '1rem',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--g)'; e.currentTarget.style.background = 'var(--g3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)'; }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: '12px',
              background: 'var(--g3)', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>
              {q.icon}
            </div>
            <div>
              <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>{q.label}</p>
              <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{q.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── RDV suivants ── */}
      {rdvs.length > 1 && (
        <Card style={{ padding: '1.1rem' }}>
          <h4 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>
            Prochaines consultations
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rdvs.slice(1, 5).map(r => (
              <div key={r.id_rdv} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: 'var(--surface2)', borderRadius: '10px',
                border: '1px solid var(--border)',
              }}>
                <div>
                  <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem' }}>
                    Dr {r.prenom_medecin} {r.nom_medecin}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{formatDateTime(r.date_rdv)}</p>
                </div>
                <Badge type={BADGE[r.statut]}>{LABEL[r.statut]}</Badge>
              </div>
            ))}
          </div>
          {rdvs.length > 5 && (
            <button
              onClick={() => navigate('/patient/rdv')}
              style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--g)', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', width: '100%', textAlign: 'center' }}
            >
              Voir tous les {rdvs.length} rendez-vous →
            </button>
          )}
        </Card>
      )}

      {/* Bannière */}
      <div style={{
        marginTop: '1.25rem',
        background: 'var(--g3)',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        display: 'flex', alignItems: 'center', gap: '0.75rem',
        border: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: '1.4rem' }}>🇸🇳</span>
        <p style={{ color: 'var(--text)', fontSize: '0.82rem', fontWeight: '600' }}>
          Votre santé, notre priorité · <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontWeight: '400' }}>Teranga bi</span>
        </p>
      </div>
    </div>
  );
}
