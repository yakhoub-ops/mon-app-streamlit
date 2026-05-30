import { useState, useEffect, useCallback } from 'react';
import { assuranceService } from '../../services/assurance.service';
import Card   from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge  from '../../components/ui/Badge';

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

const EMPTY = { nom: '', code: '', taux_prise_en_charge: '', description: '' };

/* ── Modal création / édition ── */
function Modal({ initial, onClose, onSaved }) {
  const [form,   setForm]   = useState(initial
    ? { nom: initial.nom, code: initial.code || '', taux_prise_en_charge: initial.taux_prise_en_charge, description: initial.description || '' }
    : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const sf = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const focus = e => { e.target.style.borderColor = 'var(--g)'; };
  const blur  = e => { e.target.style.borderColor = 'var(--border)'; };

  const submit = async e => {
    e.preventDefault();
    if (!form.nom || form.taux_prise_en_charge === '') { setError('Nom et taux requis'); return; }
    const taux = Number(form.taux_prise_en_charge);
    if (taux < 0 || taux > 100) { setError('Le taux doit être entre 0 et 100'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, taux_prise_en_charge: taux };
      if (initial) {
        await assuranceService.update(initial.id_assurance, payload);
      } else {
        await assuranceService.create(payload);
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
          background: 'var(--surface)', borderRadius: '16px', width: '100%', maxWidth: 480,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)', pointerEvents: 'auto',
        }}>
          {/* Header */}
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>
              {initial ? `Modifier — ${initial.nom}` : 'Nouvelle mutuelle / assurance'}
            </h3>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: 'var(--muted)', lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <form onSubmit={submit} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {error && (
              <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.65rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: '600' }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Nom de la mutuelle *</label>
                <input required value={form.nom} onChange={sf('nom')} onFocus={focus} onBlur={blur}
                  style={inp} placeholder="Ex : IPRES, CSS, SALAMA…" />
              </div>
              <div>
                <label style={lbl}>Code court</label>
                <input value={form.code} onChange={sf('code')} onFocus={focus} onBlur={blur}
                  style={inp} placeholder="Ex : IPRES" />
              </div>
              <div>
                <label style={lbl}>Taux de prise en charge (%) *</label>
                <input
                  type="number" min="0" max="100" step="0.5"
                  required
                  value={form.taux_prise_en_charge}
                  onChange={sf('taux_prise_en_charge')}
                  onFocus={focus} onBlur={blur}
                  style={inp} placeholder="Ex : 80"
                />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Description / conditions</label>
                <textarea
                  value={form.description} onChange={sf('description')}
                  onFocus={focus} onBlur={blur} rows={3}
                  style={{ ...inp, resize: 'vertical' }}
                  placeholder="Informations complémentaires sur la couverture…"
                />
              </div>
            </div>

            {/* Aperçu tiers-payant — uniquement si taux valide (0–100) */}
            {form.taux_prise_en_charge !== '' && Number(form.taux_prise_en_charge) > 0 && Number(form.taux_prise_en_charge) <= 100 && (
              <div style={{ background: 'var(--g3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', gap: '1.5rem' }}>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--g2)', fontWeight: '700', marginBottom: '0.1rem' }}>Part assurance</p>
                  <p style={{ fontWeight: '800', color: 'var(--g2)', fontSize: '1.1rem' }}>{Number(form.taux_prise_en_charge)}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: '700', marginBottom: '0.1rem' }}>Reste patient</p>
                  <p style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1.1rem' }}>{100 - Number(form.taux_prise_en_charge)}%</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: '700', marginBottom: '0.1rem' }}>Exemple sur 10 000 F</p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Mutuelle : <strong>{(10000 * Number(form.taux_prise_en_charge) / 100).toLocaleString('fr-FR')} F</strong>
                    {' '}· Patient : <strong>{(10000 * (100 - Number(form.taux_prise_en_charge)) / 100).toLocaleString('fr-FR')} F</strong>
                  </p>
                </div>
              </div>
            )}
          </form>

          {/* Footer */}
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
            <Button variant="ghost" type="button" onClick={onClose}>Annuler</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? 'Enregistrement…' : (initial ? 'Modifier' : 'Créer')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Page principale ── */
export default function AdminAssurances() {
  const [assurances, setAssurances] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);   // null | 'create' | assurance-object
  const [toggling,   setToggling]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // On veut TOUTES les assurances, y compris inactives — on appelle directement
      const r = await assuranceService.getAll();
      setAssurances(r.data);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (a) => {
    setToggling(a.id_assurance);
    try {
      await assuranceService.update(a.id_assurance, { actif: a.actif ? 0 : 1 });
      load();
    } catch {}
    setToggling(null);
  };

  const totalActives = assurances.filter(a => a.actif).length;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
            Mutuelles et assurances
          </h2>
          <p style={{ fontSize: '0.83rem', color: 'var(--muted)' }}>
            {totalActives} active(s) · Tiers-payant RG14
          </p>
        </div>
        <Button onClick={() => setModal('create')}>+ Nouvelle mutuelle</Button>
      </div>

      {/* Tableau */}
      {loading ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>Chargement…</Card>
      ) : assurances.length === 0 ? (
        <Card style={{ textAlign: 'center', padding: '3rem', color: 'var(--muted)' }}>
          Aucune assurance enregistrée.
        </Card>
      ) : (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '2px solid var(--border)' }}>
                {['Mutuelle', 'Code', 'Taux prise en charge', 'Reste patient', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontWeight: '700', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {assurances.map((a, i) => (
                <tr key={a.id_assurance}
                  style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--surface)' : 'var(--surface2)', opacity: a.actif ? 1 : 0.55 }}>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <p style={{ fontWeight: '700', color: 'var(--text)' }}>{a.nom}</p>
                    {a.description && (
                      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.1rem', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.description}
                      </p>
                    )}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    {a.code
                      ? <span style={{ fontFamily: 'monospace', background: 'var(--border)', padding: '0.15rem 0.5rem', borderRadius: '4px', fontSize: '0.82rem' }}>{a.code}</span>
                      : <span style={{ color: 'var(--muted)' }}>—</span>}
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {/* Barre visuelle */}
                      <div style={{ width: 80, height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                        <div style={{ width: `${a.taux_prise_en_charge}%`, height: '100%', background: 'var(--g)', borderRadius: 4 }} />
                      </div>
                      <span style={{ fontWeight: '800', color: 'var(--g2)', fontSize: '0.95rem' }}>
                        {Number(a.taux_prise_en_charge)}%
                      </span>
                    </div>
                  </td>

                  <td style={{ padding: '0.85rem 1rem', fontWeight: '600', color: 'var(--text)' }}>
                    {100 - Number(a.taux_prise_en_charge)}%
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <Badge type={a.actif ? 'success' : 'default'}>
                      {a.actif ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>

                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <Button size="sm" variant="outline" onClick={() => setModal(a)}>
                        Modifier
                      </Button>
                      <Button
                        size="sm"
                        variant={a.actif ? 'danger' : 'ghost'}
                        disabled={toggling === a.id_assurance}
                        onClick={() => toggle(a)}
                      >
                        {toggling === a.id_assurance ? '…' : (a.actif ? 'Désactiver' : 'Activer')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Modals */}
      {modal === 'create' && (
        <Modal
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
      {modal && modal !== 'create' && (
        <Modal
          initial={modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
