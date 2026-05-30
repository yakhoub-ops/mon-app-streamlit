import { formatDateTime } from '../../utils/formatDate';

export default function NotifItem({ notif }) {
  return (
    <div style={{ padding: '0.75rem 1rem', borderLeft: `3px solid ${notif.lu ? 'var(--border)' : 'var(--g)'}`, background: notif.lu ? 'var(--surface)' : 'var(--g3)', borderRadius: '0 8px 8px 0', marginBottom: '0.5rem' }}>
      <p style={{ fontSize: '0.9rem', color: 'var(--text)', fontWeight: notif.lu ? '400' : '600' }}>{notif.message}</p>
      <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '0.25rem' }}>{formatDateTime(notif.created_at)}</p>
    </div>
  );
}
