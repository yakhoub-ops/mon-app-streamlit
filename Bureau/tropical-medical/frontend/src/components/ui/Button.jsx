export default function Button({
  children, variant = 'primary', size = 'md',
  disabled, onClick, type = 'button', style = {}, className = '',
}) {
  const base = {
    border: 'none',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    transition: 'opacity 0.2s, transform 0.15s, box-shadow 0.2s',
    lineHeight: 1.2,
  };
  const variants = {
    primary: {
      background: 'var(--g)',
      color: '#fff',
      boxShadow: '0 3px 12px rgba(7,241,19,0.3)',
    },
    outline: {
      background: 'transparent',
      color: 'var(--g)',
      border: '1.5px solid var(--g)',
      boxShadow: 'none',
    },
    ghost: {
      background: 'var(--g3)',
      color: 'var(--text)',
      boxShadow: 'none',
    },
    danger: {
      background: '#e74c3c',
      color: '#fff',
      boxShadow: '0 3px 12px rgba(231,76,60,0.25)',
    },
    secondary: {
      background: 'var(--surface2)',
      color: 'var(--muted)',
      border: '1px solid var(--border)',
      boxShadow: 'none',
    },
  };
  const sizes = {
    sm: { padding: '0.38rem 0.9rem',  fontSize: '0.83rem' },
    md: { padding: '0.68rem 1.4rem',  fontSize: '0.95rem' },
    lg: { padding: '0.9rem 1.8rem',   fontSize: '1.05rem' },
  };

  const handleEnter = (e) => {
    if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)';
  };
  const handleLeave = (e) => {
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className={className}
      style={{ ...base, ...variants[variant] || variants.primary, ...sizes[size] || sizes.md, ...style }}
    >
      {children}
    </button>
  );
}
