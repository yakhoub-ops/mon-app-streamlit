import { useState, useEffect } from 'react';
import { teleconsultationService } from '../../services/teleconsultation.service';
import { rdvService }              from '../../services/rdv.service';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { formatDateTime } from '../../utils/formatDate';

const STATUT_BADGE = { planifiee: 'warning', en_cours: 'success', terminee: 'default', annulee: 'danger' };
const STATUT_LABEL = { planifiee: 'Planifiée', en_cours: 'En cours', terminee: 'Terminée', annulee: 'Annulée' };

const inp = {
  padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)',
  borderRadius: '8px', fontSize: '0.9rem', width: '100%', outline: 'none',
  background: 'var(--surface2)', color: 'var(--text)',
};

export default function MedecinTeleconsultation() {
  const [sessions,  setSessions]  = useState([]);
  const [rdvs,      setRdvs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [teleconsultActive, setTeleconsultActive] = useState(false);
  const [form,      setForm]      = useState({ id_rdv: '', id_patient: '' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, rRes] = await Promise.all([
        teleconsultationService.getAll(),
        rdvService.getAll({ statut: 'confirme', upcoming: 1 }),
      ]);
      setSessions(sRes.data);
      setRdvs(rRes.data);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async () => {
    try {
      await teleconsultationService.toggleTeleconsult(!teleconsultActive);
      setTeleconsultActive(v => !v);
    } catch {}
  };

  const creerSession = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const rdv = rdvs.find(r => r.id_rdv === Number(form.id_rdv));
      const r = await teleconsultationService.create({
        id_rdv: Number(form.id_rdv),
        id_patient: rdv?.id_patient,
      });
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const changerStatut = async (id, statut) => {
    try {
      await teleconsultationService.update(id, { statut });
      load();
    } catch {}
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Téléconsultation</h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: '0.2rem' }}>
            Sessions vidéo sécurisées via Jitsi Meet
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.65rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={toggleActive}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: '700', fontSize: '0.85rem',
              background: teleconsultActive ? 'var(--g3)' : '#f5f5f5',
              color: teleconsultActive ? 'var(--g2)' : 'var(--muted)',
            }}
          >
            {teleconsultActive ? '✓ Téléconsult. active' : 'Activer téléconsult.'}
          </button>
          <Button onClick={() => { setModal(true); setError(''); setForm({ id_rdv: '', id_patient: '' }); }}>
            + Nouvelle session
          </Button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={32} /></div>
      ) : sessions.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Aucune session de téléconsultation.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {sessions.map(s => (
            <Card key={s.id_teleconsult} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.65rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '1.1rem' }}>📹</span>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>
                      {s.prenom_patient} {s.nom_patient}
                    </span>
                    <Badge type={STATUT_BADGE[s.statut]}>{STATUT_LABEL[s.statut]}</Badge>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    RDV : {formatDateTime(s.date_rdv)}{s.motif ? ` — ${s.motif}` : ''}
                  </p>
                  {s.lien_session && (
                    <a href={s.lien_session} target="_blank" rel="noreferrer"
                      style={{ fontSize: '0.82rem', color: 'var(--g2)', fontWeight: '600', marginTop: '0.25rem', display: 'block' }}>
                      Rejoindre la session →
                    </a>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {s.statut === 'planifiee' && (
                    <Button size="sm" onClick={() => changerStatut(s.id_teleconsult, 'en_cours')}>
                      Démarrer
                    </Button>
                  )}
                  {s.statut === 'en_cours' && (
                    <Button size="sm" variant="ghost" onClick={() => changerStatut(s.id_teleconsult, 'terminee')}>
                      Terminer
                    </Button>
                  )}
                  {(s.statut === 'planifiee' || s.statut === 'en_cours') && (
                    <Button size="sm" variant="danger" onClick={() => changerStatut(s.id_teleconsult, 'annulee')}>
                      Annuler
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal nouvelle session */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '420px', overflow: 'hidden' }}>
            <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontWeight: '800', color: 'var(--text)' }}>Nouvelle session vidéo</h3>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>
            <form onSubmit={creerSession} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>
              )}
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.35rem' }}>
                  Sélectionner un RDV confirmé *
                </label>
                <select
                  required
                  value={form.id_rdv}
                  onChange={e => setForm(f => ({ ...f, id_rdv: e.target.value }))}
                  style={inp}
                >
                  <option value="">— Choisir un RDV —</option>
                  {rdvs.map(r => (
                    <option key={r.id_rdv} value={r.id_rdv}>
                      {r.prenom_patient} {r.nom_patient} · {formatDateTime(r.date_rdv)}
                    </option>
                  ))}
                </select>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                Un lien Jitsi Meet sécurisé sera automatiquement généré et envoyé au patient.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border)' }}>
                <Button variant="ghost" type="button" onClick={() => setModal(false)}>Annuler</Button>
                <Button type="submit" disabled={saving}>{saving ? 'Création…' : 'Créer la session'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
