'use client';

export function OrderCardPreview() {
  const tc = '#1a1d21';
  const ts = '0px 1px 0px rgba(255,255,255,.8), 0px -1px 0px rgba(0,0,0,.15)';
  const sc = 'rgba(0,0,0,.35)';
  const f1 = "'Inter', system-ui, sans-serif";
  const f2 = "'Source Code Pro', 'Courier New', monospace";
  const mcF = 'drop-shadow(0px 1px 0px rgba(255,255,255,.8)) drop-shadow(0px -1px 0px rgba(0,0,0,.15))';

  return (
    <div
      style={{
        aspectRatio: '360 / 227',
        position: 'relative',
        borderRadius: 12,
        overflow: 'hidden',
        background: '#2A292D',
        boxShadow: '0 2px 8px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.22)',
        userSelect: 'none',
      }}
    >
      {/* Background — Snowy Mint image */}
      <img
        src="/snowy-mint.jpg"
        alt=""
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />

      {/* Frosted border */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12, pointerEvents: 'none',
        borderTop: '1px solid rgba(255,255,255,.45)',
        borderLeft: '1px solid rgba(255,255,255,.15)',
        borderRight: '1px solid rgba(255,255,255,.1)',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }} />

      {/* Content */}
      <div style={{
        position: 'absolute', inset: 0, padding: '14px 18px',
        display: 'flex', flexDirection: 'column',
        fontFamily: f1,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="16" height="14" viewBox="27 37 168 150" style={{ display: 'block', opacity: .85, filter: mcF }}>
              <path d="m34.14 171.15c24.48-24.55 48.69-48.87 72.96-73.14 2.35-2.35 4.17-4.82 1.31-7.66-3.02-2.99-5.48-0.53-7.64 1.64-17.64 17.69-35.25 35.41-52.88 53.11-2.35 2.36-4.62 4.83-7.17 6.95-1.43 1.19-3.94 2.89-4.94 2.37-1.5-0.78-2.74-3.21-3-5.08-4.05-29.74 2.44-55.62 27.75-74.45 10-7.45 19.94-14.97 29.99-22.36 9.4-6.91 19.83-9.74 31.54-8.09 3.49 0.5 7.28 0.18 10.74-0.59 18.13-4.07 36.29-4.54 54.52-1 1.9 0.37 3.58 1.9 5.36 2.89-0.97 1.66-1.66 3.6-2.97 4.92-23.48 23.63-47.04 47.19-70.58 70.76-1.65 1.65-3.26 3.33-4.9 4.99-2.1 2.14-3.13 4.54-0.78 7.01 2.49 2.61 4.78 1.24 6.86-0.85q19.56-19.63 39.12-39.26c7.29-7.32 14.5-14.71 21.85-21.97 4.02-3.97 6.81-3.21 7.63 2.47 4.23 29.37-1.17 55.38-26.52 74.26-10.28 7.66-20.36 15.6-30.67 23.22-9.82 7.25-20.73 10.29-32.97 7.99-2.35-0.44-5-0.31-7.33 0.27-18.54 4.64-37.18 5.36-55.93 1.66-2.08-0.42-3.95-1.89-5.91-2.87 1.08-1.96 2.14-3.93 3.26-5.87 0.24-0.42 0.69-0.72 1.3-1.32z" fill={tc} />
            </svg>
            <span style={{ fontFamily: f1, fontSize: 11, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: 0.5 }}>OpenCards</span>
          </div>
          <span style={{ fontFamily: f1, fontSize: 9, fontWeight: 600, letterSpacing: 2.5, color: tc, textShadow: ts, opacity: .8 }}>VIRTUAL</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Card number */}
        <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          <span style={{ fontFamily: f2, fontSize: 13, fontWeight: 600, color: tc, textShadow: ts, flex: 1, whiteSpace: 'nowrap', letterSpacing: 2 }}>
            •••• •••• •••• ••••
          </span>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <div>
              <div style={{ fontFamily: f1, fontSize: 7, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: ts }}>EXP CHK</div>
              <div style={{ fontFamily: f2, fontSize: 11, fontWeight: 600, color: tc, textShadow: ts }}>••/••</div>
            </div>
            <div>
              <div style={{ fontFamily: f1, fontSize: 7, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: ts }}>CVV</div>
              <div style={{ fontFamily: f2, fontSize: 11, fontWeight: 600, color: tc, textShadow: ts }}>•••</div>
            </div>
          </div>
          {/* Mastercard logo */}
          <svg width="36" height="36" viewBox="0 0 24 24" style={{ display: 'block', opacity: .85, marginRight: -4, marginBottom: -6, filter: mcF }}>
            <path d="M12 6.654a6.786 6.786 0 0 1 2.596 5.344A6.786 6.786 0 0 1 12 17.34a6.786 6.786 0 0 1-2.596-5.343A6.786 6.786 0 0 1 12 6.654zm-.87-.582A7.783 7.783 0 0 0 8.4 12a7.783 7.783 0 0 0 2.728 5.926 6.798 6.798 0 1 1 .003-11.854zm1.742 11.854A7.783 7.783 0 0 0 15.6 12a7.783 7.783 0 0 0-2.73-5.928 6.798 6.798 0 1 1 .003 11.854z" fill={tc} />
          </svg>
        </div>
      </div>
    </div>
  );
}
