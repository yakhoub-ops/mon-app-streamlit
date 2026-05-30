import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

/* Définition des onglets par rôle (4 onglets + bouton + au centre) */
const NAV_CONFIG = {
  medecin: {
    tabs: [
      { label: 'Accueil',   path: '/medecin/dashboard',        icon: '🏥' },
      { label: 'RDV',       path: '/medecin/rdv',              icon: '📅' },
      null, // placeholder bouton +
      { label: 'Patients',  path: '/medecin/dashboard',        icon: '👥' },
      { label: 'Profil',    path: null,                        icon: '👤' },
    ],
    plusPath: '/medecin/consultation/new',
    plusLabel: 'Consultation',
  },
  patient: {
    tabs: [
      { label: 'Accueil',   path: '/patient/dashboard', icon: '🏠' },
      { label: 'RDV',       path: '/patient/rdv',       icon: '📅' },
      null,
      { label: 'Dossier',   path: '/patient/dossier',   icon: '📋' },
      { label: 'Profil',    path: null,                  icon: '👤' },
    ],
    plusPath: '/patient/rdv',
    plusLabel: 'Nouveau RDV',
  },
  receptionniste: {
    tabs: [
      { label: 'Accueil',   path: '/receptionniste/dashboard',    icon: '🏠' },
      { label: 'File',      path: '/receptionniste/file-attente', icon: '🧍' },
      null,
      { label: 'Urgences',  path: '/receptionniste/urgences',     icon: '🚨' },
      { label: 'Profil',    path: null,                           icon: '👤' },
    ],
    plusPath: '/receptionniste/file-attente',
    plusLabel: "File d'attente",
  },
  pharmacien: {
    tabs: [
      { label: 'Accueil',   path: '/pharmacien/dashboard',   icon: '🏠' },
      { label: 'Stock',     path: '/pharmacien/stock',       icon: '📦' },
      null,
      { label: 'Ordonnances', path: '/pharmacien/ordonnances', icon: '💊' },
      { label: 'Profil',    path: null,                       icon: '👤' },
    ],
    plusPath: '/pharmacien/stock',
    plusLabel: 'Ajouter stock',
  },
  admin: {
    tabs: [
      { label: 'Mutuelles',    path: '/admin/assurances',   icon: '🏦' },
      { label: 'Interactions', path: '/admin/interactions', icon: '⚗️' },
      null,
      { label: 'Profil',       path: '/profil',             icon: '👤' },
    ],
    plusPath: '/admin/assurances',
    plusLabel: 'Nouvelle mutuelle',
  },
};

const ROLE_LABEL = {
  medecin:        'Médecin',
  patient:        'Patient',
  receptionniste: 'Réceptionniste',
  pharmacien:     'Pharmacien',
  admin:          'Administrateur',
};

/* ── Modal profil (bottom sheet) ── */
function ProfileSheet({ user, onClose, onLogout }) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 300,
        }}
      />
      {/* Sheet */}
      <div className="slide-up" style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderRadius: '20px 20px 0 0',
        padding: '1.5rem 1.5rem 2.5rem',
        zIndex: 301,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}>
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, background: 'var(--border)', borderRadius: 2, margin: '0 auto 1.5rem' }} />

        {/* User info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Avatar name={`${user.prenom} ${user.nom}`} size={56} />
          <div>
            <p style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text)' }}>
              {user.role === 'medecin' ? `Dr ${user.prenom} ${user.nom}` : `${user.prenom} ${user.nom}`}
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{user.email || ''}</p>
            <span style={{
              display: 'inline-block',
              background: 'var(--g3)', color: 'var(--g2)',
              padding: '0.15rem 0.65rem', borderRadius: '20px',
              fontSize: '0.73rem', fontWeight: '700', marginTop: '0.35rem',
            }}>
              {ROLE_LABEL[user.role]} · Dakar
            </span>
          </div>
        </div>

        {/* Senegal banner */}
        <div style={{
          background: 'var(--g3)', borderRadius: '10px',
          padding: '0.75rem 1rem', marginBottom: '1.25rem',
          display: 'flex', alignItems: 'center', gap: '0.75rem',
        }}>
          <span style={{ fontSize: '1.5rem' }}>🇸🇳</span>
          <div>
            <p style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.88rem' }}>Plateforme santé sénégalaise</p>
            <p style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Teranga bi</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          style={{
            width: '100%',
            padding: '0.85rem',
            background: '#fde8e8',
            color: '#c0392b',
            border: 'none',
            borderRadius: '12px',
            fontWeight: '700',
            fontSize: '0.95rem',
            cursor: 'pointer',
          }}
        >
          🚪 Se déconnecter
        </button>
      </div>
    </>
  );
}

export default function BottomNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);

  if (!user) return null;

  const config = NAV_CONFIG[user.role];
  if (!config) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      <nav className="mobile-only" style={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        height: 64,
        zIndex: 200,
        boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {config.tabs.map((item, idx) => {
          /* Bouton + central */
          if (item === null) {
            return (
              <div key="plus" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <button
                  onClick={() => navigate(config.plusPath)}
                  style={{
                    width: 56, height: 56,
                    borderRadius: '50%',
                    background: 'var(--g)',
                    border: '3px solid var(--surface)',
                    boxShadow: '0 4px 16px rgba(7,241,19,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    marginBottom: 12,
                    transition: 'transform 0.15s, box-shadow 0.15s',
                    color: '#fff',
                    fontSize: '1.6rem',
                    lineHeight: 1,
                    fontWeight: '300',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(7,241,19,0.6)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(7,241,19,0.5)';
                  }}
                  aria-label={config.plusLabel}
                >
                  +
                </button>
              </div>
            );
          }

          /* Onglet profil */
          if (item.path === null) {
            return (
              <button
                key="profil"
                onClick={() => setShowProfile(true)}
                style={{
                  flex: 1,
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: '3px',
                  background: 'none', border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem 0.25rem',
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                <span style={{ fontSize: '0.65rem', color: 'var(--muted)', fontWeight: '500' }}>{item.label}</span>
              </button>
            );
          }

          /* Onglet normal */
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={({ isActive }) => ({
                flex: 1,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: '3px',
                textDecoration: 'none',
                padding: '0.5rem 0.25rem',
                color: isActive ? 'var(--g)' : '#aaa',
                fontWeight: isActive ? '700' : '400',
              })}
            >
              {({ isActive }) => (
                <>
                  <span style={{
                    fontSize: '1.25rem',
                    filter: isActive ? 'none' : 'grayscale(1) opacity(0.5)',
                    transition: 'filter 0.15s',
                  }}>
                    {item.icon}
                  </span>
                  <span style={{
                    fontSize: '0.65rem',
                    color: isActive ? 'var(--g)' : '#aaa',
                    fontWeight: isActive ? '700' : '500',
                  }}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {showProfile && (
        <ProfileSheet
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={handleLogout}
        />
      )}
    </>
  );
}
