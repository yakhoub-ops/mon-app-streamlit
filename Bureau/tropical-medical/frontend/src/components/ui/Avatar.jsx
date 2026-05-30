const BG_COLORS = ['#07f113','#05c410','#0da810','#10b80e','#13c40c','#07d110','#09e012'];

export default function Avatar({ name = '', size = 40, style = {} }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % BG_COLORS.length;

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: BG_COLORS[colorIndex],
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: '800',
      fontSize: Math.round(size * 0.36),
      flexShrink: 0,
      userSelect: 'none',
      letterSpacing: '-0.5px',
      ...style,
    }}>
      {initials || '?'}
    </div>
  );
}
