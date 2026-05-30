import { useState, useEffect, useCallback } from 'react';
import { useNavigate }    from 'react-router-dom';
import { rdvService }     from '../../services/rdv.service';
import { medecinService } from '../../services/medecin.service';
import { useAuth }        from '../../context/AuthContext';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Avatar  from '../../components/ui/Avatar';
import { formatDateTime } from '../../utils/formatDate';

const TABS  = ["Aujourd'hui", 'À venir', 'Passés', 'Disponibilités'];
const JOURS = ['', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const BADGE = { en_attente: 'warning', confirme: 'success', annule: 'danger', termine: 'default' };
const LABEL = { en_attente: 'En attente', confirme: 'Confirmé', annule: 'Annulé', termine: 'Terminé' };
const DUREES = [15, 20, 30, 45, 60];

export default function MedecinMesRdv() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab,     setTab]     = useState(0);
  const [rdvs,    setRdvs]    = useState([]);
  const [busy,    setBusy]    = useState(null);
  const [dispos,  setDispos]  = useState([]);
  const [savingD, setSavingD] = useState(false);
  const [msg,     setMsg]     = useState('');

  const medecinId = user?.id_medecin;

  const loadRdvs = useCallback(async (t) => {
    const params = {};
    if (t === 0) params.date     = new Date().toISOString().slice(0, 10);
    if (t === 1) params.upcoming = 1;
    if (t === 2) params.past     = 1;
    try { const r = await rdvService.getAll(params); setRdvs(r.data); }
    catch { setRdvs([]); }
  }, []);

  const loadDispos = useCallback(async () => {
    if (!medecinId) return;
    const r = await medecinService.getDisponibilites(medecinId);
    setDispos(r.data);
  }, [medecinId]);

  useEffect(() => { if (tab < 3) loadRdvs(tab); }, [tab, loadRdvs]);
  useEffect(() => { if (tab === 3) loadDispos(); }, [tab, loadDispos]);

  const changeStatut = async (id, action) => {
    setBusy(id);
    try { await action(id); loadRdvs(tab); }
    finally { setBusy(null); }
  };

  /* ── Disponibilités ── */
  const addSlot    = (j)       => setDispos(d => [...d, { jour_semaine: j, heure_debut: '08:00', heure_fin: '12:00', duree_slot: 30 }]);
  const removeSlot = (i)       => setDispos(d => d.filter((_, k) => k !== i));
  const editSlot   = (i, k, v) => setDispos(d => d.map((s, k2) => k2 === i ? { ...s, [k]: v } : s));

  const saveDispo = async () => {
    setSavingD(true); setMsg('');
    try {
      await medecinService.updateDisponibilites(medecinId, { disponibilites: dispos });
      setMsg('Disponibilités enregistrées !');
    } catch { setMsg('Erreur lors de l\'enregistrement'); }
    finally { setSavingD(false); setTimeout(() => setMsg(''), 4000); }
  };

  const inp = {
    padding: '0.4rem 0.65rem', border: '1px solid var(--border)',
    borderRadius: '6px', fontSize: '0.88rem', outline: 'none',
    background: 'var(--surface2)', color: 'var(--text)',
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '1.25rem' }}>Mes rendez-vous</h2>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '0.6rem 1.1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '0.92rem', fontWeight: tab === i ? '700' : '400', whiteSpace: 'nowrap',
            color: tab === i ? 'var(--g)' : 'var(--muted)',
            borderBottom: tab === i ? '2px solid var(--g)' : '2px solid transparent',
            marginBottom: '-2px',
          }}>{t}</button>
        ))}
      </div>

      {/* ── RDV (onglets 0-2) ── */}
      {tab < 3 && (rdvs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Aucun rendez-vous {tab === 0 ? "aujourd'hui" : tab === 1 ? 'à venir' : 'passé'}.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rdvs.map(r => (
            <Card key={r.id_rdv} style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', gap: '0.9rem', alignItems: 'flex-start' }}>
                <Avatar name={`${r.prenom_patient} ${r.nom_patient}`} size={44} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.prenom_patient} {r.nom_patient}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                        {formatDateTime(r.date_rdv)}{r.motif ? ` · ${r.motif}` : ''}
                        {r.type_rdv === 'teleconsultation' && (
                          <span style={{ marginLeft: '0.4rem', background: '#eaf4fb', color: '#2980b9', padding: '0.1rem 0.45rem', borderRadius: '10px', fontSize: '0.72rem', fontWeight: '700' }}>
                            📹 Téléconsult.
                          </span>
                        )}
                      </p>
                    </div>
                    <Badge type={BADGE[r.statut]}>{LABEL[r.statut]}</Badge>
                  </div>

                  {/* Actions selon statut */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem', flexWrap: 'wrap' }}>
                    {/* Toujours visible : fiche patient */}
                    <Button variant="ghost" size="sm"
                      onClick={() => navigate(`/medecin/patient/${r.id_patient}`)}>
                      Fiche patient
                    </Button>

                    {/* RDV non terminé/annulé : actions cliniques */}
                    {r.statut !== 'annule' && (
                      <>
                        <Button size="sm" variant="outline"
                          onClick={() => navigate(`/medecin/consultation/new?patient=${r.id_patient}&rdv=${r.id_rdv}`)}>
                          🩺 Consultation
                        </Button>
                        <Button size="sm" variant="outline"
                          onClick={() => navigate(`/medecin/ordonnance/new?patient=${r.id_patient}&rdv=${r.id_rdv}`)}>
                          💊 Ordonnance
                        </Button>
                        {r.type_rdv === 'teleconsultation' && (
                          <Button size="sm" variant="outline"
                            onClick={() => navigate('/medecin/teleconsultation')}>
                            📹 Téléconsult.
                          </Button>
                        )}
                      </>
                    )}

                    {/* Gestion du statut */}
                    {r.statut === 'en_attente' && (
                      <Button size="sm" disabled={busy === r.id_rdv}
                        onClick={() => changeStatut(r.id_rdv, rdvService.confirmer)}>
                        {busy === r.id_rdv ? '…' : 'Confirmer'}
                      </Button>
                    )}
                    {r.statut === 'confirme' && (
                      <Button size="sm" disabled={busy === r.id_rdv}
                        onClick={() => changeStatut(r.id_rdv, rdvService.terminer)}>
                        {busy === r.id_rdv ? '…' : 'Terminer'}
                      </Button>
                    )}
                    {r.statut !== 'annule' && r.statut !== 'termine' && (
                      <Button variant="danger" size="sm" disabled={busy === r.id_rdv}
                        onClick={() => changeStatut(r.id_rdv, rdvService.cancel)}>
                        Annuler
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ))}

      {/* ── Disponibilités (onglet 3) ── */}
      {tab === 3 && (
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.25rem' }}>
            Définissez vos plages horaires par jour. Choisissez la durée de chaque créneau — les patients ne verront que les créneaux libres.
          </p>

          {[1,2,3,4,5,6,7].map(jour => {
            const slots = dispos.filter(d => d.jour_semaine === jour);
            return (
              <Card key={jour} style={{ marginBottom: '0.65rem', padding: '0.9rem 1.1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: slots.length ? '0.65rem' : 0 }}>
                  <p style={{ fontWeight: '700', color: 'var(--text)', minWidth: '90px' }}>{JOURS[jour]}</p>
                  <Button variant="ghost" size="sm" onClick={() => addSlot(jour)}>+ Plage</Button>
                </div>

                {slots.length === 0 && (
                  <p style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Repos — aucune plage définie</p>
                )}

                {dispos.map((d, idx) => d.jour_semaine !== jour ? null : (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <input type="time" value={d.heure_debut}
                      onChange={e => editSlot(idx, 'heure_debut', e.target.value)} style={inp} />
                    <span style={{ color: 'var(--muted)' }}>→</span>
                    <input type="time" value={d.heure_fin}
                      onChange={e => editSlot(idx, 'heure_fin', e.target.value)} style={inp} />
                    {/* Durée du créneau */}
                    <select
                      value={d.duree_slot || 30}
                      onChange={e => editSlot(idx, 'duree_slot', Number(e.target.value))}
                      style={{ ...inp, minWidth: 90 }}
                      title="Durée d'un créneau"
                    >
                      {DUREES.map(mn => (
                        <option key={mn} value={mn}>{mn} min</option>
                      ))}
                    </select>
                    <button onClick={() => removeSlot(idx)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '1.2rem', lineHeight: 1, padding: '0.1rem 0.25rem' }}>
                      ×
                    </button>
                  </div>
                ))}
              </Card>
            );
          })}

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem' }}>
            <Button onClick={saveDispo} disabled={savingD || !medecinId}>
              {savingD ? 'Enregistrement…' : 'Enregistrer les disponibilités'}
            </Button>
            {msg && (
              <span style={{ fontSize: '0.9rem', fontWeight: '600', color: msg.startsWith('Disponibilités') ? 'var(--g)' : '#c0392b' }}>
                {msg}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
