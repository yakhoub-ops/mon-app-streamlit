import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ordonnanceService }   from '../../services/ordonnance.service';
import { patientService }      from '../../services/patient.service';
import { consultationService } from '../../services/consultation.service';
import { interactionService }  from '../../services/interaction.service';
import Avatar  from '../../components/ui/Avatar';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';
import Badge   from '../../components/ui/Badge';

const EMPTY_LIGNE = { id_medicament: '', posologie: '', duree: '', quantite: 1, instructions: '' };

const NIVEAU_COLOR = { faible: '#f39c12', modere: '#e67e22', eleve: '#e74c3c', contrindication: '#c0392b' };
const NIVEAU_LABEL = { faible: 'Faible', modere: 'Modérée', eleve: 'Élevée', contrindication: 'Contre-indication' };

export default function NouvelleOrdonnance() {
  const navigate = useNavigate();
  const [params]  = useSearchParams();
  const patient_id      = params.get('patient');
  const consultation_id = params.get('consultation');

  const [patient,        setPatient]        = useState(null);
  const [consultation,   setConsultation]   = useState(null);
  const [medicaments,    setMedicaments]    = useState([]);
  const [lignes,         setLignes]         = useState([{ ...EMPTY_LIGNE }]);
  const [expiration,     setExpiration]     = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [interactions,   setInteractions]   = useState([]);
  const [interBloquant,  setInterBloquant]  = useState(false);

  useEffect(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    setExpiration(d.toISOString().slice(0, 10));
  }, []);

  useEffect(() => {
    if (patient_id) patientService.getOne(patient_id).then(r => setPatient(r.data)).catch(() => {});
    if (consultation_id) consultationService.getOne(consultation_id).then(r => setConsultation(r.data)).catch(() => {});
    ordonnanceService.getMedicaments().then(r => setMedicaments(r.data)).catch(() => {});
  }, [patient_id, consultation_id]);

  // RG13 — Vérifier interactions à chaque changement de médicament
  const verifierInteractions = useCallback(async (lignesActuelles) => {
    const ids = lignesActuelles
      .map(l => Number(l.id_medicament))
      .filter(id => id > 0);
    if (ids.length < 2) { setInteractions([]); setInterBloquant(false); return; }
    try {
      const r = await interactionService.checker(ids);
      setInteractions(r.data.interactions || []);
      setInterBloquant(r.data.bloquant || false);
    } catch {}
  }, []);

  /* ── Lignes ── */
  const addLigne    = ()       => setLignes(l => [...l, { ...EMPTY_LIGNE }]);
  const removeLigne = (i)      => {
    const next = lignes.filter((_, k) => k !== i);
    setLignes(next);
    verifierInteractions(next);
  };
  const editLigne = (i, k, v) => {
    const next = lignes.map((row, k2) => k2 === i ? { ...row, [k]: v } : row);
    setLignes(next);
    if (k === 'id_medicament') verifierInteractions(next);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const valides = lignes.filter(l => l.id_medicament && l.posologie);
    if (valides.length === 0) { setError('Ajoutez au moins un médicament avec posologie.'); return; }
    if (interBloquant) { setError('Impossible de valider : interactions médicamenteuses bloquantes détectées.'); return; }
    setSaving(true); setError('');
    try {
      await ordonnanceService.create({
        id_consultation: consultation_id ? Number(consultation_id) : undefined,
        id_patient:      Number(patient_id),
        date_expiration: expiration,
        lignes: valides.map(l => ({ ...l, id_medicament: Number(l.id_medicament), quantite: Number(l.quantite) })),
      });
      navigate(`/medecin/patient/${patient_id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    padding: '0.55rem 0.75rem', border: '1px solid var(--border)',
    borderRadius: '7px', fontSize: '0.9rem', outline: 'none', background: 'var(--surface)',
  };
  const lbl = { fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.2rem' };

  if (!patient_id) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
      <p>Aucun patient sélectionné.</p>
      <Button style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>Retour</Button>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '860px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g)', fontWeight: '600', padding: 0 }}>← Retour</button>
        <span>/</span><span>Nouvelle ordonnance</span>
      </div>

      {/* Header patient + consultation */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {patient && (
          <Card style={{ flex: 1, padding: '0.85rem 1.1rem', display: 'flex', gap: '0.85rem', alignItems: 'center', minWidth: 200 }}>
            <Avatar name={`${patient.prenom} ${patient.nom}`} size={42} />
            <div>
              <p style={{ fontWeight: '700', color: 'var(--text)' }}>{patient.prenom} {patient.nom}</p>
              <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{patient.telephone}</p>
            </div>
          </Card>
        )}
        {consultation && (
          <Card style={{ flex: 1, padding: '0.85rem 1.1rem', minWidth: 200 }}>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', fontWeight: '600', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Consultation liée</p>
            <p style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.9rem' }}>{consultation.motif || 'Sans motif'}</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{consultation.diagnostic || '—'}</p>
          </Card>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>{error}</div>
        )}

        {/* Expiration */}
        <Card style={{ marginBottom: '1rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div>
              <label style={lbl}>Date d'expiration</label>
              <input type="date" value={expiration} onChange={e => setExpiration(e.target.value)} style={inp} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '1.1rem' }}>
              Validité de l'ordonnance (30 jours par défaut)
            </p>
          </div>
        </Card>

        {/* Médicaments */}
        <Card style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: '700', color: 'var(--text)' }}>Médicaments ({lignes.length})</h3>
            <Button type="button" variant="outline" size="sm" onClick={addLigne}>+ Ajouter</Button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {lignes.map((ligne, i) => (
              <div key={i} style={{ border: '1px solid var(--border)', borderRadius: '10px', padding: '1rem', background: 'var(--surface2)', position: 'relative' }}>

                {/* Numéro + supprimer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ background: 'var(--g)', color: '#fff', borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: '700' }}>{i + 1}</span>
                  {lignes.length > 1 && (
                    <button type="button" onClick={() => removeLigne(i)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c', fontSize: '1.2rem', lineHeight: 1 }}>×</button>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr 1fr', gap: '0.65rem', alignItems: 'end' }}>
                  {/* Médicament */}
                  <div style={{ gridColumn: '1 / 3' }}>
                    <label style={lbl}>Médicament *</label>
                    <select required value={ligne.id_medicament} onChange={e => editLigne(i, 'id_medicament', e.target.value)}
                      style={{ ...inp, width: '100%' }}>
                      <option value="">— Sélectionner —</option>
                      {medicaments.map(m => (
                        <option key={m.id_medicament} value={m.id_medicament}>
                          {m.nom}{m.dosage ? ` (${m.dosage})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantité */}
                  <div>
                    <label style={lbl}>Quantité</label>
                    <input type="number" min={1} max={99} value={ligne.quantite}
                      onChange={e => editLigne(i, 'quantite', e.target.value)}
                      style={{ ...inp, width: '100%' }} />
                  </div>

                  {/* Durée */}
                  <div>
                    <label style={lbl}>Durée</label>
                    <input value={ligne.duree} onChange={e => editLigne(i, 'duree', e.target.value)}
                      placeholder="7 jours" style={{ ...inp, width: '100%' }} />
                  </div>

                  {/* Posologie */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Posologie *</label>
                    <input required value={ligne.posologie} onChange={e => editLigne(i, 'posologie', e.target.value)}
                      placeholder="Ex : 1 comprimé matin et soir pendant les repas"
                      style={{ ...inp, width: '100%' }} />
                  </div>

                  {/* Instructions */}
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={lbl}>Instructions particulières</label>
                    <input value={ligne.instructions} onChange={e => editLigne(i, 'instructions', e.target.value)}
                      placeholder="Ex : ne pas écraser, à prendre à jeun…"
                      style={{ ...inp, width: '100%' }} />
                  </div>
                </div>

                {/* Aperçu médicament sélectionné */}
                {ligne.id_medicament && (() => {
                  const m = medicaments.find(m => m.id_medicament === Number(ligne.id_medicament));
                  return m ? (
                    <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Badge type="info">{m.forme}</Badge>
                      {m.dci && <Badge type="default">DCI : {m.dci}</Badge>}
                    </div>
                  ) : null;
                })()}
              </div>
            ))}
          </div>
        </Card>

        {/* RG13 — Alertes interactions */}
        {interactions.length > 0 && (
          <div style={{
            marginBottom: '1.25rem', padding: '1rem 1.25rem', borderRadius: '12px',
            background: interBloquant ? '#fde8e8' : '#fff8e1',
            border: `1.5px solid ${interBloquant ? '#e74c3c' : '#f39c12'}`,
          }}>
            <p style={{ fontWeight: '800', color: interBloquant ? '#c0392b' : '#e67e22', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
              {interBloquant ? '⛔ Interactions bloquantes détectées' : '⚠ Interactions médicamenteuses'}
            </p>
            {interactions.map((inter, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginTop: '0.4rem' }}>
                <span style={{
                  background: NIVEAU_COLOR[inter.niveau], color: '#fff',
                  padding: '0.1rem 0.5rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700', whiteSpace: 'nowrap',
                }}>{NIVEAU_LABEL[inter.niveau]}</span>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  <strong>{inter.nom_medicament_a}</strong> + <strong>{inter.nom_medicament_b}</strong>
                  {inter.description ? ` — ${inter.description}` : ''}
                </p>
              </div>
            ))}
            {interBloquant && (
              <p style={{ marginTop: '0.6rem', fontSize: '0.83rem', color: '#c0392b', fontWeight: '600' }}>
                La validation de l'ordonnance est bloquée. Modifiez la prescription.
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="submit" disabled={saving || interBloquant}>
            {saving ? 'Création…' : 'Créer l\'ordonnance'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
