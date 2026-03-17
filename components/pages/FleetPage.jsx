'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { toast, Modal, StatusBadge, Field, EmptyState, Spinner, SkeletonCards, PageHeader, useConfirm, ProgressBar } from '@/components/ui';

const VEH_STATUSES = ['Moving','Stopped','Alert'];
const ELD_OPTS     = ['Connected','Malfunction','Data Transfer'];
const HOS_OPTS     = ['D','ON','SB','OFF'];
const CARGO_TYPES  = ['Electronics','Auto Parts','Pharma·Cold Chain','Foodstuff','Hazmat','General Freight','Reefer·Produce'];
const BLANK = {vehicle_number:'',vin:'',driver_name:'',eld_status:'Connected',hos_status:'OFF',drive_remaining_minutes:660,fuel_percent:100,odometer_miles:0,status:'Stopped',cargo_type:'General Freight',speed_mph:0};

export default function FleetPage({ searchQuery }) {
  const [vehicles,      setVehicles] = useState([]);
  const [loading,       setLoading]  = useState(true);
  const [showModal,     setShow]     = useState(false);
  const [showDispatch,  setDispatch] = useState(false);
  const [editVeh,       setEditVeh]  = useState(null);
  const [saving,        setSaving]   = useState(false);
  const [form,          setForm]     = useState(BLANK);
  const [dispForm,      setDF]       = useState({vehicle_id:'',destination:'',cargo_type:'General Freight'});
  const [confirm, ConfirmEl]         = useConfirm();

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    try { setVehicles(await fetchAll('vehicles',{order:'vehicle_number',asc:true})); }
    catch { toast('Failed to load fleet','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `TRK-${String(vehicles.length+1).padStart(4,'0')}`;
    setForm({...BLANK,vehicle_number:num,vin:`VIN${Date.now().toString().slice(-8)}`});
    setEditVeh(null); setShow(true);
  }
  function openEdit(v) {
    setForm({vehicle_number:v.vehicle_number,vin:v.vin||'',driver_name:v.driver_name||'',eld_status:v.eld_status,hos_status:v.hos_status,drive_remaining_minutes:v.drive_remaining_minutes,fuel_percent:v.fuel_percent,odometer_miles:v.odometer_miles,status:v.status,cargo_type:v.cargo_type||'General Freight',speed_mph:v.speed_mph||0});
    setEditVeh(v); setShow(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.vehicle_number){toast('Vehicle number required','error');return;}
    setSaving(true);
    try {
      const p = {...form, drive_remaining_minutes:+form.drive_remaining_minutes, fuel_percent:+form.fuel_percent, odometer_miles:+form.odometer_miles, speed_mph:+form.speed_mph};
      if(editVeh){await updateRow('vehicles',editVeh.id,p);toast('Vehicle updated','success');}
      else       {await insertRow('vehicles',p);           toast('Vehicle added','success');}
      setShow(false); load();
    } catch(err){toast(err.message,'error');}
    setSaving(false);
  }

  async function handleDelete(v) {
    const ok = await confirm({title:'Remove Vehicle',description:`Remove ${v.vehicle_number} from the fleet?`,confirmText:'Remove',variant:'danger'});
    if (!ok) return;
    try{await deleteRow('vehicles',v.id);toast('Vehicle removed','info');load();}
    catch(err){toast(err.message,'error');}
  }

  async function handleDispatch(e) {
    e.preventDefault();
    const v = vehicles.find(x=>x.vehicle_number===dispForm.vehicle_id);
    if (!v){toast('Select a vehicle','error');return;}
    setSaving(true);
    try {
      await updateRow('vehicles',v.id,{status:'Moving',cargo_type:dispForm.cargo_type});
      toast(`${v.vehicle_number} dispatched to ${dispForm.destination}`,'success');
      setDispatch(false); load();
    } catch(err){toast(err.message,'error');}
    setSaving(false);
  }

  const filtered = vehicles.filter(v=>!searchQuery||`${v.vehicle_number} ${v.driver_name||''} ${v.status}`.toLowerCase().includes(searchQuery.toLowerCase()));
  const moving = vehicles.filter(v=>v.status==='Moving').length;
  const alerts = vehicles.filter(v=>v.status==='Alert').length;

  const statusColor = s => s==='Alert'?'#ef4444':s==='Stopped'?'#f59e0b':'#14b8a6';
  const hosColor    = m => m<60?'#f87171':m<120?'#fbbf24':'#5eead4';
  const fuelColor   = f => f<25?'#ef4444':f<50?'#f59e0b':'#14b8a6';

  return (
    <div>
      <PageHeader
        title="FLEET MANAGEMENT"
        subtitle={`${vehicles.length} vehicles · ${moving} moving · ${alerts} alerts · ELD mandate compliant`}
        actions={
          <>
            <button className="btn btn-ghost btn-sm" onClick={openNew}>+ Add Vehicle</button>
            <button className="btn btn-primary" onClick={()=>setDispatch(true)}>⚡ Dispatch</button>
          </>
        }
      />

      {loading ? <SkeletonCards count={6}/> : filtered.length===0 ? (
        <EmptyState icon="🚛" title="No vehicles found" description="Add a vehicle to your fleet to get started."/>
      ) : (
        <div className="grid-auto">
          {filtered.map(v=>(
            <div key={v.id} className="card" style={{borderLeft:`3px solid ${statusColor(v.status)}`,padding:16}}>
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700}}>{v.vehicle_number}</span>
                <StatusBadge status={v.status}/>
              </div>

              <div style={{fontSize:12.5,color:'var(--t2)',marginBottom:3}}>👤 {v.driver_name||<span style={{color:'var(--t3)'}}>Unassigned</span>}</div>
              <div style={{fontSize:11,color:'var(--t3)',marginBottom:12}}>📦 {v.cargo_type}</div>

              {/* Stats grid */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:12}}>
                {[
                  {l:'Drive Remaining', v:`${Math.floor(v.drive_remaining_minutes/60)}h ${v.drive_remaining_minutes%60}m`, c:hosColor(v.drive_remaining_minutes)},
                  {l:'Fuel Level',      v:`${v.fuel_percent}%`,  c:fuelColor(v.fuel_percent)},
                  {l:'ELD Status',      v:v.eld_status,          c:v.eld_status==='Malfunction'?'#f87171':'#5eead4'},
                  {l:'Speed',           v:`${v.speed_mph} mph`,  c:'var(--t1)'},
                ].map(s=>(
                  <div key={s.l} style={{background:'rgba(255,255,255,0.03)',borderRadius:7,padding:8}}>
                    <div style={{fontSize:9.5,color:'var(--t3)',marginBottom:2}}>{s.l}</div>
                    <div className="mono" style={{fontSize:12,color:s.c}}>{s.v}</div>
                  </div>
                ))}
              </div>

              {/* Fuel bar */}
              <div style={{marginBottom:4}}>
                <div className="flex justify-between mb-4" style={{fontSize:9.5,color:'var(--t3)'}}>
                  <span>Fuel</span><span>{v.fuel_percent}%</span>
                </div>
                <ProgressBar value={v.fuel_percent} color={fuelColor(v.fuel_percent)}/>
              </div>

              {v.eld_status==='Malfunction' && (
                <div style={{marginTop:10,padding:'5px 10px',borderRadius:6,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.18)',fontSize:10.5,color:'#f87171'}}>
                  ⚠ ELD Malfunction — manual log required
                </div>
              )}
              {v.drive_remaining_minutes < 60 && (
                <div style={{marginTop:6,padding:'5px 10px',borderRadius:6,background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.18)',fontSize:10.5,color:'#fbbf24'}}>
                  ⏱ HOS ALERT — {v.drive_remaining_minutes} min remaining
                </div>
              )}

              <div className="flex gap-6 mt-12">
                <button className="btn btn-ghost btn-sm" style={{flex:1}} onClick={()=>openEdit(v)}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(v)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit/Add Modal */}
      {showModal && (
        <Modal title={editVeh?`EDIT — ${editVeh.vehicle_number}`:'ADD VEHICLE'} onClose={()=>setShow(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Vehicle Number"><input className="input" readOnly={!!editVeh} value={form.vehicle_number} onChange={e=>setForm(p=>({...p,vehicle_number:e.target.value}))}/></Field>
                <Field label="Driver Name"><input className="input" placeholder="Full name" value={form.driver_name} onChange={e=>setForm(p=>({...p,driver_name:e.target.value}))}/></Field>
                <Field label="Status"><select className="input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{VEH_STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="ELD Status"><select className="input" value={form.eld_status} onChange={e=>setForm(p=>({...p,eld_status:e.target.value}))}>{ELD_OPTS.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="HOS Status"><select className="input" value={form.hos_status} onChange={e=>setForm(p=>({...p,hos_status:e.target.value}))}>{HOS_OPTS.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="Cargo Type"><select className="input" value={form.cargo_type} onChange={e=>setForm(p=>({...p,cargo_type:e.target.value}))}>{CARGO_TYPES.map(c=><option key={c}>{c}</option>)}</select></Field>
                <Field label="Fuel (%)"><input className="input" type="number" min="0" max="100" value={form.fuel_percent} onChange={e=>setForm(p=>({...p,fuel_percent:e.target.value}))}/></Field>
                <Field label="Drive Remaining (min)"><input className="input" type="number" min="0" max="660" value={form.drive_remaining_minutes} onChange={e=>setForm(p=>({...p,drive_remaining_minutes:e.target.value}))}/></Field>
                <Field label="Speed (mph)"><input className="input" type="number" min="0" value={form.speed_mph} onChange={e=>setForm(p=>({...p,speed_mph:e.target.value}))}/></Field>
                <Field label="Odometer (mi)"><input className="input" type="number" min="0" value={form.odometer_miles} onChange={e=>setForm(p=>({...p,odometer_miles:e.target.value}))}/></Field>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<Spinner/>:editVeh?'Update Vehicle':'Add Vehicle'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Dispatch Modal */}
      {showDispatch && (
        <Modal title="DISPATCH VEHICLE" onClose={()=>setDispatch(false)} size="sm">
          <form onSubmit={handleDispatch}>
            <div className="modal-body">
              <Field label="Select Vehicle *">
                <select className="input" value={dispForm.vehicle_id} onChange={e=>setDF(p=>({...p,vehicle_id:e.target.value}))} required>
                  <option value="">— choose vehicle —</option>
                  {vehicles.filter(v=>v.status!=='Moving').map(v=><option key={v.id} value={v.vehicle_number}>{v.vehicle_number} · {v.driver_name||'Unassigned'}</option>)}
                </select>
              </Field>
              <Field label="Destination *" className="mt-4"><input className="input" placeholder="USDETROIT" value={dispForm.destination} onChange={e=>setDF(p=>({...p,destination:e.target.value}))} required/></Field>
              <Field label="Cargo Type" className="mt-4"><select className="input" value={dispForm.cargo_type} onChange={e=>setDF(p=>({...p,cargo_type:e.target.value}))}>{CARGO_TYPES.map(c=><option key={c}>{c}</option>)}</select></Field>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setDispatch(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<Spinner/>:'⚡ Dispatch Now'}</button>
            </div>
          </form>
        </Modal>
      )}
      {ConfirmEl}
    </div>
  );
}
