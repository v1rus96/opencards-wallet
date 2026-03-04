'use client';

import { useState, useEffect, useRef, useMemo, type ReactNode } from 'react';

function generateAscii(cols: number, rows: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789{}[]();<>+=-*/&|^~!@#$%';
  let seed = cols * rows + 1337;
  const rng = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  let out = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) out += chars[(rng() * chars.length) | 0];
    if (y < rows - 1) out += '\n';
  }
  return out;
}

interface CanvasProps {
  progress: number;
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
  decay: number;
  life: number;
  time: number;
  twS: number;
  twA: number;
}

function ScannerCanvas({ progress, width, height }: CanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const raf = useRef<number>(0);
  const progRef = useRef(progress);
  useEffect(() => { progRef.current = progress; }, [progress]);

  useEffect(() => {
    if (!width || !height) return;
    if (particles.current.length === 0) {
      for (let i = 0; i < 250; i++) {
        particles.current.push({
          x: Math.random() * width, y: Math.random() * height,
          vx: Math.random() * 1.2 + 0.3, vy: Math.random() * 0.4 - 0.2,
          r: Math.random() * 0.8 + 0.4, alpha: Math.random() * 0.4 + 0.6,
          decay: Math.random() * 0.018 + 0.005, life: 0, time: 0,
          twS: Math.random() * 0.06 + 0.02, twA: Math.random() * 0.15 + 0.1,
        });
      }
    }
  }, [width, height]);

  useEffect(() => {
    const c = ref.current;
    if (!c || !width || !height) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    c.width = width * 2;
    c.height = height * 2;
    ctx.scale(2, 2);

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      const sx = width * progRef.current;
      ctx!.globalCompositeOperation = 'lighter';

      const g = ctx!.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, 'rgba(255,255,255,0)');
      g.addColorStop(0.08, 'rgba(255,255,255,0.45)');
      g.addColorStop(0.92, 'rgba(255,255,255,0.45)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx!.fillStyle = g;
      ctx!.fillRect(sx - 4, 0, 8, height);

      ctx!.fillStyle = 'rgba(255,255,255,0.92)';
      ctx!.fillRect(sx - 1.5, 0, 3, height);

      const bl = ctx!.createLinearGradient(sx - 30, 0, sx + 30, 0);
      bl.addColorStop(0, 'rgba(196,181,253,0)');
      bl.addColorStop(0.4, 'rgba(196,181,253,0.08)');
      bl.addColorStop(0.5, 'rgba(200,190,255,0.15)');
      bl.addColorStop(0.6, 'rgba(196,181,253,0.08)');
      bl.addColorStop(1, 'rgba(196,181,253,0)');
      ctx!.fillStyle = bl;
      ctx!.fillRect(sx - 30, 0, 60, height);

      for (const p of particles.current) {
        p.time++;
        p.life -= p.decay;
        p.alpha += Math.sin(p.time * p.twS) * p.twA;
        p.x += p.vx;
        p.y += p.vy;
        if (p.life <= 0 || p.x > width || p.x < 0) {
          p.x = sx + (Math.random() * 6 - 3);
          p.y = Math.random() * height;
          p.life = 1;
          p.alpha = Math.random() * 0.4 + 0.6;
          p.vx = Math.random() * 1.2 + 0.3;
          p.vy = Math.random() * 0.4 - 0.2;
          p.time = 0;
        }
        let fade = 1;
        const fz = 40;
        if (p.y < fz) fade = p.y / fz;
        else if (p.y > height - fz) fade = (height - p.y) / fz;
        const a = Math.max(0, Math.min(1, p.alpha * fade * p.life));
        if (a < 0.01) continue;
        ctx!.fillStyle = `rgba(196,181,253,${a.toFixed(3)})`;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = 'source-over';
      raf.current = requestAnimationFrame(draw);
    }
    draw();
    return () => cancelAnimationFrame(raf.current);
  }, [width, height]);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'absolute', inset: 0,
        width: '100%', height: '100%',
        borderRadius: 12, pointerEvents: 'none',
      }}
    />
  );
}

interface AsciiProps {
  progress: number;
  flickerOpacity: number;
  width: number;
  height: number;
}

function AsciiLayer({ progress, flickerOpacity, width, height }: AsciiProps) {
  const CW = 6.02, CH = 11.5;
  const cols = Math.max(1, Math.ceil(width / CW));
  const rows = Math.max(1, Math.ceil(height / CH));
  const ascii = useMemo(() => generateAscii(cols, rows), [cols, rows]);

  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 12, overflow: 'hidden',
      clipPath: `inset(0 0 0 ${progress * 100}%)`,
      opacity: flickerOpacity, transition: 'opacity 0.1s',
    }}>
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 12,
        background: 'rgba(8,6,14,0.88)', overflow: 'hidden',
        display: 'flex', alignItems: 'stretch',
      }}>
        <pre style={{
          fontFamily: "'Courier New', monospace", fontSize: 10,
          lineHeight: '11.5px', color: 'rgba(196,181,253,0.65)',
          margin: 0, padding: 0, whiteSpace: 'pre', overflow: 'hidden',
          letterSpacing: 0.3, width: '100%', height: '100%',
        }}>{ascii}</pre>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

interface CardScanAnimationProps {
  children: ReactNode;
  progress: number; // 0-100
  onComplete?: () => void;
}

export function CardScanAnimation({ children, progress: extProg, onComplete }: CardScanAnimationProps) {
  const wr = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [flickerOp, setFlickerOp] = useState(0.85);
  const flickR = useRef<ReturnType<typeof setInterval> | null>(null);

  // Smoothly animate toward target progress
  const [animProg, setAnimProg] = useState(extProg);
  const targetRef = useRef(extProg);
  const currentRef = useRef(extProg);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    targetRef.current = extProg;
    // Start animation loop if not already running
    cancelAnimationFrame(rafRef.current);
    let lastTime = performance.now();

    function animate(now: number) {
      const dt = (now - lastTime) / 1000; // seconds
      lastTime = now;
      const target = targetRef.current;
      const current = currentRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.3) {
        // Close enough — snap
        currentRef.current = target;
        setAnimProg(target);
        return; // stop loop
      }

      // Smooth lerp: ~1% per frame at 60fps ≈ 3-4s to cover large jumps
      const speed = Math.max(1, Math.abs(diff) * 0.025); // very slow, cinematic
      const step = Math.sign(diff) * Math.min(Math.abs(diff), speed * dt * 60);
      currentRef.current = current + step;
      setAnimProg(currentRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [extProg]);

  useEffect(() => {
    if (!wr.current) return;
    const ro = new ResizeObserver(([e]) => setDims({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(wr.current);
    return () => ro.disconnect();
  }, []);

  const isActive = animProg >= 0 && animProg < 100;
  useEffect(() => {
    if (!isActive) {
      if (flickR.current) clearInterval(flickR.current);
      setFlickerOp(0.85);
      return;
    }
    flickR.current = setInterval(() => setFlickerOp(v => v === 0.85 ? 1.0 : 0.85), 140);
    return () => { if (flickR.current) clearInterval(flickR.current); };
  }, [isActive]);

  useEffect(() => {
    if (animProg >= 100) onComplete?.();
  }, [animProg, onComplete]);

  const p = Math.min(Math.max(animProg / 100, 0), 1);
  const showFx = p < 1;

  return (
    <div ref={wr} style={{ position: 'relative' }}>
      <div style={{
        clipPath: showFx ? `inset(0 ${(1 - p) * 100}% 0 0)` : 'none',
        borderRadius: 12,
      }}>
        {children}
      </div>
      {showFx && (
        <AsciiLayer progress={p} flickerOpacity={flickerOp} width={dims.w} height={dims.h} />
      )}
      {showFx && dims.w > 0 && (
        <ScannerCanvas progress={p} width={dims.w} height={dims.h} />
      )}
    </div>
  );
}
