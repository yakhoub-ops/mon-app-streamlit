import { useState, useEffect, useCallback } from 'react';
import { urgenceService }   from '../../services/urgence.service';
import { patientService }   from '../../services/patient.service';
import { medecinService }   from '../../services/medecin.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

/* ── Couleurs niveaux ── */
const NIVEAU = {
  critique: { label: 'CRITIQUE', color: '#c0392b', bg: '#fdecea', pulse: true },
  urgent:   { label: 'URGENT',   color: '#e67e22', bg: '#fef5ec', pulse: false },
  modere:   { label: 'Modéré',   color: '#f39c12', bg: '#fef9ec', pulse: false },
  faible:   { label: 'Faible',   color: '#27ae60', bg: '#eafaf1', pulse: false },
};

const STATUT_COLOR = { en_attente: '#e74c3c', prise_en_charge: '#e67e22', resolue: '#27ae60' };
const STATUT_LABEL = { en_attente: 'En attente', prise_en_charge: 'Prise en charge', resolue: 'Résolue' };

function elapsed(dt) {
  const mins = Math.floor((Date.now() - new Date(dt)) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
}

/* ── Modal nouvelle urgence ── */
function AddUrgenceModal({ onClose, onSaved, medecins }) {
  const [mode,     setMode]     = useState('patient'); // 'patient' | 'libre'
  const [search,   setSearch]   = useState('');
  const [patients, setPatients] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({ nom_patient: '', description: '', niveau: 'urgent', id_medecin: '', notes: '' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  useEffect(() => {
    if (mode !== 'patient' || search.length < 2) { setPatients([]); return; }
    patientService.getAll({ q: search }).then(r => setPatients(r.data)).catch(() => {});
  }, [search, mode]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.description) { setError('La description est requise.'); return; }
    if (mode === 'patient' && !selected) { setError('Sélectionnez un patient.'); return; }
    if (mode === 'libre' && !form.nom_patient) { setError('Saisissez le nom du patient.'); return; }
    setSaving(true); setError('');
    try {
      await urgenceService.create({
        id_patient:  mode === 'patient' ? selected.id_patient : undefined,
        nom_patient: mode === 'libre'   ? form.nom_patient    : undefined,
        description: form.description,
        niveau:      form.niveau,
        id_medecin:  form.id_medecin || undefined,
        notes:       form.notes || undefined,
      });
      onSaved();
    } catch (e) {
      setError(e.response?.data?.error || 'Erreur');
      setSaving(false);
    }
  };

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.9rem', background: 'var(--surface)', width: '100%', outline: 'none' };
  const lbl = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '460px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.25)' }}>

        {/* Titre avec rouge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: '700', color: '#c0392b', fontSize: '1.1rem' }}>🚨 Nouvelle urgence</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--muted)' }}>×</button>
        </div>

        {error && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.6rem', borderRadius: '7px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        {/* Mode patient */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.1rem' }}>
          {[['patient', 'Patient enregistré'], ['libre', 'Identité libre']].map(([k, v]) => (
            <button key={k} onClick={() => { setMode(k); setSelected(null); setSearch(''); }}
              style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: `2px solid ${mode === k ? 'var(--g)' : 'var(--border)'}`, background: mode === k ? 'var(--g3)' : 'var(--surface)', color: mode === k ? 'var(--g)' : 'var(--muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }}>
              {v}
            </button>
          ))}
        </div>

        {mode === 'patient' ? (
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Rechercher un patient</label>
            <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
              placeholder="Nom, prénom, téléphone…" style={inp} />
            {patients.length > 0 && !selected && (
              <div style={{ border: '1px solid var(--border)', borderRadius: '7px', marginTop: '0.3rem', maxHeight: 160, overflowY: 'auto', background: 'var(--surface)' }}>
                {patients.map(p => (
                  <div key={p.id_patient}
                    onClick={() => { setSelected(p); setSearch(`${p.prenom} ${p.nom}`); setPatients([]); }}
                    style={{ padding: '0.55rem 0.85rem', cursor: 'pointer', display: 'flex', gap: '0.5rem', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <Avatar name={`${p.prenom} ${p.nom}`} size={26} />
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)' }}>{p.prenom} {p.nom}</p>
                      <p style={{ fontSize: '0.77rem', color: 'var(--muted)' }}>{p.telephone}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div style={{ marginBottom: '1rem' }}>
            <label style={lbl}>Nom du patient</label>
            <input value={form.nom_patient} onChange={set('nom_patient')}
              placeholder="Ex : John Doe (non enregistré)" style={inp} />
          </div>
        )}

        {/* Niveau */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Niveau de gravité</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {Object.entries(NIVEAU).map(([k, v]) => (
              <button key={k} type="button"
                onClick={() => setForm(f => ({ ...f, niveau: k }))}
                style={{ padding: '0.4rem 0.85rem', borderRadius: '20px', border: `2px solid ${form.niveau === k ? v.color : 'var(--border)'}`, background: form.niveau === k ? v.bg : 'var(--surface)', color: form.niveau === k ? v.color : 'var(--muted)', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Description *</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            placeholder="Symptômes, circonstances, état du patient…"
            style={{ ...inp, resize: 'vertical' }} />
        </div>

        {/* Médecin */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Médecin responsable (optionnel)</label>
          <select value={form.id_medecin} onChange={set('id_medecin')} style={inp}>
            <option value="">— Non assigné —</option>
            {medecins.map(m => (
              <option key={m.id_medecin} value={m.id_medecin}>Dr {m.prenom} {m.nom} · {m.specialite}</option>
            ))}
          </select>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={lbl}>Notes complémentaires</label>
          <input value={form.notes} onChange={set('notes')} placeholder="Infos supplémentaires…" style={inp} />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={saving} style={{ background: '#c0392b' }}>
            {saving ? 'Enregistrement…' : '🚨 Déclarer l\'urgence'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Carte urgence ── */
function UrgenceCard({ u, onAction, onRemove }) {
  const niv = NIVEAU[u.niveau] || NIVEAU.urgent;
  const nomPatient = u.id_patient
    ? `${u.prenom_pat_reg || ''} ${u.nom_pat_reg || ''}`.trim()
    : (u.nom_patient || 'Inconnu');

  return (
    <div style={{ border: `2px solid ${niv.color}33`, borderLeft: `5px solid ${niv.color}`, borderRadius: '10px', padding: '1rem', background: niv.bg, marginBottom: '0.75rem', position: 'relative' }}>
      {/* Badge niveau + statut */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.4rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontWeight: '800', color: niv.color, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{niv.label}</span>
          {u.statut === 'en_attente' && (
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0392b', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: STATUT_COLOR[u.statut], fontWeight: '600' }}>{STATUT_LABEL[u.statut]}</span>
          <span style={{ fontSize: '0.76rem', color: 'var(--muted)' }}>· {elapsed(u.date_arrivee)}</span>
        </div>
      </div>

      {/* Patient */}
      <div style={{ display: 'flex', gap: '0.7rem', alignItems: 'flex-start', marginBottom: '0.7rem' }}>
        <Avatar name={nomPatient} size={36} />
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{nomPatient}</p>
          {u.telephone && <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{u.telephone}</p>}
          {u.nom_medecin && <p style={{ fontSize: '0.8rem', color: 'var(--g2)' }}>Dr {u.prenom_medecin} {u.nom_medecin}</p>}
        </div>
      </div>

      {/* Description */}
      <p style={{ fontSize: '0.88rem', color: 'var(--text)', marginBottom: u.notes ? '0.4rem' : 0, lineHeight: 1.4 }}>{u.description}</p>
      {u.notes && <p style={{ fontSize: '0.8rem', color: 'var(--muted)', fontStyle: 'italic' }}>{u.notes}</p>}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
        {u.statut === 'en_attente' && (
          <button onClick={() => onAction(u.id_urgence, 'prise_en_charge')}
            style={{ padding: '0.35rem 0.85rem', background: '#e67e22', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            Prendre en charge
          </button>
        )}
        {u.statut === 'prise_en_charge' && (
          <button onClick={() => onAction(u.id_urgence, 'resolue')}
            style={{ padding: '0.35rem 0.85rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            ✓ Résoudre
          </button>
        )}
        <button onClick={() => onRemove(u.id_urgence)}
          style={{ padding: '0.35rem 0.7rem', background: 'none', color: '#e74c3c', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '1rem', marginLeft: 'auto' }}>
          ×
        </button>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function Urgences() {
  const [urgences,  setUrgences]  = useState([]);
  const [medecins,  setMedecins]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [tab,       setTab]       = useState('actives'); // 'actives' | 'resolues'

  const load = useCallback(async () => {
    try {
      const params = tab === 'resolues' ? { statut: 'resolue' } : {};
      const r = await urgenceService.getAll(params);
      setUrgences(r.data);
    } catch { setUrgences([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    medecinService.getAll?.().then(r => setMedecins(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleAction = async (id, statut) => {
    await urgenceService.update(id, { statut });
    load();
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Supprimer cette urgence ?')) return;
    await urgenceService.remove(id);
    load();
  };

  const critique = urgences.filter(u => u.niveau === 'critique');
  const urgent   = urgences.filter(u => u.niveau === 'urgent');
  const autres   = urgences.filter(u => u.niveau !== 'critique' && u.niveau !== 'urgent');

  const enAttente    = urgences.filter(u => u.statut === 'en_attente');
  const priseEnCharge = urgences.filter(u => u.statut === 'prise_en_charge');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Pulse animation globale */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(1.3)} }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: '#c0392b', marginBottom: '0.2rem' }}>🚨 Urgences</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Aujourd'hui · {enAttente.length} en attente · {priseEnCharge.length} prise(s) en charge
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} style={{ background: '#c0392b' }}>+ Nouvelle urgence</Button>
      </div>

      {/* Alertes critiques banner */}
      {tab === 'actives' && critique.length > 0 && (
        <div style={{ background: '#fdecea', border: '2px solid #c0392b', borderRadius: '10px', padding: '0.85rem 1.1rem', marginBottom: '1.25rem', display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <p style={{ color: '#c0392b', fontWeight: '700', fontSize: '0.9rem' }}>
            {critique.length} cas critique{critique.length > 1 ? 's' : ''} nécessitant une intervention immédiate
          </p>
        </div>
      )}

      {/* Compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.6rem', marginBottom: '1.25rem' }}>
        {Object.entries(NIVEAU).map(([k, v]) => {
          const count = urgences.filter(u => u.niveau === k).length;
          return (
            <Card key={k} style={{ padding: '0.7rem', textAlign: 'center', borderTop: `3px solid ${v.color}`, background: v.bg }}>
              <p style={{ fontSize: '1.4rem', fontWeight: '800', color: v.color }}>{count}</p>
              <p style={{ fontSize: '0.75rem', color: v.color, fontWeight: '600' }}>{v.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {[['actives', 'Actives'], ['resolues', 'Résolues']].map(([k, v]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '0.6rem 1.25rem', background: 'none', border: 'none', borderBottom: `3px solid ${tab === k ? 'var(--g)' : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', fontWeight: tab === k ? '700' : '400', color: tab === k ? 'var(--g)' : 'var(--muted)', fontSize: '0.9rem' }}>
            {v}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {!loading && urgences.length === 0 && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>
            {tab === 'resolues' ? 'Aucune urgence résolue aujourd\'hui.' : 'Aucune urgence active.'}
          </p>
          {tab === 'actives' && <Button style={{ marginTop: '1rem', background: '#c0392b' }} onClick={() => setShowModal(true)}>Déclarer une urgence</Button>}
        </Card>
      )}

      {/* Critiques d'abord */}
      {tab === 'actives' && critique.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#c0392b', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Critiques</p>
          {critique.map(u => <UrgenceCard key={u.id_urgence} u={u} onAction={handleAction} onRemove={handleRemove} />)}
        </div>
      )}

      {tab === 'actives' && urgent.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e67e22', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Urgents</p>
          {urgent.map(u => <UrgenceCard key={u.id_urgence} u={u} onAction={handleAction} onRemove={handleRemove} />)}
        </div>
      )}

      {tab === 'actives' && autres.length > 0 && (
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>Autres</p>
          {autres.map(u => <UrgenceCard key={u.id_urgence} u={u} onAction={handleAction} onRemove={handleRemove} />)}
        </div>
      )}

      {tab === 'resolues' && urgences.map(u => (
        <UrgenceCard key={u.id_urgence} u={u} onAction={handleAction} onRemove={handleRemove} />
      ))}

      {showModal && (
        <AddUrgenceModal medecins={medecins} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
