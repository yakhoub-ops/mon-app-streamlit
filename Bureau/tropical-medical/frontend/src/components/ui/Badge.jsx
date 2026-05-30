const COLORS = {
  success:  { bg: 'var(--g3)',  color: 'var(--g2)' },
  warning:  { bg: '#fff8e1',    color: '#e67e22' },
  danger:   { bg: '#fde8e8',    color: '#c0392b' },
  error:    { bg: '#fde8e8',    color: '#c0392b' },
  info:     { bg: '#e3f2fd',    color: '#1565c0' },
  default:  { bg: 'var(--g4)', color: 'var(--muted)' },
  purple:   { bg: '#f3e5f5',    color: '#7b1fa2' },
  orange:   { bg: '#fff3e0',    color: '#e65100' },
};

export default function Badge({ children, type = 'default', style = {} }) {
  const c = COLORS[type] || COLORS.default;
  return (
    <span style={{
      ...c,
      padding: '0.22rem 0.7rem',
      borderRadius: '20px',
      fontSize: '0.76rem',
      fontWeight: '700',
      whiteSpace: 'nowrap',
      display: 'inline-flex',
      alignItems: 'center',
      ...style,
    }}>
      {children}
    </span>
  );
}
