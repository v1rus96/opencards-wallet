'use client';

import { useState, useRef } from 'react';
import { CreditCard } from 'lucide-react';

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
}

const W = 280;
const H = 165;

const GRADIENTS = [
  'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)',
  'linear-gradient(145deg, #1c1230 0%, #2d1b4e 40%, #4a1f6e 100%)',
  'linear-gradient(145deg, #0c1a1f 0%, #0d2a2f 40%, #0a3d33 100%)',
  'linear-gradient(145deg, #2a1a1a 0%, #3e1616 40%, #601a0f 100%)',
];

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

export function CardTypeCarousel({ products, selected, onSelect }: Props) {
  const [current, setCurrent] = useState(() => {
    const idx = selected ? products.findIndex(p => p.id === selected.id) : 0;
    return idx >= 0 ? idx : 0;
  });
  const [dragPx, setDragPx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [settling, setSettling] = useState(false);
  const touch = useRef({ x: 0, y: 0, horizontal: null as boolean | null, swiped: false });

  let progress = current;
  if (dragging && touch.current.horizontal) {
    let d = -dragPx / W;
    const target = current + d;
    if (target < 0) d = -current * 0.3 + target * 0.3;
    else if (target > products.length - 1) d = (products.length - 1 - current) + (target - products.length + 1) * 0.3;
    progress = current + d;
  }

  const snapTo = (idx: number) => {
    setCurrent(idx);
    try {
      const wa = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { selectionChanged: () => void } } } }).Telegram?.WebApp;
      wa?.HapticFeedback?.selectionChanged();
    } catch { /* */ }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, horizontal: null, swiped: false };
    setDragging(true);
    setDragPx(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touch.current.x;
    const dy = e.touches[0].clientY - touch.current.y;
    if (touch.current.horizontal === null && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      touch.current.horizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (touch.current.horizontal) {
      setDragPx(dx);
      touch.current.swiped = true;
    }
  };

  const endDrag = () => {
    if (touch.current.horizontal) {
      const threshold = W / 4;
      if (dragPx < -threshold && current < products.length - 1) snapTo(current + 1);
      else if (dragPx > threshold && current > 0) snapTo(current - 1);
      setSettling(true);
      setTimeout(() => setSettling(false), 450);
    }
    setDragging(false);
    setDragPx(0);
    touch.current.horizontal = null;
  };

  const transition = dragging
    ? 'none'
    : settling
      ? 'transform 0.4s cubic-bezier(0.25,1,0.5,1), opacity 0.3s ease'
      : 'none';

  return (
    <div
      className="relative select-none"
      style={{ height: H + 44, touchAction: 'pan-y' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={endDrag}
      onTouchCancel={endDrag}
    >
      <div className="absolute inset-x-0 top-0 flex justify-center" style={{ height: H }}>
        {products.map((product, i) => {
          const off = i - progress;
          const scale = interp(off, [-2, -1, 0, 1, 2], [0.75, 0.85, 1.0, 1.15, 1.15]);
          const ty    = interp(off, [-2, -1, 0, 1, 2], [55,   30,   0,  -80,  -80]);
          const op    = interp(off, [-2, -1, 0, 1, 2], [1.0,  1.0,  1.0, 0,    0]);
          const rotX  = interp(off, [-2, -1, 0, 1, 2], [35,   20,   0,   0,    0]);
          const active = Math.abs(off) < 0.5;

          return (
            <div
              key={product.id}
              className="absolute"
              onClick={() => { if (active && !touch.current.swiped) onSelect(product); }}
              style={{
                width: W,
                height: H,
                perspective: 600,
                zIndex: Math.round(100 - Math.abs(off) * 10),
                opacity: Math.max(0, Math.min(1, op)),
                transform: `translateY(${ty}px) scale(${scale})`,
                transition,
                willChange: 'transform, opacity',
                cursor: active ? 'pointer' : 'default',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  transform: `rotateX(${rotX}deg)`,
                  transformOrigin: 'center bottom',
                  transition,
                }}
              >
                <div
                  className="relative h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] p-5"
                  style={{
                    background: GRADIENTS[i % GRADIENTS.length],
                    boxShadow: '0 4px 24px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
                  }}
                >
                  <div className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-white/[0.05] blur-2xl" />
                  <div className="pointer-events-none absolute -bottom-8 -left-8 h-20 w-20 rounded-full bg-white/[0.03] blur-2xl" />

                  <div className="relative z-10 flex h-full flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <CreditCard size={28} className="text-white/60" />
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.05] px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
                        {product.category}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{product.organization} {product.type}</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-xs text-zinc-400">
                          Fee: <span className="font-semibold text-zinc-300">${product.cardPrice}</span>
                        </span>
                        <span className="text-xs text-zinc-500">
                          ${product.depositMin} – ${Number(product.depositMax).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length > 1 && (
        <div className="absolute bottom-0 flex w-full items-center justify-center gap-2" style={{ height: 28, zIndex: 200 }}>
          {products.map((_, i) => {
            const active = Math.abs(i - Math.round(progress)) < 0.5;
            return (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: 7,
                  height: 7,
                  background: active ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.15)',
                  transform: `scale(${active ? 1 : 0.75})`,
                }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
