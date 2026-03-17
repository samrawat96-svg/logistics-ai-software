'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { showToast, Modal, StatusBadge, FormRow, EmptyState, Spinner, ProgressBar } from '@/components/ui';

const ELD_OPTS = ['Connected','Malfunction','Data Transfer'];
const HOS_OPTS = ['D','ON','SB','OFF'];
const HOS_LABELS = { D:'Driving', ON:'On Duty', SB:'Sleeper Berth', OFF:'Off Duty' };

export default function DriversPage({ searchQuery }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ driver_number:'', full_name:'', cdl_license:'', eld_status:'Connected', hos_status:'OFF', drive_remaining_minutes:660, safety_score:95, vehicle_number:'', status:'Active' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setDrivers(await fetchAll('drivers', { order:'driver_number', asc:true })); } catch { showToast('Failed to load drivers','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `DRV-${String(drivers.length + 1).padStart(3,'0')}`;
    const lic = `CDL-A-${100000 + Math.floor(Math.random()*899999)}`;
    setForm({ driver_number:num, full_name:'', cdl_license:lic, eld_status:'Connected', hos_status:'OFF', drive_remaining_minutes:660, safety_score:95, vehicle_number:'', status:'Active' });
    setEditDriver(null); setShowModal(true);
  }

  function openEdit(d) {
    setForm({ driver_number:d.driver_number, full_name:d.full_name, cdl_license:d.cdl_license||'', eld_status:d.eld_status, hos_status:d.hos_status, drive_remaining_minutes:d.drive_remaining_minutes, safety_score:d.safety_score, vehicle_number:d.vehicle_number||'', status:d.status });
    setEditDriver(d); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.full_name) { showToast('Driver name required','error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, drive_remaining_minutes:parseInt(form.drive_remaining_minutes), safety_score:parseFloat(form.safety_score) };
      if (editDriver) { await updateRow('drivers', editDriver.id, payload); showToast('Driver updated','success'); }
      else { await insertRow('drivers', payload); showToast('Driver added','success'); }
      setShowModal(false); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(d) {
    if (!confirm(`Remove driver ${d.full_name}?`)) return;
    try { await deleteRow('drivers', d.id); showToast('Driver removed','info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  const filtered = drivers.filter(d => !searchQuery || d.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || d.driver_number?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>DRIVER MANAGEMENT</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{drivers.length} drivers · {drivers.filter(d=>d.drive_remaining_minutes<60).length} HOS alerts · Hours of service tracking</div>
        </div>
        <button className="btn-p" onClick={openNew}>+ Add Driver</button>
      </div>

      <div className="gl" style={{ borderRadius:14, overflow:'hidden' }}>
        <div className="tbl-wrap">
          {loading ? <div style={{ padding:40, textAlign:'center' }}><Spinner /></div> : (
            <table className="dt">
              <thead><tr><th>Driver</th><th>CDL License</th><th>ELD</th><th>HOS Status</th><th>Drive Remaining</th><th>Safety Score</th><th>Vehicle</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={9}><EmptyState message="No drivers found" /></td></tr> : filtered.map(d=>(
                  <tr key={d.id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{d.full_name}</div>
                      <div className="mono" style={{ color:'var(--t3)', fontSize:10 }}>{d.driver_number}</div>
                    </td>
                    <td className="mono">{d.cdl_license}</td>
                    <td><StatusBadge status={d.eld_status === 'Connected' ? 'Connected' : d.eld_status} /></td>
                    <td><span className={`bdg ${d.hos_status==='D'?'bg-g':d.hos_status==='OFF'?'bg-b':'bg-a'}`}>{HOS_LABELS[d.hos_status]||d.hos_status}</span></td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <span className="mono" style={{ color:d.drive_remaining_minutes<60?'#f87171':'#5eead4' }}>{Math.floor(d.drive_remaining_minutes/60)}h {d.drive_remaining_minutes%60}m</span>
                        {d.drive_remaining_minutes < 60 && <span className="bdg bg-r" style={{ fontSize:9 }}>HOS ALERT</span>}
                      </div>
                    </td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:55 }}><ProgressBar value={d.safety_score} color={d.safety_score>90?'#14b8a6':d.safety_score>80?'#a855f7':'#f59e0b'} /></div>
                        <span className="mono" style={{ fontSize:11 }}>{d.safety_score}</span>
                      </div>
                    </td>
                    <td className="mono" style={{ color:'#a78bfa' }}>{d.vehicle_number||'—'}</td>
                    <td><StatusBadge status={d.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn-g" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>openEdit(d)}>Edit</button>
                        <button className="btn-danger" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>handleDelete(d)}>Del</button>
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
        <Modal title={editDriver ? `EDIT DRIVER — ${editDriver.driver_number}` : 'ADD DRIVER'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="Driver Number"><input className="g-input" value={form.driver_number} onChange={e=>setForm({...form,driver_number:e.target.value})} readOnly={!!editDriver} /></FormRow>
              <FormRow label="Full Name *"><input className="g-input" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required /></FormRow>
              <FormRow label="CDL License"><input className="g-input" value={form.cdl_license} onChange={e=>setForm({...form,cdl_license:e.target.value})} /></FormRow>
              <FormRow label="ELD Status"><select className="g-input" value={form.eld_status} onChange={e=>setForm({...form,eld_status:e.target.value})}>{ELD_OPTS.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="HOS Status"><select className="g-input" value={form.hos_status} onChange={e=>setForm({...form,hos_status:e.target.value})}>{HOS_OPTS.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="Status"><select className="g-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>Off Duty</option></select></FormRow>
              <FormRow label="Drive Remaining (min)"><input className="g-input" type="number" min="0" max="660" value={form.drive_remaining_minutes} onChange={e=>setForm({...form,drive_remaining_minutes:e.target.value})} /></FormRow>
              <FormRow label="Safety Score"><input className="g-input" type="number" min="0" max="100" step="0.1" value={form.safety_score} onChange={e=>setForm({...form,safety_score:e.target.value})} /></FormRow>
              <FormRow label="Assigned Vehicle"><input className="g-input" value={form.vehicle_number} onChange={e=>setForm({...form,vehicle_number:e.target.value})} placeholder="TRK-0001" /></FormRow>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : editDriver ? 'Update Driver' : 'Add Driver'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
