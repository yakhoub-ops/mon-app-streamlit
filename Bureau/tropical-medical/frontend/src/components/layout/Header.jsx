import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../ui/NotificationBell';
import LogoPlaceholder from '../ui/LogoPlaceholder';
import Avatar from '../ui/Avatar';

const ROLE_LABEL = {
  medecin:        'Médecin · Dakar',
  patient:        'Patient · Dakar',
  receptionniste: 'Réceptionniste · Dakar',
  pharmacien:     'Pharmacien · Dakar',
};

/* ── Header mobile (fond vert) ── */
function MobileHeader({ user }) {
  return (
    <header className="mobile-only" style={{
      background: 'var(--g)',
      padding: '0.85rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.85rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 12px rgba(7,241,19,0.3)',
    }}>
      {/* Logo */}
      <LogoPlaceholder size={52} style={{ borderColor: '#fff', background: '#fff' }} />

      {/* Centre : salutation */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontWeight: '500' }}>
          Assalamu Alaikum 👋
        </p>
        <p style={{
          color: '#fff',
          fontWeight: '800',
          fontSize: '0.95rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {user.role === 'medecin' ? `Dr ${user.prenom} ${user.nom}` : `${user.prenom} ${user.nom}`}
        </p>
        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.72rem' }}>
          {ROLE_LABEL[user.role] || 'Dakar'}
        </p>
      </div>

      {/* Cloche notifications */}
      <div style={{ position: 'relative' }}>
        <NotificationBellWhite />
      </div>
    </header>
  );
}

/* Bell blanche pour le header vert */
function NotificationBellWhite() {
  return (
    <div style={{ position: 'relative' }}>
      <NotificationBell white />
    </div>
  );
}

/* ── Header desktop (barre fine en haut) ── */
function DesktopHeader({ user, logout }) {
  return (
    <header className="desktop-only" style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0.7rem 1.5rem',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: '1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 1px 6px rgba(7,241,19,0.07)',
    }}>
      <NotificationBell />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <Avatar name={`${user.prenom} ${user.nom}`} size={34} />
        <div>
          <p style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text)', lineHeight: 1.1 }}>
            {user.role === 'medecin' ? `Dr ${user.prenom} ${user.nom}` : `${user.prenom} ${user.nom}`}
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
            {ROLE_LABEL[user.role]}
          </p>
        </div>
      </div>
    </header>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <>
      <MobileHeader user={user} />
      <DesktopHeader user={user} logout={logout} />
    </>
  );
}
