import { useState, useEffect } from 'react';
import { useAuth }             from '../../context/AuthContext';
import { dossierService }      from '../../services/dossier.service';
import { ordonnanceService }   from '../../services/ordonnance.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Avatar from '../../components/ui/Avatar';

const fmt = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/* ── Ordonnance expandable ── */
function OrdonnanceLine({ id_ordonnance, date_ordonnance, statut }) {
  const [open,    setOpen]    = useState(false);
  const [lignes,  setLignes]  = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!open && lignes === null) {
      setLoading(true);
      try {
        const { data } = await ordonnanceService.getOne(id_ordonnance);
        setLignes(data.lignes || []);
      } catch { setLignes([]); }
      finally { setLoading(false); }
    }
    setOpen(o => !o);
  };

  const color = statut === 'active' ? 'success' : statut === 'annulee' ? 'error' : 'default';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', marginBottom: '0.5rem' }}>
      <button onClick={toggle} style={{ width: '100%', background: 'var(--surface2)', border: 'none', cursor: 'pointer', padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
        <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
          Ordonnance du {fmt(date_ordonnance)}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Badge type={color}>{statut}</Badge>
          <a
            href={`/print/ordonnance/${id_ordonnance}`}
            target="_blank"
            rel="noreferrer"
            onClick={e => e.stopPropagation()}
            style={{ fontSize: '0.75rem', color: 'var(--g2)', fontWeight: '700', textDecoration: 'none', padding: '0.15rem 0.5rem', border: '1px solid var(--g)', borderRadius: '6px', whiteSpace: 'nowrap' }}
          >
            PDF
          </a>
          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '0.75rem 1rem' }}>
          {loading && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Chargement…</p>}
          {lignes && lignes.length === 0 && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Aucun médicament.</p>}
          {lignes && lignes.map((l, i) => (
            <div key={i} style={{ borderBottom: i < lignes.length - 1 ? '1px solid var(--border)' : 'none', paddingBottom: '0.5rem', marginBottom: '0.5rem' }}>
              <p style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.9rem' }}>
                {l.nom}{l.dosage ? ` (${l.dosage})` : ''}
                {l.forme && <span style={{ marginLeft: '0.4rem', fontSize: '0.78rem', color: 'var(--muted)', fontWeight: '400' }}>{l.forme}</span>}
              </p>
              <p style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
                {l.posologie}{l.duree ? ` · ${l.duree}` : ''}{l.quantite > 1 ? ` · Qté : ${l.quantite}` : ''}
              </p>
              {l.instructions && <p style={{ fontSize: '0.8rem', color: 'var(--g2)', marginTop: '0.2rem' }}>⚠ {l.instructions}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Consultation accordion ── */
function ConsultationCard({ c, ordonnances }) {
  const [open, setOpen] = useState(false);
  const linked = ordonnances.filter(o => o.id_consultation === c.id_consultation);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden', marginBottom: '0.75rem' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', background: 'var(--surface)', border: 'none', cursor: 'pointer', padding: '0.85rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textAlign: 'left' }}>
        <div>
          <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem', marginBottom: '0.15rem' }}>
            {c.motif || 'Consultation sans motif'}
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
            {fmt(c.date_consultation)}
            {c.medecin_nom ? ` · Dr ${c.medecin_prenom} ${c.medecin_nom}` : ''}
            {linked.length > 0 ? ` · ${linked.length} ordonnance${linked.length > 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Badge type={c.statut === 'terminee' ? 'success' : 'warning'}>{c.statut}</Badge>
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {open && (
        <div style={{ padding: '1rem 1.1rem', borderTop: '1px solid var(--border)', background: 'var(--surface2)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.75rem' }}>
            {c.diagnostic && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Diagnostic</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{c.diagnostic}</p>
              </div>
            )}
            {c.traitement && (
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Traitement</p>
                <p style={{ fontSize: '0.88rem', color: 'var(--text)' }}>{c.traitement}</p>
              </div>
            )}
            {c.notes && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Notes</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{c.notes}</p>
              </div>
            )}
          </div>

          {linked.length > 0 && (
            <div>
              <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Ordonnances</p>
              {linked.map(o => (
                <OrdonnanceLine key={o.id_ordonnance} {...o} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page principale ── */
export default function MonDossier() {
  const { user } = useAuth();
  const [dossier,       setDossier]       = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [ordonnances,   setOrdonnances]   = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');

  useEffect(() => {
    if (!user?.id_patient) return;
    Promise.all([
      dossierService.getByPatient(user.id_patient),
      ordonnanceService.getAll(),
    ])
      .then(([dRes, oRes]) => {
        const d = dRes.data;
        setDossier(d);
        setConsultations(d.consultations || []);
        setOrdonnances(oRes.data || []);
      })
      .catch(() => setError('Impossible de charger votre dossier.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (loading) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Chargement du dossier…</div>
  );

  if (error) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#c0392b' }}>{error}</div>
  );

  if (!dossier) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>Dossier introuvable.</div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* Titre */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)' }}>Mon dossier médical</h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
          Dossier #{dossier.id_dossier} · Créé le {fmt(dossier.date_creation)}
        </p>
      </div>

      {/* Infos patient */}
      <Card style={{ padding: '1.1rem 1.25rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <Avatar name={`${user.prenom} ${user.nom}`} size={52} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>{user.prenom} {user.nom}</p>
          <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{user.email}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {dossier.groupe_sanguin && <Badge type="error">{dossier.groupe_sanguin}</Badge>}
          {dossier.allergies && <Badge type="warning">⚠ Allergies</Badge>}
        </div>
      </Card>

      {/* Alertes médicales */}
      {(dossier.allergies || dossier.antecedents) && (
        <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem', borderLeft: '4px solid #e67e22' }}>
          {dossier.allergies && (
            <div style={{ marginBottom: dossier.antecedents ? '0.75rem' : 0 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: '#e67e22', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Allergies</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{dossier.allergies}</p>
            </div>
          )}
          {dossier.antecedents && (
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Antécédents médicaux</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{dossier.antecedents}</p>
            </div>
          )}
        </Card>
      )}

      {/* Observations */}
      {dossier.observations && (
        <Card style={{ padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>Observations du médecin</p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>{dossier.observations}</p>
        </Card>
      )}

      {/* Consultations */}
      <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>
          Consultations ({consultations.length})
        </h3>
      </div>

      {consultations.length === 0 ? (
        <Card style={{ padding: '1.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Aucune consultation enregistrée.</p>
        </Card>
      ) : (
        consultations.map(c => (
          <ConsultationCard key={c.id_consultation} c={c} ordonnances={ordonnances} />
        ))
      )}
    </div>
  );
}
