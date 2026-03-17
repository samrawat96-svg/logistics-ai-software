'use client';
import { useEffect, useRef } from 'react';

const CARRIERS = ['USX','FDX','UPSF','CNWY','ABFS','RDWY','HNRY','DAFG','EXLA'];
const SHP_STATUS = ['In Transit','Booked','Gate In','Customs Hold','Gate Out','POD Signed'];

function ri(a, b, seed) { return a + Math.abs(Math.sin(seed)*1000 % (b-a)) | 0; }

export default function ReportsPage() {
  const carrierRef = useRef(null); const carrierChart = useRef(null);
  const statusRef = useRef(null);  const statusChart = useRef(null);
  const revRef = useRef(null);     const revChart = useRef(null);
  const lineRef = useRef(null);    const lineChart = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      [carrierChart,statusChart,revChart,lineChart].forEach(r => { r.current?.destroy(); });

      if (carrierRef.current) carrierChart.current = new Chart(carrierRef.current, {
        type:'bar',
        data:{ labels:CARRIERS, datasets:[{ label:'On-Time %', data:CARRIERS.map((_,i)=>ri(72,98,i*7)), backgroundColor:'rgba(124,58,237,0.55)', borderColor:'rgba(168,85,247,0.8)', borderWidth:1, borderRadius:5 }] },
        options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y', plugins:{ legend:{ display:false } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } }, min:0,max:100 }, y:{ grid:{ display:false }, ticks:{ color:'rgba(255,255,255,0.45)', font:{ size:10, family:'JetBrains Mono' } } } } }
      });

      if (statusRef.current) statusChart.current = new Chart(statusRef.current, {
        type:'doughnut',
        data:{ labels:SHP_STATUS, datasets:[{ data:[95,32,48,18,22,33], backgroundColor:['rgba(20,184,166,0.7)','rgba(124,58,237,0.7)','rgba(240,220,136,0.7)','rgba(245,158,11,0.7)','rgba(59,130,246,0.7)','rgba(168,85,247,0.7)'], borderWidth:0 }] },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'right', labels:{ color:'rgba(255,255,255,0.45)', font:{ size:10 }, padding:8 } } } }
      });

      if (revRef.current) revChart.current = new Chart(revRef.current, {
        type:'bar',
        data:{ labels:Array.from({length:17},(_,i)=>`Mar ${i+1}`), datasets:[
          { label:'Revenue',     data:Array.from({length:17},(_,i)=>ri(80000,145000,i*3)),  backgroundColor:'rgba(20,184,166,0.55)', borderRadius:3 },
          { label:'Operating Cost', data:Array.from({length:17},(_,i)=>ri(48000,88000,i*7)), backgroundColor:'rgba(124,58,237,0.55)', borderRadius:3 },
        ]},
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'rgba(255,255,255,0.45)', font:{ size:10 } } } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:9 } } }, y:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 }, callback:v=>'$'+(v/1000).toFixed(0)+'K' } } } }
      });

      if (lineRef.current) lineChart.current = new Chart(lineRef.current, {
        type:'line',
        data:{ labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets:[
            { label:'FY 2025', data:[1.8,1.9,2.1,2.0,2.3,2.2,2.4,2.5,2.3,2.6,2.7,2.8], borderColor:'rgba(168,85,247,0.6)', backgroundColor:'rgba(168,85,247,0.06)', fill:true, tension:0.4, pointRadius:3 },
            { label:'FY 2026', data:[2.1,2.3,2.4,null,null,null,null,null,null,null,null,null], borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.1)', fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:'#a855f7' },
          ]
        },
        options:{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ labels:{ color:'rgba(255,255,255,0.45)', font:{ size:10 } } } }, scales:{ x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } }, y:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 }, callback:v=>'$'+v+'M' } } } }
      });
    });
    return () => { [carrierChart,statusChart,revChart,lineChart].forEach(r => r.current?.destroy()); };
  }, []);

  const handleExport = (type) => {
    const data = `Report Type: ${type}\nGenerated: ${new Date().toISOString()}\nStatus: Q1 2026 — All facilities`;
    const blob = new Blob([data], {type:'text/plain'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `logiai-${type.toLowerCase().replace(' ','-')}.txt`; a.click();
  };

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>ANALYTICS & REPORTS</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>Q1 2026 — All facilities · Auto-refreshed</div>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button className="btn-g" onClick={()=>handleExport('Performance Report')}>⬇ Export PDF</button>
          <button className="btn-g" onClick={()=>handleExport('Raw Data CSV')}>⬇ Export CSV</button>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[
          { label:'Total Revenue Q1', val:'$7.2M', delta:'+18.4%', color:'#a855f7' },
          { label:'Avg On-Time Rate', val:'94.7%', delta:'+2.1 pts', color:'#14b8a6' },
          { label:'Shipments Moved', val:'1,847', delta:'+8.2%', color:'#F0DC88' },
          { label:'Cost per Shipment', val:'$892', delta:'-3.4%', color:'#5eead4' },
        ].map(k=>(
          <div key={k.label} className="gl-sm" style={{ padding:14, borderRadius:12 }}>
            <div style={{ fontFamily:"'Orbitron',monospace", fontSize:20, color:k.color, fontWeight:700 }}>{k.val}</div>
            <div style={{ fontSize:11, color:'var(--t2)', marginTop:3 }}>{k.label}</div>
            <div style={{ fontSize:10, color:'#5eead4', marginTop:4 }}>{k.delta} vs last quarter</div>
          </div>
        ))}
      </div>

      <div className="g2" style={{ marginBottom:16 }}>
        <div className="gl-card">
          <div className="st" style={{ marginBottom:12 }}>CARRIER ON-TIME PERFORMANCE</div>
          <div style={{ height:210 }}><canvas ref={carrierRef} /></div>
        </div>
        <div className="gl-card">
          <div className="st" style={{ marginBottom:12 }}>SHIPMENT STATUS DISTRIBUTION</div>
          <div style={{ height:210 }}><canvas ref={statusRef} /></div>
        </div>
      </div>

      <div className="gl-card" style={{ marginBottom:16 }}>
        <div className="st" style={{ marginBottom:12 }}>DAILY REVENUE vs OPERATING COST — MARCH 2026</div>
        <div style={{ height:190 }}><canvas ref={revRef} /></div>
      </div>

      <div className="gl-card">
        <div className="st" style={{ marginBottom:12 }}>REVENUE TREND — FY 2025 vs FY 2026</div>
        <div style={{ height:190 }}><canvas ref={lineRef} /></div>
      </div>
    </div>
  );
}
