export default function Card({ children, style = {}, onClick, className = '' }) {
  const isClickable = typeof onClick === 'function';
  return (
    <div
      onClick={onClick}
      className={`${isClickable ? 'card-hover' : ''} ${className}`}
      style={{
        background: 'var(--surface)',
        borderRadius: '14px',
        border: '1px solid var(--border)',
        padding: '1.25rem',
        boxShadow: '0 2px 8px rgba(7,241,19,0.07)',
        cursor: isClickable ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
