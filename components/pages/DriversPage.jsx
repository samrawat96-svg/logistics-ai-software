'use client';
import { useState, useEffect, useMemo } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { toast, Modal, StatusBadge, Field, EmptyState, Spinner, SkeletonTable, PageHeader, useConfirm, ProgressBar } from '@/components/ui';

const ELD_OPTS = ['Connected','Malfunction','Data Transfer'];
const HOS_OPTS = ['D','ON','SB','OFF'];
const HOS_LABELS = {D:'Driving',ON:'On Duty',SB:'Sleeper Berth',OFF:'Off Duty'};
const BLANK = {driver_number:'',full_name:'',cdl_license:'',eld_status:'Connected',hos_status:'OFF',drive_remaining_minutes:660,safety_score:95,vehicle_number:'',status:'Active'};

export default function DriversPage({ searchQuery }) {
  const [drivers,   setDrivers] = useState([]);
  const [loading,   setLoading] = useState(true);
  const [showModal, setShow]    = useState(false);
  const [editDrv,   setEdit]    = useState(null);
  const [saving,    setSaving]  = useState(false);
  const [form,      setForm]    = useState(BLANK);
  const [confirm, ConfirmEl]    = useConfirm();

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    try { setDrivers(await fetchAll('drivers',{order:'driver_number',asc:true})); }
    catch { toast('Failed to load drivers','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `DRV-${String(drivers.length+1).padStart(3,'0')}`;
    const lic = `CDL-A-${100000+Math.floor(Math.random()*899999)}`;
    setForm({...BLANK,driver_number:num,cdl_license:lic});
    setEdit(null); setShow(true);
  }
  function openEdit(d) {
    setForm({driver_number:d.driver_number,full_name:d.full_name,cdl_license:d.cdl_license||'',eld_status:d.eld_status,hos_status:d.hos_status,drive_remaining_minutes:d.drive_remaining_minutes,safety_score:d.safety_score,vehicle_number:d.vehicle_number||'',status:d.status});
    setEdit(d); setShow(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if(!form.full_name){toast('Driver name required','error');return;}
    setSaving(true);
    try {
      const p = {...form,drive_remaining_minutes:+form.drive_remaining_minutes,safety_score:+form.safety_score};
      if(editDrv){await updateRow('drivers',editDrv.id,p);toast('Driver updated','success');}
      else       {await insertRow('drivers',p);            toast('Driver added','success');}
      setShow(false); load();
    } catch(err){toast(err.message,'error');}
    setSaving(false);
  }

  async function handleDelete(d) {
    const ok = await confirm({title:'Remove Driver',description:`Remove ${d.full_name} from the system?`,confirmText:'Remove',variant:'danger'});
    if(!ok) return;
    try{await deleteRow('drivers',d.id);toast('Driver removed','info');load();}
    catch(err){toast(err.message,'error');}
  }

  const filtered = useMemo(()=>drivers.filter(d=>!searchQuery||`${d.full_name} ${d.driver_number} ${d.status}`.toLowerCase().includes(searchQuery.toLowerCase())),[drivers,searchQuery]);

  const hosColor = m => m<60?'badge-red':m<120?'badge-amber':'badge-green';
  const safeColor = s => s>90?'#14b8a6':s>80?'#a855f7':'#f59e0b';
  const hosAlerts = drivers.filter(d=>d.drive_remaining_minutes<60).length;

  return (
    <div>
      <PageHeader
        title="DRIVER MANAGEMENT"
        subtitle={`${drivers.length} drivers · ${hosAlerts} HOS alerts · Hours-of-Service tracking`}
        actions={<button className="btn btn-primary" onClick={openNew}>+ Add Driver</button>}
      />

      {hosAlerts > 0 && (
        <div className="card-sm mb-16" style={{borderLeft:'3px solid #f59e0b',background:'rgba(245,158,11,0.07)',border:'1px solid rgba(245,158,11,0.18)'}}>
          <span style={{fontSize:12,color:'#fbbf24'}}>⏱ <strong>{hosAlerts} driver{hosAlerts>1?'s':''}</strong> approaching HOS limit — dispatch relay drivers</span>
        </div>
      )}

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          {loading ? <SkeletonTable rows={8} cols={8}/> : filtered.length===0 ? (
            <EmptyState icon="👤" title="No drivers found" description="Add a driver to start tracking Hours of Service."/>
          ) : (
            <table className="dt">
              <thead><tr><th>Driver</th><th>CDL License</th><th>ELD</th><th>HOS Status</th><th>Drive Remaining</th><th>Safety Score</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(d=>(
                  <tr key={d.id}>
                    <td>
                      <div style={{fontWeight:600,fontSize:13}}>{d.full_name}</div>
                      <div className="mono" style={{color:'var(--t3)',fontSize:10}}>{d.driver_number}</div>
                    </td>
                    <td className="mono" style={{fontSize:11}}>{d.cdl_license}</td>
                    <td>
                      <span className={`badge ${d.eld_status==='Connected'?'badge-green':d.eld_status==='Malfunction'?'badge-red':'badge-amber'}`}>{d.eld_status}</span>
                    </td>
                    <td>
                      <span className={`badge ${d.hos_status==='D'?'badge-green':d.hos_status==='OFF'?'badge-blue':d.hos_status==='ON'?'badge-amber':'badge-violet'}`}>
                        {HOS_LABELS[d.hos_status]||d.hos_status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-8">
                        <span className={`badge ${hosColor(d.drive_remaining_minutes)}`} style={{fontSize:11,padding:'2px 7px'}}>
                          {Math.floor(d.drive_remaining_minutes/60)}h {d.drive_remaining_minutes%60}m
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-8">
                        <div style={{width:50}}><ProgressBar value={d.safety_score} color={safeColor(d.safety_score)}/></div>
                        <span className="mono" style={{fontSize:11,color:safeColor(d.safety_score)}}>{Number(d.safety_score).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="mono" style={{color:'#a78bfa'}}>{d.vehicle_number||'—'}</td>
                    <td><StatusBadge status={d.status}/></td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(d)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(d)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal title={editDrv?`EDIT — ${editDrv.full_name}`:'ADD DRIVER'} onClose={()=>setShow(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Driver Number"><input className="input" readOnly={!!editDrv} value={form.driver_number} onChange={e=>setForm(p=>({...p,driver_number:e.target.value}))}/></Field>
                <Field label="Full Name *"><input className="input" placeholder="Full name" value={form.full_name} onChange={e=>setForm(p=>({...p,full_name:e.target.value}))} required/></Field>
                <Field label="CDL License"><input className="input" value={form.cdl_license} onChange={e=>setForm(p=>({...p,cdl_license:e.target.value}))}/></Field>
                <Field label="ELD Status"><select className="input" value={form.eld_status} onChange={e=>setForm(p=>({...p,eld_status:e.target.value}))}>{ELD_OPTS.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="HOS Status"><select className="input" value={form.hos_status} onChange={e=>setForm(p=>({...p,hos_status:e.target.value}))}>{HOS_OPTS.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="Status"><select className="input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option>Active</option><option>Off Duty</option></select></Field>
                <Field label="Drive Remaining (min)"><input className="input" type="number" min="0" max="660" value={form.drive_remaining_minutes} onChange={e=>setForm(p=>({...p,drive_remaining_minutes:e.target.value}))}/></Field>
                <Field label="Safety Score (0–100)"><input className="input" type="number" min="0" max="100" step="0.1" value={form.safety_score} onChange={e=>setForm(p=>({...p,safety_score:e.target.value}))}/></Field>
                <Field label="Assigned Vehicle"><input className="input" placeholder="TRK-0001" value={form.vehicle_number} onChange={e=>setForm(p=>({...p,vehicle_number:e.target.value}))}/></Field>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<Spinner/>:editDrv?'Update Driver':'Add Driver'}</button>
            </div>
          </form>
        </Modal>
      )}
      {ConfirmEl}
    </div>
  );
}
