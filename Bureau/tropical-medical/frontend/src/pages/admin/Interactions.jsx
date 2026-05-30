import { useState, useEffect, useCallback } from 'react';
import { interactionService } from '../../services/interaction.service';
import { ordonnanceService }  from '../../services/ordonnance.service';
import Card   from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge  from '../../components/ui/Badge';

/* ── Couleurs et libellés par niveau ── */
const NIVEAUX = [
  { value: 'faible',          label: 'Faible',             color: '#f39c12', bg: '#fef9ec', desc: 'Surveillance recommandée' },
  { value: 'modere',          label: 'Modérée',            color: '#e67e22', bg: '#fef5ec', desc: 'Précaution, ajuster la dose' },
  { value: 'eleve',           label: 'Élevée',             color: '#e74c3c', bg: '#fde8e8', desc: 'Eviter la co-prescription' },
  { value: 'contrindication', label: 'Contre-indication',  color: '#c0392b', bg: '#f9d5d5', desc: 'Association INTERDITE' },
];

const NIVEAU_MAP = Object.fromEntries(NIVEAUX.map(n => [n.value, n]));

const inp = {
  padding: '0.65rem 0.9rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.9rem',
  width: '100%',
  outline: 'none',
  background: 'var(--surface2)',
  color: 'var(--text)',
  transition: 'border-color .2s',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: '700',
  color: 'var(--muted)', display: 'block', marginBottom: '0.3rem',
};

/* ── Badge niveau ── */
function NiveauBadge({ niveau }) {
  const n = NIVEAU_MAP[niveau];
  if (!n) return null;
  return (
    <span style={{
      padding: '0.2rem 0.65rem', borderRadius: '20px', fontSize: '0.75rem',
      fontWeight: '700', background: n.bg, color: n.color, whiteSpace: 'nowrap',
    }}>
      {n.label}
    </span>
  );
}

/* ── Modal création / édition ── */
function Modal({ medicaments, initial, onClose, onSaved }) {
  const [form,   setForm]   = useState({
    id_medicament_a: initial?.id_medicament_a ?? '',
    id_medicament_b: initial?.id_medicament_b ?? '',
    niveau:          initial?.niveau          ?? 'modere',
    description:     initial?.description     ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const focus = e => { e.target.style.borderColor = 'var(--g)'; };
  const blur  = e => { e.target.style.borderColor = 'var(--border)'; };

  const selectedA = medicaments.find(m => m.id_medicament === Number(form.id_medicament_a));
  const selectedB = medicaments.find(m => m.id_medicament === Number(form.id_medicament_b));
  const niveauInfo = NIVEAU_MAP[form.niveau];

  const submit = async e => {
    e.preventDefault();
    if (!form.id_medicament_a || !form.id_medicament_b) { setError('Sélectionnez les deux médicaments'); return; }
    if (form.id_medicament_a === form.id_medicament_b) { setError('Les deux médicaments doivent être différents'); return; }
    setSaving(true); setError('');
    try {
      if (initial) {
        await interactionService.update(initial.id_interaction, {
          niveau: form.niveau,
          description: form.description,
        });
      } else {
        await interactionService.create({
          id_medicament_a: Number(form.id_medicament_a),
          id_medicament_b: Number(form.id_medicament_b),
          niveau: form.niveau,
          description: form.description,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la sauvegarde');
      setSaving(false);
    }
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 300 }} />
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', zIndex: 301, padding: '1rem', pointerEvents: 'none',
      }}>
        <div style={{
          background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: 540,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', pointerEvents: 'auto',
        }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>
              {initial ? 'Modifier l\'interaction' : 'Nouvelle interaction médicamenteuse'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ padding: '1.25rem', overflowY: 'auto', flex: 1 }}>
            <form id="inter-form" onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {error && (
                <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                  ⚠ {error}
                </div>
              )}

              {/* Médicaments A et B */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '0.5rem', alignItems: 'end' }}>
                <div>
                  <label style={lbl}>Médicament A *</label>
                  <select
                    required
                    value={form.id_medicament_a}
                    onChange={sf('id_medicament_a')}
                    onFocus={focus} onBlur={blur}
                    style={inp}
                    disabled={!!initial}
                  >
                    <option value="">— Choisir —</option>
                    {medicaments.map(m => (
                      <option key={m.id_medicament} value={m.id_medicament}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ textAlign: 'center', paddingBottom: '0.5rem', fontSize: '1.3rem', color: 'var(--muted)' }}>⇄</div>

                <div>
                  <label style={lbl}>Médicament B *</label>
                  <select
                    required
                    value={form.id_medicament_b}
                    onChange={sf('id_medicament_b')}
                    onFocus={focus} onBlur={blur}
                    style={inp}
                    disabled={!!initial}
                  >
                    <option value="">— Choisir —</option>
                    {medicaments.filter(m => m.id_medicament !== Number(form.id_medicament_a)).map(m => (
                      <option key={m.id_medicament} value={m.id_medicament}>
                        {m.nom}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Aperçu des deux médicaments sélectionnés */}
              {selectedA && selectedB && (
                <div style={{
                  padding: '0.75rem 1rem', borderRadius: '10px',
                  background: niveauInfo?.bg || 'var(--surface2)',
                  border: `1.5px solid ${niveauInfo?.color || 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                }}>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{selectedA.nom}</span>
                  <span style={{ color: niveauInfo?.color || 'var(--muted)', fontSize: '1.1rem' }}>+</span>
                  <span style={{ fontWeight: '700', color: 'var(--text)' }}>{selectedB.nom}</span>
                  {niveauInfo && (
                    <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: niveauInfo.color, fontWeight: '600' }}>
                      {niveauInfo.desc}
                    </span>
                  )}
                </div>
              )}

              {/* Niveau */}
              <div>
                <label style={lbl}>Niveau de l'interaction *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {NIVEAUX.map(n => (
                    <button
                      key={n.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, niveau: n.value }))}
                      style={{
                        padding: '0.65rem 0.9rem', borderRadius: '10px', cursor: 'pointer', textAlign: 'left',
                        border: `2px solid ${form.niveau === n.value ? n.color : 'var(--border)'}`,
                        background: form.niveau === n.value ? n.bg : 'var(--surface2)',
                        transition: 'all .15s',
                      }}
                    >
                      <p style={{ fontWeight: '700', color: n.color, fontSize: '0.85rem' }}>{n.label}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.1rem' }}>{n.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label style={lbl}>Description clinique</label>
                <textarea
                  value={form.description}
                  onChange={sf('description')}
                  onFocus={focus} onBlur={blur}
                  rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  placeholder="Expliquez le mécanisme ou les risques de cette interaction…"
                />
              </div>
            </form>
          </div>

          {/* Footer */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button type="submit" form="inter-form" disabled={saving}>
              {saving ? 'Enregistrement…' : (initial ? 'Modifier' : 'Enregistrer')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page principale ── */
export default function AdminInteractions() {
  const [interactions, setInteractions] = useState([]);
  const [medicaments,  setMedicaments]  = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filterNiveau, setFilterNiveau] = useState('');
  const [modal,        setModal]        = useState(null);
  const [deleting,     setDeleting]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, mRes] = await Promise.all([
        interactionService.getAll(),
        ordonnanceService.getMedicaments(),
      ]);
      setInteractions(iRes.data);
      setMedicaments(mRes.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const supprimer = async (id) => {
    if (!window.confirm('Supprimer définitivement cette interaction ?')) return;
    setDeleting(id);
    try {
      await interactionService.remove(id);
      load();
    } catch {}
    setDeleting(null);
  };

  /* Filtrage */
  const filtered = interactions.filter(inter => {
    const term = search.toLowerCase();
    const matchSearch = !term ||
      inter.nom_medicament_a.toLowerCase().includes(term) ||
      inter.nom_medicament_b.toLowerCase().includes(term) ||
      (inter.description || '').toLowerCase().includes(term);
    const matchNiveau = !filterNiveau || inter.niveau === filterNiveau;
    return matchSearch && matchNiveau;
  });

  /* Compteurs par niveau */
  const counts = NIVEAUX.reduce((acc, n) => {
    acc[n.value] = interactions.filter(i => i.niveau === n.value).length;
    return acc;
  }, {});

  return (
    <div style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
            Interactions médicamenteuses
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
            {interactions.length} interaction(s) enregistrée(s) · Vérificateur RG13
          </p>
        </div>
        <Button onClick={() => setModal('create')}>+ Nouvelle interaction</Button>
      </div>

      {/* Compteurs par niveau */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem', marginBottom: '1.25rem' }}>
        {NIVEAUX.map(n => (
          <button
            key={n.value}
            onClick={() => setFilterNiveau(filterNiveau === n.value ? '' : n.value)}
            style={{
              padding: '0.75rem 1rem', borderRadius: '12px', cursor: 'pointer', textAlign: 'left',
              border: `2px solid ${filterNiveau === n.value ? n.color : 'transparent'}`,
              background: n.bg, transition: 'border-color .15s',
            }}
          >
            <p style={{ fontWeight: '900', color: n.color, fontSize: '1.4rem', lineHeight: 1 }}>
              {counts[n.value] || 0}
            </p>
            <p style={{ fontSize: '0.75rem', color: n.color, fontWeight: '600', marginTop: '0.2rem' }}>
              {n.label}
            </p>
          </button>
        ))}
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: '1rem' }}>
        <span style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un médicament ou mot-clé…"
          style={{ ...inp, paddingLeft: '2.4rem' }}
          onFocus={e => e.target.style.borderColor = 'var(--g)'}
          onBlur={e => e.target.style.borderColor = 'var(--border)'}
        />
      </div>

      {/* Liste */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Chargement…</Card>
      ) : filtered.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          {interactions.length === 0
            ? 'Aucune interaction enregistrée. Cliquez sur « + Nouvelle interaction » pour commencer.'
            : 'Aucun résultat pour cette recherche.'}
        </Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filtered.map(inter => {
            const n = NIVEAU_MAP[inter.niveau];
            return (
              <Card key={inter.id_interaction} style={{
                padding: '1rem 1.25rem',
                borderLeft: `4px solid ${n?.color || 'var(--border)'}`,
                display: 'flex', gap: '1rem', alignItems: 'flex-start',
              }}>
                {/* Icône niveau */}
                <div style={{
                  width: 40, height: 40, borderRadius: '10px', flexShrink: 0,
                  background: n?.bg || 'var(--surface2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
                }}>
                  {inter.niveau === 'contrindication' ? '⛔' : inter.niveau === 'eleve' ? '🚫' : inter.niveau === 'modere' ? '⚠️' : 'ℹ️'}
                </div>

                {/* Contenu */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>{inter.nom_medicament_a}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>+</span>
                    <span style={{ fontWeight: '700', color: 'var(--text)' }}>{inter.nom_medicament_b}</span>
                    <NiveauBadge niveau={inter.niveau} />
                  </div>
                  {inter.description && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                      {inter.description}
                    </p>
                  )}
                  {inter.dci_a && inter.dci_b && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                      DCI : {inter.dci_a} / {inter.dci_b}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <Button size="sm" variant="outline" onClick={() => setModal(inter)}>
                    Modifier
                  </Button>
                  <Button
                    size="sm" variant="danger"
                    disabled={deleting === inter.id_interaction}
                    onClick={() => supprimer(inter.id_interaction)}
                  >
                    {deleting === inter.id_interaction ? '…' : 'Suppr.'}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && (
        <Modal
          medicaments={medicaments}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {modal && modal !== 'create' && (
        <Modal
          medicaments={medicaments}
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
