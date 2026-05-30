export default function Spinner({ size = 28, color = 'var(--g)', style = {} }) {
  return (
    <div
      className="spin"
      style={{
        width: size,
        height: size,
        border: `3px solid ${color}30`,
        borderTop: `3px solid ${color}`,
        borderRadius: '50%',
        display: 'inline-block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
