'use client';
import { useRef, useEffect, useState, useCallback } from 'react';

// US city positions in a 600×340 SVG/Canvas space
const CITIES = {
  CHICAGO:      { x: 387, y: 112, label: 'CHI' },
  LOSANGELES:   { x: 70,  y: 221, label: 'LA'  },
  DALLAS:       { x: 292, y: 238, label: 'DAL' },
  BOSTON:       { x: 558, y: 106, label: 'BOS' },
  DETROIT:      { x: 434, y: 106, label: 'DET' },
  PHOENIX:      { x: 134, y: 229, label: 'PHX' },
  SEATTLE:      { x: 28,  y: 33,  label: 'SEA' },
  MIAMI:        { x: 463, y: 336, label: 'MIA' },
  DENVER:       { x: 207, y: 142, label: 'DEN' },
  MINNEAPOLIS:  { x: 329, y: 70,  label: 'MIN' },
  ATLANTA:      { x: 420, y: 225, label: 'ATL' },
  HOUSTON:      { x: 307, y: 280, label: 'HOU' },
  PORTLAND:     { x: 24,  y: 62,  label: 'PDX' },
  NEWYORK:      { x: 528, y: 129, label: 'NYC' },
  SANFRANCISCO: { x: 30,  y: 169, label: 'SF'  },
  LASVEGAS:     { x: 102, y: 192, label: 'LV'  },
};

// Major interstate corridors
const HIGHWAYS = [
  ['SEATTLE','PORTLAND'],['PORTLAND','SANFRANCISCO'],['SANFRANCISCO','LOSANGELES'],
  ['LOSANGELES','LASVEGAS'],['LASVEGAS','PHOENIX'],['LOSANGELES','PHOENIX'],
  ['PHOENIX','DALLAS'],['DALLAS','HOUSTON'],['HOUSTON','MIAMI'],['MIAMI','ATLANTA'],
  ['ATLANTA','NEWYORK'],['NEWYORK','BOSTON'],['ATLANTA','DETROIT'],['DETROIT','BOSTON'],
  ['CHICAGO','DETROIT'],['CHICAGO','MINNEAPOLIS'],['CHICAGO','DENVER'],
  ['MINNEAPOLIS','CHICAGO'],['DENVER','DALLAS'],['SANFRANCISCO','DENVER'],
  ['CHICAGO','NEWYORK'],['DALLAS','CHICAGO'],['HOUSTON','ATLANTA'],
];

// Vehicle routes + metadata
const VEHICLE_ROUTES = [
  { id:'TRK-0001', driver:'Marcus Johnson',    cargo:'Electronics',     from:'CHICAGO',      to:'DETROIT',       status:'Moving',  speed:0.0009 },
  { id:'TRK-0002', driver:'Tyler Williams',    cargo:'Auto Parts',      from:'LOSANGELES',   to:'MIAMI',         status:'Moving',  speed:0.0004 },
  { id:'TRK-0003', driver:'Elena Rodriguez',   cargo:'Pharma·Cold',     from:'DALLAS',       to:'BOSTON',        status:'Moving',  speed:0.0006 },
  { id:'TRK-0004', driver:'Jason Chen',        cargo:'Foodstuff',       from:'PHOENIX',      to:'CHICAGO',       status:'Stopped', speed:0      },
  { id:'TRK-0005', driver:'Patricia Thompson', cargo:'Hazmat',          from:'HOUSTON',      to:'DALLAS',        status:'Alert',   speed:0      },
  { id:'TRK-0006', driver:'David Garcia',      cargo:'General Freight', from:'SEATTLE',      to:'SANFRANCISCO',  status:'Moving',  speed:0.0008 },
  { id:'TRK-0007', driver:'Rachel Martinez',   cargo:'Reefer·Produce',  from:'SANFRANCISCO', to:'LOSANGELES',    status:'Moving',  speed:0.0007 },
  { id:'TRK-0008', driver:'Kevin Anderson',    cargo:'Electronics',     from:'DENVER',       to:'CHICAGO',       status:'Stopped', speed:0      },
  { id:'TRK-0009', driver:'Sandra Taylor',     cargo:'Auto Parts',      from:'MIAMI',        to:'ATLANTA',       status:'Moving',  speed:0.0007 },
  { id:'TRK-0010', driver:'James Wilson',      cargo:'General Freight', from:'MINNEAPOLIS',  to:'CHICAGO',       status:'Moving',  speed:0.0005 },
];

const STATUS_COLOR = { Moving:'#14b8a6', Stopped:'#f59e0b', Alert:'#ef4444' };
const STATUS_GLOW  = { Moving:'rgba(20,184,166,0.4)', Stopped:'rgba(245,158,11,0.4)', Alert:'rgba(239,68,68,0.5)' };

function lerp(a, b, t) { return a + (b - a) * t; }

export default function LiveFleetMap({ height = 300 }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const stateRef  = useRef(
    VEHICLE_ROUTES.map((v, i) => ({
      ...v,
      progress: 0.1 + (i * 0.09) % 0.85, // stagger starting positions
    }))
  );
  const [tooltip, setTooltip] = useState(null);
  const [isDark,  setIsDark]  = useState(true);

  // Detect theme
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    check();
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => obs.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    const scaleX = W / 600;
    const scaleY = H / 340;

    // Background
    ctx.fillStyle = isDark ? '#07040f' : '#ede8fa';
    ctx.fillRect(0, 0, W, H);

    // Grid
    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(100,80,160,0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x < 600; x += 60) {
      ctx.beginPath(); ctx.moveTo(x * scaleX, 0); ctx.lineTo(x * scaleX, H); ctx.stroke();
    }
    for (let y = 0; y < 340; y += 60) {
      ctx.beginPath(); ctx.moveTo(0, y * scaleY); ctx.lineTo(W, y * scaleY); ctx.stroke();
    }

    // Draw highways
    HIGHWAYS.forEach(([a, b]) => {
      const ca = CITIES[a]; const cb = CITIES[b];
      if (!ca || !cb) return;
      ctx.beginPath();
      ctx.moveTo(ca.x * scaleX, ca.y * scaleY);
      ctx.lineTo(cb.x * scaleX, cb.y * scaleY);
      ctx.strokeStyle = isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.14)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Animate vehicle positions
    stateRef.current.forEach(v => {
      if (v.status === 'Moving') {
        v.progress = (v.progress + v.speed) % 1;
      }
    });

    // Draw route highlight lines for moving vehicles
    stateRef.current.forEach(v => {
      if (v.status !== 'Moving') return;
      const from = CITIES[v.from]; const to = CITIES[v.to];
      if (!from || !to) return;
      const grad = ctx.createLinearGradient(from.x * scaleX, from.y * scaleY, to.x * scaleX, to.y * scaleY);
      grad.addColorStop(0, 'rgba(20,184,166,0)');
      grad.addColorStop(v.progress, 'rgba(20,184,166,0.5)');
      grad.addColorStop(1, 'rgba(20,184,166,0)');
      ctx.beginPath();
      ctx.moveTo(from.x * scaleX, from.y * scaleY);
      ctx.lineTo(to.x * scaleX, to.y * scaleY);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw city dots
    Object.entries(CITIES).forEach(([, c]) => {
      ctx.beginPath();
      ctx.arc(c.x * scaleX, c.y * scaleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = isDark ? 'rgba(168,85,247,0.5)' : 'rgba(124,58,237,0.4)';
      ctx.fill();

      // City label
      ctx.font = `bold ${9 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(15,8,38,0.35)';
      ctx.fillText(c.label, c.x * scaleX + 5, c.y * scaleY - 4);
    });

    // Draw vehicle blips
    stateRef.current.forEach(v => {
      const from = CITIES[v.from]; const to = CITIES[v.to];
      if (!from || !to) return;
      const x = lerp(from.x, to.x, v.progress) * scaleX;
      const y = lerp(from.y, to.y, v.progress) * scaleY;
      const col = STATUS_COLOR[v.status];
      const glow = STATUS_GLOW[v.status];

      // Pulse ring
      const pulse = (Date.now() % 2000) / 2000;
      ctx.beginPath();
      ctx.arc(x, y, (6 + pulse * 10) * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = glow.replace('0.4)', `${0.35 * (1 - pulse)}`).replace('0.5)', `${0.45 * (1 - pulse)}`);
      ctx.fill();

      // Outer ring
      ctx.beginPath();
      ctx.arc(x, y, 6 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = col + '33';
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Inner dot
      ctx.beginPath();
      ctx.arc(x, y, 3.5 * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();

      // Truck icon (text)
      ctx.font = `${8 * Math.min(scaleX, scaleY)}px monospace`;
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(15,8,38,0.7)';
      ctx.fillText(v.id.replace('TRK-', ''), x + 8 * scaleX, y - 6 * scaleY);
    });

    // Label
    ctx.font = `bold ${9 * Math.min(scaleX, scaleY)}px Inter, sans-serif`;
    ctx.fillStyle = isDark ? 'rgba(20,184,166,0.5)' : 'rgba(20,184,166,0.7)';
    ctx.fillText('● LIVE FLEET POSITIONS', 8 * scaleX, 16 * scaleY);
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setSize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width  = rect.width  * window.devicePixelRatio;
      canvas.height = height * window.devicePixelRatio;
      canvas.style.height = height + 'px';
    };

    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(canvas.parentElement);

    let last = 0;
    const loop = (ts) => {
      if (ts - last > 50) { draw(); last = ts; } // 20fps
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      ro.disconnect();
    };
  }, [draw, height]);

  // Mouse hover for tooltip
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) / rect.width * 600;
    const my = (e.clientY - rect.top)  / rect.height * 340;

    let found = null;
    stateRef.current.forEach(v => {
      const from = CITIES[v.from]; const to = CITIES[v.to];
      if (!from || !to) return;
      const vx = lerp(from.x, to.x, v.progress);
      const vy = lerp(from.y, to.y, v.progress);
      if (Math.hypot(vx - mx, vy - my) < 12) found = { ...v, px: e.clientX - rect.left, py: e.clientY - rect.top };
    });
    setTooltip(found);
  }, []);

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  const moving  = stateRef.current.filter(v => v.status === 'Moving').length;
  const stopped = stateRef.current.filter(v => v.status === 'Stopped').length;
  const alerts  = stateRef.current.filter(v => v.status === 'Alert').length;

  return (
    <div>
      <div className="live-map-wrap" onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
        <canvas ref={canvasRef} />
        {tooltip && (
          <div className="map-tooltip" style={{ left: tooltip.px + 12, top: Math.max(4, tooltip.py - 60) }}>
            <div style={{ fontWeight: 700, color: STATUS_COLOR[tooltip.status], marginBottom: 2 }}>
              {tooltip.id} · {tooltip.status}
            </div>
            <div style={{ fontSize: 11 }}>👤 {tooltip.driver}</div>
            <div style={{ fontSize: 11 }}>📦 {tooltip.cargo}</div>
            <div style={{ fontSize: 11 }}>
              📍 {tooltip.from?.replace(/([A-Z])/g, ' $1').trim()} → {tooltip.to?.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            <div style={{ fontSize: 11 }}>📊 {(tooltip.progress * 100).toFixed(0)}% complete</div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="map-legend">
        {[['Moving', '#14b8a6', moving], ['Stopped', '#f59e0b', stopped], ['Alert', '#ef4444', alerts]].map(([l, c, n]) => (
          <div key={l} className="map-legend-item">
            <div className="map-legend-dot" style={{ background: c }} />
            <span>{l} ({n})</span>
          </div>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 10, opacity: 0.5 }}>Hover trucks for details · Updates every 50ms</span>
      </div>
    </div>
  );
}
