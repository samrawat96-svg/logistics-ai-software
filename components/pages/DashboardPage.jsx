'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchAll } from '@/lib/supabase';
import { StatusBadge, SkeletonKPI } from '@/components/ui';
import LiveFleetMap from '@/components/LiveFleetMap';

export default function DashboardPage({ onNavigate }) {
  const [data,     setData]     = useState({ shipments:[], vehicles:[], alerts:[], orders:[] });
  const [loading,  setLoading]  = useState(true);
  const chartRef   = useRef(null);
  const chartInst  = useRef(null);

  useEffect(() => {
    Promise.all([
      fetchAll('shipments',{order:'created_at',limit:8}),
      fetchAll('vehicles'),
      fetchAll('alerts',{order:'created_at',limit:10}),
      fetchAll('orders'),
    ]).then(([shipments,vehicles,alerts,orders]) => {
      setData({shipments,vehicles,alerts,orders});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* Chart */
  useEffect(() => {
    if (loading || typeof window === 'undefined') return;
    import('chart.js').then(({Chart,registerables}) => {
      Chart.register(...registerables);
      chartInst.current?.destroy();
      const ctx = chartRef.current; if (!ctx) return;
      chartInst.current = new Chart(ctx, {
        type:'line',
        data:{
          labels:['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
          datasets:[
            {label:'Shipments',data:[85,92,78,95,88,76,102],borderColor:'#a855f7',backgroundColor:'rgba(168,85,247,0.08)',fill:true,tension:0.45,pointBackgroundColor:'#a855f7',pointRadius:4,pointHoverRadius:6},
            {label:'Deliveries',data:[78,85,72,88,82,70,95], borderColor:'#14b8a6',backgroundColor:'rgba(20,184,166,0.06)',fill:true,tension:0.45,pointBackgroundColor:'#14b8a6',pointRadius:4,pointHoverRadius:6},
          ],
        },
        options:{
          responsive:true, maintainAspectRatio:false,
          interaction:{mode:'index',intersect:false},
          plugins:{legend:{labels:{color:'rgba(255,255,255,0.45)',font:{size:11,family:'Inter'}}},tooltip:{backgroundColor:'rgba(8,5,16,0.95)',titleColor:'#fff',bodyColor:'rgba(255,255,255,0.65)',borderColor:'rgba(124,58,237,0.3)',borderWidth:1,padding:10,cornerRadius:8}},
          scales:{x:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'rgba(255,255,255,0.38)',font:{size:10}}},y:{grid:{color:'rgba(255,255,255,0.04)'},ticks:{color:'rgba(255,255,255,0.38)',font:{size:10}}}},
        },
      });
    });
    return () => chartInst.current?.destroy();
  }, [loading]);

  const {shipments,vehicles,alerts,orders} = data;
  const moving      = vehicles.filter(v=>v.status==='Moving').length;
  const stopped     = vehicles.filter(v=>v.status==='Stopped').length;
  const alertVeh    = vehicles.filter(v=>v.status==='Alert').length;
  const openOrders  = orders.filter(o=>o.status!=='Delivered').length;
  const critAlerts  = alerts.filter(a=>a.type==='critical').length;

  const alertCol = {critical:'#f87171',warning:'#fbbf24',success:'#5eead4',info:'#a78bfa'};
  const timeAgo  = ['just now','2m ago','8m ago','14m ago','23m ago','31m ago','42m ago','1h ago','1.5h ago','2h ago'];

  if (loading) return (
    <div>
      <SkeletonKPI count={4} />
      <div className="grid2">
        <div className="card" style={{height:280}}><div className="skeleton" style={{height:'100%',borderRadius:8}} /></div>
        <div className="card" style={{height:280}}><div className="skeleton" style={{height:'100%',borderRadius:8}} /></div>
      </div>
    </div>
  );

  return (
    <div>
      {/* Row 1 — KPIs */}
      <div className="kpi-grid mb-16">
        {[
          {icon:'🚛',label:'Active Shipments', val: shipments.length || 247, color:'#14b8a6', delta:'+8.2%', bg:'rgba(20,184,166,0.08)', border:'rgba(20,184,166,0.15)'},
          {icon:'📋',label:'Open Orders',      val: openOrders || 48,        color:'#a855f7', delta:'+12%',  bg:'rgba(168,85,247,0.08)', border:'rgba(168,85,247,0.15)'},
          {icon:'⚡',label:'On-Time Delivery', val:'94.7%',                  color:'#f0dc88', delta:'97.3% SLA',bg:'rgba(240,220,136,0.07)',border:'rgba(240,220,136,0.15)'},
          {icon:'🔔',label:'Active Alerts',    val: alerts.length || 5,      color:'#f87171', delta:`${critAlerts||2} critical`, bg:'rgba(239,68,68,0.08)',border:'rgba(239,68,68,0.15)'},
        ].map(k=>(
          <div key={k.label} className="card">
            <div className="flex items-center justify-between mb-12">
              <div style={{width:36,height:36,borderRadius:9,background:k.bg,border:`1px solid ${k.border}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16}}>{k.icon}</div>
              <span className="badge badge-violet" style={{fontSize:10}}>{k.delta}</span>
            </div>
            <div className="kpi-val" style={{color:k.color}}>{k.val}</div>
            <div className="kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Row 2 — mini metrics */}
      <div className="grid4 mb-16">
        {[
          {label:'Active Vehicles', val:moving||42,    color:'#14b8a6', pct:84},
          {label:'Revenue MTD',     val:'$2.4M',        color:'#a855f7', pct:78},
          {label:'CO₂ Saved MTD',   val:'28.4t',        color:'#f0dc88', pct:62},
          {label:'HOS Violations',  val: alerts.filter(a=>a.title?.includes('HOS')).length || 3, color:'#f87171', pct:6},
        ].map(m=>(
          <div key={m.label} className="card-sm flex items-center gap-10">
            <div style={{fontFamily:"'Orbitron',monospace",fontSize:18,fontWeight:700,color:m.color,flexShrink:0}}>{m.val}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11,color:'var(--t2)',marginBottom:5}}>{m.label}</div>
              <div className="pbar"><div className="pfill" style={{width:`${m.pct}%`,background:m.color}}/></div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3 — Chart */}
      <div className="card mb-16">
        <div className="flex items-center justify-between mb-16">
          <div>
            <div className="sect-label" style={{marginBottom:2}}>SHIPMENT THROUGHPUT</div>
            <div style={{fontSize:10,color:'var(--t3)'}}>7-day rolling · auto-refreshed</div>
          </div>
          <div className="flex gap-6">
            {['1D','7D','30D'].map((l,i)=>(
              <button key={l} className={`btn btn-sm ${i===1?'btn-primary':'btn-ghost'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div style={{height:190}}><canvas ref={chartRef}/></div>
      </div>

      {/* Row 4 — Live Fleet Map (full width) */}
      <div className="card mb-16">
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="sect-label" style={{marginBottom:2}}>LIVE FLEET MAP — USA</div>
            <div style={{fontSize:10,color:'var(--t3)'}}>Real-time vehicle positions · 10 assets tracked · Hover for details</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate('fleet')}>Fleet Manager →</button>
        </div>
        <LiveFleetMap height={280}/>
      </div>

      {/* Row 4 — Recent Shipments + Operations Log */}
      <div className="grid2">
        <div className="card">
          <div className="flex items-center justify-between mb-16">
            <div className="sect-label" style={{marginBottom:0}}>RECENT SHIPMENTS</div>
            <button className="btn btn-ghost btn-sm" onClick={()=>onNavigate('shipments')}>View all →</button>
          </div>
          <div className="table-wrap">
            <table className="dt">
              <thead><tr><th>BOL #</th><th>SCAC</th><th>Route</th><th>Status</th></tr></thead>
              <tbody>
                {shipments.slice(0,8).map(s=>(
                  <tr key={s.id}>
                    <td className="mono" style={{color:'#a78bfa'}}>{s.bol_number}</td>
                    <td className="mono" style={{color:'#5eead4',fontWeight:600}}>{s.scac}</td>
                    <td style={{fontSize:11,color:'var(--t2)'}}>{s.origin?.replace('US','').slice(0,4)}→{s.destination?.replace('US','').slice(0,4)}</td>
                    <td><StatusBadge status={s.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="sect-label mb-12">OPERATIONS LOG</div>
          <div style={{overflowY:'auto',maxHeight:260}}>
            {(alerts.length > 0 ? alerts : [
              {type:'success',message:'BOL-2024006 delivered — POD signed at USPORTLAND'},
              {type:'critical',message:'TEMP ALERT: BOL-2024010 reefer +3.8°C above set-point'},
              {type:'info',message:'New order ORD-8001 from Apex Industries (Platinum SLA)'},
              {type:'warning',message:'HOS warning: DRV-005 has 55 min remaining'},
              {type:'success',message:'WH-002 LA FC: Gate IN confirmed — 14 pallets'},
              {type:'info',message:'AI model v4.2 retrained · 247 routes re-optimized'},
            ]).map((a,i)=>(
              <div key={a.id||i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,0.04)'}}>
                <div style={{width:5,height:5,borderRadius:'50%',background:alertCol[a.type]||'#a78bfa',marginTop:6,flexShrink:0}}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,lineHeight:1.45}}>{a.message||a.title}</div>
                  <div style={{fontSize:10,color:'var(--t3)',marginTop:3}}>{timeAgo[i]||'—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
