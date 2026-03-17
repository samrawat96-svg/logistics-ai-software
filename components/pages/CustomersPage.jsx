'use client';
import { useState, useEffect } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { showToast, Modal, TierBadge, StatusBadge, FormRow, EmptyState, Spinner, ProgressBar } from '@/components/ui';

const TIERS = ['Platinum','Gold','Standard'];

export default function CustomersPage({ searchQuery }) {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCust, setEditCust] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ customer_number:'', company_name:'', sla_tier:'Standard', annual_value_usd:0, active_orders:0, on_time_rate:90, risk_score:20, credit_limit_usd:100000, status:'Active' });

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCustomers(await fetchAll('customers', { order:'created_at' })); } catch { showToast('Failed to load customers','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `CUST-${100 + customers.length + 1}`;
    setForm({ customer_number:num, company_name:'', sla_tier:'Standard', annual_value_usd:0, active_orders:0, on_time_rate:90, risk_score:20, credit_limit_usd:100000, status:'Active' });
    setEditCust(null); setShowModal(true);
  }

  function openEdit(c) {
    setForm({ customer_number:c.customer_number, company_name:c.company_name, sla_tier:c.sla_tier, annual_value_usd:c.annual_value_usd, active_orders:c.active_orders, on_time_rate:c.on_time_rate, risk_score:c.risk_score, credit_limit_usd:c.credit_limit_usd, status:c.status });
    setEditCust(c); setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.company_name) { showToast('Company name required','error'); return; }
    setSaving(true);
    try {
      const payload = { ...form, annual_value_usd:parseInt(form.annual_value_usd), active_orders:parseInt(form.active_orders), on_time_rate:parseFloat(form.on_time_rate), risk_score:parseFloat(form.risk_score), credit_limit_usd:parseInt(form.credit_limit_usd) };
      if (editCust) { await updateRow('customers', editCust.id, payload); showToast('Customer updated','success'); }
      else { await insertRow('customers', payload); showToast('Customer added','success'); }
      setShowModal(false); load();
    } catch(err) { showToast(err.message,'error'); }
    setSaving(false);
  }

  async function handleDelete(c) {
    if (!confirm(`Remove ${c.company_name}?`)) return;
    try { await deleteRow('customers', c.id); showToast('Customer removed','info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  async function handleStatusToggle(c) {
    const newStatus = c.status === 'Active' ? 'On Hold' : 'Active';
    try { await updateRow('customers', c.id, { status:newStatus }); showToast(`${c.company_name} → ${newStatus}`,'info'); load(); } catch(err) { showToast(err.message,'error'); }
  }

  const filtered = customers.filter(c => {
    if (!searchQuery) return true;
    return c.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) || c.customer_number?.toLowerCase().includes(searchQuery.toLowerCase()) || c.sla_tier?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <div className="st" style={{ marginBottom:1 }}>CUSTOMER CRM</div>
          <div style={{ fontSize:10, color:'var(--t3)' }}>{customers.length} accounts · {customers.filter(c=>c.sla_tier==='Platinum').length} Platinum · {customers.filter(c=>c.sla_tier==='Gold').length} Gold · {customers.filter(c=>c.sla_tier==='Standard').length} Standard</div>
        </div>
        <button className="btn-p" onClick={openNew}>+ Add Customer</button>
      </div>

      <div className="gl" style={{ borderRadius:14, overflow:'hidden' }}>
        <div className="tbl-wrap">
          {loading ? <div style={{ padding:40, textAlign:'center' }}><Spinner /></div> : (
            <table className="dt">
              <thead><tr><th>Company</th><th>SLA Tier</th><th>Annual Value</th><th>Active Orders</th><th>On-Time Rate</th><th>Risk Score</th><th>Credit Limit</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.length === 0 ? <tr><td colSpan={9}><EmptyState message="No customers found" /></td></tr> : filtered.map(c=>(
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight:600, fontSize:13 }}>{c.company_name}</div>
                      <div className="mono" style={{ color:'var(--t3)', fontSize:10 }}>{c.customer_number}</div>
                    </td>
                    <td><TierBadge tier={c.sla_tier} /></td>
                    <td className="mono" style={{ color:'#a78bfa' }}>${(c.annual_value_usd/1000).toFixed(0)}K</td>
                    <td className="mono">{c.active_orders}</td>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                        <div style={{ width:55 }}><ProgressBar value={c.on_time_rate} color={c.on_time_rate>95?'#14b8a6':c.on_time_rate>85?'#a855f7':'#f59e0b'} /></div>
                        <span className="mono" style={{ fontSize:11 }}>{Number(c.on_time_rate).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <span className="mono" style={{ color:c.risk_score>50?'#f87171':c.risk_score>30?'#fbbf24':'#5eead4' }}>{Number(c.risk_score).toFixed(1)}</span>
                      <span className={`bdg ${c.risk_score>50?'bg-r':c.risk_score>30?'bg-a':'bg-g'}`} style={{ marginLeft:5, fontSize:'9px' }}>{c.risk_score>50?'HIGH':c.risk_score>30?'MED':'LOW'}</span>
                    </td>
                    <td className="mono">${(c.credit_limit_usd/1000).toFixed(0)}K</td>
                    <td>
                      <button onClick={()=>handleStatusToggle(c)} style={{ background:'none', border:'none', cursor:'pointer', padding:0 }}>
                        <StatusBadge status={c.status} />
                      </button>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:5 }}>
                        <button className="btn-g" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>openEdit(c)}>Edit</button>
                        <button className="btn-danger" style={{ fontSize:11, padding:'3px 9px' }} onClick={()=>handleDelete(c)}>Del</button>
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
        <Modal title={editCust ? `EDIT — ${editCust.company_name}` : 'ADD CUSTOMER'} onClose={()=>setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <FormRow label="Customer Number"><input className="g-input" value={form.customer_number} readOnly={!!editCust} onChange={e=>setForm({...form,customer_number:e.target.value})} /></FormRow>
              <FormRow label="Company Name *"><input className="g-input" value={form.company_name} onChange={e=>setForm({...form,company_name:e.target.value})} required /></FormRow>
              <FormRow label="SLA Tier"><select className="g-input" value={form.sla_tier} onChange={e=>setForm({...form,sla_tier:e.target.value})}>{TIERS.map(t=><option key={t}>{t}</option>)}</select></FormRow>
              <FormRow label="Status"><select className="g-input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Active</option><option>On Hold</option></select></FormRow>
              <FormRow label="Annual Value ($)"><input className="g-input" type="number" min="0" value={form.annual_value_usd} onChange={e=>setForm({...form,annual_value_usd:e.target.value})} /></FormRow>
              <FormRow label="Credit Limit ($)"><input className="g-input" type="number" min="0" value={form.credit_limit_usd} onChange={e=>setForm({...form,credit_limit_usd:e.target.value})} /></FormRow>
              <FormRow label="Active Orders"><input className="g-input" type="number" min="0" value={form.active_orders} onChange={e=>setForm({...form,active_orders:e.target.value})} /></FormRow>
              <FormRow label="On-Time Rate (%)"><input className="g-input" type="number" min="0" max="100" step="0.1" value={form.on_time_rate} onChange={e=>setForm({...form,on_time_rate:e.target.value})} /></FormRow>
              <FormRow label="Risk Score (0-100)"><input className="g-input" type="number" min="0" max="100" step="0.1" value={form.risk_score} onChange={e=>setForm({...form,risk_score:e.target.value})} /></FormRow>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-g" onClick={()=>setShowModal(false)}>Cancel</button>
              <button type="submit" className="btn-p" disabled={saving}>{saving ? <Spinner/> : editCust ? 'Update Customer' : 'Add Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
