import { useState, useEffect, useCallback } from 'react';
import { patientService }    from '../../services/patient.service';
import { fileAttenteService } from '../../services/fileAttente.service';
import { urgenceService }    from '../../services/urgence.service';
import Avatar  from '../../components/ui/Avatar';
import Badge   from '../../components/ui/Badge';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../utils/formatDate';

const GROUPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const SEXES   = [{ v:'M', l:'Masculin' }, { v:'F', l:'Féminin' }, { v:'Autre', l:'Autre' }];
const EMPTY_FORM = {
  nom:'', prenom:'', telephone:'', email:'',
  date_naissance:'', sexe:'', adresse:'',
  groupe_sanguin:'', allergies:'', antecedents:'',
};

const PRIO = {
  1: { label: 'URGENT',     color: '#c0392b', bg: '#fdecea' },
  2: { label: 'Priorité',   color: '#e67e22', bg: '#fef5ec' },
  3: { label: 'Normal',     color: '#2980b9', bg: '#eaf4fb' },
};

function waitTime(dt) {
  const mins = Math.floor((Date.now() - new Date(dt)) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins/60)}h${String(mins%60).padStart(2,'0')}`;
}

const inp = {
  padding: '0.7rem 0.9rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.9rem',
  background: 'var(--surface2)',
  width: '100%',
  outline: 'none',
  color: 'var(--text)',
  transition: 'border-color 0.2s',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)',
  marginBottom: '0.3rem', display: 'block',
};

/* ── Modal création patient ── */
function PatientModal({ onClose, onSaved, initial = null }) {
  const [form,   setForm]   = useState(initial ? {
    nom: initial.nom, prenom: initial.prenom, telephone: initial.telephone, email: initial.email || '',
    date_naissance: initial.date_naissance?.slice(0,10) || '', sexe: initial.sexe || '',
    adresse: initial.adresse || '', groupe_sanguin: initial.groupe_sanguin || '',
    allergies: initial.allergies || '', antecedents: initial.antecedents || '',
  } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const sf = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const onFocus = (e) => { e.target.style.borderColor = 'var(--g)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      if (initial) { await patientService.update(initial.id_patient, form); }
      else         { await patientService.create(form); }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue');
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 301, padding: '1rem',
        pointerEvents: 'none',
      }}>
        <div className="scale-in" style={{
          background: 'var(--surface)',
          borderRadius: '16px',
          width: '100%', maxWidth: 560,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.2)',
          pointerEvents: 'auto',
        }}>
          <div style={{ padding: '1.1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1.05rem' }}>
              {initial ? `Modifier — ${initial.prenom} ${initial.nom}` : 'Nouveau patient'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--muted)', lineHeight: 1 }}>×</button>
          </div>

          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            {error && (
              <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.7rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: '600' }}>
                ⚠️ {error}
              </div>
            )}
            <form id="patient-form" onSubmit={submit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div><label style={lbl}>Nom *</label><input required value={form.nom} onChange={sf('nom')} onFocus={onFocus} onBlur={onBlur} style={inp} placeholder="Diallo" /></div>
                <div><label style={lbl}>Prénom *</label><input required value={form.prenom} onChange={sf('prenom')} onFocus={onFocus} onBlur={onBlur} style={inp} placeholder="Fatou" /></div>
                <div><label style={lbl}>Téléphone *</label><input required value={form.telephone} onChange={sf('telephone')} onFocus={onFocus} onBlur={onBlur} style={inp} placeholder="77 123 45 67" /></div>
                <div><label style={lbl}>Email</label><input type="email" value={form.email} onChange={sf('email')} onFocus={onFocus} onBlur={onBlur} style={inp} placeholder="optionnel" /></div>
                <div><label style={lbl}>Date naissance</label><input type="date" value={form.date_naissance} onChange={sf('date_naissance')} onFocus={onFocus} onBlur={onBlur} style={inp} /></div>
                <div>
                  <label style={lbl}>Sexe</label>
                  <select value={form.sexe} onChange={sf('sexe')} onFocus={onFocus} onBlur={onBlur} style={inp}>
                    <option value="">— Sélectionner —</option>
                    {SEXES.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Adresse</label>
                  <input value={form.adresse} onChange={sf('adresse')} onFocus={onFocus} onBlur={onBlur} style={inp} placeholder="Dakar, Médina" />
                </div>
                <div>
                  <label style={lbl}>Groupe sanguin</label>
                  <select value={form.groupe_sanguin} onChange={sf('groupe_sanguin')} onFocus={onFocus} onBlur={onBlur} style={inp}>
                    <option value="">— Inconnu —</option>
                    {GROUPES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div />
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Allergies</label>
                  <textarea value={form.allergies} onChange={sf('allergies')} rows={2} onFocus={onFocus} onBlur={onBlur} style={{ ...inp, resize: 'vertical' }} placeholder="Ex: pénicilline, arachides…" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <label style={lbl}>Antécédents médicaux</label>
                  <textarea value={form.antecedents} onChange={sf('antecedents')} rows={2} onFocus={onFocus} onBlur={onBlur} style={{ ...inp, resize: 'vertical' }} placeholder="Ex: diabète type 2…" />
                </div>
              </div>
            </form>
          </div>

          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <Button variant="ghost" onClick={onClose}>Annuler</Button>
            <Button type="submit" form="patient-form" disabled={saving}>
              {saving ? <><Spinner size={14} color="#fff" /> Enregistrement…</> : (initial ? 'Enregistrer' : 'Créer le patient')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page principale ── */
export default function RecepDashboard() {
  const [patients,  setPatients]  = useState([]);
  const [file,      setFile]      = useState([]);
  const [urgences,  setUrgences]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [modal,     setModal]     = useState(null);
  const [selected,  setSelected]  = useState(null);
  const [deleting,  setDeleting]  = useState(null);
  const [loading,   setLoading]   = useState(false);

  const load = useCallback((q = '') => {
    patientService.getAll(q).then(r => setPatients(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fileAttenteService.getAll({}).then(r => setFile(r.data)).catch(() => {});
    urgenceService.getAll({ statut: 'active' }).then(r => setUrgences(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { load(search); }, 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const handleDelete = async (p) => {
    if (!window.confirm(`Désactiver ${p.prenom} ${p.nom} ?`)) return;
    setDeleting(p.id_patient);
    try {
      await patientService.remove(p.id_patient);
      load(search);
    } catch (err) {
      alert(err.response?.data?.error || 'Erreur');
    } finally {
      setDeleting(null);
    }
  };

  const enAttente = file.filter(f => f.statut === 'en_attente');
  const appeles   = file.filter(f => f.statut === 'appele');

  return (
    <div className="fade-in" style={{ padding: '1.25rem', maxWidth: 940, margin: '0 auto' }}>

      {/* ── Compteurs file d'attente ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.25rem' }}>
        {[
          { label: 'En attente',    val: enAttente.length, icon: '🧍', color: '#e67e22', bg: '#fef5ec' },
          { label: 'Appelés',       val: appeles.length,   icon: '📢', color: '#2980b9', bg: '#eaf4fb' },
          { label: 'Urgences act.', val: urgences.length,  icon: '🚨', color: '#c0392b', bg: '#fdecea' },
        ].map(s => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: '14px',
            padding: '1rem 1.1rem',
            border: `1px solid ${s.color}25`,
            display: 'flex', alignItems: 'center', gap: '0.75rem',
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: '12px',
              background: `${s.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem', flexShrink: 0,
            }}>
              {s.icon}
            </div>
            <div>
              <p style={{ fontSize: '1.6rem', fontWeight: '900', color: s.color, lineHeight: 1 }}>{s.val}</p>
              <p style={{ fontSize: '0.72rem', color: s.color, opacity: 0.8, fontWeight: '600' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Patients ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
        <h3 style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>
          Patients ({patients.length})
        </h3>
        <Button onClick={() => { setSelected(null); setModal('create'); }}>+ Nouveau patient</Button>
      </div>

      {/* Recherche */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom, téléphone ou email…"
          style={{ ...inp, paddingLeft: '2.5rem' }}
          onFocus={e => e.target.style.borderColor = 'var(--g)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Liste patients */}
      {patients.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
          {search ? 'Aucun résultat pour cette recherche.' : 'Aucun patient enregistré.'}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {patients.map(p => (
            <Card key={p.id_patient} style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', padding: '0.85rem 1.1rem' }}>
              <Avatar name={`${p.prenom} ${p.nom}`} size={42} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.prenom} {p.nom}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                  {p.telephone}{p.date_naissance ? ` · né(e) le ${formatDate(p.date_naissance)}` : ''}
                </p>
              </div>
              {p.groupe_sanguin && (
                <Badge type="danger" style={{ background: '#fdecea', color: '#c0392b' }}>
                  {p.groupe_sanguin}
                </Badge>
              )}
              <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                <Button variant="outline" size="sm" onClick={() => { setSelected(p); setModal('edit'); }}>
                  Modifier
                </Button>
                <Button variant="danger" size="sm" disabled={deleting === p.id_patient} onClick={() => handleDelete(p)}>
                  {deleting === p.id_patient ? '…' : 'Désactiver'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Modal patient */}
      {(modal === 'create' || modal === 'edit') && (
        <PatientModal
          initial={modal === 'edit' ? selected : null}
          onClose={() => { setModal(null); setSelected(null); }}
          onSaved={() => { setModal(null); setSelected(null); load(search); }}
        />
      )}
    </div>
  );
}
