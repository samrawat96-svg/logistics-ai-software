'use client';
import { useState, useEffect, useMemo } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { toast, Modal, StatusBadge, TierBadge, Field, EmptyState, Spinner, SkeletonTable, PageHeader, useConfirm } from '@/components/ui';

const STATUSES = ['Pending','Processing','In Transit','Delayed','Delivered'];
const TIERS    = ['Platinum','Gold','Standard'];

function validate(f) {
  const e = {};
  if (!f.customer_name?.trim()) e.customer_name = 'Required';
  if (!f.origin?.trim())        e.origin = 'Required';
  if (!f.destination?.trim())   e.destination = 'Required';
  return e;
}

export default function OrdersPage({ searchQuery }) {
  const [orders,    setOrders]  = useState([]);
  const [loading,   setLoading] = useState(true);
  const [filter,    setFilter]  = useState('all');
  const [showModal, setShow]    = useState(false);
  const [editRow,   setEditRow] = useState(null);
  const [saving,    setSaving]  = useState(false);
  const [errors,    setErrors]  = useState({});
  const [sortCol,   setSort]    = useState('created_at');
  const [sortAsc,   setSortAsc] = useState(false);
  const [confirm, ConfirmEl]    = useConfirm();

  const BLANK = { order_number:'', customer_name:'', sla_tier:'Standard', origin:'', destination:'', items:1, weight_kg:0, status:'Pending', eta:'', notes:'' };
  const [form, setForm] = useState(BLANK);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setOrders(await fetchAll('orders',{order:'created_at'})); }
    catch { toast('Failed to load orders','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `ORD-${8000+Math.floor(Math.random()*1000)}`;
    setForm({...BLANK, order_number:num});
    setEditRow(null); setErrors({}); setShow(true);
  }
  function openEdit(o) {
    setForm({order_number:o.order_number, customer_name:o.customer_name, sla_tier:o.sla_tier, origin:o.origin, destination:o.destination, items:o.items, weight_kg:o.weight_kg, status:o.status, eta:o.eta||'', notes:o.notes||''});
    setEditRow(o); setErrors({}); setShow(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      if (editRow) { await updateRow('orders',editRow.id,form); toast('Order updated','success'); }
      else         { await insertRow('orders',form);            toast('Order created','success'); }
      setShow(false); load();
    } catch(err) { toast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(o) {
    const ok = await confirm({ title:'Delete Order', description:`Remove ${o.order_number} permanently? This cannot be undone.`, confirmText:'Delete', variant:'danger' });
    if (!ok) return;
    try { await deleteRow('orders',o.id); toast('Order deleted','info'); load(); }
    catch(err) { toast(err.message,'error'); }
  }

  async function quickStatus(o, status) {
    try { await updateRow('orders',o.id,{status}); toast(`${o.order_number} → ${status}`,'success'); load(); }
    catch(err) { toast(err.message,'error'); }
  }

  const field = (k) => ({ name:k, value:form[k], onChange:e=>{ setForm(p=>({...p,[k]:e.target.value})); setErrors(p=>({...p,[k]:undefined})); }, error:errors[k] });

  function toggleSort(col) {
    if (sortCol===col) setSortAsc(v=>!v);
    else { setSort(col); setSortAsc(true); }
  }

  const filtered = useMemo(() => {
    let rows = orders.filter(o => {
      const mf = filter==='all' || o.status===filter;
      const ms = !searchQuery || `${o.order_number} ${o.customer_name} ${o.status}`.toLowerCase().includes(searchQuery.toLowerCase());
      return mf && ms;
    });
    rows.sort((a,b) => {
      const va = a[sortCol]??''; const vb = b[sortCol]??'';
      return sortAsc ? (va>vb?1:-1) : (va<vb?1:-1);
    });
    return rows;
  }, [orders, filter, searchQuery, sortCol, sortAsc]);

  const counts = useMemo(()=> STATUSES.reduce((acc,s)=>({...acc,[s]:orders.filter(o=>o.status===s).length}),{}), [orders]);

  const Th = ({col, label}) => (
    <th className="sortable" onClick={()=>toggleSort(col)}>
      {label} {sortCol===col ? (sortAsc?'↑':'↓') : <span style={{opacity:0.3}}>↕</span>}
    </th>
  );

  return (
    <div>
      <PageHeader
        title="ORDER MANAGEMENT"
        subtitle={`${orders.length} total · ${counts['Pending']||0} pending · ${counts['Delayed']||0} delayed`}
        actions={
          <>
            <select className="input" style={{width:150,fontSize:12,padding:'6px 10px'}} value={filter} onChange={e=>setFilter(e.target.value)}>
              <option value="all">All Status</option>
              {STATUSES.map(s=><option key={s} value={s}>{s} ({counts[s]||0})</option>)}
            </select>
            <button className="btn btn-primary" onClick={openNew}>
              <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
              New Order
            </button>
          </>
        }
      />

      {/* Status filter pills */}
      <div className="flex gap-6 mb-16" style={{flexWrap:'wrap'}}>
        {['all',...STATUSES].map(s=>{
          const active = filter===s;
          const cnt = s==='all' ? orders.length : counts[s]||0;
          return (
            <button key={s} onClick={()=>setFilter(s)}
              className={`btn btn-sm ${active?'btn-primary':'btn-ghost'}`}
              style={{borderRadius:20}}>
              {s==='all'?'All':s} <span style={{opacity:0.7,marginLeft:3}}>({cnt})</span>
            </button>
          );
        })}
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          {loading ? <SkeletonTable rows={8} cols={9}/> : filtered.length === 0 ? (
            <EmptyState icon="📋" title="No orders found" description="Try changing the filter or create a new order." action={<button className="btn btn-primary btn-sm" onClick={openNew}>+ New Order</button>}/>
          ) : (
            <table className="dt">
              <thead>
                <tr>
                  <Th col="order_number" label="Order ID"/>
                  <Th col="customer_name" label="Customer"/>
                  <th>SLA</th>
                  <Th col="origin" label="Origin"/>
                  <Th col="destination" label="Destination"/>
                  <th>Items</th>
                  <th>Weight</th>
                  <th>Status</th>
                  <Th col="eta" label="ETA"/>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o=>(
                  <tr key={o.id}>
                    <td className="mono" style={{color:'#a78bfa',fontWeight:600}}>{o.order_number}</td>
                    <td style={{fontWeight:500,maxWidth:160}} className="truncate">{o.customer_name}</td>
                    <td><TierBadge tier={o.sla_tier}/></td>
                    <td className="mono" style={{fontSize:11}}>{o.origin}</td>
                    <td className="mono" style={{fontSize:11}}>{o.destination}</td>
                    <td className="mono">{o.items}</td>
                    <td className="mono">{Number(o.weight_kg).toLocaleString()} kg</td>
                    <td>
                      <select
                        className="badge"
                        style={{cursor:'pointer',background:'transparent',border:'none',color:'inherit',fontSize:10.5,fontWeight:600,outline:'none',appearance:'auto'}}
                        value={o.status}
                        onChange={e=>quickStatus(o,e.target.value)}
                      >
                        {STATUSES.map(s=><option key={s} value={s} style={{background:'#130d1c'}}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{fontSize:12,color:'var(--t2)'}}>{o.eta||'—'}</td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(o)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(o)}>Del</button>
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
        <Modal title={editRow?`EDIT — ${editRow.order_number}`:'NEW ORDER'} onClose={()=>setShow(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Order Number"><input readOnly className="input" {...field('order_number')}/></Field>
                <Field label="Customer Name *" error={errors.customer_name}><input className="input" placeholder="Company name" {...field('customer_name')}/></Field>
                <Field label="SLA Tier"><select className="input" {...field('sla_tier')}>{TIERS.map(t=><option key={t}>{t}</option>)}</select></Field>
                <Field label="Status"><select className="input" {...field('status')}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></Field>
                <Field label="Origin *" error={errors.origin}><input className="input" placeholder="CHICAGO" {...field('origin')}/></Field>
                <Field label="Destination *" error={errors.destination}><input className="input" placeholder="DETROIT" {...field('destination')}/></Field>
                <Field label="Items"><input className="input" type="number" min="1" {...field('items')} onChange={e=>setForm(p=>({...p,items:parseInt(e.target.value)||1}))}/></Field>
                <Field label="Weight (kg)"><input className="input" type="number" min="0" {...field('weight_kg')} onChange={e=>setForm(p=>({...p,weight_kg:parseFloat(e.target.value)||0}))}/></Field>
                <Field label="ETA"><input className="input" type="date" {...field('eta')}/></Field>
              </div>
              <Field label="Notes" className="mt-4" style={{marginTop:14}}><textarea className="input" rows={2} {...field('notes')}/></Field>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <Spinner/> : editRow ? 'Update Order' : 'Create Order'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {ConfirmEl}
    </div>
  );
}
