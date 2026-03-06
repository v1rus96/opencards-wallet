'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { SlidingNumber } from '@/components/SlidingNumber';

interface Product {
  id: string;
  name: string;
  organization: string;
  type: string;
  category: string;
  cardPrice: string;
  depositMin: string;
  depositMax: string;
}

interface Props {
  products: Product[];
  selected: Product | null;
  onSelect: (product: Product) => void;
  collapsed?: boolean;
  amountValue?: number;
}

const W = 300;
const H = Math.round(W * (227 / 360));
const COLLAPSE_SCALE = 0.85;
const COLLAPSED_H = Math.round(H * COLLAPSE_SCALE) + 56;

/* ── Card designs — matching CardList.tsx ─────────────────────────── */
const DESIGNS = [
  { name: "Snowy Mint", img: "/snowy-mint.jpg", dark: false },
  { name: "Egg Sour", bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fcd34d 50%, #fef9c3 100%)", dark: false },
  { name: "Columbia Blue", bg: "linear-gradient(135deg, #bfdbfe 0%, #93c5fd 25%, #a5b4fc 50%, #ddd6fe 75%, #c7d2fe 100%)", dark: false },
  { name: "My Pink", bg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #fda4af 75%, #fecdd3 100%)", dark: false },
  { name: "Midnight", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #1e3a5f 75%, #0f172a 100%)", dark: true },
  { name: "Aurora", bg: "linear-gradient(135deg, #065f46 0%, #047857 20%, #0d9488 40%, #2dd4bf 60%, #a78bfa 80%, #7c3aed 100%)", dark: true },
  { name: "Sunset", bg: "linear-gradient(135deg, #f97316 0%, #ef4444 25%, #db2777 50%, #9333ea 75%, #7c3aed 100%)", dark: true },
];

const f1 = "'Inter', system-ui, sans-serif";
const f2 = "'Source Code Pro', 'Courier New', monospace";

function interp(t: number, inR: number[], outR: number[]): number {
  if (t <= inR[0]) return outR[0];
  if (t >= inR[inR.length - 1]) return outR[outR.length - 1];
  for (let i = 0; i < inR.length - 1; i++) {
    if (t <= inR[i + 1]) {
      const p = (t - inR[i]) / (inR[i + 1] - inR[i]);
      return outR[i] + p * (outR[i + 1] - outR[i]);
    }
  }
  return outR[outR.length - 1];
}

const CARD_TRANSITION = 'transform 0.45s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease';

/* ── Card face ────────────────────────────────────────────────────── */
function CardFace({ product, designIdx, amountValue }: { product: Product; designIdx: number; amountValue?: number }) {
  const d = DESIGNS[designIdx % DESIGNS.length];
  const dark = d.dark;
  const tc = dark ? "#ffffff" : "#1a1d21";
  const ts = dark
    ? "0px 1px 0px rgba(255,255,255,.3), 0px -1px 0px rgba(0,0,0,.7)"
    : "0px 1px 0px rgba(255,255,255,.8), 0px -1px 0px rgba(0,0,0,.15)";
  const sc = dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
  const labelTs = ts;
  const mcF = dark
    ? "drop-shadow(0px 1px 0px rgba(255,255,255,.3)) drop-shadow(0px -1px 0px rgba(0,0,0,.7))"
    : "drop-shadow(0px 1px 0px rgba(255,255,255,.8)) drop-shadow(0px -1px 0px rgba(0,0,0,.15))";

  const showAmount = amountValue != null;

  return (
    <div style={{
      position: "relative",
      width: "100%",
      height: "100%",
      borderRadius: 12,
      overflow: "hidden",
      background: "#2A292D",
      boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.22), 0 16px 48px rgba(0,0,0,.16)",
      userSelect: "none",
    }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
        {'img' in d && d.img
          ? <Image src={d.img} alt="" fill sizes="300px" style={{ objectFit: "cover" }} priority />
          : <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: d.bg }} />}
      </div>

      {/* Frosted border */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none",
        borderTop: "1px solid rgba(255,255,255,.45)",
        borderLeft: "1px solid rgba(255,255,255,.15)",
        borderRight: "1px solid rgba(255,255,255,.1)",
        borderBottom: "1px solid rgba(255,255,255,.05)",
      }} />

      {/* Shimmer */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", borderRadius: 12 }}>
        <div style={{
          position: "absolute", top: 0, left: "-200%", width: "400%", height: "100%",
          background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,.12) 48%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.12) 52%, transparent 65%)",
          animation: "cardShimmer 4s ease-in-out infinite",
        }} />
      </div>

      {/* Content */}
      <div style={{ position: "absolute", inset: 0, padding: "16px 18px", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <svg width="16" height="14" viewBox="27 37 168 150" style={{ display: "block", opacity: .85, filter: mcF }}>
              <path d="m34.14 171.15c24.48-24.55 48.69-48.87 72.96-73.14 2.35-2.35 4.17-4.82 1.31-7.66-3.02-2.99-5.48-0.53-7.64 1.64-17.64 17.69-35.25 35.41-52.88 53.11-2.35 2.36-4.62 4.83-7.17 6.95-1.43 1.19-3.94 2.89-4.94 2.37-1.5-0.78-2.74-3.21-3-5.08-4.05-29.74 2.44-55.62 27.75-74.45 10-7.45 19.94-14.97 29.99-22.36 9.4-6.91 19.83-9.74 31.54-8.09 3.49 0.5 7.28 0.18 10.74-0.59 18.13-4.07 36.29-4.54 54.52-1 1.9 0.37 3.58 1.9 5.36 2.89-0.97 1.66-1.66 3.6-2.97 4.92-23.48 23.63-47.04 47.19-70.58 70.76-1.65 1.65-3.26 3.33-4.9 4.99-2.1 2.14-3.13 4.54-0.78 7.01 2.49 2.61 4.78 1.24 6.86-0.85q19.56-19.63 39.12-39.26c7.29-7.32 14.5-14.71 21.85-21.97 4.02-3.97 6.81-3.21 7.63 2.47 4.23 29.37-1.17 55.38-26.52 74.26-10.28 7.66-20.36 15.6-30.67 23.22-9.82 7.25-20.73 10.29-32.97 7.99-2.35-0.44-5-0.31-7.33 0.27-18.54 4.64-37.18 5.36-55.93 1.66-2.08-0.42-3.95-1.89-5.91-2.87 1.08-1.96 2.14-3.93 3.26-5.87 0.24-0.42 0.69-0.72 1.3-1.32z" fill={tc} />
            </svg>
            <span style={{ fontFamily: f1, fontSize: 11, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: 0.5 }}>OpenCards</span>
          </div>
          <span style={{ fontFamily: f1, fontSize: 9, fontWeight: 600, letterSpacing: 2, color: tc, textShadow: labelTs, opacity: .8 }}>VIRTUAL</span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Dynamic content area — amount or product info */}
        {showAmount ? (
          <>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: f2, fontSize: 30, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: -.5, display: 'inline-flex', alignItems: 'baseline' }}>
                $<SlidingNumber value={amountValue} />
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <div style={{ fontFamily: f1, fontSize: 10, fontWeight: 600, color: sc, letterSpacing: .3 }}>
                  {product.organization} {product.type} · Fee ${product.cardPrice}
                </div>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" style={{ display: "block", opacity: .85, marginRight: -4, marginBottom: -6, filter: mcF }}>
                <path d="M12 6.654a6.786 6.786 0 0 1 2.596 5.344A6.786 6.786 0 0 1 12 17.34a6.786 6.786 0 0 1-2.596-5.343A6.786 6.786 0 0 1 12 6.654zm-.87-.582A7.783 7.783 0 0 0 8.4 12a7.783 7.783 0 0 0 2.728 5.926 6.798 6.798 0 1 1 .003-11.854zm1.742 11.854A7.783 7.783 0 0 0 15.6 12a7.783 7.783 0 0 0-2.73-5.928 6.798 6.798 0 1 1 .003 11.854z" fill={tc} />
              </svg>
            </div>
          </>
        ) : (
          <>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontFamily: f2, fontSize: 20, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: -.5 }}>
                ${product.cardPrice} <span style={{ fontFamily: f1, fontSize: 10, fontWeight: 600, color: sc, letterSpacing: .5 }}>card fee</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 16 }}>
                <div>
                  <div style={{ fontFamily: f1, fontSize: 7, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: labelTs }}>TYPE</div>
                  <div style={{ fontFamily: f2, fontSize: 11, fontWeight: 600, color: tc, textShadow: ts }}>{product.organization} {product.type}</div>
                </div>
                <div>
                  <div style={{ fontFamily: f1, fontSize: 7, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: labelTs }}>DEPOSIT</div>
                  <div style={{ fontFamily: f2, fontSize: 11, fontWeight: 600, color: tc, textShadow: ts }}>${product.depositMin}–${Number(product.depositMax).toLocaleString()}</div>
                </div>
              </div>
              <svg width="36" height="36" viewBox="0 0 24 24" style={{ display: "block", opacity: .85, marginRight: -4, marginBottom: -6, filter: mcF }}>
                <path d="M12 6.654a6.786 6.786 0 0 1 2.596 5.344A6.786 6.786 0 0 1 12 17.34a6.786 6.786 0 0 1-2.596-5.343A6.786 6.786 0 0 1 12 6.654zm-.87-.582A7.783 7.783 0 0 0 8.4 12a7.783 7.783 0 0 0 2.728 5.926 6.798 6.798 0 1 1 .003-11.854zm1.742 11.854A7.783 7.783 0 0 0 15.6 12a7.783 7.783 0 0 0-2.73-5.928 6.798 6.798 0 1 1 .003 11.854z" fill={tc} />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function CardTypeCarousel({ products, selected, onSelect, collapsed = false, amountValue }: Props) {
  const [current, setCurrent] = useState(() => {
    const idx = selected ? products.findIndex(p => p.id === selected.id) : 0;
    return idx >= 0 ? idx : 0;
  });
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const touch = useRef({ x: 0, y: 0, horizontal: null as boolean | null, swiped: false });

  const selectedIdx = selected ? products.findIndex(p => p.id === selected.id) : -1;

  /* Inject shimmer keyframes once */
  useEffect(() => {
    const id = 'card-carousel-shimmer';
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id;
    s.textContent = `@keyframes cardShimmer { 0%,100% { transform: translateX(0%); } 50% { transform: translateX(50%); } }`;
    document.head.appendChild(s);
  }, []);

  let progress = current;
  if (!collapsed && dragging && touch.current.horizontal) {
    let d = -dragPx / W;
    const target = current + d;
    if (target < 0) d = -current * 0.3 + target * 0.3;
    else if (target > products.length - 1) d = (products.length - 1 - current) + (target - products.length + 1) * 0.3;
    progress = current + d;
  }

  const snapTo = useCallback((idx: number) => {
    setCurrent(idx);
    try {
      const wa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { selectionChanged: () => void } } } }).Telegram?.WebApp;
      wa?.HapticFeedback?.selectionChanged();
    } catch { /* */ }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null, swiped: false };
    setDragging(true);
    setDragPx(0);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (touch.current.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touch.current.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (touch.current.horizontal) {
      setDragPx(dx);
      touch.current.swiped = true;
    }
  }, []);

  const endDrag = useCallback(() => {
    if (touch.current.horizontal) {
      const threshold = W / 4;
      if (dragPx < -threshold && current < products.length - 1) snapTo(current + 1);
      else if (dragPx > threshold && current > 0) snapTo(current - 1);
    }
    setDragging(false);
    setDragPx(0);
    touch.current.horizontal = null;
  }, [dragPx, current, products.length, snapTo]);

  /* Always use CSS transition when not dragging — handles both snap settle and collapse */
  const transition = dragging ? 'none' : CARD_TRANSITION;

  const containerH = collapsed ? COLLAPSED_H : H + 44;

  return (
    <div
      className="relative select-none"
      style={{
        height: containerH,
        transition: 'height 0.45s cubic-bezier(0.25,1,0.5,1)',
        touchAction: collapsed ? 'auto' : 'pan-y',
      }}
      onTouchStart={collapsed ? undefined : handleTouchStart}
      onTouchMove={collapsed ? undefined : handleTouchMove}
      onTouchEnd={collapsed ? undefined : endDrag}
      onTouchCancel={collapsed ? undefined : endDrag}
    >
      <div
        className="absolute inset-x-0 top-0 flex justify-center"
        style={{ height: collapsed ? COLLAPSED_H : H }}
      >
        {products.map((product, i) => {
          const off = i - progress;
          const absOff = Math.abs(off);

          if (!collapsed && absOff > 2.5) return null;

          let scale: number, ty: number, op: number, rotX: number;

          if (collapsed) {
            if (i === selectedIdx) {
              scale = COLLAPSE_SCALE;
              ty = 0;
              op = 1;
              rotX = 0;
            } else {
              scale = 0.7;
              ty = 0;
              op = 0;
              rotX = 0;
            }
          } else {
            scale = interp(off, [-2, -1, 0, 1, 2], [0.82, 0.9, 1.0, 1.08, 1.08]);
            ty = interp(off, [-2, -1, 0, 1, 2], [36, 18, 0, -45, -45]);
            op = interp(off, [-2, -1, 0, 1, 2], [1.0, 1.0, 1.0, 0, 0]);
            rotX = interp(off, [-2, -1, 0, 1, 2], [25, 14, 0, 0, 0]);
          }

          const active = !collapsed && absOff < 0.5;

          return (
            <div
              key={product.id}
              className="absolute"
              onClick={() => { if (active && !touch.current.swiped) onSelect(product); }}
              style={{
                width: W,
                height: H,
                zIndex: collapsed ? (i === selectedIdx ? 10 : 0) : Math.round(100 - absOff * 10),
                opacity: Math.max(0, Math.min(1, op)),
                transform: `translate3d(0,${ty}px,0) scale(${scale}) rotateX(${rotX}deg)`,
                transformOrigin: 'center bottom',
                transition,
                cursor: active ? 'pointer' : 'default',
                pointerEvents: collapsed && i !== selectedIdx ? 'none' : undefined,
              }}
            >
              <CardFace
                product={product}
                designIdx={i}
                amountValue={collapsed && i === selectedIdx ? amountValue : undefined}
              />
            </div>
          );
        })}
      </div>

      {/* Paginator dots — fade out when collapsed */}
      {products.length > 1 && (
        <div
          className="absolute bottom-0 flex w-full items-center justify-center gap-2"
          style={{
            height: 28,
            zIndex: 200,
            opacity: collapsed ? 0 : 1,
            transition: 'opacity 0.25s ease',
            pointerEvents: collapsed ? 'none' : undefined,
          }}
        >
          {products.map((_, i) => {
            const active = Math.abs(i - Math.round(progress)) < 0.5;
            return (
              <div
                key={i}
                className="rounded-full"
                style={{
                  width: 7,
                  height: 7,
                  background: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)',
                  transform: `scale(${active ? 1 : 0.75})`,
                  transition: 'background 0.2s, transform 0.2s',
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
