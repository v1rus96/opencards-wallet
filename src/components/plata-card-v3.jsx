import { useState, useEffect, useRef, useMemo } from "react";
import { Snowflake } from "lucide-react";

const ICE_TEXTURE = "data:image/jpeg;base64,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";

const DESIGNS = [
  { name: "Dynamic", type: "dynamic" },
  { name: "Snowy Mint", bg: "linear-gradient(135deg, #e0f2eb 0%, #a8d8c0 25%, #b8e6d0 50%, #d4ece2 75%, #c8e6cf 100%)" },
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

function generateAscii(cols, rows) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789{}[]();<>+=-*/&|^~!@#$%";
  let seed = cols * rows + 1337;
  const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  let out = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) out += chars[(rng() * chars.length) | 0];
    if (y < rows - 1) out += "\n";
  }
  return out;
}

function ScannerCanvas({ progress, width, height }) {
  const ref = useRef(null);
  const particles = useRef([]);
  const raf = useRef(null);
  const progRef = useRef(progress);
  useEffect(() => { progRef.current = progress; }, [progress]);

  useEffect(() => {
    if (!width || !height) return;
    if (particles.current.length === 0) {
      for (let i = 0; i < 250; i++) particles.current.push({
        x: Math.random() * width, y: Math.random() * height,
        vx: Math.random() * 1.2 + 0.3, vy: Math.random() * 0.4 - 0.2,
        r: Math.random() * 0.8 + 0.4, alpha: Math.random() * 0.4 + 0.6,
        decay: Math.random() * 0.018 + 0.005, life: 0, time: 0,
        twS: Math.random() * 0.06 + 0.02, twA: Math.random() * 0.15 + 0.1,
      });
    }
  }, [width, height]);

  useEffect(() => {
    const c = ref.current; if (!c || !width || !height) return;
    const ctx = c.getContext("2d"); c.width = width * 2; c.height = height * 2; ctx.scale(2, 2);
    function draw() {
      ctx.clearRect(0, 0, width, height);
      const sx = width * progRef.current;
      ctx.globalCompositeOperation = "lighter";
      const g = ctx.createLinearGradient(0, 0, 0, height);
      g.addColorStop(0, "rgba(255,255,255,0)"); g.addColorStop(0.08, "rgba(255,255,255,0.45)");
      g.addColorStop(0.92, "rgba(255,255,255,0.45)"); g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g; ctx.fillRect(sx - 4, 0, 8, height);
      ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.fillRect(sx - 1.5, 0, 3, height);
      const bl = ctx.createLinearGradient(sx - 30, 0, sx + 30, 0);
      bl.addColorStop(0, "rgba(196,181,253,0)"); bl.addColorStop(0.4, "rgba(196,181,253,0.08)");
      bl.addColorStop(0.5, "rgba(200,190,255,0.15)"); bl.addColorStop(0.6, "rgba(196,181,253,0.08)");
      bl.addColorStop(1, "rgba(196,181,253,0)"); ctx.fillStyle = bl; ctx.fillRect(sx - 30, 0, 60, height);
      for (const p of particles.current) {
        p.time++; p.life -= p.decay; p.alpha += Math.sin(p.time * p.twS) * p.twA;
        p.x += p.vx; p.y += p.vy;
        if (p.life <= 0 || p.x > width || p.x < 0) {
          p.x = sx + (Math.random() * 6 - 3); p.y = Math.random() * height;
          p.life = 1; p.alpha = Math.random() * 0.4 + 0.6;
          p.vx = Math.random() * 1.2 + 0.3; p.vy = Math.random() * 0.4 - 0.2; p.time = 0;
        }
        let fade = 1; const fz = 40;
        if (p.y < fz) fade = p.y / fz; else if (p.y > height - fz) fade = (height - p.y) / fz;
        const a = Math.max(0, Math.min(1, p.alpha * fade * p.life)); if (a < 0.01) continue;
        ctx.fillStyle = `rgba(196,181,253,${a.toFixed(3)})`; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over"; raf.current = requestAnimationFrame(draw);
    }
    draw(); return () => cancelAnimationFrame(raf.current);
  }, [width, height]);

  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", borderRadius: 12, pointerEvents: "none" }} />;
}

function AsciiLayer({ progress, flickerOpacity, width, height }) {
  const CW = 6.02, CH = 11.5;
  const cols = Math.max(1, Math.ceil(width / CW));
  const rows = Math.max(1, Math.ceil(height / CH));
  const ascii = useMemo(() => generateAscii(cols, rows), [cols, rows]);
  return (
    <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", clipPath: `inset(0 0 0 ${progress * 100}%)`, opacity: flickerOpacity, transition: "opacity 0.1s" }}>
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "rgba(8,6,14,0.88)", overflow: "hidden", display: "flex", alignItems: "stretch" }}>
        <pre style={{ fontFamily: "'Courier New', monospace", fontSize: 10, lineHeight: "11.5px", color: "rgba(196,181,253,0.65)", margin: 0, padding: 0, whiteSpace: "pre", overflow: "hidden", letterSpacing: 0.3, width: "100%", height: "100%" }}>{ascii}</pre>
        <div style={{ position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.18) 2px, rgba(0,0,0,0.18) 4px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.5) 100%)", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function CardScanAnimation({ children, progress: extProg, onComplete }) {
  const wr = useRef(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [flickerOp, setFlickerOp] = useState(0.85);
  const flickR = useRef(null);

  useEffect(() => {
    if (!wr.current) return;
    const ro = new ResizeObserver(([e]) => setDims({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(wr.current); return () => ro.disconnect();
  }, []);

  const isActive = extProg >= 0 && extProg < 100;
  useEffect(() => {
    if (!isActive) { clearInterval(flickR.current); setFlickerOp(0.85); return; }
    flickR.current = setInterval(() => setFlickerOp(v => v === 0.85 ? 1.0 : 0.85), 140);
    return () => clearInterval(flickR.current);
  }, [isActive]);

  useEffect(() => { if (extProg >= 100) onComplete?.(); }, [extProg]);

  const p = Math.min(Math.max(extProg / 100, 0), 1);
  const showFx = p < 1;

  return (
    <div ref={wr} style={{ position: "relative" }}>
      <div style={{ clipPath: showFx ? `inset(0 ${(1 - p) * 100}% 0 0)` : "none", borderRadius: 12 }}>{children}</div>
      {showFx && <AsciiLayer progress={p} flickerOpacity={flickerOp} width={dims.w} height={dims.h} />}
      {showFx && dims.w > 0 && <ScannerCanvas progress={p} width={dims.w} height={dims.h} />}
    </div>
  );
}

function DynamicMesh() {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current; if (!c) return; const ctx = c.getContext("2d"); let frame;
    const cols = ["#a78bfa", "#f472b6", "#38bdf8", "#34d399", "#fbbf24"];
    const blobs = cols.map((color, i) => ({ color, x: 0.15 + 0.7 * Math.random(), y: 0.15 + 0.7 * Math.random(), vx: (0.001 + Math.random() * 0.002) * (i % 2 ? 1 : -1), vy: (0.001 + Math.random() * 0.002) * (i % 2 ? -1 : 1), r: 0.3 + Math.random() * 0.2 }));
    function draw() {
      const w = (c.width = c.offsetWidth * 2), h = (c.height = c.offsetHeight * 2);
      ctx.fillStyle = "#1a1030"; ctx.fillRect(0, 0, w, h);
      blobs.forEach(b => { b.x += b.vx; b.y += b.vy; if (b.x < -0.1 || b.x > 1.1) b.vx *= -1; if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;
        const g = ctx.createRadialGradient(b.x * w, b.y * h, 0, b.x * w, b.y * h, b.r * Math.max(w, h));
        g.addColorStop(0, b.color + "bb"); g.addColorStop(0.5, b.color + "44"); g.addColorStop(1, b.color + "00");
        ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); });
      ctx.globalCompositeOperation = "source-over"; frame = requestAnimationFrame(draw);
    } draw(); return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
}

function fmtNum(n) { return n.replace(/(.{4})/g, "$1 ").trim(); }

function Card({ cardNumber, expiryDate, cvv, balance, showDetails, isRevealed, isFrozen, frozenLabel, frozenIcon, onVis, onTopUp, onCustomize, dIdx }) {
  const [ph, setPh] = useState(0); const fr = useRef(null);
  useEffect(() => { let s = null; function tick(ts) { if (!s) s = ts; setPh(((ts - s) / 10000) % 1); fr.current = requestAnimationFrame(tick); } fr.current = requestAnimationFrame(tick); return () => cancelAnimationFrame(fr.current); }, []);
  const d = DESIGNS[dIdx] || DESIGNS[1]; const isDyn = d.type === "dynamic";
  const dark = ["Midnight", "Aurora", "Sunset"].includes(d.name) || isDyn;
  const tc = dark ? "#f0f0f0" : "#1a1d21"; const ts = dark ? "0 1px 3px rgba(0,0,0,.6)" : "0 1px 2px rgba(255,255,255,.5)";
  const sc = dark ? "rgba(240,240,240,.55)" : "rgba(26,29,33,.6)"; const bb = dark ? "rgba(255,255,255,.15)" : "rgba(0,0,0,.05)";
  const f1 = "'Inter', system-ui, sans-serif"; const f2 = "'Source Code Pro', 'Courier New', monospace";
  const mcF = dark ? "drop-shadow(0 1px 2px rgba(0,0,0,.7)) drop-shadow(0 4px 6px rgba(0,0,0,.3))" : "drop-shadow(0 1px 1px rgba(255,255,255,.6)) drop-shadow(0 2px 4px rgba(0,0,0,.15))";
  return (
    <div style={{ aspectRatio: "360/227", position: "relative", borderRadius: 12, overflow: "hidden", background: "#2A292D", boxShadow: "0 2px 8px rgba(0,0,0,.18), 0 8px 24px rgba(0,0,0,.22), 0 16px 48px rgba(0,0,0,.16)", userSelect: "none" }}>
      <div style={{ position: "absolute", inset: 0, filter: isFrozen ? "saturate(0) brightness(.7)" : "none", transition: "filter .5s" }}>
        {isDyn ? <DynamicMesh /> : <div style={{ position: "absolute", inset: "-20%", width: "140%", height: "140%", background: d.bg, transform: "rotate(" + (ph * 15) + "deg)", transition: "transform .3s linear" }} />}
      </div>
      <div style={{ position: "absolute", inset: 0, borderRadius: 12, pointerEvents: "none", borderTop: "1px solid rgba(255,255,255,.45)", borderLeft: "1px solid rgba(255,255,255,.15)", borderRight: "1px solid rgba(255,255,255,.1)", borderBottom: "1px solid rgba(255,255,255,.05)" }} />
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(110deg, transparent 35%, rgba(255,255,255,.12) 48%, rgba(255,255,255,.18) 50%, rgba(255,255,255,.12) 52%, transparent 65%)", backgroundSize: "300% 100%", backgroundPosition: (ph * 300) + "% 0" }} />
      <div style={{ position: "absolute", inset: 0, padding: "20px 24px", display: "flex", flexDirection: "column", filter: isFrozen ? "blur(6px)" : "none", transition: "filter .5s" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontFamily: f1, fontSize: 12, fontWeight: 600, letterSpacing: 2.5, color: tc, textShadow: ts, opacity: .8 }}>VIRTUAL</span>
          <button onClick={onCustomize} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 4px", fontFamily: f1, fontSize: 16, fontWeight: 800, letterSpacing: 3, color: tc, textShadow: ts, lineHeight: 1 }}>PLATA</button>
        </div>
        <div style={{ flex: 1 }} />
        {balance != null && (
          <div style={{ marginBottom: showDetails && cardNumber ? 16 : 8, display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontFamily: f2, fontSize: 30, fontWeight: 700, color: tc, textShadow: ts, letterSpacing: -.5 }}>{"$" + balance.toFixed(2)}</span>
            {onTopUp && <button onClick={onTopUp} style={{ width: 30, height: 30, borderRadius: "50%", background: dark ? "rgba(255,255,255,.2)" : "#1A1D21", color: "#fff", border: "none", cursor: "pointer", display: "grid", placeItems: "center", padding: 0 }}><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><line x1="7" y1="1" x2="7" y2="13" stroke="#fff" strokeWidth="2" strokeLinecap="round" /><line x1="1" y1="7" x2="13" y2="7" stroke="#fff" strokeWidth="2" strokeLinecap="round" /></svg></button>}
          </div>
        )}
        {showDetails && cardNumber && (
          <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: f2, fontSize: 18, fontWeight: 600, letterSpacing: 2.5, color: tc, textShadow: ts, flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fmtNum(cardNumber)}</span>
            {onVis && (
              <button onClick={onVis} style={{ width: 34, height: 34, borderRadius: "50%", background: bb, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {isRevealed
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={tc} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity=".7"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            )}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          {showDetails ? (
            <div style={{ display: "flex", gap: 24 }}>
              {expiryDate && <div><div style={{ fontFamily: f1, fontSize: 8, fontWeight: 700, color: sc, letterSpacing: .5 }}>EXP CHK</div><div style={{ fontFamily: f2, fontSize: 14, fontWeight: 600, letterSpacing: 2, color: tc, textShadow: ts }}>{expiryDate}</div></div>}
              {cvv && <div><div style={{ fontFamily: f1, fontSize: 8, fontWeight: 700, color: sc, letterSpacing: .5 }}>CVV</div><div style={{ fontFamily: f2, fontSize: 14, fontWeight: 600, letterSpacing: 2, color: tc, textShadow: ts }}>{cvv}</div></div>}
            </div>
          ) : <div />}
          <svg width="48" height="48" viewBox="0 0 24 24" style={{ display: "block", opacity: .85, marginRight: -6, marginBottom: -8, filter: mcF }}><path d="M12 6.654a6.786 6.786 0 0 1 2.596 5.344A6.786 6.786 0 0 1 12 17.34a6.786 6.786 0 0 1-2.596-5.343A6.786 6.786 0 0 1 12 6.654zm-.87-.582A7.783 7.783 0 0 0 8.4 12a7.783 7.783 0 0 0 2.728 5.926 6.798 6.798 0 1 1 .003-11.854zm1.742 11.854A7.783 7.783 0 0 0 15.6 12a7.783 7.783 0 0 0-2.73-5.928 6.798 6.798 0 1 1 .003 11.854z" fill={tc} /></svg>
        </div>
      </div>
      {isFrozen && (
        <>
          <div style={{ position: "absolute", inset: 0, borderRadius: 12, overflow: "hidden", pointerEvents: "none" }}>
            <img src={ICE_TEXTURE} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.35, mixBlendMode: "screen" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
            <div style={{ background: "rgba(0,0,0,0.8)", borderRadius: 4, padding: "6px 12px", display: "flex", alignItems: "center", gap: 6 }}>
              {frozenIcon && <span style={{ display: "flex", alignItems: "center" }}>{frozenIcon}</span>}
              <span style={{ fontFamily: f1, color: "#fff", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{frozenLabel || "FROZEN"}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [det, setDet] = useState(true); const [rev, setRev] = useState(false);
  const [frz, setFrz] = useState(false); const [di, setDi] = useState(1);
  const [scanProg, setScanProg] = useState(100); const [autoScan, setAutoScan] = useState(false);
  const animR = useRef(null); const f = "'Inter', system-ui, sans-serif";

  const btn = (active) => ({ padding: "10px 18px", borderRadius: 8, border: active ? "1px solid rgba(255,255,255,.25)" : "1px solid rgba(255,255,255,.12)", background: active ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)", color: "#ccc", fontFamily: f, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all .2s" });
  const scanBtnS = { padding: "10px 18px", borderRadius: 8, border: autoScan ? "1px solid rgba(167,139,250,.5)" : "1px solid rgba(167,139,250,.3)", background: autoScan ? "rgba(167,139,250,.2)" : "rgba(167,139,250,.08)", color: "#c4b5fd", fontFamily: f, fontSize: 13, fontWeight: 600, cursor: autoScan ? "default" : "pointer", transition: "all .2s", letterSpacing: 0.5 };

  function handleAutoScan() {
    if (autoScan) return; setAutoScan(true); setScanProg(0);
    const start = performance.now(); const dur = 2800;
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setScanProg(e * 100);
      if (t < 1) animR.current = requestAnimationFrame(tick);
      else { setAutoScan(false); setTimeout(() => setScanProg(100), 800); }
    }
    animR.current = requestAnimationFrame(tick);
  }
  useEffect(() => () => cancelAnimationFrame(animR.current), []);

  return (
    <div style={{ minHeight: "100vh", background: "#0b0a10", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px", gap: 28 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; } body { background: #0b0a10; }
        .scan-sl { -webkit-appearance: none; appearance: none; width: 100%; height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); outline: none; }
        .scan-sl::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 18px; height: 18px; border-radius: 50%; background: #c4b5fd; cursor: pointer; border: 2px solid rgba(255,255,255,.2); box-shadow: 0 0 10px rgba(167,139,250,.4); }
        .scan-sl::-moz-range-thumb { width: 18px; height: 18px; border-radius: 50%; background: #c4b5fd; cursor: pointer; border: 2px solid rgba(255,255,255,.2); box-shadow: 0 0 10px rgba(167,139,250,.4); }
      `}</style>
      <div style={{ color: "rgba(255,255,255,.3)", fontFamily: f, fontSize: 11, fontWeight: 600, letterSpacing: 4, textTransform: "uppercase" }}>Digital Card &middot; {DESIGNS[di].name}</div>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <CardScanAnimation progress={scanProg}>
          <Card cardNumber={rev ? "4532015112830366" : "4532\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u20220366"} expiryDate="12/27" cvv={rev ? "847" : "\u2022\u2022\u2022"} balance={2847.50} showDetails={det} isRevealed={rev} isFrozen={frz} frozenLabel="FROZEN" frozenIcon={<Snowflake size={14} color="#fff" strokeWidth={2.5} />} onVis={() => setRev(v => !v)} onTopUp={() => alert("Top Up!")} onCustomize={() => setDi(i => (i + 1) % DESIGNS.length)} dIdx={di} />
        </CardScanAnimation>
      </div>
      <div style={{ width: "100%", maxWidth: 420, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontFamily: f, fontSize: 11, fontWeight: 600, color: "#c4b5fd", letterSpacing: 1, minWidth: 48 }}>SCAN</span>
        <input type="range" min="0" max="100" step="1" value={Math.round(scanProg)} onChange={e => { if (!autoScan) setScanProg(Number(e.target.value)); }} disabled={autoScan} className="scan-sl" style={{ flex: 1 }} />
        <span style={{ fontFamily: "'Source Code Pro', monospace", fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.4)", minWidth: 36, textAlign: "right" }}>{Math.round(scanProg)}%</span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={() => setDet(v => !v)} style={btn(det)}>{det ? "Hide Details" : "Show Details"}</button>
        <button onClick={() => setRev(v => !v)} style={btn(rev)}>{rev ? "Mask Card" : "Reveal Card"}</button>
        <button onClick={() => setFrz(v => !v)} style={btn(frz)}>{frz ? "Unfreeze" : "Freeze Card"}</button>
        <button onClick={handleAutoScan} style={scanBtnS}>{autoScan ? "\u25C9 Scanning\u2026" : "\u25B7 Scan Card"}</button>
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", maxWidth: 420 }}>
        {DESIGNS.map((d, i) => (
          <button key={i} onClick={() => setDi(i)} style={{ width: 44, height: 30, borderRadius: 8, padding: 0, border: i === di ? "2.5px solid rgba(255,255,255,.7)" : "2px solid rgba(255,255,255,.1)", cursor: "pointer", overflow: "hidden", position: "relative", background: d.type === "dynamic" ? "linear-gradient(135deg, #a78bfa, #f472b6, #38bdf8, #34d399)" : d.bg, transition: "all .25s", transform: i === di ? "scale(1.15)" : "scale(1)", boxShadow: i === di ? "0 0 12px rgba(255,255,255,.15)" : "none" }} title={d.name}>
            {d.type === "dynamic" && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff" }}>{"\u2726"}</div>}
          </button>
        ))}
      </div>
    </div>
  );
}