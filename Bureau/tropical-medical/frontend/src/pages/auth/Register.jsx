import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import LogoPlaceholder from '../../components/ui/LogoPlaceholder';
import Spinner from '../../components/ui/Spinner';

const ROLES = [
  { value: 'patient',        label: '🏥 Patient' },
  { value: 'medecin',        label: '👨‍⚕️ Médecin' },
  { value: 'receptionniste', label: '🖥️ Réceptionniste' },
  { value: 'pharmacien',     label: '💊 Pharmacien' },
];

const inp = {
  width: '100%',
  padding: '0.82rem 0.9rem 0.82rem 2.75rem',
  border: '1.5px solid var(--border)',
  borderRadius: '10px',
  fontSize: '0.93rem',
  background: 'var(--surface2)',
  outline: 'none',
  color: 'var(--text)',
  transition: 'border-color 0.2s',
};

function Field({ icon, label, children }) {
  return (
    <div>
      {label && (
        <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>
          {icon}
        </span>
        {children}
      </div>
    </div>
  );
}

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nom: '', prenom: '', telephone: '', email: '',
    mot_de_passe: '', role: 'patient',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));
  const onFocus = (e) => { e.target.style.borderColor = 'var(--g)'; };
  const onBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register', form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || "Erreur lors de l'inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowX: 'hidden',
    }}>
      {/* Vague verte */}
      <div style={{ width: '100%', position: 'relative', height: 160, background: 'var(--g)', flexShrink: 0 }}>
        <svg viewBox="0 0 1440 60" style={{ position: 'absolute', bottom: -1, width: '100%', height: 60, display: 'block' }} preserveAspectRatio="none">
          <path d="M0,60 C360,10 1080,10 1440,60 L1440,60 L0,60 Z" fill="#ffffff" />
        </svg>
      </div>

      {/* Contenu */}
      <div className="fade-in" style={{
        width: '100%', maxWidth: 460,
        padding: '0 1.5rem 2.5rem',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: -45,
      }}>
        <LogoPlaceholder size={90} />
        <h1 style={{ color: 'var(--g)', fontSize: '1.9rem', fontWeight: '900', marginTop: '0.85rem', letterSpacing: '-0.8px' }}>
          Tropical
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '1.75rem' }}>
          Créer votre compte
        </p>

        {error && (
          <div className="slide-up" style={{
            width: '100%', background: '#fde8e8', color: '#c0392b',
            padding: '0.75rem 1rem', borderRadius: '12px',
            marginBottom: '1rem', fontSize: '0.88rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600',
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

          {/* Nom & Prénom */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field icon="🪪" label="Nom *">
              <input required value={form.nom} onChange={set('nom')} onFocus={onFocus} onBlur={onBlur}
                placeholder="Diallo" style={inp} />
            </Field>
            <Field icon="✨" label="Prénom *">
              <input required value={form.prenom} onChange={set('prenom')} onFocus={onFocus} onBlur={onBlur}
                placeholder="Fatou" style={inp} />
            </Field>
          </div>

          {/* Téléphone */}
          <Field icon="📱" label="Téléphone *">
            <input required type="tel" value={form.telephone} onChange={set('telephone')} onFocus={onFocus} onBlur={onBlur}
              placeholder="77 123 45 67" style={inp} />
          </Field>

          {/* Email */}
          <Field icon="✉️" label="Email *">
            <input required type="email" value={form.email} onChange={set('email')} onFocus={onFocus} onBlur={onBlur}
              placeholder="fatou@example.sn" style={inp} autoComplete="email" />
          </Field>

          {/* Mot de passe */}
          <Field icon="🔒" label="Mot de passe *">
            <input required type="password" value={form.mot_de_passe} onChange={set('mot_de_passe')} onFocus={onFocus} onBlur={onBlur}
              placeholder="••••••••" style={inp} autoComplete="new-password" />
          </Field>

          {/* Rôle */}
          <div>
            <label style={{ fontSize: '0.78rem', fontWeight: '600', color: 'var(--muted)', display: 'block', marginBottom: '0.3rem' }}>
              Votre rôle *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              {ROLES.map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, role: r.value }))}
                  style={{
                    padding: '0.65rem 0.75rem',
                    border: `2px solid ${form.role === r.value ? 'var(--g)' : 'var(--border)'}`,
                    borderRadius: '10px',
                    background: form.role === r.value ? 'var(--g3)' : 'var(--surface)',
                    color: form.role === r.value ? 'var(--g2)' : 'var(--muted)',
                    fontWeight: form.role === r.value ? '700' : '500',
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    textAlign: 'left',
                  }}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Soumettre */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '0.95rem',
              background: 'var(--g)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.85 : 1,
              boxShadow: '0 4px 18px rgba(7,241,19,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              marginTop: '0.5rem',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            {loading ? <><Spinner size={18} color="#fff" /> Inscription…</> : "S'inscrire"}
          </button>
        </form>

        <p style={{ marginTop: '1.25rem', color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: 'var(--g)', fontWeight: '800' }}>
            Se connecter
          </Link>
        </p>

        <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}>🇸🇳</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.78rem', fontStyle: 'italic' }}>Teranga bi</p>
        </div>
      </div>
    </div>
  );
}
