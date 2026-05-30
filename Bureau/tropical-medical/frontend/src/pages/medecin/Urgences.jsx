import { useState, useEffect, useCallback } from 'react';
import { urgenceService } from '../../services/urgence.service';
import { patientService } from '../../services/patient.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const NIVEAU = {
  critique: { label: 'Critique', type: 'danger',  icon: '🚨' },
  urgent:   { label: 'Urgent',   type: 'warning',  icon: '⚠️' },
  modere:   { label: 'Modéré',   type: 'info',     icon: '🔵' },
  faible:   { label: 'Faible',   type: 'default',  icon: '🟢' },
};

const fmt = d => d ? new Date(d).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—';

const inp = {
  padding: '0.65rem 0.9rem', border: '1.5px solid var(--border)',
  borderRadius: '10px', fontSize: '0.9rem', width: '100%', outline: 'none',
  background: 'var(--surface2)', color: 'var(--text)',
};

export default function MedecinUrgences() {
  const [urgences,  setUrgences]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState('active');
  const [modal,     setModal]     = useState(false);
  const [patients,  setPatients]  = useState([]);
  const [search,    setSearch]    = useState('');
  const [form,      setForm]      = useState({ id_patient: '', nom_patient: '', description: '', niveau: 'urgent', notes: '' });
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await urgenceService.getAll({ statut: tab === 'active' ? 'active' : 'resolue' });
      setUrgences(r.data);
    } catch { setUrgences([]); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (search.length < 2) { setPatients([]); return; }
    patientService.getAll(search).then(r => setPatients(r.data)).catch(() => {});
  }, [search]);

  const priseEnCharge = async (id) => {
    try { await urgenceService.update(id, { statut: 'prise_en_charge' }); load(); }
    catch {}
  };
  const resoudre = async (id) => {
    try { await urgenceService.update(id, { statut: 'resolue' }); load(); }
    catch {}
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.description) { setError('Description requise'); return; }
    setSaving(true); setError('');
    try {
      await urgenceService.create({
        id_patient:  form.id_patient  || null,
        nom_patient: form.nom_patient || null,
        description: form.description,
        niveau:      form.niveau,
        notes:       form.notes || null,
      });
      setModal(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur');
      setSaving(false);
    }
  };

  const actives  = urgences.filter(u => u.statut !== 'resolue');
  const resolues = urgences.filter(u => u.statut === 'resolue');
  const liste    = tab === 'active' ? actives : resolues;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '800px', margin: '0 auto' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '1.4rem', color: 'var(--text)' }}>Urgences</h2>
        <Button onClick={() => { setModal(true); setError(''); setForm({ id_patient:'', nom_patient:'', description:'', niveau:'urgent', notes:'' }); setSearch(''); setPatients([]); }}>
          + Déclarer urgence
        </Button>
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {[['active','Actives'], ['resolue','Résolues']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '0.55rem 1rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: tab === k ? '700' : '400', fontSize: '0.9rem',
            color: tab === k ? 'var(--g)' : 'var(--muted)',
            borderBottom: tab === k ? '2px solid var(--g)' : '2px solid transparent',
            marginBottom: '-2px',
          }}>{l}</button>
        ))}
      </div>

      {loading ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Chargement…</Card>
      ) : liste.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Aucune urgence {tab === 'active' ? 'active' : 'résolue'}.
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {liste.map(u => {
            const niv = NIVEAU[u.niveau] || NIVEAU.modere;
            return (
              <Card key={u.id_urgence} style={{ padding: '1rem 1.25rem', borderLeft: `4px solid ${u.niveau === 'critique' ? '#e74c3c' : u.niveau === 'urgent' ? '#e67e22' : '#2980b9'}` }}>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ fontSize: '1.4rem', flexShrink: 0 }}>{niv.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.4rem' }}>
                      <div>
                        <p style={{ fontWeight: '700', color: 'var(--text)' }}>
                          {u.prenom_patient || ''} {u.nom_patient_display || u.nom_patient || 'Patient inconnu'}
                        </p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{fmt(u.date_arrivee)}</p>
                      </div>
                      <Badge type={niv.type}>{niv.label}</Badge>
                    </div>
                    <p style={{ marginTop: '0.4rem', fontSize: '0.88rem', color: 'var(--text)' }}>{u.description}</p>
                    {u.notes && <p style={{ marginTop: '0.25rem', fontSize: '0.8rem', color: 'var(--muted)' }}>{u.notes}</p>}
                    {tab === 'active' && (
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                        {u.statut === 'en_attente' && (
                          <Button size="sm" onClick={() => priseEnCharge(u.id_urgence)}>Prendre en charge</Button>
                        )}
                        {u.statut !== 'resolue' && (
                          <Button size="sm" variant="ghost" onClick={() => resoudre(u.id_urgence)}>✓ Résoudre</Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal déclaration urgence */}
      {modal && (
        <>
          <div onClick={() => setModal(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
          <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 301, padding: '1rem', pointerEvents: 'none' }}>
            <div style={{ background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: 480, maxHeight: '90vh', display: 'flex', flexDirection: 'column', pointerEvents: 'auto', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: '800', color: 'var(--text)' }}>Déclarer une urgence</h3>
                <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)' }}>×</button>
              </div>
              <form onSubmit={submit} style={{ padding: '1.25rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {error && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem' }}>{error}</div>}

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Rechercher patient</label>
                  <input value={search} onChange={e => setSearch(e.target.value)} style={inp} placeholder="Nom ou téléphone…" />
                  {patients.length > 0 && !form.id_patient && (
                    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', marginTop: '0.3rem', maxHeight: 140, overflowY: 'auto' }}>
                      {patients.map(p => (
                        <div key={p.id_patient} onClick={() => { setForm(f => ({ ...f, id_patient: p.id_patient, nom_patient: '' })); setSearch(`${p.prenom} ${p.nom}`); setPatients([]); }}
                          style={{ padding: '0.55rem 0.85rem', cursor: 'pointer', display: 'flex', gap: '0.6rem', alignItems: 'center' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                          onMouseLeave={e => e.currentTarget.style.background = ''}>
                          <Avatar name={`${p.prenom} ${p.nom}`} size={26} />
                          <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>{p.prenom} {p.nom}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {!form.id_patient && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Ou identité libre (patient non enregistré)</label>
                      <input value={form.nom_patient} onChange={e => setForm(f => ({ ...f, nom_patient: e.target.value }))} style={inp} placeholder="Nom du patient…" />
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Niveau *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem' }}>
                    {Object.entries(NIVEAU).map(([k, v]) => (
                      <button key={k} type="button" onClick={() => setForm(f => ({ ...f, niveau: k }))}
                        style={{ padding: '0.55rem', borderRadius: '8px', border: `2px solid ${form.niveau === k ? '#e74c3c' : 'var(--border)'}`, background: form.niveau === k ? '#fde8e8' : 'var(--surface2)', cursor: 'pointer', fontWeight: '700', fontSize: '0.82rem', color: form.niveau === k ? '#e74c3c' : 'var(--muted)' }}>
                        {v.icon} {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Description *</label>
                  <textarea required rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ ...inp, resize: 'vertical' }} placeholder="Symptômes, circonstances…" />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>Notes internes</label>
                  <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inp} placeholder="Optionnel" />
                </div>
              </form>
              <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <Button variant="ghost" type="button" onClick={() => setModal(false)}>Annuler</Button>
                <Button onClick={submit} disabled={saving}>{saving ? 'Enregistrement…' : 'Déclarer l\'urgence'}</Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
