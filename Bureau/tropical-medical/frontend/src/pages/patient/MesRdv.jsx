import { useState, useEffect, useCallback } from 'react';
import { rdvService }     from '../../services/rdv.service';
import { medecinService } from '../../services/medecin.service';
import { useAuth }        from '../../context/AuthContext';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Avatar  from '../../components/ui/Avatar';
import { formatDate, formatDateTime } from '../../utils/formatDate';

const BADGE = { en_attente: 'warning', confirme: 'success', annule: 'danger', termine: 'default' };
const LABEL = { en_attente: 'En attente', confirme: 'Confirmé', annule: 'Annulé', termine: 'Terminé' };
const TODAY  = new Date().toISOString().slice(0, 10);

// Étape 0 = type, 1 = médecin, 2 = date, 3 = créneau
const STEP_TITLES = ['Type de consultation', 'Choisir un médecin', 'Choisir une date', 'Choisir un créneau'];

const TYPES = [
  {
    value: 'presentiel',
    icon:  '🏥',
    label: 'Consultation physique',
    desc:  'Vous vous déplacez au centre médical.',
    color: 'var(--g)',
    bg:    'var(--g3)',
  },
  {
    value: 'teleconsultation',
    icon:  '📹',
    label: 'Téléconsultation',
    desc:  'Consultation vidéo depuis chez vous. Médecins disponibles uniquement.',
    color: '#2980b9',
    bg:    '#eaf4fb',
  },
];

export default function PatientMesRdv() {
  const { user } = useAuth();
  const [rdvs,       setRdvs]       = useState([]);
  const [tab,        setTab]        = useState(0);
  const [busy,       setBusy]       = useState(null);
  const [modal,      setModal]      = useState(false);

  // Wizard : étape 0=type 1=médecin 2=date 3=créneau
  const [step,       setStep]       = useState(0);
  const [typeRdv,    setTypeRdv]    = useState('');
  const [medecins,   setMedecins]   = useState([]);
  const [loadMeds,   setLoadMeds]   = useState(false);
  const [selMed,     setSelMed]     = useState(null);
  const [date,       setDate]       = useState(TODAY);
  const [creneaux,   setCreneaux]   = useState([]);
  const [selSlot,    setSelSlot]    = useState('');
  const [motif,      setMotif]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [bookErr,    setBookErr]    = useState('');
  const [loadSlots,  setLoadSlots]  = useState(false);

  const loadRdvs = useCallback(async (t) => {
    try {
      const r = await rdvService.getAll(t === 0 ? { upcoming: 1 } : { past: 1 });
      setRdvs(r.data);
    } catch { setRdvs([]); }
  }, []);

  useEffect(() => { loadRdvs(tab); }, [tab, loadRdvs]);

  const annuler = async (id) => {
    if (!window.confirm('Annuler ce rendez-vous ?')) return;
    setBusy(id);
    try { await rdvService.cancel(id); loadRdvs(tab); }
    finally { setBusy(null); }
  };

  const openModal = () => {
    setStep(0); setTypeRdv(''); setSelMed(null); setDate(TODAY);
    setSelSlot(''); setMotif(''); setBookErr(''); setCreneaux([]);
    setMedecins([]);
    setModal(true);
  };

  /* Étape 0 → 1 : charger médecins selon le type choisi */
  const choisirType = async (type) => {
    setTypeRdv(type);
    setStep(1);
    setLoadMeds(true);
    setMedecins([]);
    try {
      const params = type === 'teleconsultation'
        ? { teleconsult: 1 }   // filtre backend : teleconsult_active = 1
        : {};
      const r = await medecinService.getAll(params);
      // Filtre côté front si besoin
      const liste = type === 'teleconsultation'
        ? r.data.filter(m => m.teleconsult_active)
        : r.data;
      setMedecins(liste);
    } catch { setMedecins([]); }
    setLoadMeds(false);
  };

  /* Étape 1 → 2 */
  const choisirMedecin = (m) => { setSelMed(m); setStep(2); };

  /* Étape 2 → 3 : charger créneaux */
  useEffect(() => {
    if (step !== 3 || !selMed) return;
    setLoadSlots(true); setSelSlot(''); setCreneaux([]);
    medecinService.getCreneaux(selMed.id_medecin, date)
      .then(r => setCreneaux(r.data))
      .catch(() => setCreneaux([]))
      .finally(() => setLoadSlots(false));
  }, [step, date, selMed]);

  /* Confirmation */
  const confirmerRdv = async () => {
    if (!selSlot) return;
    setSaving(true); setBookErr('');
    try {
      const date_rdv = `${date}T${selSlot}:00`;
      await rdvService.create({
        id_medecin: selMed.id_medecin,
        date_rdv,
        motif,
        type_rdv: typeRdv,
      });
      setModal(false);
      loadRdvs(0);
      setTab(0);
    } catch (err) {
      setBookErr(err.response?.data?.error || 'Erreur lors de la réservation');
    } finally {
      setSaving(false);
    }
  };

  const inp = { padding: '0.65rem 0.9rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', width: '100%' };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Mes rendez-vous</h2>
        <Button onClick={openModal}>+ Prendre RDV</Button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {['À venir', 'Passés'].map((t, i) => (
          <button key={t} onClick={() => setTab(i)} style={{
            padding: '0.55rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontSize: '0.92rem', fontWeight: tab === i ? '700' : '400',
            color: tab === i ? 'var(--g)' : 'var(--muted)',
            borderBottom: tab === i ? '2px solid var(--g)' : '2px solid transparent',
            marginBottom: '-2px',
          }}>{t}</button>
        ))}
      </div>

      {/* Liste RDV */}
      {rdvs.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          {tab === 0 ? "Aucun rendez-vous à venir." : "Aucun rendez-vous passé."}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {rdvs.map(r => (
            <Card key={r.id_rdv} style={{ padding: '1rem 1.25rem', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: r.type_rdv === 'teleconsultation' ? '#eaf4fb' : 'var(--g3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>
                {r.type_rdv === 'teleconsultation' ? '📹' : '🩺'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.3rem' }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: '700', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Dr {r.prenom_medecin} {r.nom_medecin}
                    </p>
                    <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                      {r.specialite} · {formatDateTime(r.date_rdv)}
                      {r.type_rdv === 'teleconsultation' && (
                        <span style={{ marginLeft: '0.4rem', color: '#2980b9', fontWeight: '700' }}>· Vidéo</span>
                      )}
                    </p>
                    {r.motif && <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{r.motif}</p>}
                  </div>
                  <Badge type={BADGE[r.statut]}>{LABEL[r.statut]}</Badge>
                </div>
                {tab === 0 && r.statut !== 'annule' && r.statut !== 'termine' && (
                  <div style={{ marginTop: '0.55rem' }}>
                    <Button variant="danger" size="sm" disabled={busy === r.id_rdv} onClick={() => annuler(r.id_rdv)}>
                      {busy === r.id_rdv ? '…' : 'Annuler'}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ===== MODAL RÉSERVATION ===== */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '85vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase' }}>
                  Étape {step + 1} / 4
                </p>
                <h3 style={{ color: 'var(--text)', fontSize: '1.05rem' }}>{STEP_TITLES[step]}</h3>
              </div>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
            </div>

            {/* Barre de progression */}
            <div style={{ display: 'flex', padding: '0.75rem 1.5rem 0', gap: '0.4rem' }}>
              {[0,1,2,3].map(i => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? 'var(--g)' : 'var(--border)', transition: 'background .2s' }} />
              ))}
            </div>

            {/* Body */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1 }}>

              {/* Étape 0 : Type de consultation */}
              {step === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <p style={{ fontSize: '0.88rem', color: 'var(--muted)', marginBottom: '0.25rem' }}>
                    Comment souhaitez-vous consulter ?
                  </p>
                  {TYPES.map(t => (
                    <button key={t.value} onClick={() => choisirType(t.value)} style={{
                      display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.25rem',
                      background: typeRdv === t.value ? t.bg : 'var(--surface2)',
                      border: `2px solid ${typeRdv === t.value ? t.color : 'var(--border)'}`,
                      borderRadius: '12px', cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                    }}>
                      <span style={{ fontSize: '2rem', flexShrink: 0 }}>{t.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.2rem' }}>{t.label}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{t.desc}</p>
                      </div>
                      <span style={{ color: t.color, fontSize: '1.1rem' }}>›</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Étape 1 : Choisir médecin */}
              {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {typeRdv === 'teleconsultation' && (
                    <div style={{ background: '#eaf4fb', borderRadius: '8px', padding: '0.65rem 0.9rem', marginBottom: '0.5rem', fontSize: '0.82rem', color: '#2980b9', fontWeight: '600' }}>
                      📹 Seuls les médecins ayant activé la téléconsultation sont affichés.
                    </div>
                  )}
                  {loadMeds ? (
                    <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Chargement…</p>
                  ) : medecins.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
                      {typeRdv === 'teleconsultation'
                        ? 'Aucun médecin n\'a activé la téléconsultation pour l\'instant.'
                        : 'Aucun médecin disponible.'}
                    </div>
                  ) : medecins.map(m => (
                    <button key={m.id_medecin} onClick={() => choisirMedecin(m)} style={{
                      display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1rem',
                      background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '10px',
                      cursor: 'pointer', textAlign: 'left', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--g)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <Avatar name={`${m.prenom} ${m.nom}`} size={40} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          Dr {m.prenom} {m.nom}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                          {m.specialite}{m.service ? ` · ${m.service}` : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Étape 2 : Choisir date */}
              {step === 2 && (
                <div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', padding: '0.75rem 1rem', background: 'var(--g3)', borderRadius: '8px' }}>
                    <Avatar name={`${selMed.prenom} ${selMed.nom}`} size={36} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Dr {selMed.prenom} {selMed.nom}</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{selMed.specialite}</p>
                    </div>
                  </div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Date souhaitée</label>
                  <input type="date" value={date} min={TODAY} onChange={e => setDate(e.target.value)} style={inp} />
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.75rem' }}>
                    {formatDate(date)} — les créneaux disponibles s'afficheront à l'étape suivante.
                  </p>
                </div>
              )}

              {/* Étape 3 : Choisir créneau */}
              {step === 3 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
                      Dr {selMed.prenom} {selMed.nom} · <strong style={{ color: 'var(--text)' }}>{formatDate(date)}</strong>
                    </p>
                    <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--g)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>
                      ← Changer
                    </button>
                  </div>

                  {loadSlots ? (
                    <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Chargement des créneaux…</p>
                  ) : creneaux.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--muted)' }}>
                      <p>Aucun créneau disponible ce jour.</p>
                      <button onClick={() => setStep(2)} style={{ marginTop: '0.75rem', background: 'none', border: 'none', color: 'var(--g)', cursor: 'pointer', fontWeight: '600' }}>
                        Choisir une autre date
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                      {creneaux.map(slot => (
                        <button key={slot} onClick={() => setSelSlot(slot)} style={{
                          padding: '0.6rem', border: `1.5px solid ${selSlot === slot ? 'var(--g)' : 'var(--border)'}`,
                          borderRadius: '8px', background: selSlot === slot ? 'var(--g3)' : 'var(--surface)',
                          color: selSlot === slot ? 'var(--g2)' : 'var(--text)',
                          fontWeight: selSlot === slot ? '700' : '400',
                          cursor: 'pointer', fontSize: '0.9rem',
                        }}>{slot}</button>
                      ))}
                    </div>
                  )}

                  {selSlot && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Motif de consultation</label>
                      <input value={motif} onChange={e => setMotif(e.target.value)}
                        placeholder="Ex : fièvre, consultation de routine…" style={inp} />
                    </div>
                  )}

                  {bookErr && (
                    <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.65rem', borderRadius: '8px', marginTop: '0.75rem', fontSize: '0.88rem' }}>
                      {bookErr}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="ghost" onClick={() => step > 0 ? setStep(s => s - 1) : setModal(false)}>
                {step === 0 ? 'Annuler' : '← Retour'}
              </Button>
              {step === 2 && (
                <Button onClick={() => setStep(3)}>Voir les créneaux →</Button>
              )}
              {step === 3 && (
                <Button disabled={!selSlot || saving} onClick={confirmerRdv}>
                  {saving ? 'Réservation…' : 'Confirmer le RDV'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
