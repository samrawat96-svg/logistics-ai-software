'use client';
import { useState, useEffect, useMemo } from 'react';
import { fetchAll, insertRow, updateRow, deleteRow } from '@/lib/supabase';
import { toast, Modal, TierBadge, StatusBadge, Field, EmptyState, Spinner, SkeletonTable, PageHeader, useConfirm, ProgressBar } from '@/components/ui';

const TIERS = ['Platinum','Gold','Standard'];
const BLANK = {customer_number:'',company_name:'',sla_tier:'Standard',annual_value_usd:0,active_orders:0,on_time_rate:90,risk_score:20,credit_limit_usd:100000,status:'Active'};

export default function CustomersPage({ searchQuery }) {
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShow]      = useState(false);
  const [editCust,  setEdit]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [tierFilter,setTF]        = useState('all');
  const [form,      setForm]      = useState(BLANK);
  const [confirm, ConfirmEl]      = useConfirm();

  useEffect(()=>{ load(); },[]);

  async function load() {
    setLoading(true);
    try { setCustomers(await fetchAll('customers',{order:'created_at'})); }
    catch { toast('Failed to load customers','error'); }
    setLoading(false);
  }

  function openNew() {
    const num = `CUST-${100+customers.length+1}`;
    setForm({...BLANK,customer_number:num});
    setEdit(null); setShow(true);
  }
  function openEdit(c) {
    setForm({customer_number:c.customer_number,company_name:c.company_name,sla_tier:c.sla_tier,annual_value_usd:c.annual_value_usd,active_orders:c.active_orders,on_time_rate:c.on_time_rate,risk_score:c.risk_score,credit_limit_usd:c.credit_limit_usd,status:c.status});
    setEdit(c); setShow(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if(!form.company_name){toast('Company name required','error');return;}
    setSaving(true);
    try {
      const p = {...form,annual_value_usd:+form.annual_value_usd,active_orders:+form.active_orders,on_time_rate:+form.on_time_rate,risk_score:+form.risk_score,credit_limit_usd:+form.credit_limit_usd};
      if(editCust){await updateRow('customers',editCust.id,p);toast('Customer updated','success');}
      else        {await insertRow('customers',p);             toast('Customer added','success');}
      setShow(false); load();
    } catch(err){toast(err.message,'error');}
    setSaving(false);
  }

  async function handleDelete(c) {
    const ok = await confirm({title:'Remove Customer',description:`Remove ${c.company_name} permanently?`,confirmText:'Remove',variant:'danger'});
    if(!ok) return;
    try{await deleteRow('customers',c.id);toast('Removed','info');load();}
    catch(err){toast(err.message,'error');}
  }

  async function toggleStatus(c) {
    const ns = c.status==='Active'?'On Hold':'Active';
    try{await updateRow('customers',c.id,{status:ns});toast(`${c.company_name} → ${ns}`,'info');load();}
    catch(err){toast(err.message,'error');}
  }

  const filtered = useMemo(()=>customers.filter(c=>{
    const mf = tierFilter==='all'||c.sla_tier===tierFilter;
    const ms = !searchQuery||`${c.company_name} ${c.customer_number} ${c.sla_tier}`.toLowerCase().includes(searchQuery.toLowerCase());
    return mf && ms;
  }),[customers,tierFilter,searchQuery]);

  const tierCounts = useMemo(()=>TIERS.reduce((a,t)=>({...a,[t]:customers.filter(c=>c.sla_tier===t).length}),{}),[customers]);
  const riskColor = r => r>50?'#f87171':r>30?'#fbbf24':'#5eead4';
  const riskLabel = r => r>50?'HIGH':r>30?'MED':'LOW';
  const otColor   = o => o>95?'#14b8a6':o>85?'#a855f7':'#f59e0b';

  return (
    <div>
      <PageHeader
        title="CUSTOMER CRM"
        subtitle={`${customers.length} accounts · ${tierCounts['Platinum']||0} Platinum · ${tierCounts['Gold']||0} Gold · ${tierCounts['Standard']||0} Standard`}
        actions={
          <>
            <div className="flex gap-6">
              {['all',...TIERS].map(t=>(
                <button key={t} onClick={()=>setTF(t)} className={`btn btn-sm ${tierFilter===t?'btn-primary':'btn-ghost'}`} style={{borderRadius:20}}>
                  {t==='all'?'All':t}{t!=='all'&&` (${tierCounts[t]||0})`}
                </button>
              ))}
            </div>
            <button className="btn btn-primary" onClick={openNew}>+ Add Customer</button>
          </>
        }
      />

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          {loading ? <SkeletonTable rows={8} cols={8}/> : filtered.length===0 ? (
            <EmptyState icon="🏢" title="No customers found" description="Add a customer account or change the tier filter."/>
          ) : (
            <table className="dt">
              <thead><tr><th>Company</th><th>SLA Tier</th><th>Annual Value</th><th>Active Orders</th><th>On-Time Rate</th><th>Risk Score</th><th>Credit Limit</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map(c=>(
                  <tr key={c.id}>
                    <td>
                      <div style={{fontWeight:600,fontSize:13}}>{c.company_name}</div>
                      <div className="mono" style={{color:'var(--t3)',fontSize:10}}>{c.customer_number}</div>
                    </td>
                    <td><TierBadge tier={c.sla_tier}/></td>
                    <td className="mono" style={{color:'#a78bfa',fontWeight:600}}>${(c.annual_value_usd/1000).toFixed(0)}K</td>
                    <td className="mono">{c.active_orders}</td>
                    <td>
                      <div className="flex items-center gap-8">
                        <div style={{width:48}}><ProgressBar value={c.on_time_rate} color={otColor(c.on_time_rate)}/></div>
                        <span className="mono" style={{fontSize:11}}>{Number(c.on_time_rate).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-6">
                        <span className="mono" style={{fontSize:11,color:riskColor(c.risk_score)}}>{Number(c.risk_score).toFixed(1)}</span>
                        <span className={`badge ${c.risk_score>50?'badge-red':c.risk_score>30?'badge-amber':'badge-green'}`} style={{fontSize:9}}>{riskLabel(c.risk_score)}</span>
                      </div>
                    </td>
                    <td className="mono">${(c.credit_limit_usd/1000).toFixed(0)}K</td>
                    <td>
                      <button onClick={()=>toggleStatus(c)} style={{background:'none',border:'none',cursor:'pointer',padding:0}}>
                        <StatusBadge status={c.status}/>
                      </button>
                    </td>
                    <td>
                      <div className="flex gap-6">
                        <button className="btn btn-ghost btn-sm" onClick={()=>openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(c)}>Del</button>
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
        <Modal title={editCust?`EDIT — ${editCust.company_name}`:'ADD CUSTOMER'} onClose={()=>setShow(false)}>
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Customer Number"><input className="input" readOnly={!!editCust} value={form.customer_number} onChange={e=>setForm(p=>({...p,customer_number:e.target.value}))}/></Field>
                <Field label="Company Name *"><input className="input" placeholder="Company name" value={form.company_name} onChange={e=>setForm(p=>({...p,company_name:e.target.value}))} required/></Field>
                <Field label="SLA Tier"><select className="input" value={form.sla_tier} onChange={e=>setForm(p=>({...p,sla_tier:e.target.value}))}>{TIERS.map(t=><option key={t}>{t}</option>)}</select></Field>
                <Field label="Status"><select className="input" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option>Active</option><option>On Hold</option></select></Field>
                <Field label="Annual Value ($)"><input className="input" type="number" min="0" value={form.annual_value_usd} onChange={e=>setForm(p=>({...p,annual_value_usd:e.target.value}))}/></Field>
                <Field label="Credit Limit ($)"><input className="input" type="number" min="0" value={form.credit_limit_usd} onChange={e=>setForm(p=>({...p,credit_limit_usd:e.target.value}))}/></Field>
                <Field label="Active Orders"><input className="input" type="number" min="0" value={form.active_orders} onChange={e=>setForm(p=>({...p,active_orders:e.target.value}))}/></Field>
                <Field label="On-Time Rate (%)"><input className="input" type="number" min="0" max="100" step="0.1" value={form.on_time_rate} onChange={e=>setForm(p=>({...p,on_time_rate:e.target.value}))}/></Field>
                <Field label="Risk Score (0–100)"><input className="input" type="number" min="0" max="100" step="0.1" value={form.risk_score} onChange={e=>setForm(p=>({...p,risk_score:e.target.value}))}/></Field>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={()=>setShow(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving?<Spinner/>:editCust?'Update Customer':'Add Customer'}</button>
            </div>
          </form>
        </Modal>
      )}
      {ConfirmEl}
    </div>
  );
}
