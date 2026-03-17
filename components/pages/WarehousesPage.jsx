'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchAll, updateRow } from '@/lib/supabase';
import { showToast, Modal, FormRow, EmptyState, Spinner, ProgressBar } from '@/components/ui';

const TYPES = ['Distribution Center','Fulfillment Center','Cross-Dock'];

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editWH, setEditWH] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!warehouses.length) return;
    if (typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      if (chartInstanceRef.current) chartInstanceRef.current.destroy();
      const ctx = chartRef.current; if (!ctx) return;
      chartInstanceRef.current = new Chart(ctx, {
        type:'bar',
        data:{
          labels:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: warehouses.map((w,i)=>({
            label:w.name,
            data:Array.from({length:12},(_,m)=>Math.max(40, Math.min(98, w.utilization_pct + (Math.sin((m+i)*1.2)*12)|0))),
            backgroundColor:['rgba(124,58,237,0.55)','rgba(20,184,166,0.55)','rgba(240,220,136,0.55)','rgba(239,68,68,0.45)','rgba(168,85,247,0.55)'][i%5],
            borderRadius:3,
          }))
        },
        options:{ responsive:true, maintainAspectRatio:false,
          plugins:{ legend:{ labels:{ color:'rgba(255,255,255,0.45)', font:{ size:10, family:'DM Sans' } } } },
          scales:{ x:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } }, y:{ grid:{ color:'rgba(255,255,255,0.035)' }, ticks:{ color:'rgba(255,255,255,0.38)', font:{ size:10 } } } }
        }
      });
    });
    return () => { chartInstanceRef.current?.destroy(); };
  }, [warehouses]);

  async function load() {
    setLoading(true);
    try { setWarehouses(await fetchAll('warehouses', { order:'warehouse_id', asc:true })); } catch { showToast('Failed to load warehouses','error'); }
    setLoading(false);
  }

  function openEdit(w) {
    setForm({ utilization_pct:w.utilization_pct, available_doors:w.available_doors, facility_type:w.facility_type, capacity_sqft:w.capacity_sqft, dock_doors:w.dock_doors });
    setEditWH(w);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRow('warehouses', editWH.id, { ...form, utilization_pct:parseInt(form.utilization_pct), available_doors:parseInt(form.available_doors), capacity_sqft:parseInt(form.capacity_sqft), dock_doors:parseInt(form.dock_doors) });
      showToast('Warehouse updated','success');
      setEditWH(null); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  const typeColor = t => t.includes('Cross')?'bg-v':t.includes('Fulfillment')?'bg-b':'bg-g';

  return (
    <div className="fade-in">
      <div style={{ marginBottom:16 }}>
        <div className="st" style={{ marginBottom:1 }}>WAREHOUSE NETWORK</div>
        <div style={{ fontSize:10, color:'var(--t3)' }}>{warehouses.length} facilities · {warehouses.filter(w=>w.facility_type.includes('Distribution')).length} distribution centers · {warehouses.filter(w=>w.facility_type.includes('Cross')).length} cross-docks</div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40 }}><Spinner /></div> : (
        <>
          <div className="g3" style={{ marginBottom:16 }}>
            {warehouses.map(w=>(
              <div key={w.id} className="gl-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                  <div>
                    <div className="mono" style={{ fontSize:11, color:'var(--t3)' }}>{w.warehouse_id}</div>
                    <div style={{ fontSize:15, fontWeight:600, marginTop:2 }}>{w.name}</div>
                    <div style={{ fontSize:10.5, color:'var(--t3)' }}>{w.location}</div>
                  </div>
                  <span className={`bdg ${typeColor(w.facility_type)}`} style={{ fontSize:'9.5px' }}>{w.facility_type}</span>
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
                    <span style={{ color:'var(--t2)' }}>Utilization</span>
                    <span className="mono" style={{ color:w.utilization_pct>90?'#f87171':w.utilization_pct>75?'#fbbf24':'#5eead4' }}>{w.utilization_pct}%</span>
                  </div>
                  <div className="pbar" style={{ height:7 }}><div className="pfill" style={{ width:`${w.utilization_pct}%`, background:w.utilization_pct>90?'#ef4444':w.utilization_pct>75?'#f59e0b':'#14b8a6' }} /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:7, textAlign:'center' }}>
                  <div style={{ padding:8, borderRadius:7, background:'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14 }}>{(w.capacity_sqft/1000).toFixed(0)}K</div>
                    <div style={{ fontSize:9, color:'var(--t3)' }}>sq ft</div>
                  </div>
                  <div style={{ padding:8, borderRadius:7, background:'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14 }}>{w.dock_doors}</div>
                    <div style={{ fontSize:9, color:'var(--t3)' }}>Dock Doors</div>
                  </div>
                  <div style={{ padding:8, borderRadius:7, background:'rgba(255,255,255,0.04)' }}>
                    <div style={{ fontFamily:"'Orbitron',monospace", fontSize:14, color:w.available_doors<5?'#f87171':'#5eead4' }}>{w.available_doors}</div>
                    <div style={{ fontSize:9, color:'var(--t3)' }}>Available</div>
                  </div>
                </div>
                {w.utilization_pct > 90 && <div style={{ marginTop:10, padding:'6px 10px', borderRadius:6, background:'rgba(239,68,68,0.09)', border:'1px solid rgba(239,68,68,0.18)', fontSize:10.5, color:'#f87171' }}>⚠ CAPACITY ALERT — Cross-dock overflow required</div>}
                <button className="btn-g" style={{ fontSize:11, padding:'5px 12px', marginTop:10, width:'100%' }} onClick={()=>openEdit(w)}>Edit Facility</button>
              </div>
            ))}
          </div>

          <div className="gl-card">
            <div className="st" style={{ marginBottom:12 }}>FACILITY UTILIZATION — 12 MONTH TREND</div>
            <div style={{ height:200 }}><canvas ref={chartRef} /></div>
          </div>
        </>
      )}

      {editWH && (
        <Modal title={`EDIT — ${editWH.name}`} onClose={()=>setEditWH(null)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="Facility Type"><select className="g-input" value={form.facility_type} onChange={e=>setForm({...form,facility_type:e.target.value})}>{TYPES.map(t=><option key={t}>{t}</option>)}</select></FormRow>
              <FormRow label="Utilization (%)"><input className="g-input" type="number" min="0" max="100" value={form.utilization_pct} onChange={e=>setForm({...form,utilization_pct:e.target.value})} /></FormRow>
              <FormRow label="Capacity (sq ft)"><input className="g-input" type="number" min="0" value={form.capacity_sqft} onChange={e=>setForm({...form,capacity_sqft:e.target.value})} /></FormRow>
              <FormRow label="Dock Doors"><input className="g-input" type="number" min="0" value={form.dock_doors} onChange={e=>setForm({...form,dock_doors:e.target.value})} /></FormRow>
              <FormRow label="Available Doors"><input className="g-input" type="number" min="0" value={form.available_doors} onChange={e=>setForm({...form,available_doors:e.target.value})} /></FormRow>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setEditWH(null)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : 'Update Facility'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
