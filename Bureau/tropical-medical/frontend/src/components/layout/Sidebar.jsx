import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoPlaceholder from '../ui/LogoPlaceholder';

const NAV = {
  medecin: [
    { label: 'Tableau de bord',    path: '/medecin/dashboard',        icon: '🏥' },
    { label: 'Mes rendez-vous',    path: '/medecin/rdv',              icon: '📅' },
    { label: '+ Consultation',     path: '/medecin/consultation/new', icon: '📋' },
    { label: '+ Ordonnance',       path: '/medecin/ordonnance/new',   icon: '💊' },
    { label: 'Téléconsultation',   path: '/medecin/teleconsultation', icon: '📹' },
  ],
  patient: [
    { label: 'Tableau de bord', path: '/patient/dashboard', icon: '🏠' },
    { label: 'Mes rendez-vous', path: '/patient/rdv',       icon: '📅' },
    { label: 'Mon dossier',     path: '/patient/dossier',   icon: '📋' },
    { label: 'Mes factures',    path: '/patient/factures',  icon: '💰' },
  ],
  receptionniste: [
    { label: 'Tableau de bord', path: '/receptionniste/dashboard',    icon: '🏠' },
    { label: "File d'attente",  path: '/receptionniste/file-attente', icon: '🧍' },
    { label: 'Urgences',        path: '/receptionniste/urgences',     icon: '🚨' },
    { label: 'Facturation',     path: '/receptionniste/facturation',  icon: '💰' },
  ],
  pharmacien: [
    { label: 'Tableau de bord', path: '/pharmacien/dashboard',   icon: '🏠' },
    { label: 'Stock',           path: '/pharmacien/stock',       icon: '📦' },
    { label: 'Ordonnances',     path: '/pharmacien/ordonnances', icon: '💊' },
  ],
  admin: [
    { label: 'Mutuelles / Assurances',  path: '/admin/assurances',   icon: '🏦' },
    { label: 'Interactions médic.',     path: '/admin/interactions', icon: '⚗️' },
  ],
};

const ROLE_LABEL = {
  medecin:        'Médecin',
  patient:        'Patient',
  receptionniste: 'Réceptionniste',
  pharmacien:     'Pharmacien',
  admin:          'Administrateur',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const items = NAV[user.role] || [];

  return (
    <aside className="desktop-only" style={{
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      width: 220,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 200,
      boxShadow: '2px 0 12px rgba(7,241,19,0.07)',
    }}>
      {/* Logo */}
      <div style={{
        padding: '1.25rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
      }}>
        <LogoPlaceholder size={52} />
        <div>
          <p style={{ fontWeight: '800', color: 'var(--g)', fontSize: '1.1rem', lineHeight: 1.1 }}>Tropical</p>
          <p style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '2px' }}>Plateforme médicale</p>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '0.75rem 0.5rem', overflowY: 'auto' }}>
        {items.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '10px',
              marginBottom: '0.2rem',
              color: isActive ? 'var(--g)' : 'var(--text)',
              fontWeight: isActive ? '700' : '500',
              fontSize: '0.88rem',
              background: isActive ? 'var(--g3)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s',
            })}
            onMouseEnter={e => {
              if (!e.currentTarget.style.background.includes('var(--g3)'))
                e.currentTarget.style.background = 'var(--surface2)';
            }}
            onMouseLeave={e => {
              if (!e.currentTarget.style.background.includes('var(--g3)'))
                e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontSize: '1rem', flexShrink: 0 }}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.6rem',
          padding: '0.6rem 0.75rem', background: 'var(--surface2)',
          borderRadius: '10px', marginBottom: '0.6rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'var(--g)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '800', fontSize: '0.8rem', flexShrink: 0,
          }}>
            {(user.prenom?.[0] || '') + (user.nom?.[0] || '')}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.82rem', fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.prenom} {user.nom}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{ROLE_LABEL[user.role]}</p>
          </div>
        </div>
        <NavLink
          to="/profil"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0.6rem', background: isActive ? 'var(--g3)' : 'none',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: isActive ? 'var(--g)' : 'var(--muted)', cursor: 'pointer',
            fontSize: '0.83rem', fontWeight: '600', textDecoration: 'none', marginBottom: '0.4rem',
          })}
        >
          👤 Mon profil
        </NavLink>
        <button
          onClick={() => { logout(); navigate('/login'); }}
          style={{
            width: '100%', padding: '0.55rem', background: 'none',
            border: '1px solid var(--border)', borderRadius: '8px',
            color: 'var(--muted)', cursor: 'pointer', fontSize: '0.83rem',
            fontWeight: '600', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          🚪 Déconnexion
        </button>
      </div>
    </aside>
  );
}
