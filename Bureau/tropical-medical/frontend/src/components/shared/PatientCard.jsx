import Avatar from '../ui/Avatar';

export default function PatientCard({ patient, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.85rem 1rem', background: 'var(--surface)',
      borderRadius: '10px', border: '1px solid var(--border)', cursor: 'pointer',
      minWidth: 0,
    }}>
      <Avatar name={`${patient.prenom} ${patient.nom}`} />
      <div style={{ minWidth: 0, flex: 1 }}>
        <p style={{ fontWeight: '600', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {patient.prenom} {patient.nom}
        </p>
        <p style={{ fontSize: '0.82rem', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {patient.telephone}{patient.email ? ` · ${patient.email}` : ''}
        </p>
      </div>
    </div>
  );
}
