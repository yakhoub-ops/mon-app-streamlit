import { useState, useEffect, useCallback } from 'react';
import { factureService }   from '../../services/facture.service';
import { patientService }   from '../../services/patient.service';
import { assuranceService } from '../../services/assurance.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';

const fmt    = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtMnt = n => Number(n || 0).toLocaleString('fr-FR') + ' F CFA';

const STATUT = {
  en_attente:         { label: 'En attente',  type: 'warning' },
  partiellement_paye: { label: 'Partiel',     type: 'info'    },
  paye:               { label: 'Payée',       type: 'success' },
  annule:             { label: 'Annulée',     type: 'default' },
};

const MODES = [
  { value: 'especes',      label: 'Espèces' },
  { value: 'wave',         label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'carte',        label: 'Carte bancaire' },
  { value: 'assurance',    label: 'Assurance' },
  { value: 'cheque',       label: 'Chèque' },
];

const EMPTY_LIGNE = { description: '', quantite: 1, prix_unitaire: '' };

const PRESTATIONS = [
  'Consultation médicale',
  'Consultation spécialisée',
  'Acte infirmier',
  'Analyses biologiques',
  'Radiologie',
  'Médicaments',
  'Hospitalisation (jour)',
  'Frais administratifs',
];

/* ── Modal création facture ── */
function CreateModal({ onClose, onSaved }) {
  const [search,     setSearch]     = useState('');
  const [patients,   setPatients]   = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [lignes,     setLignes]     = useState([{ ...EMPTY_LIGNE }]);
  const [echeance,   setEcheance]   = useState('');
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [assurances, setAssurances] = useState([]);
  const [idAssurance,setIdAssurance]= useState('');

  useEffect(() => {
    if (search.length < 2) { setPatients([]); return; }
    patientService.getAll({ q: search }).then(r => setPatients(r.data)).catch(() => {});
  }, [search]);

  useEffect(() => {
    assuranceService.getAll().then(r => setAssurances(r.data)).catch(() => {});
  }, []);

  const editLigne = (i, k, v) => setLignes(l => l.map((row, j) => j === i ? { ...row, [k]: v } : row));
  const addLigne  = ()        => setLignes(l => [...l, { ...EMPTY_LIGNE }]);
  const delLigne  = i         => setLignes(l => l.filter((_, j) => j !== i));

  const total = lignes.reduce((s, l) => s + (Number(l.prix_unitaire) || 0) * (Number(l.quantite) || 1), 0);

  // RG14 — Calcul tiers-payant
  const assurance     = assurances.find(a => a.id_assurance === Number(idAssurance));
  const tauxAss       = assurance ? Number(assurance.taux_prise_en_charge) : 0;
  const partAssurance = assurance ? Math.round(total * tauxAss / 100 * 100) / 100 : 0;
  const partPatient   = total - partAssurance;

  const submit = async () => {
    if (!selected) { setError('Sélectionnez un patient.'); return; }
    const valides = lignes.filter(l => l.description && l.prix_unitaire);
    if (!valides.length) { setError('Au moins une ligne valide requise.'); return; }
    setSaving(true); setError('');
    try {
      await factureService.create({
        id_patient:    selected.id_patient,
        lignes:        valides.map(l => ({ ...l, quantite: Number(l.quantite), prix_unitaire: Number(l.prix_unitaire) })),
        date_echeance: echeance || undefined,
        notes:         notes || undefined,
        id_assurance:  idAssurance ? Number(idAssurance) : undefined,
      });
      onSaved();
    } catch (e) { setError(e.response?.data?.error || 'Erreur'); setSaving(false); }
  };

  const inp = { padding: '0.5rem 0.7rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.88rem', background: 'var(--surface)', outline: 'none' };
  const lbl = { fontSize: '0.75rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '580px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>Nouvelle facture</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>

        {error && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.55rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.85rem' }}>{error}</div>}

        {/* Patient */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={lbl}>Patient *</label>
          <input value={search} onChange={e => { setSearch(e.target.value); setSelected(null); }}
            placeholder="Rechercher…" style={{ ...inp, width: '100%' }} />
          {patients.length > 0 && !selected && (
            <div style={{ border: '1px solid var(--border)', borderRadius: '7px', marginTop: '0.3rem', maxHeight: 160, overflowY: 'auto', background: 'var(--surface)' }}>
              {patients.map(p => (
                <div key={p.id_patient}
                  onClick={() => { setSelected(p); setSearch(`${p.prenom} ${p.nom}`); setPatients([]); }}
                  style={{ padding: '0.55rem 0.85rem', cursor: 'pointer', display: 'flex', gap: '0.6rem', alignItems: 'center', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <Avatar name={`${p.prenom} ${p.nom}`} size={26} />
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.88rem', color: 'var(--text)' }}>{p.prenom} {p.nom}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{p.telephone}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Lignes */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <label style={{ ...lbl, marginBottom: 0 }}>Prestations *</label>
            <button type="button" onClick={addLigne}
              style={{ fontSize: '0.8rem', color: 'var(--g)', fontWeight: '600', background: 'none', border: 'none', cursor: 'pointer' }}>+ Ajouter</button>
          </div>
          {lignes.map((l, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '3fr 0.7fr 1.2fr auto', gap: '0.4rem', marginBottom: '0.4rem', alignItems: 'end' }}>
              <div>
                {i === 0 && <label style={lbl}>Description</label>}
                <input list="prestations" value={l.description}
                  onChange={e => editLigne(i, 'description', e.target.value)}
                  placeholder="Consultation, médicaments…"
                  style={{ ...inp, width: '100%' }} />
                <datalist id="prestations">
                  {PRESTATIONS.map(p => <option key={p} value={p} />)}
                </datalist>
              </div>
              <div>
                {i === 0 && <label style={lbl}>Qté</label>}
                <input type="number" min={1} value={l.quantite}
                  onChange={e => editLigne(i, 'quantite', e.target.value)}
                  style={{ ...inp, width: '100%' }} />
              </div>
              <div>
                {i === 0 && <label style={lbl}>Prix (F CFA)</label>}
                <input type="number" min={0} value={l.prix_unitaire}
                  onChange={e => editLigne(i, 'prix_unitaire', e.target.value)}
                  placeholder="0" style={{ ...inp, width: '100%' }} />
              </div>
              <button type="button" onClick={() => delLigne(i)} disabled={lignes.length === 1}
                style={{ padding: '0.5rem', background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', fontSize: '1.1rem', opacity: lignes.length === 1 ? 0.3 : 1 }}>×</button>
            </div>
          ))}

          {/* Total */}
          <div style={{ textAlign: 'right', marginTop: '0.5rem', padding: '0.5rem 0.75rem', background: 'var(--surface2)', borderRadius: '7px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Total : </span>
            <span style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1rem' }}>{fmtMnt(total)}</span>
          </div>
        </div>

        {/* RG14 — Tiers-payant assurance */}
        <div style={{ marginBottom: '1rem', padding: '0.85rem 1rem', background: 'var(--surface2)', borderRadius: '10px', border: '1px solid var(--border)' }}>
          <label style={{ ...lbl, marginBottom: '0.4rem' }}>Assurance / Tiers-payant</label>
          <select
            value={idAssurance}
            onChange={e => setIdAssurance(e.target.value)}
            style={{ ...inp, width: '100%', marginBottom: assurance ? '0.65rem' : 0 }}
          >
            <option value="">— Sans assurance (paiement direct) —</option>
            {assurances.map(a => (
              <option key={a.id_assurance} value={a.id_assurance}>
                {a.nom} — {a.taux_prise_en_charge}% pris en charge
              </option>
            ))}
          </select>
          {assurance && (
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, background: '#eaf4fb', borderRadius: '8px', padding: '0.6rem 0.85rem', minWidth: 120 }}>
                <p style={{ fontSize: '0.72rem', color: '#2980b9', fontWeight: '700', marginBottom: '0.1rem' }}>Part assurance ({tauxAss}%)</p>
                <p style={{ fontWeight: '800', color: '#2980b9', fontSize: '1rem' }}>{fmtMnt(partAssurance)}</p>
              </div>
              <div style={{ flex: 1, background: '#fef5ec', borderRadius: '8px', padding: '0.6rem 0.85rem', minWidth: 120 }}>
                <p style={{ fontSize: '0.72rem', color: '#e67e22', fontWeight: '700', marginBottom: '0.1rem' }}>Reste à charge patient</p>
                <p style={{ fontWeight: '800', color: '#e67e22', fontSize: '1rem' }}>{fmtMnt(partPatient)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Échéance + notes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={lbl}>Date d'échéance</label>
            <input type="date" value={echeance} onChange={e => setEcheance(e.target.value)} style={{ ...inp, width: '100%' }} />
          </div>
          <div>
            <label style={lbl}>Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Remarques…" style={{ ...inp, width: '100%' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={saving}>{saving ? 'Création…' : 'Créer la facture'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal paiement ── */
function PayModal({ facture, onClose, onSaved }) {
  const restant = Number(facture.montant_restant || 0);
  const [montant, setMontant] = useState(String(restant));
  const [mode,    setMode]    = useState('especes');
  const [ref,     setRef]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const submit = async () => {
    const n = Number(montant);
    if (!n || n <= 0) { setError('Montant invalide'); return; }
    if (n > restant) { setError(`Maximum : ${fmtMnt(restant)}`); return; }
    setSaving(true); setError('');
    try {
      const newTotal = Number(facture.montant_paye || 0) + n;
      await factureService.payer(facture.id_facture, {
        montant_paye:        newTotal,
        mode_paiement:       mode,
        reference_assurance: mode === 'assurance' ? ref : undefined,
      });
      onSaved();
    } catch (e) { setError(e.response?.data?.error || 'Erreur'); setSaving(false); }
  };

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.9rem', background: 'var(--surface)', width: '100%', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '400px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1.05rem' }}>Enregistrer un paiement</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{facture.prenom_patient} {facture.nom_patient} · Facture #{facture.id_facture}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Reste à payer</span>
            <span style={{ fontWeight: '800', color: '#c0392b', fontSize: '1.05rem' }}>{fmtMnt(restant)}</span>
          </div>
        </div>

        {error && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.55rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.85rem' }}>{error}</div>}

        <div style={{ marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Montant encaissé (F CFA) *</label>
          <input type="number" min={1} max={restant} value={montant} onChange={e => setMontant(e.target.value)} style={inp} autoFocus />
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.4rem' }}>
            {[25, 50, 75, 100].map(p => (
              <button key={p} type="button" onClick={() => setMontant(String(Math.round(restant * p / 100)))}
                style={{ flex: 1, padding: '0.25rem', fontSize: '0.75rem', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '5px', cursor: 'pointer', color: 'var(--muted)', fontWeight: '600' }}>
                {p}%
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.4rem' }}>Mode de paiement *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.35rem' }}>
            {MODES.map(m => (
              <button key={m.value} type="button" onClick={() => setMode(m.value)}
                style={{ padding: '0.4rem 0.5rem', borderRadius: '7px', border: `2px solid ${mode === m.value ? 'var(--g)' : 'var(--border)'}`, background: mode === m.value ? 'var(--g3)' : 'var(--surface)', color: mode === m.value ? 'var(--g)' : 'var(--muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.78rem' }}>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {mode === 'assurance' && (
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Référence assurance</label>
            <input value={ref} onChange={e => setRef(e.target.value)} placeholder="N° police, dossier…" style={inp} />
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={saving} style={{ background: '#27ae60' }}>
            {saving ? 'Enregistrement…' : '✓ Confirmer le paiement'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal détail ── */
function DetailModal({ id, onClose }) {
  const [data, setData] = useState(null);
  useEffect(() => { factureService.getOne(id).then(r => setData(r.data)).catch(() => setData({})); }, [id]);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)' }}>Facture #{id}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>
        {!data ? <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Chargement…</p> : (
          <>
            <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.6rem 0.85rem', flex: 1 }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Patient</p>
                <p style={{ fontWeight: '700', color: 'var(--text)', marginTop: '0.15rem' }}>{data.prenom_patient} {data.nom_patient}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{data.telephone}</p>
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.6rem 0.85rem' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Date</p>
                <p style={{ fontWeight: '600', color: 'var(--text)', marginTop: '0.15rem' }}>{fmt(data.date_emission)}</p>
                {data.date_echeance && <p style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>Éch. {fmt(data.date_echeance)}</p>}
              </div>
              <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.6rem 0.85rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>Statut</p>
                <div style={{ marginTop: '0.15rem' }}>
                  <Badge type={STATUT[data.statut]?.type}>{STATUT[data.statut]?.label}</Badge>
                </div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.87rem', marginBottom: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Prestation', 'Qté', 'P.U.', 'Total'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Prestation' ? 'left' : 'right', padding: '0.4rem 0.5rem', fontSize: '0.72rem', color: 'var(--muted)', fontWeight: '700', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(data.lignes || []).map((l, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.5rem' }}>{l.description}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--muted)' }}>{l.quantite}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', color: 'var(--muted)' }}>{fmtMnt(l.prix_unitaire)}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>{fmtMnt(l.montant)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ background: 'var(--surface2)', borderRadius: '8px', padding: '0.85rem 1rem' }}>
              {[
                ['Total facturé', fmtMnt(data.montant_total), 'var(--text)'],
                ['Montant payé', fmtMnt(data.montant_paye), '#27ae60'],
              ].map(([k, v, c]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{k}</span>
                  <span style={{ fontWeight: '700', color: c }}>{v}</span>
                </div>
              ))}
              {Number(data.montant_restant) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.3rem' }}>
                  <span style={{ fontWeight: '700', color: '#c0392b' }}>Reste à payer</span>
                  <span style={{ fontWeight: '800', color: '#c0392b', fontSize: '1rem' }}>{fmtMnt(data.montant_restant)}</span>
                </div>
              )}
            </div>
            {data.mode_paiement && (
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                Mode : <strong>{MODES.find(m => m.value === data.mode_paiement)?.label}</strong>
                {data.reference_assurance && ` · Réf. ${data.reference_assurance}`}
              </p>
            )}
            {data.notes && <p style={{ fontSize: '0.81rem', color: 'var(--muted)', fontStyle: 'italic', marginTop: '0.3rem' }}>{data.notes}</p>}
          </>
        )}
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function Facturation() {
  const [tab,      setTab]      = useState('en_attente');
  const [factures, setFactures] = useState([]);
  const [stats,    setStats]    = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(null); // { type, data? }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = tab !== 'toutes' ? { statut: tab, q: search || undefined } : { q: search || undefined };
      const [fRes, sRes] = await Promise.all([
        factureService.getAll(params),
        factureService.getStats(),
      ]);
      setFactures(fRes.data);
      setStats(sRes.data);
    } catch { setFactures([]); }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const handleAnnuler = async f => {
    if (!window.confirm(`Annuler la facture #${f.id_facture} ?`)) return;
    await factureService.annuler(f.id_facture);
    load();
  };

  const TABS = [
    { k: 'en_attente',         label: 'En attente' },
    { k: 'partiellement_paye', label: 'Partielles' },
    { k: 'paye',               label: 'Payées' },
    { k: 'toutes',             label: 'Toutes' },
  ];

  return (
    <div style={{ padding: '1.5rem', maxWidth: '960px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Facturation</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Gestion des factures et paiements</p>
        </div>
        <Button onClick={() => setModal({ type: 'create' })}>+ Nouvelle facture</Button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.7rem', marginBottom: '1.5rem' }}>
          {[
            { label: 'En attente',     val: stats.nb_en_attente || 0,                    color: '#e67e22', bg: '#fef5ec', fmt: false },
            { label: 'À encaisser',    val: fmtMnt(stats.total_restant),                 color: '#c0392b', bg: '#fdecea', fmt: true  },
            { label: 'Encaissé / jour',val: fmtMnt(stats.encaisse_jour),                 color: '#27ae60', bg: '#eafaf1', fmt: true  },
            { label: 'Total encaissé', val: fmtMnt(stats.total_encaisse),                color: '#2980b9', bg: '#eaf4fb', fmt: true  },
          ].map(s => (
            <Card key={s.label} style={{ padding: '0.85rem 1rem', borderTop: `3px solid ${s.color}`, background: s.bg }}>
              <p style={{ fontSize: s.fmt ? '0.92rem' : '1.5rem', fontWeight: '800', color: s.color, lineHeight: 1.1 }}>{s.val}</p>
              <p style={{ fontSize: '0.75rem', color: s.color, fontWeight: '600', marginTop: '0.2rem' }}>{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Tabs + Recherche */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '0.5rem', marginBottom: 0 }}>
        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              style={{ padding: '0.6rem 1rem', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.k ? 'var(--g)' : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', fontWeight: tab === t.k ? '700' : '400', color: tab === t.k ? 'var(--g)' : 'var(--muted)', fontSize: '0.88rem' }}>
              {t.label}
            </button>
          ))}
        </div>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un patient…"
          style={{ padding: '0.5rem 0.85rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.87rem', width: 220, outline: 'none', background: 'var(--surface)', marginBottom: '2px' }} />
      </div>

      <div style={{ height: '1.25rem' }} />

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {!loading && factures.length === 0 && (
        <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)' }}>Aucune facture {tab !== 'toutes' ? `avec statut "${TABS.find(t => t.k === tab)?.label}"` : ''}.</p>
          <Button style={{ marginTop: '1rem' }} onClick={() => setModal({ type: 'create' })}>Créer une facture</Button>
        </Card>
      )}

      {/* Tableau factures */}
      {!loading && factures.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
          {factures.map(f => {
            const s = STATUT[f.statut] || { label: f.statut, type: 'default' };
            const enRetard = f.date_echeance && new Date(f.date_echeance) < new Date() && f.statut !== 'paye' && f.statut !== 'annule';
            return (
              <div key={f.id_facture} style={{ border: `1px solid ${enRetard ? '#f5c6c6' : 'var(--border)'}`, borderRadius: '10px', padding: '0.85rem 1rem', background: 'var(--surface)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
                {/* Patient */}
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                  <Avatar name={`${f.prenom_patient} ${f.nom_patient}`} size={34} />
                  <div>
                    <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.9rem' }}>{f.prenom_patient} {f.nom_patient}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>#{f.id_facture} · {fmt(f.date_emission)}</p>
                  </div>
                </div>

                {/* Montant */}
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.95rem' }}>{fmtMnt(f.montant_total)}</p>
                  {Number(f.montant_paye) > 0 && (
                    <p style={{ fontSize: '0.73rem', color: '#27ae60' }}>Payé : {fmtMnt(f.montant_paye)}</p>
                  )}
                </div>

                {/* Restant */}
                <div style={{ textAlign: 'center' }}>
                  {Number(f.montant_restant) > 0 ? (
                    <p style={{ fontWeight: '700', color: '#c0392b', fontSize: '0.92rem' }}>{fmtMnt(f.montant_restant)}</p>
                  ) : (
                    <p style={{ color: '#27ae60', fontSize: '0.82rem', fontWeight: '600' }}>Soldée</p>
                  )}
                  {f.date_echeance && <p style={{ fontSize: '0.72rem', color: enRetard ? '#c0392b' : 'var(--muted)' }}>Éch. {fmt(f.date_echeance)}</p>}
                </div>

                {/* Statut */}
                <div style={{ textAlign: 'center' }}>
                  <Badge type={s.type}>{s.label}</Badge>
                  {enRetard && <div style={{ marginTop: '0.25rem' }}><Badge type="error">Retard</Badge></div>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(f.statut === 'en_attente' || f.statut === 'partiellement_paye') && (
                    <button onClick={() => setModal({ type: 'pay', data: f })}
                      style={{ padding: '0.3rem 0.75rem', background: '#27ae60', color: '#fff', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>
                      Payer
                    </button>
                  )}
                  <button onClick={() => setModal({ type: 'detail', data: f })}
                    style={{ padding: '0.3rem 0.6rem', background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '7px', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Voir
                  </button>
                  {f.statut !== 'annule' && f.statut !== 'paye' && (
                    <button onClick={() => handleAnnuler(f)}
                      style={{ padding: '0.3rem 0.5rem', background: 'none', color: '#e74c3c', border: 'none', borderRadius: '7px', cursor: 'pointer', fontSize: '1rem' }}>×</button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'create' && <CreateModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'pay'    && <PayModal facture={modal.data} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }} />}
      {modal?.type === 'detail' && <DetailModal id={modal.data.id_facture} onClose={() => setModal(null)} />}
    </div>
  );
}
