import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';

const TYPE_ICON = {
  rdv:        '📅',
  urgence:    '🚨',
  ordonnance: '💊',
  stock:      '📦',
  facture:    '💰',
  systeme:    '🔔',
};

function elapsed(dt) {
  const mins = Math.floor((Date.now() - new Date(dt)) / 60000);
  if (mins < 1)  return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `Il y a ${hrs}h`;
  return new Date(dt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

export default function NotificationBell({ white = false }) {
  const navigate  = useNavigate();
  const { notifications, unread, markRead, markAllRead, remove } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleClick = async (n) => {
    if (!n.lu) await markRead(n.id_notification);
    setOpen(false);
    if (n.lien) navigate(n.lien);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Bouton cloche */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        style={{
          position: 'relative',
          background: white ? 'rgba(255,255,255,0.2)' : 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0.45rem',
          borderRadius: '10px',
          fontSize: '1.3rem',
          lineHeight: 1,
          color: white ? '#fff' : 'var(--text)',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = white ? 'rgba(255,255,255,0.3)' : 'var(--surface2)'}
        onMouseLeave={e => e.currentTarget.style.background = white ? 'rgba(255,255,255,0.2)' : 'none'}
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            background: '#e74c3c', color: '#fff',
            borderRadius: '20px',
            fontSize: '0.6rem', fontWeight: '800',
            minWidth: 16, height: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: white ? '1.5px solid var(--g)' : '1.5px solid #fff',
          }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="scale-in" style={{
          position: 'absolute',
          right: 0, top: 'calc(100% + 8px)',
          width: 340, maxWidth: '92vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 2000,
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.85rem 1rem',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: '700', color: 'var(--text)', fontSize: '0.92rem' }}>Notifications</span>
              {unread > 0 && (
                <span style={{
                  background: '#e74c3c', color: '#fff',
                  borderRadius: '20px', padding: '0.1rem 0.5rem',
                  fontSize: '0.7rem', fontWeight: '700',
                }}>
                  {unread}
                </span>
              )}
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: 'var(--g)',
                  fontSize: '0.78rem', fontWeight: '700',
                }}
              >
                Tout lire
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
                <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔕</p>
                Aucune notification
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id_notification}
                  onClick={() => handleClick(n)}
                  style={{
                    display: 'flex', gap: '0.6rem',
                    padding: '0.75rem 1rem',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: n.lu ? 'var(--surface)' : 'var(--g3)',
                    alignItems: 'flex-start',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = n.lu ? 'var(--surface)' : 'var(--g3)'}
                >
                  <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: '0.1rem' }}>
                    {TYPE_ICON[n.type] || '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: '0.84rem',
                      color: 'var(--text)',
                      fontWeight: n.lu ? '400' : '600',
                      lineHeight: 1.35,
                      marginBottom: '0.2rem',
                    }}>
                      {n.message}
                    </p>
                    <p style={{ fontSize: '0.71rem', color: 'var(--muted)' }}>{elapsed(n.created_at)}</p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                    {!n.lu && (
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--g)', display: 'block' }} />
                    )}
                    <button
                      onClick={e => { e.stopPropagation(); remove(n.id_notification); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '1rem', padding: '0.1rem' }}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', textAlign: 'center', background: 'var(--surface2)' }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                {notifications.length} notification{notifications.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
