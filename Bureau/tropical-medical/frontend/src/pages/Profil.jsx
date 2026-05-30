import { useState } from 'react';
import { useAuth }   from '../context/AuthContext';
import { authService } from '../services/auth.service';
import Card   from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';

const inp = {
  padding: '0.7rem 0.95rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.92rem',
  width: '100%',
  outline: 'none',
  background: 'var(--surface2)',
  color: 'var(--text)',
  transition: 'border-color .2s',
};
const lbl = {
  fontSize: '0.78rem', fontWeight: '700', color: 'var(--muted)',
  display: 'block', marginBottom: '0.3rem',
};

const ROLE_LABELS = {
  medecin: 'Médecin',
  patient: 'Patient',
  receptionniste: 'Réceptionniste',
  pharmacien: 'Pharmacien',
  admin: 'Administrateur',
};

export default function Profil() {
  const { user, setUser } = useAuth();

  const [form, setForm] = useState({
    nom:       user?.nom       || '',
    prenom:    user?.prenom    || '',
    telephone: user?.telephone || '',
    email:     user?.email     || '',
    mot_de_passe_actuel:  '',
    nouveau_mot_de_passe: '',
    confirm_mdp:          '',
  });
  const [saving,  setSaving]  = useState(false);
  const [success, setSuccess] = useState('');
  const [error,   setError]   = useState('');

  const sf = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const focus = (e) => { e.target.style.borderColor = 'var(--g)'; };
  const blur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (form.nouveau_mot_de_passe && form.nouveau_mot_de_passe !== form.confirm_mdp) {
      setError('Les deux mots de passe ne correspondent pas');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        nom: form.nom, prenom: form.prenom,
        telephone: form.telephone, email: form.email,
      };
      if (form.nouveau_mot_de_passe) {
        payload.mot_de_passe_actuel  = form.mot_de_passe_actuel;
        payload.nouveau_mot_de_passe = form.nouveau_mot_de_passe;
      }
      await authService.updateProfile(payload);
      setSuccess('Profil mis à jour avec succès');
      setForm(f => ({ ...f, mot_de_passe_actuel: '', nouveau_mot_de_passe: '', confirm_mdp: '' }));
      if (setUser) setUser(u => ({ ...u, nom: form.nom, prenom: form.prenom }));
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: '560px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.4rem', color: 'var(--text)', marginBottom: '1.5rem' }}>Mon profil</h2>

      {/* Avatar + rôle */}
      <Card style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1.25rem' }}>
        <Avatar name={`${form.prenom} ${form.nom}`} size={56} />
        <div>
          <p style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--text)' }}>
            {form.prenom} {form.nom}
          </p>
          <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
            {ROLE_LABELS[user?.role] || user?.role}
          </p>
        </div>
      </Card>

      {success && (
        <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '600' }}>
          ✓ {success}
        </div>
      )}
      {error && (
        <div style={{ background: '#fde8e8', color: '#c0392b', padding: '0.75rem 1rem', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: '600' }}>
          ⚠ {error}
        </div>
      )}

      <form onSubmit={submit}>
        <Card style={{ padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '1rem', fontSize: '0.95rem' }}>
            Informations de contact
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div>
              <label style={lbl}>Prénom</label>
              <input value={form.prenom} onChange={sf('prenom')} required style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={lbl}>Nom</label>
              <input value={form.nom} onChange={sf('nom')} required style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={lbl}>Téléphone</label>
              <input value={form.telephone} onChange={sf('telephone')} style={inp} onFocus={focus} onBlur={blur} />
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={sf('email')} style={inp} onFocus={focus} onBlur={blur} />
            </div>
          </div>
        </Card>

        <Card style={{ padding: '1.25rem', marginBottom: '1.25rem' }}>
          <p style={{ fontWeight: '700', color: 'var(--text)', marginBottom: '0.4rem', fontSize: '0.95rem' }}>
            Changer le mot de passe
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '1rem' }}>
            Laissez vide si vous ne souhaitez pas changer de mot de passe.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={lbl}>Mot de passe actuel</label>
              <input type="password" value={form.mot_de_passe_actuel} onChange={sf('mot_de_passe_actuel')}
                style={inp} onFocus={focus} onBlur={blur} autoComplete="current-password" />
            </div>
            <div>
              <label style={lbl}>Nouveau mot de passe</label>
              <input type="password" value={form.nouveau_mot_de_passe} onChange={sf('nouveau_mot_de_passe')}
                style={inp} onFocus={focus} onBlur={blur} autoComplete="new-password" />
            </div>
            <div>
              <label style={lbl}>Confirmer le nouveau mot de passe</label>
              <input type="password" value={form.confirm_mdp} onChange={sf('confirm_mdp')}
                style={inp} onFocus={focus} onBlur={blur} autoComplete="new-password" />
            </div>
          </div>
        </Card>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button type="submit" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Sauvegarder les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}
