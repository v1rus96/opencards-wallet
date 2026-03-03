'use client';

import { useRef, useState, useEffect, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

const THRESHOLD = 64;
const MAX_PULL = 120;
const DAMPING = 0.4;

interface Props {
  onRefresh: () => Promise<void> | void;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const busy = useRef(false);
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    function apply(dist: number, animate: boolean) {
      const c = contentRef.current;
      const ind = indicatorRef.current;
      if (!c || !ind) return;
      const ease = 'cubic-bezier(0.25,1,0.5,1)';
      c.style.transition = animate ? `transform 0.3s ${ease}` : 'none';
      c.style.transform = `translate3d(0,${dist}px,0)`;
      ind.style.transition = animate ? `transform 0.3s ${ease}, opacity 0.25s ease` : 'none';
      ind.style.opacity = String(Math.min(dist / (THRESHOLD * 0.45), 1));
      /* centre the 32px indicator in the revealed gap */
      ind.style.transform = `translate3d(0,${Math.max(0, dist * 0.5 - 16)}px,0)`;
    }

    function onStart(e: TouchEvent) {
      if (busy.current) return;
      if (window.scrollY <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    }

    function onMove(e: TouchEvent) {
      if (!pulling.current || busy.current) return;
      const raw = e.touches[0].clientY - startY.current;
      if (raw > 0 && window.scrollY <= 0) {
        e.preventDefault();
        apply(Math.min(raw * DAMPING, MAX_PULL), false);
      } else {
        pulling.current = false;
        apply(0, true);
      }
    }

    async function onEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      const c = contentRef.current;
      const m = c ? new DOMMatrix(getComputedStyle(c).transform) : null;
      const dist = m?.m42 ?? 0;

      if (dist >= THRESHOLD) {
        busy.current = true;
        setSpinning(true);
        apply(48, true);
        try { await cbRef.current(); } catch { /* */ }
        busy.current = false;
        setSpinning(false);
        apply(0, true);
      } else {
        apply(0, true);
      }
    }

    wrap.addEventListener('touchstart', onStart, { passive: true });
    wrap.addEventListener('touchmove', onMove, { passive: false });
    wrap.addEventListener('touchend', onEnd);
    return () => {
      wrap.removeEventListener('touchstart', onStart);
      wrap.removeEventListener('touchmove', onMove);
      wrap.removeEventListener('touchend', onEnd);
    };
  }, []); // stable — all mutable state lives in refs

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      {/* Spinner — sits behind content, revealed when content slides down */}
      <div
        ref={indicatorRef}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: 32,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transform: 'translate3d(0,0,0)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        <div style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: 'rgba(20,184,166,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Loader2
            size={18}
            style={{ color: '#2dd4bf' }}
            className={spinning ? 'animate-spin' : ''}
          />
        </div>
      </div>

      {/* Content — slides down on pull, covers the spinner at rest */}
      <div
        ref={contentRef}
        style={{
          position: 'relative',
          zIndex: 6,
          background: '#09090b',
          transform: 'translate3d(0,0,0)',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
