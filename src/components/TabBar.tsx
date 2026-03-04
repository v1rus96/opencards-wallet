'use client';

import { Home, CreditCard, ClipboardList, Settings, ChevronLeft } from 'lucide-react';
import { useRef, useEffect, type ReactNode } from 'react';

const PRIMARY = '#ee4f39';

const TABS = [
  { id: 'overview' as const, icon: Home, label: 'Overview' },
  { id: 'cards' as const, icon: CreditCard, label: 'Cards' },
  { id: 'history' as const, icon: ClipboardList, label: 'Activity' },
  { id: 'settings' as const, icon: Settings, label: 'Settings' },
];

export type TabId = typeof TABS[number]['id'];

interface ActionButton {
  icon: ReactNode;
  onClick: () => void;
}

interface Props {
  active: TabId;
  onSelect: (tab: TabId) => void;
  bottomInset: number;
  actionButton?: ActionButton;
  morphedButton?: { label: string; onClick: () => void; disabled?: boolean; onBack?: () => void };
}

export function TabBar({ active, onSelect, bottomInset, actionButton, morphedButton }: Props) {
  const isMorphed = !!morphedButton;
  const hasBack = isMorphed && !!morphedButton?.onBack;
  const activeIdx = TABS.findIndex(t => t.id === active);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animated position for the gradient border
  const animPos = useRef(activeIdx);
  const prevIdx = useRef(activeIdx);
  const rafId = useRef(0);

  useEffect(() => {
    const fromIdx = prevIdx.current;
    const toIdx = activeIdx;
    prevIdx.current = toIdx;

    if (fromIdx === toIdx) {
      animPos.current = toIdx;
      drawBorder();
      return;
    }

    const duration = 300;
    const start = performance.now();

    function easeOutCubic(t: number) {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(t);

      animPos.current = fromIdx + (toIdx - fromIdx) * eased;
      drawBorder();

      if (t < 1) {
        rafId.current = requestAnimationFrame(tick);
      }
    }

    cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId.current);
  }, [activeIdx]);

  // Draw the gradient border on canvas (replicating _GradientBorderPainter)
  function drawBorder() {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const w = container.offsetWidth;
    const h = container.offsetHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const radius = 34;
    const itemWidth = w / TABS.length;
    const center = itemWidth * animPos.current + itemWidth / 2;

    // Primary color RGB
    const r = 238, g = 79, b = 57; // #ee4f39

    // 1) Colored gradient border (3px) — follows selection, bottom half only
    const leftEdge = center - itemWidth / 2;
    const rightEdge = center + itemWidth / 2;

    const colorGrad = ctx.createLinearGradient(0, 0, w, 0);
    const s0 = Math.max(0, leftEdge / w);
    const s1 = Math.max(0, (leftEdge + (rightEdge - leftEdge) * 0.45) / w);
    const s2 = Math.min(1, (leftEdge + (rightEdge - leftEdge) * 0.55) / w);
    const s3 = Math.min(1, rightEdge / w);

    colorGrad.addColorStop(0, `rgba(${r},${g},${b},0)`);
    if (s0 > 0.001) colorGrad.addColorStop(Math.max(0, s0 - 0.001), `rgba(${r},${g},${b},0)`);
    colorGrad.addColorStop(s1, `rgba(${r},${g},${b},1)`);
    colorGrad.addColorStop(s2, `rgba(${r},${g},${b},1)`);
    if (s3 < 0.999) colorGrad.addColorStop(Math.min(1, s3 + 0.001), `rgba(${r},${g},${b},0)`);
    colorGrad.addColorStop(1, `rgba(${r},${g},${b},0)`);

    // Clip to bottom half only (matching Flutter's canvas.clipRect)
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, h / 2, w, h / 2);
    ctx.clip();

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.strokeStyle = colorGrad;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();

    // 2) White border overlay (1.5px) — static, top-to-bottom gradient
    const whiteGrad = ctx.createLinearGradient(0, 0, 0, h);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,0.6)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0.2)');

    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, radius);
    ctx.strokeStyle = whiteGrad;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Redraw on mount and resize
  useEffect(() => {
    drawBorder();
    const ro = new ResizeObserver(() => drawBorder());
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: Math.max(8, bottomInset),
        paddingLeft: 16,
        paddingRight: 16,
        pointerEvents: 'none',
      }}
    >
      {/* Row: nav pill + optional action button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: ((!isMorphed && actionButton) || hasBack) ? 10 : 0,
          width: '100%',
          maxWidth: 480,
          justifyContent: 'center',
          transition: 'gap 300ms cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      >
      {/* Back button — appears when morphed with onBack */}
      <div
        style={{
          width: hasBack ? 68 : 0,
          height: 68,
          flexShrink: 0,
          overflow: 'visible',
          transition: 'width 300ms cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      >
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            padding: 1.5,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.2))',
            transform: hasBack ? 'scale(1)' : 'scale(0)',
            opacity: hasBack ? 1 : 0,
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
          }}
        >
          <button
            onClick={morphedButton?.onBack}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 32.5,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.04))',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* Glass container with canvas border */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          flex: 1,
          maxWidth: 480,
          minWidth: 0,
          borderRadius: 34,
          height: 68,
          overflow: 'hidden',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          background: isMorphed ? PRIMARY : 'linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.04))',
          pointerEvents: 'auto',
          transition: 'max-width 300ms cubic-bezier(0.33, 1, 0.68, 1), flex 300ms cubic-bezier(0.33, 1, 0.68, 1), background 300ms ease',
        }}
      >
        {/* Canvas for animated gradient borders */}
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />

        {/* Radial glow — bottom-centered half-circle */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            width: `${(250 / TABS.length)}%`,
            left: 0,
            height: 68,
            transform: `translateX(${((activeIdx * 100 - 75) * 100 / 250)}%)`,
            transition: 'transform 300ms cubic-bezier(0.33, 1, 0.68, 1), opacity 200ms ease',
            willChange: 'transform',
            pointerEvents: 'none',
            opacity: isMorphed ? 0 : 1,
            background: `radial-gradient(ellipse 50% 70% at 50% 140%, ${PRIMARY}80, transparent)`,
          }}
        />

        {/* Tab items */}
        <div
          style={{
            position: 'relative',
            display: 'flex',
            height: '100%',
            zIndex: 1,
          }}
        >
          {TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = idx === activeIdx;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  transform: isMorphed ? 'scale(0.5)' : isActive ? 'scale(1)' : 'scale(0.88)',
                  opacity: isMorphed ? 0 : isActive ? 1 : 0.5,
                  transition: 'transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
                  color: '#fff',
                  pointerEvents: isMorphed ? 'none' : undefined,
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <Icon size={26} strokeWidth={isActive ? 2.2 : 1.8} />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    letterSpacing: 0.2,
                    lineHeight: 1,
                  }}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Morphed action button — centered label overlay */}
        <button
          onClick={morphedButton?.onClick}
          disabled={morphedButton?.disabled}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 4,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            background: 'none',
            cursor: isMorphed && !morphedButton?.disabled ? 'pointer' : 'default',
            color: '#fff',
            opacity: isMorphed ? (morphedButton?.disabled ? 0.4 : 1) : 0,
            transform: isMorphed ? 'scale(1)' : 'scale(0.8)',
            transition: 'opacity 200ms ease 100ms, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1) 100ms',
            pointerEvents: isMorphed ? 'auto' : 'none',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: 0.3,
            WebkitTapHighlightColor: 'transparent',
          }}
        >
          {morphedButton?.label}
        </button>
      </div>

      {/* Action button wrapper — animates width for smooth layout shift */}
      <div
        style={{
          width: (!isMorphed && actionButton) ? 68 : 0,
          height: 68,
          flexShrink: 0,
          overflow: 'visible',
          transition: 'width 300ms cubic-bezier(0.33, 1, 0.68, 1)',
        }}
      >
        {/* Glassmorphic circle — gradient border via background trick */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 34,
            padding: 1.5,
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.6), rgba(255,255,255,0.2))',
            transform: (!isMorphed && actionButton) ? 'scale(1)' : 'scale(0)',
            opacity: (!isMorphed && actionButton) ? 1 : 0,
            transition: 'transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 200ms ease',
          }}
        >
          <button
            onClick={actionButton?.onClick}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 32.5,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              pointerEvents: 'auto',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.16), rgba(0,0,0,0.04))',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {actionButton?.icon}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
