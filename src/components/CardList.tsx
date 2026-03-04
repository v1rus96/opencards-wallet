'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Loader2, CreditCard, Snowflake } from 'lucide-react';
import { CardOrder, CardSensitive } from '@/types';
import { getCardSensitive } from '@/lib/api';

const TransactionHistory = dynamic(() => import('@/components/TransactionHistory').then(m => m.TransactionHistory), { ssr: false });

/* ── All designs ──────────────────────────────────────────────────── */
const DESIGNS = [
  { name: "Dynamic", type: "dynamic" as const },
  { name: "Snowy Mint", img: "/snowy-mint.jpg" },
  { name: "Holographic", type: "holographic" as const },
  { name: "Egg Sour", bg: "linear-gradient(135deg, #fef3c7 0%, #fde68a 25%, #fcd34d 50%, #fef9c3 100%)" },
  { name: "Columbia Blue", bg: "linear-gradient(135deg, #bfdbfe 0%, #93c5fd 25%, #a5b4fc 50%, #ddd6fe 75%, #c7d2fe 100%)" },
  { name: "My Pink", bg: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 25%, #f9a8d4 50%, #fda4af 75%, #fecdd3 100%)" },
  { name: "Buttercup", bg: "linear-gradient(135deg, #fef08a 0%, #fde047 25%, #facc15 50%, #fbbf24 75%, #fef9c3 100%)" },
  { name: "Cream Whisper", bg: "linear-gradient(135deg, #fefce8 0%, #fef3c7 30%, #fde68a 60%, #fffbeb 100%)" },
  { name: "Honeysuckle", bg: "linear-gradient(135deg, #fecaca 0%, #fca5a5 25%, #f9a8d4 50%, #fecdd3 75%, #fed7aa 100%)" },
  { name: "Tonys Pink", bg: "linear-gradient(135deg, #fbcfe8 0%, #f9a8d4 25%, #f472b6 50%, #fda4af 75%, #fecdd3 100%)" },
  { name: "Midnight", bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #3730a3 50%, #1e3a5f 75%, #0f172a 100%)" },
  { name: "Aurora", bg: "linear-gradient(135deg, #065f46 0%, #047857 20%, #0d9488 40%, #2dd4bf 60%, #a78bfa 80%, #7c3aed 100%)" },
  { name: "Sunset", bg: "linear-gradient(135deg, #f97316 0%, #ef4444 25%, #db2777 50%, #9333ea 75%, #7c3aed 100%)" },
];

/* ── Holographic gyroscope card — dot-grid with shifting gradient ── */
function HolographicBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tiltRef = useRef({ x: 0, y: 0 });
  const smoothTilt = useRef({ x: 0, y: 0 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    let hasGyro = false;

    /* Gyroscope handler (mobile) */
    const handleOrientation = (e: DeviceOrientationEvent) => {
      hasGyro = true;
      tiltRef.current = {
        x: Math.max(-1, Math.min(1, (e.gamma || 0) / 45)),
        y: Math.max(-1, Math.min(1, (e.beta || 0) / 45)),
      };
    };

    /* Mouse handler (desktop fallback) */
    const handleMouse = (e: MouseEvent) => {
      if (hasGyro) return;
      const rect = c.getBoundingClientRect();
      tiltRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
    };

    function draw() {
      const s = smoothTilt.current;
      s.x += (tiltRef.current.x - s.x) * 0.08;
      s.y += (tiltRef.current.y - s.y) * 0.08;

      const dpr = 2;
      const w = c!.offsetWidth * dpr;
      const h = c!.offsetHeight * dpr;
      c!.width = w;
      c!.height = h;
      ctx!.clearRect(0, 0, w, h);

      const tiltMag = Math.min(1, Math.sqrt(s.x * s.x + s.y * s.y));

      /* Holographic gradient — shifts position with tilt */
      const grad = ctx!.createLinearGradient(
        w * (0.15 + s.x * 0.1), h * (0.15 + s.y * 0.1),
        w * (0.85 - s.x * 0.1), h * (0.85 - s.y * 0.1)
      );
      grad.addColorStop(0, '#ECD9A8');     // Rich champagne
      grad.addColorStop(0.17, '#B89FCC');  // Medium lavender
      grad.addColorStop(0.33, '#E5C896'); // Warm gold
      grad.addColorStop(0.5, '#8FB3D5');   // Soft blue
      grad.addColorStop(0.67, '#E8CF9E'); // Golden beige
      grad.addColorStop(0.83, '#9B89C0'); // Periwinkle
      grad.addColorStop(1, '#EDD5A5');    // Champagne gold

      /* Draw dot grid — visibility increases with tilt */
      const cols = 25;
      const sz = w / cols;
      const rows = Math.ceil(h / sz) + 1;

      ctx!.globalAlpha = 0.15 + tiltMag * 0.55;
      ctx!.fillStyle = grad;
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          ctx!.beginPath();
          ctx!.arc(sz / 2 + i * sz, sz / 2 + j * sz, sz / 2, 0, Math.PI * 2);
          ctx!.fill();
        }
      }
      ctx!.globalAlpha = 1;

      /* Moving spotlight mask — carves a soft hole that follows tilt */
      const mx = w / 2 - s.x * (w / 3);
      const my = h / 2 + s.y * (h / 3);
      const mr = h / 2;
      ctx!.globalCompositeOperation = 'destination-out';
      const mg = ctx!.createRadialGradient(mx, my, 0, mx, my, mr);
      mg.addColorStop(0, 'rgba(0,0,0,0.8)');
      mg.addColorStop(0.5, 'rgba(0,0,0,0.25)');
      mg.addColorStop(1, 'rgba(0,0,0,0)');
      ctx!.fillStyle = mg;
      ctx!.fillRect(0, 0, w, h);

      /* Circular cutouts — notches at top & bottom center */
      ctx!.fillStyle = 'black';
      ctx!.beginPath();
      ctx!.arc(w / 2, 0, sz, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.beginPath();
      ctx!.arc(w / 2, h, sz, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalCompositeOperation = 'source-over';

      rafId.current = requestAnimationFrame(draw);
    }

    rafId.current = requestAnimationFrame(draw);

    /* Request gyroscope permission (iOS 13+) */
    const doe = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    if (typeof doe.requestPermission === 'function') {
      doe.requestPermission().then(state => {
        if (state === 'granted') window.addEventListener('deviceorientation', handleOrientation);
      }).catch(() => {});
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    window.addEventListener('mousemove', handleMouse);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('mousemove', handleMouse);
    };
  }, []);

  /* CSS mask for circular cutouts through the white base too */
  const cutoutMask = 'radial-gradient(circle at 50% 0, transparent 3.5%, black 4%), radial-gradient(circle at 50% 100%, transparent 3.5%, black 4%)';

  return (
    <div style={{
      position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden",
      WebkitMaskImage: cutoutMask,
      maskImage: cutoutMask,
      WebkitMaskComposite: 'source-in',
      maskComposite: 'intersect' as unknown as string,
    } as React.CSSProperties}>
      {/* White base card */}
      <div style={{ position: "absolute", inset: 0, background: "#FFFFFF" }} />
      {/* Holographic dot-grid overlay */}
      <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
      {/* Specular highlight */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 50% at ${50 + smoothTilt.current.x * 30}% ${50 + smoothTilt.current.y * 30}%, rgba(255,255,255,0.25) 0%, transparent 60%)`,
      }} />
    </div>
  );
}


/* ── Dynamic mesh canvas (exact copy from plata-card-v3) ─────────── */
function DynamicMesh() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); if (!ctx) return; let frame: number;
    const cols = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399", "#fbbf24"];
    const blobs = cols.map((color, i) => ({ color, x: 0.15 + 0.7 * Math.random(), y: 0.15 + 0.7 * Math.random(), vx: (0.001 + Math.random() * 0.002) * (i % 2 ? 1 : -1), vy: (0.001 + Math.random() * 0.002) * (i % 2 ? -1 : 1), r: 0.3 + Math.random() * 0.2 }));
    function draw() {
      const w = (c!.width = c!.offsetWidth * 2), h = (c!.height = c!.offsetHeight * 2);
      ctx!.fillStyle = "#1a1030"; ctx!.fillRect(0, 0, w, h);
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy; if (b.x < -0.1 || b.x > 1.1) b.vx *= -1; if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
        const g = ctx!.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
        g.addColorStop(0, b.color + "bb"); g.addColorStop(0.5, b.color + "44"); g.addColorStop(1, b.color + "00");
        ctx!.globalCompositeOperation = "lighter"; ctx!.fillStyle = g; ctx!.fillRect(0, 0, w, h);
      });
      ctx!.globalCompositeOperation = "source-over"; frame = requestAnimationFrame(draw);
    } draw(); return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

/* ── Format card PAN: "1234567890123456" → "1234 5678 9012 3456" ── */
function fmtNum(n: string) { return n.replace(/(.{4})/g, "$1 ").trim(); }

/* ── Staggered reveal / hide animation for card details ─────────── */
function HideableNumber({
  hiddenText,
  revealedText,
  revealed,
  gap = 0,
  style,
}: {
  hiddenText: string;
  revealedText: string | null;
  revealed: boolean;
  gap?: number;
  style?: React.CSSProperties;
}) {
  const rText = revealedText || hiddenText;
  const len = Math.max(hiddenText.length, rText.length);
  const isActive = revealed && revealedText != null;

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap, ...style }}>
      {Array.from({ length: len }).map((_, i) => {
        const hc = hiddenText[i] || '';
        const rc = rText[i] || '';

        if (hc === ' ' || rc === ' ') {
          return <span key={i} style={{ width: '0.6em' }} />;
        }

        /* Skip animation for characters that are identical (e.g. last 4 digits) */
        if (hc === rc) {
          return (
            <span key={i} style={{ display: 'inline-flex', width: '1ch', height: '1.4em', alignItems: 'center', justifyContent: 'center' }}>
              {hc}
            </span>
          );
        }

        const delay = i * 25;

        return (
          <span key={i} style={{
            display: 'inline-flex',
            width: '1ch',
            height: '1.4em',
            overflow: 'hidden',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isActive ? 'translateY(100%)' : 'translateY(0)',
              opacity: isActive ? 0 : 1,
              filter: isActive ? 'blur(4px)' : 'blur(0px)',
              transition: `transform 0.35s cubic-bezier(0.25,1,0.5,1) ${delay}ms, opacity 0.3s ease ${delay}ms, filter 0.3s ease ${delay}ms`,
            }}>
              {hc}
            </span>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: isActive ? 'translateY(0)' : 'translateY(-100%)',
              opacity: isActive ? 1 : 0,
              filter: isActive ? 'blur(0px)' : 'blur(4px)',
              transition: `transform 0.35s cubic-bezier(0.25,1,0.5,1) ${delay}ms, opacity 0.3s ease ${delay}ms, filter 0.3s ease ${delay}ms`,
            }}>
              {rc}
            </span>
          </span>
        );
      })}
    </span>
  );
}

/* ── Single card visual — exact plata-card-v3 Card component ─────── */
function CardVisual({
  card,
  onDeposit,
  onFreeze,
  isPeeking = false,
}: {
  card: CardOrder & { liveBalance: number };
  onDeposit?: () => void;
  onFreeze?: (freeze: boolean) => Promise<void>;
  isPeeking?: boolean;
}) {
  const isFrozen = card.status === 'frozen';
  const [freezing, setFreezing] = useState(false);

  const handleFreeze = useCallback(async () => {
    if (!onFreeze || freezing) return;
    setFreezing(true);
    try { await onFreeze(!isFrozen); } catch (err) { console.error('Freeze toggle failed:', err); }
    finally { setFreezing(false); }
  }, [onFreeze, freezing, isFrozen]);

  /* reveal / sensitive state */
  const [isRevealed, setIsRevealed] = useState(false);
  const [sensitive, setSensitive] = useState<CardSensitive | null>(null);
  const [revealing, setRevealing] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [designIdx, setDesignIdx] = useState(1); // Snowy Mint default

  /* phase animation (slow background rotation + shimmer) */
  const [ph, setPh] = useState(0);
  const fr = useRef<number>(0);
  useEffect(() => {
    let s: number | null = null;
    function tick(ts: number) { if (!s) s = ts; setPh(((ts - s) / 10000) % 1); fr.current = requestAnimationFrame(tick); }
    fr.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(fr.current);
  }, []);

  /* reveal handler */
  const handleVis = useCallback(async () => {
    if (isRevealed) { setIsRevealed(false); return; }
    setRevealing(true);
    try {
      const data = await getCardSensitive(card.id);
      setSensitive(data);
      setIsRevealed(true);
    } catch (err) { console.error('Failed to reveal card:', err); }
    finally { setRevealing(false); }
  }, [isRevealed, card.id]);

  /* design variables */
  const d = DESIGNS[designIdx] || DESIGNS[1];
  const isDyn = d.type === "dynamic";
  const isHolo = d.type === "holographic";
  const dark = ["Midnight", "Aurora", "Sunset"].includes(d.name) || isDyn;
  /* Engraved = text darker than background + white shadow below */
  const tc = dark ? "#ffffff" : "#1a1d21";
  const ts = dark
    ? "0px 1px 0px rgba(255,255,255,.3), 0px -1px 0px rgba(0,0,0,.7)"
    : "0px 1px 0px rgba(255,255,255,.8), 0px -1px 0px rgba(0,0,0,.15)";
  const sc = dark ? "rgba(255,255,255,.35)" : "rgba(0,0,0,.35)";
  const labelTs = dark
    ? "0px 1px 0px rgba(255,255,255,.3), 0px -1px 0px rgba(0,0,0,.7)"
    : "0px 1px 0px rgba(255,255,255,.8), 0px -1px 0px rgba(0,0,0,.15)";
  const f1 = "'Inter', system-ui, sans-serif";
  const f2 = "'Source Code Pro', 'Courier New', monospace";
  const mcF = dark
    ? "drop-shadow(0px 1px 0px rgba(255,255,255,.3)) drop-shadow(0px -1px 0px rgba(0,0,0,.7))"
    : "drop-shadow(0px 1px 0px rgba(255,255,255,.8)) drop-shadow(0px -1px 0px rgba(0,0,0,.15))";

  /* card data */
  const hiddenCardNumber = fmtNum(`\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${card.last4 || '\u2022\u2022\u2022\u2022'}`);
  const revealedCardNumber = sensitive ? fmtNum(sensitive.card_number) : null;
  const hiddenExpiry = '\u2022\u2022/\u2022\u2022';
  const revealedExpiry = sensitive
    ? sensitive.expiry.replace(/(\d{2})\/?(\d{2})(\d{2})/, '$1/$3')
    : null;
  const hiddenCvv = '\u2022\u2022\u2022';
  const revealedCvv = sensitive ? sensitive.cvv : null;
  const balance = card.liveBalance;

  return (
    <div style={{ aspectRatio: "360/227", position: "relative", borderRadius: 12, overflow: "hidden", background: "#2A292D", boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.22), 0 16px 48px rgba(0,0,0,.16)", userSelect: "none" }}>
      {/* Background */}
      <div style={{ position: "absolute", inset: 0, width: "100%", height: "100%", filter: isFrozen ? "brightness(.85) saturate(0.3)" : "none", transition: "filter .5s" }}>
        {isDyn
          ? <DynamicMesh />
          : isHolo
            ? <HolographicBg />
            : 'img' in d && d.img
              ? <img src={d.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              : <div style={{ position: "absolute", inset: "-20%", width: "140%", height: "140%", background: d.bg, transform: "rotate(" + (ph * 15) + "deg)", transition: "transform .3s linear" }} />}
      </div>
      {/* Frozen overlay — icy frost frame + badge */}
      {isFrozen && (
        <>
          <div style={{ position: "absolute", inset: 0, background: "rgba(180,210,240,0.35)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", pointerEvents: "none" }}>
            <img src="/cqu6Rn.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.7, mixBlendMode: "lighten" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 3 }}>
            <button
              onPointerUp={(e) => { e.stopPropagation(); if (onFreeze) handleFreeze(); }}
              style={{ background: "rgba(0,0,0,0.8)", borderRadius: 4, padding: "6px 12px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              {freezing
                ? <Loader2 size={14} color="#fff" className="animate-spin" />
                : <Snowflake size={14} color="#fff" strokeWidth={2.5} />}
              <span style={{ fontFamily: f1, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>
                {freezing ? "UNFREEZING..." : "UNFREEZE"}
              </span>
            </button>
          </div>
        </>
      )}
      {/* Frosted border */}
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none", borderTop: "1px solid rgba(255,255,255,.45)", borderLeft: "1px solid rgba(255,255,255,.15)", borderRight: "1px solid rgba(255,255,255,.1)", borderBottom: "1px solid rgba(255,255,255,.05)" }} />
      {/* Holographic shimmer */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,.12) 48%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.12) 52%, transparent 65%)", backgroundSize: "300% 100%", backgroundPosition: (ph * 300) + "% 0" }} />
      {/* Content */}
      <div style={{ position: "absolute", inset: 0, padding: "20px 24px", display: "flex", flexDirection: "column", filter: isFrozen ? "blur(6px)" : "none", transition: "filter .5s" }}>
        {/* Header: VIRTUAL / PLATA — hidden when peeking in stack */}
        {!isPeeking && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <button
              onPointerUp={(e) => { e.stopPropagation(); setDesignIdx(i => (i + 1) % DESIGNS.length); }}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 0, lineHeight: 1, display: "flex", alignItems: "center", gap: 6 }}
            >
              <svg width="20" height="18" viewBox="27 37 168 150" style={{ display: "block", opacity: .85, filter: mcF }}><path d="m34.14 171.15c24.48-24.55 48.69-48.87 72.96-73.14 2.35-2.35 4.17-4.82 1.31-7.66-3.02-2.99-5.48-0.53-7.64 1.64-17.64 17.69-35.25 35.41-52.88 53.11-2.35 2.36-4.62 4.83-7.17 6.95-1.43 1.19-3.94 2.89-4.94 2.37-1.5-0.78-2.74-3.21-3-5.08-4.05-29.74 2.44-55.62 27.75-74.45 10-7.45 19.94-14.97 29.99-22.36 9.4-6.91 19.83-9.74 31.54-8.09 3.49 0.5 7.28 0.18 10.74-0.59 18.13-4.07 36.29-4.54 54.52-1 1.9 0.37 3.58 1.9 5.36 2.89-0.97 1.66-1.66 3.6-2.97 4.92-23.48 23.63-47.04 47.19-70.58 70.76-1.65 1.65-3.26 3.33-4.9 4.99-2.1 2.14-3.13 4.54-0.78 7.01 2.49 2.61 4.78 1.24 6.86-0.85q19.56-19.63 39.12-39.26c7.29-7.32 14.5-14.71 21.85-21.97 4.02-3.97 6.81-3.21 7.63 2.47 4.23 29.37-1.17 55.38-26.52 74.26-10.28 7.66-20.36 15.6-30.67 23.22-9.82 7.25-20.73 10.29-32.97 7.99-2.35-0.44-5-0.31-7.33 0.27-18.54 4.64-37.18 5.36-55.93 1.66-2.08-0.42-3.95-1.89-5.91-2.87 1.08-1.96 2.14-3.93 3.26-5.87 0.24-0.42 0.69-0.72 1.3-1.32z" fill={tc} /></svg>
              <span style={{ fontFamily: f1, fontSize: 14, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: 0.5 }}>OpenCards</span>
            </button>
            <span style={{ fontFamily: f1, fontSize: 12, fontWeight: 600, letterSpacing: 2.5, color: tc, textShadow: labelTs, opacity: .8 }}>VIRTUAL</span>
          </div>
        )}
        <div style={{ flex: 1 }} />
        {/* Balance */}
        {balance != null && (
          <div style={{ marginBottom: showDetails ? 16 : 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: f2, fontSize: 30, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: -.5 }}>{"$" + balance.toFixed(2)}</span>
            {onDeposit && (
              <button
                onPointerUp={(e) => { e.stopPropagation(); onDeposit(); }}
                style={{ width: 30, height: 30, borderRadius: "50%", background: dark ? "rgba(255,255,255,.2)" : "#1A1D21", color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><line x1="1" y1="7" x2="13" y2="7" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
            )}
          </div>
        )}
        {/* Card number + eye toggle + freeze */}
        {showDetails && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span
              onPointerUp={(e) => {
                if (!isRevealed || !sensitive) return;
                e.stopPropagation();
                navigator.clipboard.writeText(sensitive.card_number).catch(() => {});
                try { (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (t: string) => void } } } }).Telegram?.WebApp?.HapticFeedback?.notificationOccurred('success'); } catch { /* */ }
              }}
              style={{ fontFamily: f2, fontSize: 18, fontWeight: 600, color: tc, textShadow: ts, flex: 1, whiteSpace: "nowrap", overflow: "hidden", cursor: isRevealed ? "pointer" : "default" }}
            >
              <HideableNumber hiddenText={hiddenCardNumber} revealedText={revealedCardNumber} revealed={isRevealed} gap={2.5} />
            </span>
            <button
              onPointerUp={(e) => { e.stopPropagation(); handleVis(); }}
              style={{ width: 34, height: 34, borderRadius: "50%", background: dark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
            >
              {revealing ? (
                <Loader2 size={16} color={tc} className="animate-spin" />
              ) : isRevealed
                ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
            </button>
            {onFreeze && (
              <button
                onPointerUp={(e) => { e.stopPropagation(); handleFreeze(); }}
                style={{ width: 34, height: 34, borderRadius: "50%", background: dark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.05)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background .2s ease" }}
              >
                {freezing
                  ? <Loader2 size={16} color={tc} className="animate-spin" />
                  : <Snowflake size={16} color={tc} opacity={0.7} />}
              </button>
            )}
          </div>
        )}
        {/* Footer: EXP CHK / CVV / Mastercard */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {showDetails ? (
            <div style={{ display: "flex", gap: 24 }}>
              <div><div style={{ fontFamily: f1, fontSize: 8, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: labelTs }}>EXP CHK</div><div style={{ fontFamily: f2, fontSize: 14, fontWeight: 600, color: tc, textShadow: ts }}><HideableNumber hiddenText={hiddenExpiry} revealedText={revealedExpiry} revealed={isRevealed} gap={2} /></div></div>
              <div><div style={{ fontFamily: f1, fontSize: 8, fontWeight: 700, color: sc, letterSpacing: .5, textShadow: labelTs }}>CVV</div><div style={{ fontFamily: f2, fontSize: 14, fontWeight: 600, color: tc, textShadow: ts }}><HideableNumber hiddenText={hiddenCvv} revealedText={revealedCvv} revealed={isRevealed} gap={2} /></div></div>
            </div>
          ) : <div />}
          <svg width="48" height="48" viewBox="0 0 24 24" style={{ display: "block", opacity: .85, marginRight: -6, marginBottom: -8, filter: mcF }}><path d="M12 6.654a6.786 6.786 0 0 1 2.596 5.344A6.786 6.786 0 0 1 12 17.34a6.786 6.786 0 0 1-2.596-5.343A6.786 6.786 0 0 1 12 6.654zm-.87-.582A7.783 7.783 0 0 0 8.4 12a7.783 7.783 0 0 0 2.728 5.926 6.798 6.798 0 1 1 .003-11.854zm1.742 11.854A7.783 7.783 0 0 0 15.6 12a7.783 7.783 0 0 0-2.73-5.928 6.798 6.798 0 1 1 .003 11.854z" fill={tc} /></svg>
        </div>
      </div>
    </div>
  );
}

/* ── Props ────────────────────────────────────────────────────────── */
interface Props {
  cards: (CardOrder & { liveBalance: number })[];
  loading: boolean;
  onDeposit?: (card: CardOrder & { liveBalance: number }) => void;
  onFreeze?: (card: CardOrder & { liveBalance: number }, freeze: boolean) => Promise<void>;
}

/* ── Card peek height (visible portion when stacked) ─────────────── */
const PEEK = 52;

/* ── CardList export — Apple Wallet stack ─────────────────────────── */
export function CardList({ cards, loading, onDeposit, onFreeze }: Props) {
  const [selected, setSelected] = useState<number | null>(null);
  /* Deferred flag — mounts TransactionHistory AFTER the card animation
     has had at least two frames to paint, so the heavy DOM work from
     mounting the transaction list doesn't block the compositor. */
  const [txReady, setTxReady] = useState(false);
  const txRaf = useRef<number>(0);

  // Track pointer down position to avoid treating scrolls as taps
  const pointerDownY = useRef<number | null>(null);

  /* Memoize the array so TransactionHistory doesn't get a new reference on every render */
  const selectedCardsArr = useMemo(() => {
    return selected !== null ? [cards[selected]] : [];
  }, [cards, selected]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1].map(i => (
          <div key={i} className="h-44 animate-pulse rounded-2xl bg-zinc-800/60" />
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="py-12 text-center">
        <CreditCard size={32} className="mx-auto text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-500">No cards yet</p>
      </div>
    );
  }

  /* Calculate the total stack height */
  const cardH = 227;  /* intrinsic card height based on aspect-ratio 360/227 */
  const isCollapsed = selected === null;

  /* Container height:
     - collapsed: card height + peek for each additional card
     - expanded:  card height + peek for each card below selected */
  const stackH = isCollapsed
    ? cardH + (cards.length - 1) * PEEK
    : cardH + (cards.length - 1 - selected) * PEEK;

  const handleTap = (idx: number) => {
    cancelAnimationFrame(txRaf.current);
    if (selected === idx) {
      setTxReady(false);
      setSelected(null);  /* tap selected card → collapse */
    } else {
      setSelected(idx);   /* tap any card → select it */
      /* Double-rAF: first rAF fires after the browser
         composites the card-transform frame, second rAF
         fires after that frame is actually painted.
         Only THEN do we mount TransactionHistory. */
      txRaf.current = requestAnimationFrame(() => {
        txRaf.current = requestAnimationFrame(() => {
          setTxReady(true);
        });
      });
    }
  };



  return (
    <div style={{ position: "relative" }}>
      {/* Container for card stack */}
      <div
        style={{
          position: "relative",
          width: "100%",
          zIndex: 2, /* card stack sits visually above transactions */
          /* Height matches cards + peek offset + padding below */
          paddingBottom: `calc(${(227 / 360) * 100}% + ${(isCollapsed ? (cards.length - 1) : 0) * PEEK}px + 24px)`,
          /* No transition on paddingBottom — it triggers layout reflow every
             frame, which blocks the GPU-composited card transforms on mobile.
             The card animations alone provide the visual continuity. */
        }}
      >
        {cards.map((card, idx) => {
          let y: number;
          let z: number;
          let opacity = 1;
          let scale = 1;

          if (isCollapsed) {
            /* Stack: each card peeks — first card at top (behind), last card in front */
            y = idx * PEEK;
            z = idx;  /* last card has highest z — sits in front */
          } else {
            if (idx < selected!) {
              /* Cards ABOVE selected — tuck behind the selected card + progressive shrink */
              const distBehind = selected! - idx;
              y = 0;
              z = idx;  /* lower z = hidden behind selected */
              opacity = 0;
              scale = 1 - distBehind * 0.05;  /* furthest behind shrinks most */
            } else if (idx === selected) {
              /* SELECTED card — moves to top position */
              y = 0;
              z = cards.length + 1;
            } else {
              /* Cards BELOW selected — slide down slightly and fade out, over the transactions */
              y = cardH + cards.length * PEEK + 120;
              z = idx;
              opacity = 0;
            }
          }

          /* Show peek info when card is stacked behind another (not the front card in collapsed, or not selected) */
          const isFrontCard = isCollapsed && idx === cards.length - 1;
          const isSelectedCard = !isCollapsed && idx === selected;
          const showPeekInfo = !isFrontCard && !isSelectedCard && opacity > 0;
          const maskedNum = `•••• •••• •••• ${card.last4 || '••••'}`;

          /* No per-card delay — use a single fixed transition string
             so mobile WebViews don't skip the animation when the
             transition shorthand itself changes between renders. */

          return (
            <div
              key={card.id}
              onPointerDown={(e) => { pointerDownY.current = e.clientY; }}
              onPointerUp={(e) => {
                // If user dragged more than 10px vertically, treat as scroll, not tap
                if (pointerDownY.current !== null && Math.abs(e.clientY - pointerDownY.current) < 10) {
                  handleTap(idx);
                }
                pointerDownY.current = null;
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                /* force hardware acceleration via translate3d/scale3d */
                transform: `translate3d(0, ${y}px, 0) scale3d(${scale}, ${scale}, 1)`,
                transformOrigin: "top center",
                zIndex: z,
                opacity,
                transition: "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease",
                willChange: "transform, opacity",
                cursor: "pointer",
              }}
            >
              <CardVisual
                card={card}
                onDeposit={onDeposit ? () => onDeposit(card) : undefined}
                onFreeze={onFreeze ? (freeze) => onFreeze(card, freeze) : undefined}
                isPeeking={showPeekInfo}
              />
              {/* Peek info overlay — visible on stacked non-front cards */}
              {showPeekInfo && (
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: PEEK,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0 20px",
                  pointerEvents: "none",
                  zIndex: 2,
                }}>
                  <span style={{
                    fontFamily: "'Source Code Pro', 'Courier New', monospace",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1a1d21",
                    textShadow: "0px 1px 0px rgba(255,255,255,.8), 0px -1px 0px rgba(0,0,0,.15)",
                  }}>${card.liveBalance?.toFixed(2) ?? '0.00'}</span>
                  <span style={{
                    fontFamily: "'Source Code Pro', 'Courier New', monospace",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "rgba(0,0,0,0.5)",
                    textShadow: "0px 1px 0px rgba(255,255,255,.6), 0px -1px 0px rgba(0,0,0,.1)",
                    letterSpacing: 1,
                  }}>{maskedNum}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Render selected card transactions below using CSS Grid for height transition */}
      <div
        style={{
          position: "relative",
          zIndex: 1, /* sit below the sliding cards */
          display: "grid",
          gridTemplateRows: selected !== null ? "1fr" : "0fr",
          transition: "grid-template-rows 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
        }}
        onClick={(e) => e.stopPropagation()} /* Prevent clicking transactions from collapsing stack */
      >
        <div style={{ overflow: "hidden" }}>
          <div style={{
            paddingTop: 24,
            opacity: selected !== null ? 1 : 0,
            transform: `translate3d(0, ${selected !== null ? '0px' : '20px'}, 0)`,
            pointerEvents: selected !== null ? 'auto' : 'none',
            transition: "opacity 0.4s ease 0.1s, transform 0.4s cubic-bezier(0.25, 1, 0.5, 1) 0.1s",
            willChange: "opacity, transform"
          }}>
            {selected !== null && txReady && (
              <TransactionHistory cards={selectedCardsArr} hideFilter />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
