'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow, supabase } from '@/lib/supabase';
import { showToast, Modal, StatusBadge, TierBadge, FormRow, EmptyState, Spinner } from '@/components/ui';

const STATUSES = ['Pending','In Transit','Delivered','Delayed','Processing'];
const TIERS = ['Platinum','Gold','Standard'];

export default function OrdersPage({ searchQuery }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editOrder, setEditOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ order_number:'', customer_name:'', sla_tier:'Standard', origin:'', destination:'', items:1, weight_kg:0, status:'Pending', eta:'', notes:'' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setOrders(await fetchAll('orders', { order:'created_at' })); } catch { showToast('Failed to load orders','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `ORD-${8000 + Math.floor(Math.random()*9000)}`;
    setForm({ order_number:num, customer_name:'', sla_tier:'Standard', origin:'', destination:'', items:1, weight_kg:0, status:'Pending', eta:'', notes:'' });
    setEditOrder(null);
    setShowModal(true);
  }

  function openEdit(o) {
    setForm({ order_number:o.order_number, customer_name:o.customer_name, sla_tier:o.sla_tier, origin:o.origin, destination:o.destination, items:o.items, weight_kg:o.weight_kg, status:o.status, eta:o.eta||'', notes:o.notes||'' });
    setEditOrder(o);
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.customer_name || !form.origin || !form.destination) { showToast('Fill all required fields','error'); return; }
    setSaving(true);
    try {
      if (editOrder) {
        await updateRow('orders', editOrder.id, form);
        showToast('Order updated','success');
      } else {
        await insertRow('orders', form);
        showToast('Order created','success');
      }
      setShowModal(false);
      load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(o) {
    if (!confirm(`Delete order ${o.order_number}?`)) return;
    try { await deleteRow('orders', o.id); showToast('Order deleted','info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  async function handleStatusChange(o, status) {
    try { await updateRow('orders', o.id, { status }); showToast(`Status → ${status}`,'success'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  const filtered = orders.filter(o => {
    const matchFilter = filter === 'all' || o.status === filter;
    const matchSearch = !searchQuery || o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) || o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFilter && matchSearch;
  });

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>ORDER MANAGEMENT</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{orders.length} total orders · {orders.filter(o=>o.status==='Pending').length} pending action</div>
        </div>
        <div style={{ display:'flex', gap:7 }}>
          <select className="g-input" value={filter} onChange={e=>setFilter(e.target.value)} style={{ fontSize:12 }}>
            <option value="all">All Status</option>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button className="btn-p" onClick={openNew}>+ New Order</button>
        </div>
      </div>

      <div className="gl" style={{ borderRadius:14, overflow:'hidden' }}>
        <div className="tbl-wrap">
          {loading ? <div style={{ padding:40, textAlign:'center' }}><Spinner /></div> : (
            <table className="dt">
              <thead><tr><th>Order ID</th><th>Customer</th><th>SLA</th><th>Origin</th><th>Destination</th><th>Items</th><th>Weight</th><th>Status</th><th>ETA</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={10}><EmptyState message="No orders found" /></td></tr> : filtered.map(o=>(
                  <tr key={o.id}>
                    <td className="mono" style={{ color:'#a78bfa' }}>{o.order_number}</td>
                    <td style={{ fontWeight:500 }}>{o.customer_name}</td>
                    <td><TierBadge tier={o.sla_tier} /></td>
                    <td className="mono">{o.origin}</td>
                    <td className="mono">{o.destination}</td>
                    <td className="mono">{o.items}</td>
                    <td className="mono">{Number(o.weight_kg).toLocaleString()} kg</td>
                    <td>
                      <select style={{ background:'transparent', border:'none', cursor:'pointer', color:'inherit', fontSize:11, outline:'none' }} value={o.status} onChange={e=>handleStatusChange(o,e.target.value)}>
                        {STATUSES.map(s=><option key={s} value={s} style={{ background:'#1a0f20' }}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color:'var(--t2)', fontSize:11.5 }}>{o.eta || '—'}</td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn-g" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>openEdit(o)}>Edit</button>
                        <button className="btn-danger" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>handleDelete(o)}>Del</button>
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
        <Modal title={editOrder ? `EDIT ORDER — ${editOrder.order_number}` : 'NEW ORDER'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="Order Number"><input className="g-input" value={form.order_number} onChange={e=>setForm({...form,order_number:e.target.value})} placeholder="ORD-8001" readOnly={!!editOrder} /></FormRow>
              <FormRow label="Customer Name *"><input className="g-input" value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})} placeholder="Company name" required /></FormRow>
              <FormRow label="SLA Tier"><select className="g-input" value={form.sla_tier} onChange={e=>setForm({...form,sla_tier:e.target.value})}>{TIERS.map(t=><option key={t}>{t}</option>)}</select></FormRow>
              <FormRow label="Status"><select className="g-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>{STATUSES.map(s=><option key={s}>{s}</option>)}</select></FormRow>
              <FormRow label="Origin *"><input className="g-input" value={form.origin} onChange={e=>setForm({...form,origin:e.target.value})} placeholder="CHICAGO" required /></FormRow>
              <FormRow label="Destination *"><input className="g-input" value={form.destination} onChange={e=>setForm({...form,destination:e.target.value})} placeholder="DETROIT" required /></FormRow>
              <FormRow label="Items"><input className="g-input" type="number" min="1" value={form.items} onChange={e=>setForm({...form,items:parseInt(e.target.value)||1})} /></FormRow>
              <FormRow label="Weight (kg)"><input className="g-input" type="number" min="0" value={form.weight_kg} onChange={e=>setForm({...form,weight_kg:parseFloat(e.target.value)||0})} /></FormRow>
              <FormRow label="ETA"><input className="g-input" type="date" value={form.eta} onChange={e=>setForm({...form,eta:e.target.value})} /></FormRow>
            </div>
            <FormRow label="Notes"><textarea className="g-input" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ height:60, resize:'vertical' }} /></FormRow>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : editOrder ? 'Update Order' : 'Create Order'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
