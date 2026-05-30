import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getDashboardByRole } from '../../utils/roleRedirect';
import LogoPlaceholder from '../../components/ui/LogoPlaceholder';
import Spinner from '../../components/ui/Spinner';

const inp = {
  width: '100%',
  padding: '0.9rem 1rem 0.9rem 3rem',
  border: '1.5px solid var(--border)',
  borderRadius: '12px',
  fontSize: '0.97rem',
  background: 'var(--surface2)',
  outline: 'none',
  color: 'var(--text)',
  transition: 'border-color 0.2s',
};

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  const handleFocus = (e) => { e.target.style.borderColor = 'var(--g)'; };
  const handleBlur  = (e) => { e.target.style.borderColor = 'var(--border)'; };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const role = await login(form.email, form.password);
      navigate(getDashboardByRole(role));
    } catch (err) {
      setError(err.response?.data?.error || 'Email ou mot de passe incorrect');
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
      {/* ── Vague verte en haut ── */}
      <div style={{ width: '100%', position: 'relative', height: 200, background: 'var(--g)', flexShrink: 0 }}>
        <svg
          viewBox="0 0 1440 72"
          style={{ position: 'absolute', bottom: -1, width: '100%', height: 72, display: 'block' }}
          preserveAspectRatio="none"
        >
          <path d="M0,72 C240,10 480,50 720,20 C960,-10 1200,50 1440,20 L1440,72 L0,72 Z" fill="#ffffff" />
        </svg>

        {/* Décorations */}
        <div style={{
          position: 'absolute', top: 20, right: 30,
          width: 80, height: 80,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
        }} />
        <div style={{
          position: 'absolute', top: 50, left: 40,
          width: 50, height: 50,
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
        }} />
      </div>

      {/* ── Contenu ── */}
      <div className="fade-in" style={{
        width: '100%',
        maxWidth: 420,
        padding: '0 1.5rem 2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: -70,
      }}>
        {/* Logo */}
        <LogoPlaceholder size={110} />

        {/* Titre */}
        <h1 style={{
          color: 'var(--g)',
          fontSize: '2.2rem',
          fontWeight: '900',
          marginTop: '1rem',
          letterSpacing: '-1px',
        }}>
          Tropical
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.88rem', marginBottom: '2rem' }}>
          Plateforme médicale sénégalaise
        </p>

        {/* Erreur */}
        {error && (
          <div className="slide-up" style={{
            width: '100%',
            background: '#fde8e8',
            color: '#c0392b',
            padding: '0.75rem 1rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: '600',
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>

          {/* Email */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>
              ✉️
            </span>
            <input
              type="email"
              placeholder="Votre email"
              required
              value={form.email}
              onChange={set('email')}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={inp}
              autoComplete="email"
            />
          </div>

          {/* Mot de passe */}
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', pointerEvents: 'none' }}>
              🔒
            </span>
            <input
              type={showPwd ? 'text' : 'password'}
              placeholder="Mot de passe"
              required
              value={form.password}
              onChange={set('password')}
              onFocus={handleFocus}
              onBlur={handleBlur}
              style={{ ...inp, paddingRight: '3rem' }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              style={{
                position: 'absolute', right: '1rem', top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '1rem', color: 'var(--muted)', lineHeight: 1,
              }}
              tabIndex={-1}
            >
              {showPwd ? '🙈' : '👁️'}
            </button>
          </div>

          {/* Bouton connexion */}
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
              transition: 'transform 0.15s, box-shadow 0.2s',
              marginTop: '0.25rem',
            }}
            onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(7,241,19,0.5)'; }}}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(7,241,19,0.4)'; }}
          >
            {loading ? <><Spinner size={18} color="#fff" /> Connexion en cours…</> : 'Se connecter'}
          </button>
        </form>

        {/* Lien inscription */}
        <p style={{ marginTop: '1.25rem', color: 'var(--muted)', fontSize: '0.9rem', textAlign: 'center' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: 'var(--g)', fontWeight: '800' }}>
            Créer un compte
          </Link>
        </p>

        {/* Footer sénégalais */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <p style={{ fontSize: '1.8rem', marginBottom: '0.3rem' }}>🇸🇳</p>
          <p style={{ color: 'var(--muted)', fontSize: '0.8rem', fontStyle: 'italic', fontWeight: '500' }}>
            Teranga bi
          </p>
        </div>
      </div>
    </div>
  );
}
