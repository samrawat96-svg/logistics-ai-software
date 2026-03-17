'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchAll } from '@/lib/supabase';

const INSIGHTS = [
  { type:'critical',icon:'⚠',title:'Predictive Maintenance — TRK-0005',detail:'Axle bearing vibration anomaly. Pattern matches pre-failure signature with 78% confidence. Schedule inspection within 48h.',conf:78 },
  { type:'critical',icon:'🌡',title:'Cold Chain Breach Imminent',detail:'BOL-2024010 Reefer at +3.8°C above spec. Reroute to nearest qualified cold storage immediately.',conf:91 },
  { type:'warning',icon:'⏱',title:'HOS Violation Risk — 1 Driver',detail:'DRV-005 has <60 min drive time remaining on route averaging 1.8h. Relay driver dispatch recommended.',conf:88 },
  { type:'warning',icon:'🏗',title:'Dallas XD Capacity Critical',detail:'WH-003 at 94% utilization. 18 inbound shipments due in 6 hours. Overflow auth to WH-001 required.',conf:95 },
  { type:'opportunity',icon:'🔀',title:'Ghost Route Optimization — 11 Routes',detail:'AI identified 11 alternate routes saving avg 47 miles/trip on Dallas–Chicago corridor. Est. savings: $8,400/week fuel, 2.3t CO₂/week.',conf:82 },
  { type:'opportunity',icon:'🌿',title:'LTL Consolidation Opportunity',detail:'14 LTL shipments to USBOSTON can consolidate into 6 FTL loads, reducing CO₂ by 2.3t and cutting carrier costs by $12,400 this week.',conf:74 },
  { type:'info',icon:'📊',title:'Detention Time Analysis',detail:'Average detention at WH-003 increased 34% WoW. Root cause: 3 dock doors unavailable. Demurrage accruing at $85/hr.',conf:99 },
];

const AI_SUMMARY = `Neural analysis of active shipments, 10 fleet assets, and 10 open orders reveals 3 high-priority interventions required. Predictive maintenance signals detected on TRK-0005 — axle bearing vibration anomaly matches pre-failure signature with 78% confidence. Cold chain telemetry shows 1 reefer unit exceeding set-point by >2°C — pharmaceutical SLA breach imminent on BOL-2024010. Route optimization engine has generated 11 ghost-route alternations reducing detention time by 4.2 hours across the Dallas–Chicago corridor, saving an estimated $8,400 weekly in fuel. Scope 3 emissions trending -14.3% vs last quarter.`;

export default function AIPage() {
  const [typed, setTyped] = useState('');
  const [dismissed, setDismissed] = useState(new Set());
  const carbonRef = useRef(null);
  const carbonChartRef = useRef(null);
  const trailerRef = useRef(null);
  const scene3dRef = useRef(null);

  // Typing animation
  useEffect(() => {
    let i = 0; setTyped('');
    const t = setInterval(() => {
      if (i < AI_SUMMARY.length) { setTyped(AI_SUMMARY.slice(0, i += 4)); }
      else clearInterval(t);
    }, 18);
    return () => clearInterval(t);
  }, []);

  // Carbon chart
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (carbonChartRef.current) carbonChartRef.current.destroy();
      const ctx = carbonRef.current; if (!ctx) return;
      carbonChartRef.current = new Chart(ctx, {
        type:'line',
        data:{ labels:['Oct','Nov','Dec','Jan','Feb','Mar'], datasets:[
          { label:'CO₂ Emissions (t)', data:[52.1,48.6,44.2,40.8,37.5,34.1], borderColor:'#14b8a6', backgroundColor:'rgba(20,184,166,0.08)', fill:true, tension:0.4, pointBackgroundColor:'#14b8a6', pointRadius:4 },
          { label:'Target', data:[55,50,46,43,40,37], borderColor:'rgba(240,220,136,0.45)', borderDash:[5,5], fill:false, tension:0, pointRadius:0 },
        ]},
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'rgba(255,255,255,0.45)', font:{ size:10 } } } },
          scales:{ x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } }, y:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } } }
        }
      });
    });
    return () => { carbonChartRef.current?.destroy(); };
  }, []);

  // 3D drag
  useEffect(() => {
    const sc = scene3dRef.current; const tr = trailerRef.current;
    if (!sc || !tr) return;
    let drag = false, lx = 0, ly = 0, rx = -14, ry = -28;
    const down = e => { drag=true; lx=e.clientX||e.touches?.[0]?.clientX; ly=e.clientY||e.touches?.[0]?.clientY; };
    const up = () => drag=false;
    const move = e => {
      if (!drag) return;
      const cx = e.clientX||e.touches?.[0]?.clientX; const cy = e.clientY||e.touches?.[0]?.clientY;
      ry += (cx-lx)*0.45; rx -= (cy-ly)*0.45;
      rx = Math.max(-50, Math.min(50, rx));
      tr.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
      lx=cx; ly=cy;
    };
    sc.addEventListener('mousedown', down); document.addEventListener('mouseup', up); document.addEventListener('mousemove', move);
    sc.addEventListener('touchstart', down, {passive:true}); document.addEventListener('touchend', up); document.addEventListener('touchmove', move, {passive:true});
    return () => {
      sc.removeEventListener('mousedown', down); document.removeEventListener('mouseup', up); document.removeEventListener('mousemove', move);
      sc.removeEventListener('touchstart', down); document.removeEventListener('touchend', up); document.removeEventListener('touchmove', move);
    };
  }, []);

  const typeColors = { critical:'#ef4444', warning:'#f59e0b', opportunity:'#14b8a6', info:'#3b82f6' };
  const visible = INSIGHTS.filter(i => !dismissed.has(i.title));

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ color:'var(--gold)', marginBottom:1 }}>⬡ AI INTELLIGENCE ENGINE</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>Neural predictive models · Scope 3 analytics · Dynamic rerouting</div>
        </div>
        <div className="gl-sm" style={{ display:'flex', alignItems:'center', gap:7, padding:'7px 14px', borderRadius:20, animation:'glow-gold 2.5s infinite' }}>
          <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--gold)', display:'inline-block' }} />
          <span style={{ fontSize:11, color:'var(--gold)', fontWeight:600, fontFamily:"'JetBrains Mono',monospace" }}>MODEL v4.2 ACTIVE</span>
        </div>
      </div>

      {/* AI Summary */}
      <div className="gl-card" style={{ borderLeft:'3px solid var(--gold)', marginBottom:16 }}>
        <div style={{ color:'var(--gold)', fontSize:10, fontWeight:600, marginBottom:7, letterSpacing:'0.1em' }}>⬡ NEURAL ANALYSIS — REAL-TIME SUMMARY</div>
        <div style={{ fontSize:12.5, lineHeight:1.75, color:'var(--t2)' }}>{typed}{typed.length < AI_SUMMARY.length && <span style={{ borderRight:'2px solid var(--gold)', paddingLeft:2, animation:'blink 1s infinite' }}>​</span>}</div>
      </div>

      <div className="g2" style={{ marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:10 }}>PREDICTIVE ALERTS</div>
          {visible.map(ins=>(
            <div key={ins.title} className="ins-card gl-sm" style={{ borderLeftColor:typeColors[ins.type] }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:5 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <span style={{ fontSize:14 }}>{ins.icon}</span>
                  <span style={{ fontWeight:600, fontSize:12.5 }}>{ins.title}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0, marginLeft:8 }}>
                  <span className="mono" style={{ fontSize:10, color:ins.conf>90?'#5eead4':ins.conf>80?'#F0DC88':'#a78bfa' }}>{ins.conf}%</span>
                  <button onClick={()=>setDismissed(new Set([...dismissed,ins.title]))} style={{ background:'none', border:'none', color:'var(--t3)', cursor:'pointer', fontSize:14, lineHeight:1 }}>×</button>
                </div>
              </div>
              <div style={{ fontSize:11.5, color:'var(--t2)', lineHeight:1.6 }}>{ins.detail}</div>
            </div>
          ))}
          {visible.length === 0 && <div style={{ padding:'20px 0', color:'var(--t3)', fontSize:13, textAlign:'center' }}>✓ All alerts addressed</div>}
        </div>

        <div className="gl-card">
          <div className="st" style={{ marginBottom:12 }}>SCOPE 3 EMISSIONS TRACKER</div>
          <div style={{ height:170 }}><canvas ref={carbonRef} /></div>
          <div className="g2" style={{ gap:10, marginTop:12 }}>
            <div style={{ padding:11, borderRadius:8, background:'rgba(20,184,166,0.07)', border:'1px solid rgba(20,184,166,0.14)' }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, color:'#5eead4' }}>-14.3%</div>
              <div style={{ fontSize:10, color:'var(--t3)' }}>vs Last Quarter</div>
            </div>
            <div style={{ padding:11, borderRadius:8, background:'rgba(240,220,136,0.07)', border:'1px solid rgba(240,220,136,0.14)' }}>
              <div style={{ fontFamily:"'Orbitron',monospace", fontSize:18, color:'#F0DC88' }}>28.4t</div>
              <div style={{ fontSize:10, color:'var(--t3)' }}>CO₂ Saved MTD</div>
            </div>
          </div>
        </div>
      </div>

      {/* 3D Cargo */}
      <div className="gl-card">
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <div className="st" style={{ marginBottom:0 }}>3D CARGO LOAD VISUALIZER — TRK-0001</div>
          <span style={{ fontSize:10, color:'var(--t3)' }}>Drag to rotate · 87% capacity</span>
        </div>
        <div id="scene3d" ref={scene3dRef} style={{ perspective:900, perspectiveOrigin:'50% 25%', width:'100%', height:240, display:'flex', alignItems:'center', justifyContent:'center', cursor:'grab' }}>
          <div ref={trailerRef} style={{ position:'relative', width:280, height:110, transformStyle:'preserve-3d', transform:'rotateX(-14deg) rotateY(-28deg)' }}>
            <div style={{ position:'absolute', width:280, height:110, border:'1px solid rgba(240,220,136,0.18)', borderRadius:4 }} />
            {[
              { x:4,y:10,z:8,w:82,h:88,bg:'rgba(124,58,237,0.55)',brd:'rgba(168,85,247,0.7)' },
              { x:90,y:10,z:8,w:76,h:88,bg:'rgba(20,184,166,0.48)',brd:'rgba(94,234,212,0.65)' },
              { x:170,y:10,z:8,w:68,h:88,bg:'rgba(245,158,11,0.45)',brd:'rgba(251,191,36,0.65)' },
              { x:4,y:22,z:94,w:82,h:68,bg:'rgba(240,220,136,0.38)',brd:'rgba(240,220,136,0.65)' },
              { x:90,y:22,z:94,w:76,h:68,bg:'rgba(239,68,68,0.45)',brd:'rgba(248,113,113,0.65)' },
            ].map((b,i)=>(
              <div key={i} style={{ position:'absolute', transformStyle:'preserve-3d', borderRadius:3, left:b.x, top:b.y, width:b.w, height:b.h, transform:`translateZ(${b.z}px)`, background:b.bg, border:`1px solid ${b.brd}`, boxShadow:`inset 0 0 10px ${b.brd}88` }} />
            ))}
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:7, marginTop:10 }}>
          {[{c:'#a78bfa',bg:'rgba(124,58,237,0.1)',l:'PLT-001',t:'Electronics 420kg'},
            {c:'#5eead4',bg:'rgba(20,184,166,0.1)',l:'PLT-002',t:'Auto Parts 680kg'},
            {c:'#fbbf24',bg:'rgba(245,158,11,0.1)',l:'PLT-003',t:'Pharma 210kg'},
            {c:'#f87171',bg:'rgba(239,68,68,0.1)',l:'PLT-004',t:'Hazmat 150kg'},
            {c:'#F0DC88',bg:'rgba(240,220,136,0.1)',l:'PLT-005',t:'Foodstuff 890kg'}
          ].map(p=>(
            <div key={p.l} style={{ padding:7, textAlign:'center', background:p.bg, borderRadius:6, fontSize:10 }}>
              <div className="mono" style={{ color:p.c }}>{p.l}</div>
              <div style={{ color:'var(--t3)', fontSize:9 }}>{p.t}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
