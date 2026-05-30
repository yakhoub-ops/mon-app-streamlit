import { useState, useEffect, useCallback } from 'react';
import { fileAttenteService } from '../../services/fileAttente.service';
import { patientService }     from '../../services/patient.service';
import { medecinService }     from '../../services/medecin.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

/* ── Priorité ── */
const PRIO = {
  1: { label: 'URGENT',    color: '#c0392b', bg: '#fdecea' },
  2: { label: 'Priorité',  color: '#e67e22', bg: '#fef5ec' },
  3: { label: 'Normal',    color: '#2980b9', bg: '#eaf4fb' },
  4: { label: 'Faible',    color: '#27ae60', bg: '#eafaf1' },
  5: { label: 'Non urgent',color: '#7f8c8d', bg: '#f2f3f4' },
};

const STATUT_BADGE = { en_attente: 'warning', appele: 'info', consulte: 'success', parti: 'default' };
const STATUT_LABEL = { en_attente: 'En attente', appele: 'Appelé', consulte: 'Consulté', parti: 'Parti' };

function waitTime(dt) {
  const mins = Math.floor((Date.now() - new Date(dt)) / 60000);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, '0')}`;
}

/* ── Modal ajout ── */
function AddModal({ onClose, onSaved, medecins }) {
  const [search,    setSearch]    = useState('');
  const [patients,  setPatients]  = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState({ id_medecin: '', priorite: 3, notes: '' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (search.length < 2) { setPatients([]); return; }
    patientService.getAll({ q: search }).then(r => setPatients(r.data)).catch(() => {});
  }, [search]);

  const submit = async () => {
    if (!selected) { setError('Sélectionnez un patient.'); return; }
    setSaving(true); setError('');
    try {
      await fileAttenteService.create({
        id_patient: selected.id_patient,
        id_medecin: form.id_medecin || undefined,
        priorite:   Number(form.priorite),
        notes:      form.notes || undefined,
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '420px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>Ajouter à la file</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.3rem', color: 'var(--muted)' }}>×</button>
        </div>

        {error && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.6rem', borderRadius: '7px', marginBottom: '1rem', fontSize: '0.85rem' }}>{error}</div>}

        {/* Recherche patient */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Rechercher un patient</label>
          <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Nom, prénom, téléphone…" style={inp} />
          {patients.length > 0 && !selected && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '7px', marginTop: '0.3rem', maxHeight: 180, overflowY: 'auto', background: 'var(--surface)' }}>
              {patients.map(p => (
                <div key={p.id_patient}
                  onClick={() => { setSelected(p); setSearch(`${p.prenom} ${p.nom}`); setPatients([]); }}
                  style={{ padding: '0.6rem 0.85rem', cursor: 'pointer', display: 'flex', gap: '0.6rem', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <Avatar name={`${p.prenom} ${p.nom}`} size={28} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)' }}>{p.prenom} {p.nom}</p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{p.telephone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Médecin */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Médecin (optionnel)</label>
          <select value={form.id_medecin} onChange={e => setForm(f => ({ ...f, id_medecin: e.target.value }))} style={inp}>
            <option value="">— Sans médecin assigné —</option>
            {medecins.map(m => (
              <option key={m.id_medecin} value={m.id_medecin}>Dr {m.prenom} {m.nom} · {m.specialite}</option>
            ))}
          </select>
        </div>

        {/* Priorité */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Priorité</label>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {Object.entries(PRIO).map(([k, v]) => (
              <button key={k} type="button"
                onClick={() => setForm(f => ({ ...f, priorite: Number(k) }))}
                style={{ padding: '0.35rem 0.75rem', borderRadius: '20px', border: `2px solid ${form.priorite === Number(k) ? v.color : 'var(--border)'}`, background: form.priorite === Number(k) ? v.bg : 'var(--surface)', color: form.priorite === Number(k) ? v.color : 'var(--muted)', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={lbl}>Notes (optionnel)</label>
          <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Motif de visite, remarques…" style={inp} />
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={saving}>{saving ? 'Ajout…' : 'Ajouter'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Carte patient en file ── */
function FileCard({ item, onAction, onRemove }) {
  const prio = PRIO[item.priorite] || PRIO[3];
  const nom  = `${item.prenom_patient} ${item.nom_patient}`;

  return (
    <div style={{ border: `2px solid ${prio.color}22`, borderLeft: `4px solid ${prio.color}`, borderRadius: '10px', padding: '0.9rem 1rem', background: item.statut === 'appele' ? 'var(--g3)' : 'var(--surface)', display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
      <Avatar name={nom} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.2rem' }}>
          <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{nom}</span>
          <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '20px', background: prio.bg, color: prio.color, fontWeight: '700' }}>{prio.label}</span>
          <Badge type={STATUT_BADGE[item.statut]}>{STATUT_LABEL[item.statut]}</Badge>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
          Arrivée : {waitTime(item.heure_arrivee)} · {item.telephone}
          {item.nom_medecin ? ` · Dr ${item.prenom_medecin} ${item.nom_medecin}` : ''}
        </p>
        {item.notes && <p style={{ fontSize: '0.78rem', color: 'var(--g2)', marginTop: '0.2rem' }}>{item.notes}</p>}
      </div>

      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        {item.statut === 'en_attente' && (
          <button onClick={() => onAction(item.id_file, 'appele')}
            style={{ padding: '0.35rem 0.75rem', background: 'var(--g)', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            📢 Appeler
          </button>
        )}
        {item.statut === 'appele' && (
          <button onClick={() => onAction(item.id_file, 'consulte')}
            style={{ padding: '0.35rem 0.75rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
            ✓ Consulté
          </button>
        )}
        {item.statut !== 'consulte' && item.statut !== 'parti' && (
          <button onClick={() => onAction(item.id_file, 'parti')}
            style={{ padding: '0.35rem 0.75rem', background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontSize: '0.82rem' }}>
            Parti
          </button>
        )}
        <button onClick={() => onRemove(item.id_file)}
          style={{ padding: '0.35rem 0.6rem', background: 'none', color: '#e74c3c', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '1rem' }}>
          ×
        </button>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function FileAttente() {
  const [file,      setFile]      = useState([]);
  const [medecins,  setMedecins]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showAll,   setShowAll]   = useState(false);

  const load = useCallback(async () => {
    try {
      const params = showAll ? { statut: 'all', all: 1 } : {};
      if (showAll) {
        const [actifs, consultes, partis] = await Promise.all([
          fileAttenteService.getAll({}),
          fileAttenteService.getAll({ statut: 'consulte' }),
          fileAttenteService.getAll({ statut: 'parti' }),
        ]);
        setFile([...actifs.data, ...consultes.data, ...partis.data]);
      } else {
        const r = await fileAttenteService.getAll({});
        setFile(r.data);
      }
    } catch { setFile([]); }
    setLoading(false);
  }, [showAll]);

  useEffect(() => {
    medecinService.getAll?.().then(r => setMedecins(r.data)).catch(() => {});
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  const handleAction = async (id, statut) => {
    await fileAttenteService.update(id, { statut });
    load();
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Retirer de la file ?')) return;
    await fileAttenteService.remove(id);
    load();
  };

  const actifs    = file.filter(f => f.statut === 'en_attente');
  const appeles   = file.filter(f => f.statut === 'appele');
  const termines  = file.filter(f => f.statut === 'consulte' || f.statut === 'parti');

  return (
    <div style={{ padding: '1.5rem', maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>File d'attente</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            Aujourd'hui · {actifs.length} en attente · {appeles.length} appelé(s)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={() => setShowAll(s => !s)}
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: '7px', padding: '0.4rem 0.85rem', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--muted)' }}>
            {showAll ? 'Masquer terminés' : 'Voir tous'}
          </button>
          <Button onClick={() => setShowModal(true)}>+ Ajouter</Button>
        </div>
      </div>

      {/* Compteurs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'En attente', count: actifs.length,   color: '#e67e22', bg: '#fef5ec' },
          { label: 'Appelés',    count: appeles.length,  color: '#2980b9', bg: '#eaf4fb' },
          { label: 'Terminés',   count: termines.length, color: '#27ae60', bg: '#eafaf1' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderTop: `3px solid ${s.color}`, background: s.bg }}>
            <p style={{ fontSize: '1.6rem', fontWeight: '800', color: s.color }}>{s.count}</p>
            <p style={{ fontSize: '0.78rem', color: s.color, fontWeight: '600' }}>{s.label}</p>
          </Card>
        ))}
      </div>

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {/* Appelés en premier */}
      {appeles.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--g2)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Actuellement appelés</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {appeles.map(f => <FileCard key={f.id_file} item={f} onAction={handleAction} onRemove={handleRemove} />)}
          </div>
        </div>
      )}

      {/* En attente */}
      {actifs.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>En attente</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {actifs.map(f => <FileCard key={f.id_file} item={f} onAction={handleAction} onRemove={handleRemove} />)}
          </div>
        </div>
      )}

      {/* Terminés */}
      {showAll && termines.length > 0 && (
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.6rem', letterSpacing: '0.05em' }}>Terminés aujourd'hui</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', opacity: 0.7 }}>
            {termines.map(f => <FileCard key={f.id_file} item={f} onAction={handleAction} onRemove={handleRemove} />)}
          </div>
        </div>
      )}

      {!loading && file.length === 0 && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem' }}>La file d'attente est vide.</p>
          <Button style={{ marginTop: '1rem' }} onClick={() => setShowModal(true)}>Ajouter un patient</Button>
        </Card>
      )}

      {showModal && (
        <AddModal medecins={medecins} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); load(); }} />
      )}
    </div>
  );
}
