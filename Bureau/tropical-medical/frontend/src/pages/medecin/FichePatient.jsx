import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { patientService }    from '../../services/patient.service';
import { dossierService }    from '../../services/dossier.service';
import { ordonnanceService } from '../../services/ordonnance.service';
import Avatar  from '../../components/ui/Avatar';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { formatDate, formatDateTime } from '../../utils/formatDate';

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '0.65rem 0.5rem',
        background: active ? 'var(--g)' : 'transparent',
        color: active ? '#fff' : 'var(--muted)',
        border: 'none',
        borderRadius: '10px',
        fontWeight: active ? '700' : '500',
        fontSize: '0.85rem',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

function InfoChip({ label, value, highlight = false }) {
  return (
    <div style={{
      background: highlight ? 'var(--g3)' : 'var(--surface2)',
      borderRadius: '10px',
      padding: '0.6rem 0.85rem',
      minWidth: 0,
      overflow: 'hidden',
    }}>
      <p style={{ fontSize: '0.7rem', color: highlight ? 'var(--g2)' : 'var(--muted)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.2rem' }}>
        {label}
      </p>
      <p style={{
        color: 'var(--text)', fontSize: '0.88rem', fontWeight: highlight ? '800' : '500',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        wordBreak: 'break-all',
      }}
        title={value || ''}
      >
        {value || '—'}
      </p>
    </div>
  );
}

export default function FichePatient() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [tab,      setTab]      = useState('infos');
  const [patient,  setPatient]  = useState(null);
  const [dossier,  setDossier]  = useState(null);
  const [consultations, setConsultations] = useState([]);
  const [ordonnances,   setOrdonnances]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const [editDossier,  setEditDossier]  = useState(false);
  const [observations, setObservations] = useState('');
  const [saving,       setSaving]       = useState(false);

  useEffect(() => {
    Promise.all([
      patientService.getOne(id),
      dossierService.getByPatient(id),
      ordonnanceService.getAll({ patient: id }),
    ]).then(([pRes, dRes, oRes]) => {
      setPatient(pRes.data);
      setDossier(dRes.data);
      setObservations(dRes.data.observations || '');
      setConsultations(dRes.data.consultations || []);
      setOrdonnances(oRes.data || []);
    }).catch(() => setError('Impossible de charger la fiche patient.'))
      .finally(() => setLoading(false));
  }, [id]);

  const saveDossier = async () => {
    setSaving(true);
    try {
      await dossierService.updateByPatient(id, { observations });
      setDossier(d => ({ ...d, observations }));
      setEditDossier(false);
    } catch {
      alert('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const age = (dob) => {
    if (!dob) return null;
    const y = new Date().getFullYear() - new Date(dob).getFullYear();
    return `${y} ans`;
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '1rem' }}>
      <Spinner size={40} />
      <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>Chargement de la fiche…</p>
    </div>
  );
  if (error)   return <div style={{ padding: '2rem', color: '#c0392b', fontSize: '0.9rem' }}>{error}</div>;
  if (!patient) return null;

  const nom = `${patient.prenom} ${patient.nom}`;

  return (
    <div className="fade-in" style={{ maxWidth: 860, margin: '0 auto' }}>

      {/* ── Header patient (vert) ── */}
      <div style={{
        background: 'var(--g)',
        padding: '1.25rem 1.25rem 1.5rem',
        position: 'relative',
      }}>
        {/* Retour */}
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none', cursor: 'pointer',
            color: '#fff', fontSize: '0.85rem', fontWeight: '600',
            padding: '0.35rem 0.85rem', borderRadius: '20px',
            marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
          }}
        >
          ← Retour
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.5rem', fontWeight: '800', color: '#fff',
            flexShrink: 0,
            border: '2px solid rgba(255,255,255,0.5)',
          }}>
            {(patient.prenom?.[0] || '') + (patient.nom?.[0] || '')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ color: '#fff', fontWeight: '900', fontSize: '1.2rem', marginBottom: '0.2rem' }}>
              {nom}
            </h2>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {age(patient.date_naissance) && (
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
                  {age(patient.date_naissance)}
                </span>
              )}
              {patient.adresse && (
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.8rem' }}>· {patient.adresse}</span>
              )}
            </div>
          </div>
          {patient.groupe_sanguin && (
            <div style={{
              background: '#e74c3c', color: '#fff',
              fontWeight: '900', fontSize: '0.88rem',
              padding: '0.3rem 0.75rem', borderRadius: '10px',
              flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }}>
              {patient.groupe_sanguin}
            </div>
          )}
        </div>
      </div>

      {/* ── Onglets ── */}
      <div style={{ padding: '0.85rem 1.25rem 0', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', gap: '0.35rem',
          background: 'var(--surface2)',
          borderRadius: '12px',
          padding: '0.3rem',
        }}>
          <TabBtn active={tab === 'infos'}         onClick={() => setTab('infos')}>📋 Infos</TabBtn>
          <TabBtn active={tab === 'consultations'} onClick={() => setTab('consultations')}>
            🩺 Consultations ({consultations.length})
          </TabBtn>
          <TabBtn active={tab === 'ordonnances'}   onClick={() => setTab('ordonnances')}>
            💊 Ordonnances ({ordonnances.length})
          </TabBtn>
        </div>
      </div>

      {/* ── Contenu onglets ── */}
      <div style={{ padding: '1.25rem' }}>

        {/* INFOS */}
        {tab === 'infos' && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Informations personnelles */}
            <Card>
              <h4 style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.85rem', fontSize: '0.9rem' }}>
                Informations personnelles
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.6rem' }}>
                <InfoChip label="Date naissance" value={formatDate(patient.date_naissance)} />
                <InfoChip label="Sexe"           value={patient.sexe} />
                <InfoChip label="Téléphone"      value={patient.telephone} />
                <InfoChip label="Email"          value={patient.email} />
                <InfoChip label="Adresse"        value={patient.adresse} />
                <InfoChip label="Groupe sanguin" value={patient.groupe_sanguin} highlight />
              </div>
            </Card>

            {/* Alertes médicales */}
            {(patient.allergies || patient.antecedents) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {patient.allergies && (
                  <div style={{
                    background: '#fff8e1',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    borderLeft: '4px solid #f57c00',
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '800', color: '#e65100', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                      ⚠ Allergies connues
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {patient.allergies.split(',').map((a, i) => (
                        <span key={i} style={{ background: '#fff3e0', color: '#e65100', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {patient.antecedents && (
                  <div style={{
                    background: 'var(--g3)',
                    borderRadius: '12px',
                    padding: '0.85rem 1rem',
                    borderLeft: '4px solid var(--g)',
                  }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--g2)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                      Antécédents médicaux
                    </p>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {patient.antecedents.split(',').map((a, i) => (
                        <span key={i} style={{ background: 'var(--g4)', color: 'var(--g2)', padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '600' }}>
                          {a.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dossier médical */}
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <h4 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>Dossier médical</h4>
                {!editDossier && (
                  <Button variant="ghost" size="sm" onClick={() => setEditDossier(true)}>✏️ Modifier</Button>
                )}
              </div>
              {editDossier ? (
                <div>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    rows={5}
                    placeholder="Observations générales, notes de suivi…"
                    style={{
                      width: '100%', padding: '0.75rem', border: '1.5px solid var(--border)',
                      borderRadius: '10px', fontSize: '0.9rem', resize: 'vertical',
                      outline: 'none', color: 'var(--text)', background: 'var(--surface2)',
                      marginBottom: '0.75rem', lineHeight: '1.6',
                    }}
                    onFocus={e => e.target.style.borderColor = 'var(--g)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'flex-end' }}>
                    <Button variant="ghost" size="sm" onClick={() => { setEditDossier(false); setObservations(dossier?.observations || ''); }}>
                      Annuler
                    </Button>
                    <Button size="sm" disabled={saving} onClick={saveDossier}>
                      {saving ? <Spinner size={14} color="#fff" /> : '✓ Enregistrer'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p style={{ color: observations ? 'var(--text)' : 'var(--muted)', fontSize: '0.9rem', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                  {observations || 'Aucune observation enregistrée.'}
                </p>
              )}
            </Card>

            {/* Boutons d'action */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link to={`/medecin/ordonnance/new?patient=${id}`} style={{ flex: 1 }}>
                <Button style={{ width: '100%' }}>💊 Nouvelle ordonnance</Button>
              </Link>
              <Link to={`/medecin/consultation/new?patient=${id}`} style={{ flex: 1 }}>
                <Button variant="outline" style={{ width: '100%' }}>🩺 Nouvelle consultation</Button>
              </Link>
            </div>
          </div>
        )}

        {/* CONSULTATIONS */}
        {tab === 'consultations' && (
          <div className="fade-in">
            {consultations.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Aucune consultation enregistrée.</p>
                <Link to={`/medecin/consultation/new?patient=${id}`}>
                  <Button>+ Nouvelle consultation</Button>
                </Link>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {consultations.map(c => (
                  <Card key={c.id_consultation} style={{ padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.92rem' }}>
                          Dr {c.prenom_medecin} {c.nom_medecin}
                          {c.specialite && <span style={{ fontWeight: '400', color: 'var(--muted)', fontSize: '0.82rem' }}> · {c.specialite}</span>}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{formatDateTime(c.date_consultation)}</p>
                      </div>
                      <Badge type={c.statut === 'terminee' ? 'success' : 'warning'}>{c.statut}</Badge>
                    </div>
                    {c.motif && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.3rem' }}>
                        <strong>Motif :</strong> {c.motif}
                      </p>
                    )}
                    {c.diagnostic && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
                        <strong>Diagnostic :</strong> {c.diagnostic}
                      </p>
                    )}
                    {c.traitement && (
                      <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                        <strong>Traitement :</strong> {c.traitement}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ORDONNANCES */}
        {tab === 'ordonnances' && (
          <div className="fade-in">
            {ordonnances.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>Aucune ordonnance enregistrée.</p>
                <Link to={`/medecin/ordonnance/new?patient=${id}`}>
                  <Button>+ Nouvelle ordonnance</Button>
                </Link>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ordonnances.map(o => (
                  <Card key={o.id_ordonnance} style={{ padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.92rem' }}>
                          Ordonnance #{o.id_ordonnance}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          Créée le {formatDate(o.date_creation)} · Exp. {formatDate(o.date_expiration)}
                        </p>
                      </div>
                      <Badge type={o.statut === 'active' ? 'success' : 'default'}>{o.statut}</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
