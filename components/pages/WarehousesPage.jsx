'use client';
import { useState, useEffect, useRef } from 'react';
import { fetchAll, updateRow } from '@/lib/supabase';
import { toast, Modal, Field, Spinner, PageHeader } from '@/components/ui';

const TYPES = ['Distribution Center','Fulfillment Center','Cross-Dock'];

function UtilBar({ pct }) {
  const c = pct > 90 ? '#ef4444' : pct > 75 ? '#f59e0b' : '#14b8a6';
  return (
    <div>
      <div className="flex justify-between mb-4" style={{ fontSize: 11, color: 'var(--t2)' }}>
        <span>Utilization</span>
        <span className="mono" style={{ color: c, fontWeight: 700 }}>{pct}%</span>
      </div>
      <div className="pbar" style={{ height: 7 }}>
        <div className="pfill" style={{ width: `${pct}%`, background: c }} />
      </div>
    </div>
  );
}

export default function WarehousesPage() {
  const [warehouses, setWH]      = useState([]);
  const [loading,    setLoading] = useState(true);
  const [editWH,     setEdit]    = useState(null);
  const [saving,     setSaving]  = useState(false);
  const [form,       setForm]    = useState({});
  const chartRef  = useRef(null);
  const chartInst = useRef(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setWH(await fetchAll('warehouses', { order: 'warehouse_id', asc: true })); }
    catch { toast('Failed to load warehouses', 'error'); }
    setLoading(false);
  }

  useEffect(() => {
    if (!warehouses.length || typeof window === 'undefined') return;
    import('chart.js').then(({ Chart, registerables }) => {
      Chart.register(...registerables);
      chartInst.current?.destroy();
      const ctx = chartRef.current; if (!ctx) return;
      chartInst.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
          datasets: warehouses.map((w, i) => ({
            label: w.name,
            data: Array.from({ length: 12 }, (_, m) => Math.max(35, Math.min(98, (w.utilization_pct + Math.sin((m + i) * 1.3) * 14) | 0))),
            backgroundColor: ['rgba(124,58,237,0.55)','rgba(20,184,166,0.55)','rgba(240,220,136,0.55)','rgba(239,68,68,0.45)','rgba(59,130,246,0.55)'][i % 5],
            borderRadius: 4,
          })),
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { labels: { color: 'rgba(255,255,255,0.45)', font: { size: 10, family: 'Inter' } } } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.38)', font: { size: 10 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.38)', font: { size: 10 }, callback: v => v + '%' }, min: 0, max: 100 },
          },
        },
      });
    });
    return () => chartInst.current?.destroy();
  }, [warehouses]);

  function openEdit(w) {
    setForm({ facility_type: w.facility_type, utilization_pct: w.utilization_pct, capacity_sqft: w.capacity_sqft, dock_doors: w.dock_doors, available_doors: w.available_doors });
    setEdit(w);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateRow('warehouses', editWH.id, { ...form, utilization_pct: +form.utilization_pct, capacity_sqft: +form.capacity_sqft, dock_doors: +form.dock_doors, available_doors: +form.available_doors });
      toast('Warehouse updated', 'success');
      setEdit(null); load();
    } catch (err) { toast(err.message, 'error'); }
    setSaving(false);
  }

  const typeColor = t => t.includes('Cross') ? 'badge-violet' : t.includes('Fulfillment') ? 'badge-blue' : 'badge-green';

  return (
    <div>
      <PageHeader
        title="WAREHOUSE NETWORK"
        subtitle={`${warehouses.length} facilities · ${warehouses.filter(w => w.utilization_pct > 90).length} at capacity · monitoring 24/7`}
      />

      {loading ? (
        <div className="grid3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card"><div className="skeleton" style={{ height: 180, borderRadius: 8 }} /></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid3 mb-16">
            {warehouses.map(w => (
              <div key={w.id} className="card" style={{ '--c': w.utilization_pct > 90 ? '#ef4444' : w.utilization_pct > 75 ? '#f59e0b' : '#14b8a6' }}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--t3)', marginBottom: 2 }}>{w.warehouse_id}</div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{w.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--t3)' }}>📍 {w.location}</div>
                  </div>
                  <span className={`badge ${typeColor(w.facility_type)}`} style={{ fontSize: 9.5, textAlign: 'right' }}>{w.facility_type}</span>
                </div>

                <UtilBar pct={w.utilization_pct} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, margin: '12px 0' }}>
                  {[
                    { l: 'sq ft', v: `${(w.capacity_sqft / 1000).toFixed(0)}K` },
                    { l: 'Dock Doors', v: w.dock_doors },
                    { l: 'Available', v: w.available_doors, c: w.available_doors < 4 ? '#f87171' : '#5eead4' },
                  ].map(s => (
                    <div key={s.l} style={{ textAlign: 'center', padding: '8px 4px', background: 'rgba(255,255,255,0.03)', borderRadius: 7 }}>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 15, fontWeight: 700, color: s.c || 'var(--t1)' }}>{s.v}</div>
                      <div style={{ fontSize: 9.5, color: 'var(--t3)', marginTop: 2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>

                {w.utilization_pct > 90 && (
                  <div style={{ padding: '6px 10px', borderRadius: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', fontSize: 10.5, color: '#f87171', marginBottom: 8 }}>
                    ⚠ CAPACITY CRITICAL — cross-dock overflow required
                  </div>
                )}

                <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={() => openEdit(w)}>
                  ✎ Edit Facility
                </button>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="sect-label mb-16">UTILIZATION TREND — 12 MONTHS</div>
            <div style={{ height: 200 }}><canvas ref={chartRef} /></div>
          </div>
        </>
      )}

      {editWH && (
        <Modal title={`EDIT — ${editWH.name}`} onClose={() => setEdit(null)} size="sm">
          <form onSubmit={handleSave}>
            <div className="modal-body">
              <div className="form-grid">
                <Field label="Facility Type"><select className="input" value={form.facility_type} onChange={e => setForm(p => ({ ...p, facility_type: e.target.value }))}>{TYPES.map(t => <option key={t}>{t}</option>)}</select></Field>
                <Field label="Utilization (%)"><input className="input" type="number" min="0" max="100" value={form.utilization_pct} onChange={e => setForm(p => ({ ...p, utilization_pct: e.target.value }))} /></Field>
                <Field label="Capacity (sq ft)"><input className="input" type="number" min="0" value={form.capacity_sqft} onChange={e => setForm(p => ({ ...p, capacity_sqft: e.target.value }))} /></Field>
                <Field label="Total Dock Doors"><input className="input" type="number" min="0" value={form.dock_doors} onChange={e => setForm(p => ({ ...p, dock_doors: e.target.value }))} /></Field>
                <Field label="Available Doors"><input className="input" type="number" min="0" value={form.available_doors} onChange={e => setForm(p => ({ ...p, available_doors: e.target.value }))} /></Field>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Spinner /> : 'Update Facility'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
