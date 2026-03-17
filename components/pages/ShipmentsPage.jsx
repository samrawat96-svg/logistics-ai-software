'use client';
import { useState, useEffect, useMemo } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { toast, Modal, StatusBadge, Field, EmptyState, Spinner, SkeletonTable, PageHeader, useConfirm } from '@/components/ui';

const STATUSES = ['Booked','In Transit','Gate In','Customs Hold','Gate Out','POD Signed'];
const CARRIERS  = ['USX','FDX','UPSF','CNWY','ABFS','RDWY','HNRY','DAFG','EXLA'];
const INCOS     = ['FOB','DDP','DAP','EXW','FCA','CPT'];

const BLANK = {bol_number:'',scac:'USX',incoterms:'FOB',origin:'',destination:'',vehicle_id:'',eta:'',temp_celsius:'',temp_alert:false,status:'Booked'};

function exportCSV(rows) {
  const h = ['BOL#','SCAC','Incoterms','Origin','Destination','Vehicle','ETA','Temp Alert','Status'];
  const csv = [h,...rows.map(s=>[s.bol_number,s.scac,s.incoterms,s.origin,s.destination,s.vehicle_id||'',s.eta||'',s.temp_alert?'YES':'',s.status])].map(r=>r.join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv],{type:'text/csv'})); a.download='shipments.csv'; a.click();
}

export default function ShipmentsPage({ searchQuery }) {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShow]      = useState(false);
  const [editRow,   setEditRow]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [filterStatus, setFS]     = useState('all');
  const [form, setForm]           = useState(BLANK);
  const [confirm, ConfirmEl]      = useConfirm();

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    try { setShipments(await fetchAll('shipments',{order:'created_at'})); }
    catch { toast('Failed to load shipments','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `BOL-${Date.now().toString().slice(-7)}`;
    setForm({...BLANK,bol_number:num});
    setEditRow(null); setShow(true);
  }
  function openEdit(s) {
    setForm({bol_number:s.bol_number,scac:s.scac,incoterms:s.incoterms,origin:s.origin,destination:s.destination,vehicle_id:s.vehicle_id||'',eta:s.eta||'',temp_celsius:s.temp_celsius??'',temp_alert:s.temp_alert??false,status:s.status});
    setEditRow(s); setShow(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.origin||!form.destination){toast('Fill required fields','error');return;}
    setSaving(true);
    try {
      const payload = {...form, temp_celsius:form.temp_celsius===''?null:parseFloat(form.temp_celsius)};
      if (editRow){await updateRow('shipments',editRow.id,payload);toast('Shipment updated','success');}
      else        {await insertRow('shipments',payload);            toast('Shipment created','success');}
      setShow(false); load();
    } catch(err){toast(err.message,'error');}
    setSaving(false);
  }

  async function handleDelete(s) {
    const ok = await confirm({title:'Delete Shipment',description:`Remove ${s.bol_number} permanently?`,confirmText:'Delete',variant:'danger'});
    if (!ok) return;
    try{await deleteRow('shipments',s.id);toast('Shipment deleted','info');load();}
    catch(err){toast(err.message,'error');}
  }

  const filtered = useMemo(()=>{
    return shipments.filter(s=>{
      const mf = filterStatus==='all' || s.status===filterStatus;
      const ms = !searchQuery || `${s.bol_number} ${s.scac} ${s.status} ${s.origin} ${s.destination}`.toLowerCase().includes(searchQuery.toLowerCase());
      return mf && ms;
    });
  },[shipments,filterStatus,searchQuery]);

  return (
    <div>
      <PageHeader
        title="SHIPMENT TRACKER"
        subtitle={`${shipments.length} shipments · ${shipments.filter(s=>s.status==='Customs Hold').length} in customs · ${shipments.filter(s=>s.temp_alert).length} temp alerts`}
        actions={
          <>
            <select className="input" style={{width:160,fontSize:12,padding:'6px 10px'}} value={filterStatus} onChange={e=>setFS(e.target.value)}>
              <option value="all">All Status</option>
              {STATUSES.map(s=><option key={s}>{s}</option>)}
            </select>
            <button className="btn btn-ghost btn-sm" onClick={()=>exportCSV(filtered)}>⬇ CSV</button>
            <button className="btn btn-primary" onClick={openNew}>+ New Shipment</button>
          </>
        }
      />

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          {loading ? <SkeletonTable rows={8} cols={9}/> : filtered.length===0 ? (
            <EmptyState icon="🚛" title="No shipments found" description="Change the filter or add a new shipment."/>
          ) : (
            <table className="dt">
              <thead><tr><th>BOL #</th><th>SCAC</th><th>Incoterms</th><th>Origin</th><th>Destination</th><th>Vehicle</th><th>ETA</th><th>Temp</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(s=>(
                  <tr key={s.id}>
                    <td className="mono" style={{color:'#a78bfa',fontWeight:600}}>{s.bol_number}</td>
                    <td className="mono" style={{color:'#5eead4',fontWeight:700}}>{s.scac}</td>
                    <td className="mono" style={{fontSize:11}}>{s.incoterms}</td>
                    <td style={{fontSize:11,maxWidth:110}} className="truncate">{s.origin}</td>
                    <td style={{fontSize:11,maxWidth:110}} className="truncate">{s.destination}</td>
                    <td className="mono" style={{color:'#a78bfa'}}>{s.vehicle_id||'—'}</td>
                    <td style={{fontSize:11.5,color:'var(--t2)'}}>{s.eta||'—'}</td>
                    <td>
                      {s.temp_alert
                        ? <span className="badge badge-red">⚠ {s.temp_celsius}°C</span>
                        : <span style={{color:'var(--t3)',fontSize:12}}>—</span>}
                    </td>
                    <td><StatusBadge status={s.status}/></td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(s)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(s)}>Del</button>
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
        <Modal title={editRow?`EDIT — ${editRow.bol_number}`:'NEW SHIPMENT'} onClose={()=>setShow(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="BOL Number"><input className="input" readOnly={!!editRow} value={form.bol_number} onChange={e=>setForm(p=>({...p,bol_number:e.target.value}))}/></Field>
                <Field label="SCAC Carrier"><select className="input" value={form.scac} onChange={e=>setForm(p=>({...p,scac:e.target.value}))}>{CARRIERS.map(c=><option key={c}>{c}</option>)}</select></Field>
                <Field label="Incoterms"><select className="input" value={form.incoterms} onChange={e=>setForm(p=>({...p,incoterms:e.target.value}))}>{INCOS.map(c=><option key={c}>{c}</option>)}</select></Field>
                <Field label="Status"><select className="input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="Origin *"><input className="input" placeholder="USCHICAGO" value={form.origin} onChange={e=>setForm(p=>({...p,origin:e.target.value}))} required/></Field>
                <Field label="Destination *"><input className="input" placeholder="USDETROIT" value={form.destination} onChange={e=>setForm(p=>({...p,destination:e.target.value}))} required/></Field>
                <Field label="Vehicle ID"><input className="input" placeholder="TRK-0001" value={form.vehicle_id} onChange={e=>setForm(p=>({...p,vehicle_id:e.target.value}))}/></Field>
                <Field label="ETA"><input className="input" type="date" value={form.eta} onChange={e=>setForm(p=>({...p,eta:e.target.value}))}/></Field>
                <Field label="Temp (°C)"><input className="input" type="number" step="0.1" placeholder="e.g. -2.0" value={form.temp_celsius} onChange={e=>setForm(p=>({...p,temp_celsius:e.target.value}))}/></Field>
                <Field label="Temp Alert">
                  <div className="flex items-center gap-10" style={{paddingTop:8}}>
                    <input type="checkbox" id="ta" checked={form.temp_alert} onChange={e=>setForm(p=>({...p,temp_alert:e.target.checked}))} style={{width:16,height:16,accentColor:'var(--violet)'}}/>
                    <label htmlFor="ta" style={{fontSize:12.5,color:'var(--t2)',cursor:'pointer'}}>Flag temperature breach</label>
                  </div>
                </Field>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<Spinner/>:editRow?'Update':'Create Shipment'}</button>
            </div>
          </form>
        </Modal>
      )}
      {ConfirmEl}
    </div>
  );
}
