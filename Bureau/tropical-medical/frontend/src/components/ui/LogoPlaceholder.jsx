import { useRef, useState, useEffect } from 'react';

export default function LogoPlaceholder({ size = 80, style = {} }) {
  const inputRef = useRef();
  const [logo, setLogo] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('tropical_logo');
    if (saved) setLogo(saved);
  }, []);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem('tropical_logo', reader.result);
      setLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const iconSize = Math.max(14, size * 0.28);

  return (
    <div
      onClick={() => inputRef.current.click()}
      title="Cliquer pour changer le logo"
      style={{
        width: size, height: size,
        border: '2px dashed var(--g)',
        borderRadius: size >= 80 ? '16px' : '10px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
        overflow: 'hidden',
        background: '#fff',
        flexShrink: 0,
        transition: 'opacity 0.2s',
        ...style,
      }}
      onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
    >
      {logo ? (
        <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        <>
          <span style={{ fontSize: iconSize }}>📷</span>
          {size >= 52 && (
            <span style={{
              fontSize: Math.max(9, size * 0.11),
              color: 'var(--muted)',
              marginTop: '3px',
              textAlign: 'center',
              lineHeight: 1.2,
              padding: '0 4px',
            }}>
              {size >= 80 ? 'Votre logo ici' : 'Logo ici'}
            </span>
          )}
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        style={{ display: 'none' }}
      />
    </div>
  );
}
