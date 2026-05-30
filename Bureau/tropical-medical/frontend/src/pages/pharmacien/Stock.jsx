import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { stockService } from '../../services/stock.service';
import Card   from '../../components/ui/Card';
import Badge  from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const fmt     = d => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtHeure = d => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—';

const FORMES = ['comprime','sirop','injectable','creme','gouttes','poudre','autre'];
const TYPE_COLOR = { entree: '#27ae60', sortie: '#e74c3c', ajustement: '#e67e22' };
const TYPE_SIGN  = { entree: '+', sortie: '-', ajustement: '±' };

function pctStock(s) { return s.seuil_alerte > 0 ? Math.min((s.quantite / s.seuil_alerte) * 50, 100) : 100; }
function barColor(s) { if (s.perime) return '#7f8c8d'; if (s.en_alerte) return '#c0392b'; if (pctStock(s) < 75) return '#e67e22'; return '#27ae60'; }

/* ── Modal mouvement (entrée / sortie) ── */
function MvtModal({ stock, type, onClose, onDone }) {
  const [qty,   setQty]   = useState('');
  const [motif, setMotif] = useState('');
  const [err,   setErr]   = useState('');
  const [busy,  setBusy]  = useState(false);

  const submit = async () => {
    const n = Number(qty);
    if (!n || n <= 0) { setErr('Quantité invalide'); return; }
    setBusy(true); setErr('');
    try {
      const fn = type === 'entree' ? stockService.entree : stockService.sortie;
      await fn(stock.id_stock, { quantite: n, motif });
      onDone();
    } catch (e) { setErr(e.response?.data?.error || 'Erreur'); setBusy(false); }
  };

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.9rem', background: 'var(--surface)', width: '100%', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '380px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: type === 'entree' ? '#27ae60' : '#c0392b', fontSize: '1rem' }}>
            {type === 'entree' ? '📥 Entrée de stock' : '📤 Sortie de stock'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>
        <p style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text)', marginBottom: '1rem' }}>
          {stock.nom} · Stock actuel : <span style={{ color: stock.en_alerte ? '#c0392b' : 'var(--g)' }}>{stock.quantite}</span>
        </p>
        {err && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.55rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.85rem' }}>{err}</div>}
        <div style={{ marginBottom: '0.85rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Quantité *</label>
          <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)} style={inp} autoFocus />
        </div>
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' }}>Motif</label>
          <input value={motif} onChange={e => setMotif(e.target.value)} placeholder={type === 'entree' ? 'Réapprovisionnement…' : 'Dispensation, périmé…'} style={inp} />
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={busy} style={{ background: type === 'entree' ? '#27ae60' : '#c0392b' }}>
            {busy ? 'Enregistrement…' : 'Confirmer'}
          </Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal édition seuil/prix ── */
function EditModal({ stock, onClose, onDone }) {
  const [form, setForm] = useState({
    seuil_alerte:   stock.seuil_alerte,
    prix_unitaire:  stock.prix_unitaire,
    lot:            stock.lot || '',
    date_peremption: stock.date_peremption ? stock.date_peremption.slice(0,10) : '',
  });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      await stockService.update(stock.id_stock, {
        seuil_alerte:   Number(form.seuil_alerte),
        prix_unitaire:  Number(form.prix_unitaire),
        lot:            form.lot || null,
        date_peremption: form.date_peremption || null,
      });
      onDone();
    } catch (e) { setErr(e.response?.data?.error || 'Erreur'); setBusy(false); }
  };

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.9rem', background: 'var(--surface)', width: '100%', outline: 'none' };
  const lbl = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '380px', maxWidth: '95vw', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem' }}>Modifier — {stock.nom}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>
        {err && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.55rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.85rem' }}>{err}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div><label style={lbl}>Seuil d'alerte</label><input type="number" min={0} value={form.seuil_alerte} onChange={set('seuil_alerte')} style={inp} /></div>
          <div><label style={lbl}>Prix unitaire (F CFA)</label><input type="number" min={0} step="0.01" value={form.prix_unitaire} onChange={set('prix_unitaire')} style={inp} /></div>
          <div><label style={lbl}>Numéro de lot</label><input value={form.lot} onChange={set('lot')} style={inp} /></div>
          <div><label style={lbl}>Date de péremption</label><input type="date" value={form.date_peremption} onChange={set('date_peremption')} style={inp} /></div>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={busy}>{busy ? 'Enregistrement…' : 'Sauvegarder'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal ajout nouveau stock ── */
function AddStockModal({ onClose, onDone }) {
  const [mode, setMode] = useState('existant'); // 'existant' | 'nouveau'
  const [existants, setExistants] = useState([]);
  const [form, setForm] = useState({ id_medicament: '', nom: '', dci: '', forme: 'comprime', dosage: '', quantite: 0, seuil_alerte: 10, prix_unitaire: 0, lot: '', date_peremption: '' });
  const [busy, setBusy] = useState(false);
  const [err,  setErr]  = useState('');
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    stockService.getAll().then(r => {
      const ids = new Set(r.data.map(s => s.id_medicament));
      import('../../services/ordonnance.service').then(({ ordonnanceService }) =>
        ordonnanceService.getMedicaments().then(m => setExistants(m.data.filter(x => !ids.has(x.id_medicament))))
      ).catch(() => {});
    }).catch(() => {});
  }, []);

  const submit = async () => {
    setBusy(true); setErr('');
    try {
      const payload = mode === 'existant'
        ? { id_medicament: Number(form.id_medicament), quantite: Number(form.quantite), seuil_alerte: Number(form.seuil_alerte), prix_unitaire: Number(form.prix_unitaire), lot: form.lot || undefined, date_peremption: form.date_peremption || undefined }
        : { nom: form.nom, dci: form.dci, forme: form.forme, dosage: form.dosage, quantite: Number(form.quantite), seuil_alerte: Number(form.seuil_alerte), prix_unitaire: Number(form.prix_unitaire), lot: form.lot || undefined, date_peremption: form.date_peremption || undefined };
      if (mode === 'existant' && !payload.id_medicament) { setErr('Sélectionnez un médicament'); setBusy(false); return; }
      if (mode === 'nouveau' && !payload.nom) { setErr('Nom requis'); setBusy(false); return; }
      await stockService.create(payload);
      onDone();
    } catch (e) { setErr(e.response?.data?.error || 'Erreur'); setBusy(false); }
  };

  const inp = { padding: '0.55rem 0.75rem', border: '1px solid var(--border)', borderRadius: '7px', fontSize: '0.9rem', background: 'var(--surface)', width: '100%', outline: 'none' };
  const lbl = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.25rem' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', borderRadius: '14px', padding: '1.5rem', width: '460px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.1rem' }}>
          <h3 style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem' }}>Ajouter au stock</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1.3rem' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
          {[['existant', 'Médicament existant'], ['nouveau', 'Nouveau médicament']].map(([k, v]) => (
            <button key={k} onClick={() => setMode(k)}
              style={{ flex: 1, padding: '0.45rem', borderRadius: '8px', border: `2px solid ${mode === k ? 'var(--g)' : 'var(--border)'}`, background: mode === k ? 'var(--g3)' : 'var(--surface)', color: mode === k ? 'var(--g)' : 'var(--muted)', fontWeight: '600', cursor: 'pointer', fontSize: '0.83rem' }}>
              {v}
            </button>
          ))}
        </div>

        {err && <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.55rem', borderRadius: '7px', marginBottom: '0.85rem', fontSize: '0.85rem' }}>{err}</div>}

        {mode === 'existant' ? (
          <div style={{ marginBottom: '0.85rem' }}>
            <label style={lbl}>Médicament *</label>
            <select value={form.id_medicament} onChange={set('id_medicament')} style={inp}>
              <option value="">— Sélectionner —</option>
              {existants.map(m => <option key={m.id_medicament} value={m.id_medicament}>{m.nom}{m.dosage ? ` (${m.dosage})` : ''}</option>)}
            </select>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '0.85rem' }}>
            <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Nom *</label><input value={form.nom} onChange={set('nom')} style={inp} /></div>
            <div><label style={lbl}>DCI</label><input value={form.dci} onChange={set('dci')} style={inp} /></div>
            <div><label style={lbl}>Dosage</label><input value={form.dosage} onChange={set('dosage')} style={inp} /></div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={lbl}>Forme</label>
              <select value={form.forme} onChange={set('forme')} style={inp}>
                {FORMES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginBottom: '1rem' }}>
          <div><label style={lbl}>Quantité initiale</label><input type="number" min={0} value={form.quantite} onChange={set('quantite')} style={inp} /></div>
          <div><label style={lbl}>Seuil d'alerte</label><input type="number" min={0} value={form.seuil_alerte} onChange={set('seuil_alerte')} style={inp} /></div>
          <div><label style={lbl}>Prix unitaire (F CFA)</label><input type="number" min={0} step="0.01" value={form.prix_unitaire} onChange={set('prix_unitaire')} style={inp} /></div>
          <div><label style={lbl}>Numéro de lot</label><input value={form.lot} onChange={set('lot')} style={inp} /></div>
          <div style={{ gridColumn: '1/-1' }}><label style={lbl}>Date de péremption</label><input type="date" value={form.date_peremption} onChange={set('date_peremption')} style={inp} /></div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <Button onClick={submit} disabled={busy}>{busy ? 'Ajout…' : 'Ajouter au stock'}</Button>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

/* ── Ligne stock ── */
function StockRow({ s, onEntree, onSortie, onEdit, onRemove }) {
  const bar = pctStock(s);
  const color = barColor(s);

  return (
    <div style={{ border: `1px solid ${s.en_alerte ? '#f5c6c6' : 'var(--border)'}`, borderRadius: '10px', padding: '0.9rem 1rem', background: s.perime ? '#f8f8f8' : s.en_alerte ? '#fff8f8' : 'var(--surface)', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'center' }}>
      {/* Médicament */}
      <div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.15rem' }}>
          <span style={{ fontWeight: '700', color: s.perime ? 'var(--muted)' : 'var(--text)', fontSize: '0.93rem' }}>{s.nom}</span>
          {s.dosage && s.dosage !== '—' && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.dosage}</span>}
          {s.en_alerte && !s.perime && <Badge type="error">Alerte</Badge>}
          {s.perime && <Badge type="default">Périmé</Badge>}
          {!s.perime && s.expiration_proche && <Badge type="warning">Expire bientôt</Badge>}
        </div>
        <p style={{ fontSize: '0.77rem', color: 'var(--muted)' }}>
          {s.dci && `DCI: ${s.dci} · `}{s.forme} · Lot: {s.lot || '—'}
        </p>
      </div>

      {/* Quantité + barre */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: '800', fontSize: '1.1rem', color }}>{s.quantite}</p>
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${bar}%`, background: color, borderRadius: 2 }} />
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: 2 }}>seuil: {s.seuil_alerte}</p>
      </div>

      {/* Prix */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--text)' }}>
          {Number(s.prix_unitaire).toLocaleString('fr-FR')} F
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>/ unité</p>
      </div>

      {/* Péremption */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: '0.83rem', color: s.perime ? '#c0392b' : s.expiration_proche ? '#e67e22' : 'var(--muted)' }}>
          {fmt(s.date_peremption)}
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.35rem' }}>
        <button onClick={() => onEntree(s)} title="Entrée"
          style={{ padding: '0.3rem 0.6rem', background: '#eafaf1', color: '#27ae60', border: '1px solid #a9dfbf', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}>+</button>
        <button onClick={() => onSortie(s)} title="Sortie"
          style={{ padding: '0.3rem 0.6rem', background: '#fdecea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '700' }}>−</button>
        <button onClick={() => onEdit(s)} title="Modifier"
          style={{ padding: '0.3rem 0.6rem', background: 'var(--surface2)', color: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>✎</button>
        <button onClick={() => onRemove(s)} title="Supprimer"
          style={{ padding: '0.3rem 0.5rem', background: 'none', color: '#e74c3c', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '1rem' }}>×</button>
      </div>
    </div>
  );
}

/* ── Page principale ── */
export default function Stock() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initTab = searchParams.get('tab') || 'stock';

  const [tab,        setTab]        = useState(initTab);
  const [stock,      setStock]      = useState([]);
  const [mouvements, setMouvements] = useState([]);
  const [search,     setSearch]     = useState('');
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | { type: 'entree'|'sortie'|'edit'|'add', stock? }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'alertes') {
        const r = await stockService.getAlertes();
        setStock(r.data);
      } else if (tab === 'peremptions') {
        const r = await stockService.getPeremptions(90);
        setStock(r.data);
      } else if (tab === 'mouvements') {
        const r = await stockService.getMouvementsAll();
        setMouvements(r.data);
      } else {
        const r = await stockService.getAll(search ? { q: search } : {});
        setStock(r.data);
      }
    } catch { setStock([]); }
    setLoading(false);
  }, [tab, search]);

  useEffect(() => { load(); }, [load]);

  const closeModal = () => setModal(null);
  const refresh    = () => { closeModal(); load(); };

  const handleRemove = async s => {
    if (!window.confirm(`Supprimer ${s.nom} du stock ?`)) return;
    await stockService.remove(s.id_stock);
    load();
  };

  const tabs = [
    { k: 'stock',       label: 'Stock' },
    { k: 'alertes',     label: `Alertes${stock.length && tab === 'alertes' ? ` (${stock.length})` : ''}` },
    { k: 'peremptions', label: 'Péremptions' },
    { k: 'mouvements',  label: 'Historique' },
  ];

  const alertCount = tab === 'alertes' ? stock.length : null;

  return (
    <div style={{ padding: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontWeight: '800', fontSize: '1.4rem', color: 'var(--text)', marginBottom: '0.2rem' }}>Gestion du stock</h2>
          <p style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>
            {tab === 'stock' ? `${stock.length} médicament${stock.length > 1 ? 's' : ''}` :
             tab === 'alertes' ? `${stock.length} alerte${stock.length > 1 ? 's' : ''}` :
             tab === 'peremptions' ? `${stock.length} article${stock.length > 1 ? 's' : ''} expirant bientôt` :
             `${mouvements.length} mouvement${mouvements.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <Button onClick={() => setModal({ type: 'add' })}>+ Ajouter au stock</Button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.25rem' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => { setTab(t.k); setSearchParams(t.k !== 'stock' ? { tab: t.k } : {}); }}
            style={{ padding: '0.6rem 1.1rem', background: 'none', border: 'none', borderBottom: `3px solid ${tab === t.k ? 'var(--g)' : 'transparent'}`, marginBottom: '-2px', cursor: 'pointer', fontWeight: tab === t.k ? '700' : '400', color: tab === t.k ? 'var(--g)' : 'var(--muted)', fontSize: '0.9rem' }}>
            {t.label}
            {t.k === 'alertes' && tab !== 'alertes' && <AlertBadgeCount tab={t.k} />}
          </button>
        ))}
      </div>

      {/* Barre de recherche (tab stock) */}
      {tab === 'stock' && (
        <div style={{ marginBottom: '1rem' }}>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un médicament…"
            style={{ padding: '0.6rem 1rem', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', width: '100%', maxWidth: 340, outline: 'none', background: 'var(--surface)' }} />
        </div>
      )}

      {loading && <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem' }}>Chargement…</p>}

      {/* Tab stock / alertes / peremptions */}
      {(tab === 'stock' || tab === 'alertes' || tab === 'peremptions') && !loading && (
        <>
          {tab === 'alertes' && stock.length > 0 && (
            <div style={{ background: '#fdecea', border: '2px solid #c0392b', borderRadius: '10px', padding: '0.8rem 1rem', marginBottom: '1rem' }}>
              <p style={{ color: '#c0392b', fontWeight: '700', fontSize: '0.9rem' }}>
                ⚠ {stock.length} médicament{stock.length > 1 ? 's' : ''} sous le seuil d'alerte — réapprovisionnement nécessaire
              </p>
            </div>
          )}

          {stock.length === 0 ? (
            <Card style={{ padding: '2.5rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--muted)' }}>
                {tab === 'alertes' ? 'Aucune alerte de stock.' : tab === 'peremptions' ? 'Aucune péremption imminente.' : 'Aucun article en stock.'}
              </p>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {/* En-tête colonnes */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.75rem', padding: '0 1rem', fontSize: '0.72rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <span>Médicament</span><span style={{ textAlign: 'center' }}>Quantité</span><span style={{ textAlign: 'center' }}>Prix</span><span style={{ textAlign: 'center' }}>Péremption</span><span />
              </div>
              {stock.map(s => (
                <StockRow key={s.id_stock} s={s}
                  onEntree={s => setModal({ type: 'entree', stock: s })}
                  onSortie={s => setModal({ type: 'sortie', stock: s })}
                  onEdit={s => setModal({ type: 'edit', stock: s })}
                  onRemove={handleRemove} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab historique mouvements */}
      {tab === 'mouvements' && !loading && (
        <Card style={{ padding: '1rem 1.25rem' }}>
          {mouvements.length === 0 ? (
            <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1.5rem' }}>Aucun mouvement enregistré.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  {['Date', 'Médicament', 'Type', 'Quantité', 'Motif', 'Par'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', fontSize: '0.75rem', fontWeight: '700', color: 'var(--muted)', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mouvements.map(mv => (
                  <tr key={mv.id_mouvement} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.55rem 0.75rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmtHeure(mv.created_at)}</td>
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: '600', color: 'var(--text)' }}>{mv.nom_medicament}</td>
                    <td style={{ padding: '0.55rem 0.75rem' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '700', background: mv.type === 'entree' ? '#eafaf1' : mv.type === 'sortie' ? '#fdecea' : '#fef9ec', color: TYPE_COLOR[mv.type] }}>
                        {mv.type}
                      </span>
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem', fontWeight: '700', color: TYPE_COLOR[mv.type] }}>
                      {mv.type === 'entree' ? '+' : mv.type === 'sortie' ? '-' : '±'}{Math.abs(mv.quantite)}
                    </td>
                    <td style={{ padding: '0.55rem 0.75rem', color: 'var(--muted)', maxWidth: 200 }}>{mv.motif || '—'}</td>
                    <td style={{ padding: '0.55rem 0.75rem', color: 'var(--muted)' }}>{mv.prenom_util ? `${mv.prenom_util} ${mv.nom_util}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* Modals */}
      {modal?.type === 'entree' && <MvtModal stock={modal.stock} type="entree" onClose={closeModal} onDone={refresh} />}
      {modal?.type === 'sortie' && <MvtModal stock={modal.stock} type="sortie" onClose={closeModal} onDone={refresh} />}
      {modal?.type === 'edit'   && <EditModal stock={modal.stock} onClose={closeModal} onDone={refresh} />}
      {modal?.type === 'add'    && <AddStockModal onClose={closeModal} onDone={refresh} />}
    </div>
  );
}

/* Badge count alertes (mini) */
function AlertBadgeCount() {
  const [count, setCount] = useState(null);
  useEffect(() => { stockService.getAlertes().then(r => setCount(r.data.length)).catch(() => {}); }, []);
  if (!count) return null;
  return <span style={{ marginLeft: '0.35rem', background: '#c0392b', color: '#fff', borderRadius: '20px', padding: '0 0.45rem', fontSize: '0.72rem', fontWeight: '700' }}>{count}</span>;
}
