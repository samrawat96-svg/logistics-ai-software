'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchAll } from '@/lib/supabase';
import { StatusBadge, ProgressBar } from '@/components/ui';

export default function DashboardPage({ onNavigate }) {
  const [shipments, setShipments] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [orders, setOrders] = useState([]);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    fetchAll('shipments', { order: 'created_at', limit: 8 }).then(setShipments).catch(() => {});
    fetchAll('vehicles').then(setVehicles).catch(() => {});
    fetchAll('alerts', { order: 'created_at', limit: 10 }).then(setAlerts).catch(() => {});
    fetchAll('orders').then(setOrders).catch(() => {});
  }, []);

  // Chart
  useEffect(() => {
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
      const ctx = chartRef.current;
      if (!ctx) return;
      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
          datasets: [
            { label:'Shipments', data:[85,92,78,95,88,76,102], borderColor:'#a855f7', backgroundColor:'rgba(168,85,247,0.07)', fill:true, tension:0.4, pointBackgroundColor:'#a855f7', pointRadius:4 },
            { label:'Deliveries', data:[78,85,72,88,82,70,95], borderColor:'#14b8a6', backgroundColor:'rgba(20,184,166,0.05)', fill:true, tension:0.4, pointBackgroundColor:'#14b8a6', pointRadius:4 },
          ],
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: { legend:{ labels:{ color:'rgba(255,255,255,0.45)', font:{ size:11, family:'DM Sans' } } }, tooltip:{ backgroundColor:'rgba(10,6,18,0.95)', titleColor:'#fff', bodyColor:'rgba(255,255,255,0.65)', borderColor:'rgba(124,58,237,0.3)', borderWidth:1 } },
          scales: { x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } }, y:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } } }
        },
      });
    });
    return () => { chartInstanceRef.current?.destroy(); };
  }, []);

  const moving = vehicles.filter(v => v.status === 'Moving').length;
  const stopped = vehicles.filter(v => v.status === 'Stopped').length;
  const alertVeh = vehicles.filter(v => v.status === 'Alert').length;
  const activeOrders = orders.filter(o => o.status !== 'Delivered').length;
  const delivered = orders.filter(o => o.status === 'Delivered').length;
  const onTime = orders.length ? Math.round((delivered / orders.length) * 100) : 94;

  const alertColors = { critical:'#f87171', warning:'#fbbf24', success:'#5eead4', info:'#a78bfa' };
  const actTimes = ['just now','2m ago','8m ago','14m ago','23m ago','31m ago','42m ago','1h ago','1.5h ago','2h ago'];

  return (
    <div className="fade-in">
      {/* KPIs Row 1 */}
      <div className="kpi-grid">
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ padding:7, borderRadius:8, background:'rgba(20,184,166,0.1)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#14b8a6" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <span className="bdg bg-g">+8.2%</span>
          </div>
          <div className="kpi-val" style={{ color:'#14b8a6' }}>{shipments.length || 247}</div>
          <div className="kpi-lbl">Active Shipments</div>
        </div>
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ padding:7, borderRadius:8, background:'rgba(168,85,247,0.1)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#a855f7" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
            </div>
            <span className="bdg bg-v">+12.1%</span>
          </div>
          <div className="kpi-val" style={{ color:'#a855f7' }}>{activeOrders || 48}</div>
          <div className="kpi-lbl">Open Orders</div>
        </div>
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ padding:7, borderRadius:8, background:'rgba(240,220,136,0.1)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#F0DC88" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <span className="bdg bg-gold">97.3% SLA</span>
          </div>
          <div className="kpi-val" style={{ color:'#F0DC88' }}>94.7%</div>
          <div className="kpi-lbl">On-Time Delivery</div>
        </div>
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ padding:7, borderRadius:8, background:'rgba(239,68,68,0.1)' }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#f87171" strokeWidth="2"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
            </div>
            <span className="bdg bg-r">{alerts.filter(a=>a.type==='critical').length || 5} Critical</span>
          </div>
          <div className="kpi-val" style={{ color:'#f87171' }}>{alerts.length || 18}</div>
          <div className="kpi-lbl">Active Alerts</div>
        </div>
      </div>

      {/* KPIs Row 2 */}
      <div className="kpi-grid" style={{ marginBottom:16 }}>
        <div className="gl-sm" style={{ padding:14, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
          <div className="kpi-val" style={{ fontSize:20, color:'#14b8a6' }}>{moving || 42}</div>
          <div style={{ flex:1 }}><div style={{ fontSize:11, color:'var(--t2)' }}>Active Vehicles</div><div className="pbar" style={{ marginTop:4 }}><div className="pfill" style={{ width:'84%', background:'#14b8a6' }} /></div></div>
        </div>
        <div className="gl-sm" style={{ padding:14, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
          <div className="kpi-val" style={{ fontSize:20, color:'#a855f7' }}>$2.4M</div>
          <div style={{ flex:1 }}><div style={{ fontSize:11, color:'var(--t2)' }}>Revenue MTD</div><div className="pbar" style={{ marginTop:4 }}><div className="pfill" style={{ width:'78%', background:'#a855f7' }} /></div></div>
        </div>
        <div className="gl-sm" style={{ padding:14, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
          <div className="kpi-val" style={{ fontSize:20, color:'#F0DC88' }}>28.4t</div>
          <div style={{ flex:1 }}><div style={{ fontSize:11, color:'var(--t2)' }}>CO₂ Saved MTD</div><div className="pbar" style={{ marginTop:4 }}><div className="pfill" style={{ width:'62%', background:'#F0DC88' }} /></div></div>
        </div>
        <div className="gl-sm" style={{ padding:14, borderRadius:12, display:'flex', alignItems:'center', gap:12 }}>
          <div className="kpi-val" style={{ fontSize:20, color:'#f87171' }}>3</div>
          <div style={{ flex:1 }}><div style={{ fontSize:11, color:'var(--t2)' }}>HOS Violations</div><div className="pbar" style={{ marginTop:4 }}><div className="pfill" style={{ width:'6%', background:'#ef4444' }} /></div></div>
        </div>
      </div>

      {/* Chart + Map */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:16, marginBottom:16 }}>
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
            <div><div className="st" style={{ marginBottom:2 }}>SHIPMENT THROUGHPUT</div><div style={{ fontSize:10, color:'var(--t3)' }}>Live 7-day rolling window</div></div>
            <div style={{ display:'flex', gap:6 }}>
              <button className="btn-g" style={{ padding:'3px 9px', fontSize:10 }}>1D</button>
              <button className="btn-p" style={{ padding:'3px 9px', fontSize:10 }}>7D</button>
              <button className="btn-g" style={{ padding:'3px 9px', fontSize:10 }}>30D</button>
            </div>
          </div>
          <div style={{ height:190 }}><canvas ref={chartRef} /></div>
        </div>
        <div className="gl-card">
          <div className="st" style={{ marginBottom:10 }}>FLEET POSITIONS</div>
          <div className="map-bg">
            <svg viewBox="0 0 320 190" width="100%" height="100%" style={{ position:'absolute', inset:0 }}>
              <line x1="0" y1="63" x2="320" y2="63" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <line x1="0" y1="95" x2="320" y2="95" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <line x1="0" y1="127" x2="320" y2="127" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <line x1="80" y1="0" x2="80" y2="190" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <line x1="160" y1="0" x2="160" y2="190" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <line x1="240" y1="0" x2="240" y2="190" stroke="rgba(255,255,255,0.035)" strokeWidth="1"/>
              <path d="M45,90 Q100,68 165,80 Q225,92 285,82" fill="none" stroke="rgba(20,184,166,0.35)" strokeWidth="1.5" strokeDasharray="5,4"/>
              <path d="M35,115 Q95,135 155,122 Q215,109 270,128" fill="none" stroke="rgba(124,58,237,0.35)" strokeWidth="1.5" strokeDasharray="5,4"/>
              <polygon points="165,88 170,78 175,88" fill="rgba(240,220,136,0.7)" stroke="rgba(240,220,136,0.9)" strokeWidth="0.8"/>
              <polygon points="75,105 80,95 85,105" fill="rgba(240,220,136,0.7)" stroke="rgba(240,220,136,0.9)" strokeWidth="0.8"/>
              <polygon points="250,75 255,65 260,75" fill="rgba(240,220,136,0.7)" stroke="rgba(240,220,136,0.9)" strokeWidth="0.8"/>
            </svg>
            {vehicles.slice(0, 30).map((v, i) => {
              const x = 30 + ((i * 9.2 + 15) % 270);
              const y = 20 + ((i * 6.1 + 10) % 155);
              const cls = v.status === 'Alert' ? 'va' : v.status === 'Stopped' ? 'vs' : 'vm';
              return <div key={v.id} className={`vdot ${cls}`} style={{ left:x, top:y, position:'absolute' }} title={v.vehicle_number} />;
            })}
          </div>
          <div style={{ display:'flex', gap:12, marginTop:8, fontSize:10 }}>
            <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--t2)' }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#14b8a6', display:'inline-block' }}/> Moving ({moving || 42})</span>
            <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--t2)' }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#f59e0b', display:'inline-block' }}/> Stopped ({stopped || 5})</span>
            <span style={{ display:'flex', alignItems:'center', gap:4, color:'var(--t2)' }}><span style={{ width:7, height:7, borderRadius:'50%', background:'#ef4444', display:'inline-block' }}/> Alert ({alertVeh || 3})</span>
          </div>
        </div>
      </div>

      {/* Bottom */}
      <div className="g2">
        <div className="gl-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <div className="st" style={{ marginBottom:0 }}>RECENT SHIPMENTS</div>
            <button className="btn-g" onClick={() => onNavigate('shipments')} style={{ fontSize:11, padding:'3px 10px' }}>View All →</button>
          </div>
          <div className="tbl-wrap">
            <table className="dt"><thead><tr><th>BOL #</th><th>SCAC</th><th>Route</th><th>Status</th></tr></thead>
            <tbody>{shipments.slice(0,8).map(s=>(
              <tr key={s.id}>
                <td className="mono" style={{ color:'#a78bfa' }}>{s.bol_number}</td>
                <td className="mono" style={{ color:'#5eead4', fontWeight:600 }}>{s.scac}</td>
                <td style={{ fontSize:11, color:'var(--t2)' }}>{s.origin?.slice(2)}→{s.destination?.slice(2)}</td>
                <td><StatusBadge status={s.status} /></td>
              </tr>
            ))}</tbody></table>
          </div>
        </div>
        <div className="gl-card">
          <div className="st" style={{ marginBottom:12 }}>OPERATIONS LOG</div>
          <div style={{ overflowY:'auto', maxHeight:220 }}>
            {alerts.length === 0 ? (
              [
                { c:'#14b8a6', t:'BOL-2024006 delivered — POD signed at USPORTLAND' },
                { c:'#f87171', t:'TEMP ALERT: BOL-2024010 reefer +3.8°C above set-point' },
                { c:'#a78bfa', t:'New order ORD-8001 from Apex Industries (Platinum SLA)' },
                { c:'#fbbf24', t:'HOS warning: DRV-005 has 55min remaining' },
                { c:'#5eead4', t:'WH-002 LA FC: Gate IN confirmed — 14 pallets' },
                { c:'#F0DC88', t:'AI model v4.2 retrained · 247 routes re-optimized' },
              ].map((a,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.035)' }}>
                  <div style={{ width:5, height:5, borderRadius:'50%', background:a.c, marginTop:5, flexShrink:0 }} />
                  <div><div style={{ fontSize:11.5, lineHeight:1.4 }}>{a.t}</div><div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{['just now','2m','8m','14m','23m','31m'][i]} ago</div></div>
                </div>
              ))
            ) : alerts.map((a,i)=>(
              <div key={a.id} style={{ display:'flex', alignItems:'flex-start', gap:9, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.035)' }}>
                <div style={{ width:5, height:5, borderRadius:'50%', background:alertColors[a.type]||'#a78bfa', marginTop:5, flexShrink:0 }} />
                <div><div style={{ fontSize:11.5, lineHeight:1.4 }}>{a.message || a.title}</div><div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{actTimes[i] || '—'}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
