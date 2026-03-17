'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { showToast, Modal, StatusBadge, FormRow, EmptyState, Spinner } from '@/components/ui';

const STATUSES = ['Booked','In Transit','Gate In','Customs Hold','Gate Out','POD Signed'];
const CARRIERS = ['USX','FDX','UPSF','CNWY','ABFS','RDWY','HNRY','DAFG','EXLA'];
const INCOS = ['FOB','DDP','DAP','EXW','FCA','CPT'];

function CSVExport(rows) {
  const headers = ['BOL#','SCAC','Incoterms','Origin','Destination','Vehicle','ETA','Temp Alert','Status'];
  const csv = [headers, ...rows.map(s => [s.bol_number,s.scac,s.incoterms,s.origin,s.destination,s.vehicle_id||'',s.eta||'',s.temp_alert?'YES':'',s.status])].map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'shipments.csv'; a.click();
}

export default function ShipmentsPage({ searchQuery }) {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editShip, setEditShip] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ bol_number:'', scac:'USX', incoterms:'FOB', origin:'', destination:'', vehicle_id:'', eta:'', temp_celsius:'', temp_alert:false, status:'Booked' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setShipments(await fetchAll('shipments', { order:'created_at' })); } catch { showToast('Failed to load shipments','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `BOL-${2024000 + Math.floor(Math.random()*999)}`;
    setForm({ bol_number:num, scac:'USX', incoterms:'FOB', origin:'', destination:'', vehicle_id:'', eta:'', temp_celsius:'', temp_alert:false, status:'Booked' });
    setEditShip(null); setShowModal(true);
  }

  function openEdit(s) {
    setForm({ bol_number:s.bol_number, scac:s.scac, incoterms:s.incoterms, origin:s.origin, destination:s.destination, vehicle_id:s.vehicle_id||'', eta:s.eta||'', temp_celsius:s.temp_celsius||'', temp_alert:s.temp_alert||false, status:s.status });
    setEditShip(s); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.origin || !form.destination) { showToast('Fill required fields','error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, temp_celsius: form.temp_celsius === '' ? null : parseFloat(form.temp_celsius) };
      if (editShip) { await updateRow('shipments', editShip.id, payload); showToast('Shipment updated','success'); }
      else { await insertRow('shipments', payload); showToast('Shipment created','success'); }
      setShowModal(false); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(s) {
    if (!confirm(`Delete ${s.bol_number}?`)) return;
    try { await deleteRow('shipments', s.id); showToast('Shipment deleted','info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  const filtered = shipments.filter(s => !searchQuery || s.bol_number?.toLowerCase().includes(searchQuery.toLowerCase()) || s.scac?.toLowerCase().includes(searchQuery.toLowerCase()) || s.status?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>SHIPMENT TRACKER</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{shipments.length} active · {shipments.filter(s=>s.status==='Customs Hold').length} in customs · {shipments.filter(s=>s.temp_alert).length} temperature alerts</div>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <button className="btn-g" onClick={()=>CSVExport(filtered)}>⬇ Export CSV</button>
          <button className="btn-p" onClick={openNew}>+ New Shipment</button>
        </div>
      </div>

      <div className="gl" style={{ borderRadius:14, overflow:'hidden' }}>
        <div className="tbl-wrap">
          {loading ? <div style={{ padding:40, textAlign:'center' }}><Spinner /></div> : (
            <table className="dt">
              <thead><tr><th>BOL #</th><th>SCAC</th><th>Incoterms</th><th>Origin</th><th>Destination</th><th>Vehicle</th><th>ETA</th><th>Temp</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={10}><EmptyState message="No shipments found" /></td></tr> : filtered.map(s=>(
                  <tr key={s.id}>
                    <td className="mono" style={{ color:'#a78bfa' }}>{s.bol_number}</td>
                    <td className="mono" style={{ color:'#5eead4', fontWeight:600 }}>{s.scac}</td>
                    <td className="mono">{s.incoterms}</td>
                    <td className="mono" style={{ fontSize:11 }}>{s.origin}</td>
                    <td className="mono" style={{ fontSize:11 }}>{s.destination}</td>
                    <td className="mono" style={{ color:'#a78bfa' }}>{s.vehicle_id || '—'}</td>
                    <td style={{ fontSize:11.5, color:'var(--t2)' }}>{s.eta || '—'}</td>
                    <td>{s.temp_alert ? <span className="bdg bg-r">⚠ +{s.temp_celsius}°C</span> : <span style={{ color:'var(--t3)' }}>—</span>}</td>
                    <td><StatusBadge status={s.status} /></td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn-g" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>openEdit(s)}>Edit</button>
                        <button className="btn-danger" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>handleDelete(s)}>Del</button>
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
        <Modal title={editShip ? `EDIT SHIPMENT — ${editShip.bol_number}` : 'NEW SHIPMENT'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="BOL Number"><input className="g-input" value={form.bol_number} onChange={e=>setForm({...form,bol_number:e.target.value})} readOnly={!!editShip} /></FormRow>
              <FormRow label="SCAC Carrier"><select className="g-input" value={form.scac} onChange={e=>setForm({...form,scac:e.target.value})}>{CARRIERS.map(c=><option key={c}>{c}</option>)}</select></FormRow>
              <FormRow label="Incoterms"><select className="g-input" value={form.incoterms} onChange={e=>setForm({...form,incoterms:e.target.value})}>{INCOS.map(c=><option key={c}>{c}</option>)}</select></FormRow>
              <FormRow label="Status"><select className="g-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="Origin *"><input className="g-input" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} placeholder="USCHICAGO" required /></FormRow>
              <FormRow label="Destination *"><input className="g-input" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="USDETROIT" required /></FormRow>
              <FormRow label="Vehicle ID"><input className="g-input" value={form.vehicle_id} onChange={e=>setForm({...form,vehicle_id:e.target.value})} placeholder="TRK-0001" /></FormRow>
              <FormRow label="ETA"><input className="g-input" type="date" value={form.eta} onChange={e=>setForm({...form,eta:e.target.value})} /></FormRow>
              <FormRow label="Temp (°C)"><input className="g-input" type="number" step="0.1" value={form.temp_celsius} onChange={e=>setForm({...form,temp_celsius:e.target.value})} placeholder="e.g. -2.0" /></FormRow>
              <FormRow label="Temp Alert">
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', paddingTop:4 }}>
                  <input type="checkbox" checked={form.temp_alert} onChange={e=>setForm({...form,temp_alert:e.target.checked})} />
                  <span style={{ fontSize:12, color:'var(--t2)' }}>Flag temperature breach</span>
                </label>
              </FormRow>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : editShip ? 'Update' : 'Create Shipment'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
