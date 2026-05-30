import Badge from '../ui/Badge';
import { formatDateTime } from '../../utils/formatDate';

const STATUS_TYPE = { confirme: 'success', en_attente: 'warning', annule: 'danger' };

export default function RdvItem({ rdv }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--surface)', borderRadius: '10px', border: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontWeight: '600', color: 'var(--text)' }}>{rdv.nom_patient || rdv.nom_medecin}</p>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{formatDateTime(rdv.date_rdv)}</p>
      </div>
      <Badge type={STATUS_TYPE[rdv.statut] || 'default'}>{rdv.statut}</Badge>
    </div>
  );
}
