import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { consultationService } from '../../services/consultation.service';
import { patientService }      from '../../services/patient.service';
import { rdvService }          from '../../services/rdv.service';
import Avatar  from '../../components/ui/Avatar';
import Button  from '../../components/ui/Button';
import Card    from '../../components/ui/Card';

const EMPTY = { motif: '', diagnostic: '', traitement: '', notes: '', statut: 'en_cours' };

export default function NouvelleConsultation() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const patient_id = params.get('patient');
  const rdv_id     = params.get('rdv');

  const [patient,  setPatient]  = useState(null);
  const [rdv,      setRdv]      = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [addOrdo,  setAddOrdo]  = useState(false);

  useEffect(() => {
    if (!patient_id) return;
    patientService.getOne(patient_id).then(r => setPatient(r.data)).catch(() => {});
    if (rdv_id) {
      rdvService.getOne(rdv_id)
        .then(r => {
          setRdv(r.data);
          if (r.data.motif) setForm(f => ({ ...f, motif: r.data.motif }));
        })
        .catch(() => {});
    }
  }, [patient_id, rdv_id]);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patient_id) { setError('Aucun patient sélectionné.'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await consultationService.create({
        id_patient: Number(patient_id),
        id_rdv:     rdv_id ? Number(rdv_id) : undefined,
        ...form,
      });
      if (addOrdo) {
        navigate(`/medecin/ordonnance/new?patient=${patient_id}&consultation=${data.id_consultation}`);
      } else {
        navigate(`/medecin/patient/${patient_id}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création');
    } finally {
      setSaving(false);
    }
  };

  const inp = {
    padding: '0.65rem 0.9rem', border: '1px solid var(--border)',
    borderRadius: '8px', fontSize: '0.95rem', outline: 'none',
    width: '100%', background: 'var(--surface)',
  };
  const lbl = { fontSize: '0.82rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' };

  if (!patient_id) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
      <p>Aucun patient sélectionné.</p>
      <Button style={{ marginTop: '1rem' }} onClick={() => navigate(-1)}>Retour</Button>
    </div>
  );

  return (
    <div style={{ padding: '1.5rem', maxWidth: '760px', margin: '0 auto' }}>

      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--g)', fontWeight: '600', padding: 0 }}>← Retour</button>
        <span>/</span><span>Nouvelle consultation</span>
      </div>

      {/* Header patient */}
      {patient && (
        <Card style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Avatar name={`${patient.prenom} ${patient.nom}`} size={48} />
          <div>
            <p style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>{patient.prenom} {patient.nom}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
              {patient.telephone}{patient.groupe_sanguin ? ` · ${patient.groupe_sanguin}` : ''}
              {patient.allergies ? ` · ⚠ ${patient.allergies}` : ''}
            </p>
          </div>
          {rdv && (
            <div style={{ marginLeft: 'auto', background: 'var(--g3)', borderRadius: '8px', padding: '0.4rem 0.85rem', fontSize: '0.82rem', color: 'var(--g2)', fontWeight: '600' }}>
              RDV #{rdv.id_rdv}
            </div>
          )}
        </Card>
      )}

      {/* Formulaire */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.88rem' }}>{error}</div>
        )}

        <Card style={{ marginBottom: '1rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div>
              <label style={lbl}>Motif de consultation</label>
              <input value={form.motif} onChange={set('motif')} style={inp} placeholder="Ex : fièvre, douleurs abdominales…" />
            </div>

            <div>
              <label style={lbl}>Diagnostic</label>
              <textarea value={form.diagnostic} onChange={set('diagnostic')} rows={3}
                style={{ ...inp, resize: 'vertical' }}
                placeholder="Ex : paludisme simple, gastro-entérite aiguë…" />
            </div>

            <div>
              <label style={lbl}>Traitement prescrit</label>
              <textarea value={form.traitement} onChange={set('traitement')} rows={3}
                style={{ ...inp, resize: 'vertical' }}
                placeholder="Ex : repos, hydratation, ACT 3 jours…" />
            </div>

            <div>
              <label style={lbl}>Notes cliniques</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                style={{ ...inp, resize: 'vertical' }}
                placeholder="Observations supplémentaires, examens à demander…" />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Statut</label>
                <select value={form.statut} onChange={set('statut')} style={inp}>
                  <option value="en_cours">En cours</option>
                  <option value="terminee">Terminée</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Option ordonnance */}
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', marginBottom: '1.25rem', padding: '0.85rem 1rem', background: addOrdo ? 'var(--g3)' : 'var(--surface)', border: `1.5px solid ${addOrdo ? 'var(--g)' : 'var(--border)'}`, borderRadius: '10px' }}>
          <input type="checkbox" checked={addOrdo} onChange={e => setAddOrdo(e.target.checked)}
            style={{ width: 18, height: 18, accentColor: 'var(--g)' }} />
          <div>
            <p style={{ fontWeight: '600', color: 'var(--text)', fontSize: '0.95rem' }}>Créer une ordonnance après</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Vous serez redirigé vers le formulaire d'ordonnance</p>
          </div>
        </label>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : addOrdo ? 'Enregistrer et créer l\'ordonnance' : 'Enregistrer la consultation'}
          </Button>
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Annuler</Button>
        </div>
      </form>
    </div>
  );
}
