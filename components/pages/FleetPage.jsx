'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { showToast, Modal, StatusBadge, FormRow, EmptyState, Spinner, ProgressBar } from '@/components/ui';

const STATUSES = ['Moving','Stopped','Alert'];
const ELD_OPTS = ['Connected','Malfunction','Data Transfer'];
const HOS_OPTS = ['D','ON','SB','OFF'];
const CARGO_TYPES = ['Electronics','Auto Parts','Pharma·Cold Chain','Foodstuff','Hazmat','General Freight','Reefer·Produce'];

export default function FleetPage({ searchQuery }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [editVeh, setEditVeh] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ vehicle_number:'', vin:'', driver_name:'', eld_status:'Connected', hos_status:'OFF', drive_remaining_minutes:660, fuel_percent:100, odometer_miles:0, status:'Stopped', cargo_type:'General Freight', speed_mph:0, latitude:'', longitude:'' });
  const [dispatchForm, setDispatchForm] = useState({ vehicle_id:'', destination:'', cargo_type:'General Freight', notes:'' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setVehicles(await fetchAll('vehicles', { order:'vehicle_number', asc:true })); } catch { showToast('Failed to load fleet','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `TRK-${String(vehicles.length + 1).padStart(4,'0')}`;
    setForm({ vehicle_number:num, vin:`1HTMM${Math.random().toString().slice(2,12)}`, driver_name:'', eld_status:'Connected', hos_status:'OFF', drive_remaining_minutes:660, fuel_percent:100, odometer_miles:0, status:'Stopped', cargo_type:'General Freight', speed_mph:0, latitude:'', longitude:'' });
    setEditVeh(null); setShowModal(true);
  }

  function openEdit(v) {
    setForm({ vehicle_number:v.vehicle_number, vin:v.vin||'', driver_name:v.driver_name||'', eld_status:v.eld_status, hos_status:v.hos_status, drive_remaining_minutes:v.drive_remaining_minutes, fuel_percent:v.fuel_percent, odometer_miles:v.odometer_miles, status:v.status, cargo_type:v.cargo_type||'General Freight', speed_mph:v.speed_mph||0, latitude:v.latitude||'', longitude:v.longitude||'' });
    setEditVeh(v); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.vehicle_number) { showToast('Vehicle number required','error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, fuel_percent:parseFloat(form.fuel_percent), drive_remaining_minutes:parseInt(form.drive_remaining_minutes), odometer_miles:parseInt(form.odometer_miles), speed_mph:parseInt(form.speed_mph), latitude:form.latitude?parseFloat(form.latitude):null, longitude:form.longitude?parseFloat(form.longitude):null };
      if (editVeh) { await updateRow('vehicles', editVeh.id, payload); showToast('Vehicle updated','success'); }
      else { await insertRow('vehicles', payload); showToast('Vehicle added to fleet','success'); }
      setShowModal(false); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(v) {
    if (!confirm(`Remove ${v.vehicle_number} from fleet?`)) return;
    try { await deleteRow('vehicles', v.id); showToast('Vehicle removed','info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  async function handleDispatch(e) {
    e.preventDefault();
    const v = vehicles.find(x => x.vehicle_number === dispatchForm.vehicle_id);
    if (!v) { showToast('Select a vehicle','error'); return; }
    setSaving(true);
    try {
      await updateRow('vehicles', v.id, { status:'Moving', cargo_type:dispatchForm.cargo_type });
      await insertRow('shipments', { bol_number:`BOL-${Date.now()}-D`, scac:'USX', incoterms:'FOB', origin:'DISPATCH', destination:dispatchForm.destination, vehicle_id:dispatchForm.vehicle_id, status:'Booked' });
      showToast(`${v.vehicle_number} dispatched to ${dispatchForm.destination}`,'success');
      setShowDispatchModal(false); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  const filtered = vehicles.filter(v => !searchQuery || v.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) || v.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>FLEET MANAGEMENT</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{vehicles.length} vehicles · {vehicles.filter(v=>v.status==='Moving').length} active · ELD mandate compliance</div>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button className="btn-g" onClick={openNew}>+ Add Vehicle</button>
          <button className="btn-p" onClick={()=>setShowDispatchModal(true)}>⚡ Dispatch Vehicle</button>
        </div>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:40 }}><Spinner /></div> : (
        <div className="gauto">
          {filtered.length === 0 ? <EmptyState message="No vehicles found" /> : filtered.map(v=>(
            <div key={v.id} className="gl-card" style={{ borderLeft:`3px solid ${v.status==='Alert'?'#ef4444':v.status==='Stopped'?'#f59e0b':'#14b8a6'}`, padding:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
                <span style={{ fontFamily:"'Orbitron',monospace", fontSize:12, fontWeight:700 }}>{v.vehicle_number}</span>
                <StatusBadge status={v.status} />
              </div>
              <div style={{ fontSize:11.5, color:'var(--t2)', marginBottom:5 }}>👤 {v.driver_name || 'Unassigned'}</div>
              <div style={{ fontSize:10.5, color:'var(--t3)', marginBottom:10 }}>📦 {v.cargo_type}</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:10 }}>
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:6, padding:7 }}>
                  <div style={{ fontSize:9.5, color:'var(--t3)' }}>HOS Remaining</div>
                  <div className="mono" style={{ fontSize:12, color:v.drive_remaining_minutes<60?'#f87171':'#5eead4', marginTop:2 }}>{Math.floor(v.drive_remaining_minutes/60)}h {v.drive_remaining_minutes%60}m</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:6, padding:7 }}>
                  <div style={{ fontSize:9.5, color:'var(--t3)' }}>Fuel Level</div>
                  <div className="mono" style={{ fontSize:12, color:v.fuel_percent<25?'#f87171':v.fuel_percent<50?'#fbbf24':'#a78bfa', marginTop:2 }}>{v.fuel_percent}%</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:6, padding:7 }}>
                  <div style={{ fontSize:9.5, color:'var(--t3)' }}>ELD Status</div>
                  <div className="mono" style={{ fontSize:10, color:v.eld_status==='Malfunction'?'#f87171':'#5eead4', marginTop:2 }}>{v.eld_status}</div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.03)', borderRadius:6, padding:7 }}>
                  <div style={{ fontSize:9.5, color:'var(--t3)' }}>Speed</div>
                  <div className="mono" style={{ fontSize:12, marginTop:2 }}>{v.speed_mph} mph</div>
                </div>
              </div>
              <ProgressBar value={v.fuel_percent} color={v.fuel_percent<25?'#ef4444':v.fuel_percent<50?'#f59e0b':'#14b8a6'} />
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                <button className="btn-g" style={{ flex:1, fontSize:11 }} onClick={()=>openEdit(v)}>Edit</button>
                <button className="btn-danger" style={{ fontSize:11 }} onClick={()=>handleDelete(v)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal title={editVeh ? `EDIT — ${editVeh.vehicle_number}` : 'ADD VEHICLE'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="Vehicle Number"><input className="g-input" value={form.vehicle_number} onChange={e=>setForm({...form,vehicle_number:e.target.value})} readOnly={!!editVeh} /></FormRow>
              <FormRow label="Driver Name"><input className="g-input" value={form.driver_name} onChange={e=>setForm({...form,driver_name:e.target.value})} /></FormRow>
              <FormRow label="Status"><select className="g-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="ELD Status"><select className="g-input" value={form.eld_status} onChange={e=>setForm({...form,eld_status:e.target.value})}>{ELD_OPTS.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="HOS Status"><select className="g-input" value={form.hos_status} onChange={e=>setForm({...form,hos_status:e.target.value})}>{HOS_OPTS.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="Cargo Type"><select className="g-input" value={form.cargo_type} onChange={e=>setForm({...form,cargo_type:e.target.value})}>{CARGO_TYPES.map(c=><option key={c}>{c}</option>)}</select></FormRow>
              <FormRow label="Fuel (%)"><input className="g-input" type="number" min="0" max="100" value={form.fuel_percent} onChange={e=>setForm({...form,fuel_percent:e.target.value})} /></FormRow>
              <FormRow label="Drive Remaining (min)"><input className="g-input" type="number" min="0" max="660" value={form.drive_remaining_minutes} onChange={e=>setForm({...form,drive_remaining_minutes:e.target.value})} /></FormRow>
              <FormRow label="Speed (mph)"><input className="g-input" type="number" min="0" value={form.speed_mph} onChange={e=>setForm({...form,speed_mph:e.target.value})} /></FormRow>
              <FormRow label="Odometer (mi)"><input className="g-input" type="number" min="0" value={form.odometer_miles} onChange={e=>setForm({...form,odometer_miles:e.target.value})} /></FormRow>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : editVeh ? 'Update' : 'Add Vehicle'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDispatchModal && (
        <Modal title="DISPATCH VEHICLE" onClose={()=>setShowDispatchModal(false)}>
          <form onSubmit={handleDispatch}>
            <FormRow label="Select Vehicle *">
              <select className="g-input" value={dispatchForm.vehicle_id} onChange={e=>setDispatchForm({...dispatchForm,vehicle_id:e.target.value})} required>
                <option value="">-- Choose vehicle --</option>
                {vehicles.filter(v=>v.status!=='Moving').map(v=><option key={v.id} value={v.vehicle_number}>{v.vehicle_number} — {v.driver_name||'Unassigned'}</option>)}
              </select>
            </FormRow>
            <FormRow label="Destination *"><input className="g-input" value={dispatchForm.destination} onChange={e=>setDispatchForm({...dispatchForm,destination:e.target.value})} placeholder="e.g. USDETROIT" required /></FormRow>
            <FormRow label="Cargo Type"><select className="g-input" value={dispatchForm.cargo_type} onChange={e=>setDispatchForm({...dispatchForm,cargo_type:e.target.value})}>{CARGO_TYPES.map(c=><option key={c}>{c}</option>)}</select></FormRow>
            <FormRow label="Notes"><textarea className="g-input" value={dispatchForm.notes} onChange={e=>setDispatchForm({...dispatchForm,notes:e.target.value})} style={{ height:60 }} /></FormRow>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowDispatchModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : '⚡ Dispatch'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
