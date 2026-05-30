import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

const STYLES = {
  success: { background: 'var(--g)',  color: '#fff',     icon: '✓' },
  error:   { background: '#e74c3c',   color: '#fff',     icon: '✕' },
  warning: { background: '#f39c12',   color: '#fff',     icon: '⚠' },
  info:    { background: '#2980b9',   color: '#fff',     icon: 'ℹ' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const toast = {
    success: (m) => show(m, 'success'),
    error:   (m) => show(m, 'error'),
    warning: (m) => show(m, 'warning'),
    info:    (m) => show(m, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => {
          const s = STYLES[t.type] || STYLES.info;
          return (
            <div
              key={t.id}
              className="slide-up"
              style={{
                background: s.background,
                color: s.color,
                padding: '0.75rem 1.1rem',
                borderRadius: '12px',
                fontSize: '0.88rem',
                fontWeight: '600',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                pointerEvents: 'auto',
                minWidth: '220px',
                maxWidth: '320px',
              }}
            >
              <span style={{ fontSize: '1rem', flexShrink: 0 }}>{s.icon}</span>
              <span>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
};
