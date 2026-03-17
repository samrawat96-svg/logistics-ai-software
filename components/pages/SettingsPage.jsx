'use client';
import { useState } from 'react';
import { toast } from '@/components/ui';

const DEFAULT_SETTINGS = {
  hos_warning_minutes: 60,
  reefer_variance_c: 2.0,
  capacity_alert_pct: 90,
  detention_free_hours: 2.0,
  modelVersion: 'v4.2 (Latest)',
  emissionsStandard: 'ISO 14064',
  refreshInterval: '30 seconds',
  ghostRoutes: true,
  emailAlerts: true,
  smsAlerts: false,
  autoReroute: true,
  darkMode: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  function update(key, val) {
    setSettings(prev => ({ ...prev, [key]: val }));
  }

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    localStorage.setItem('logiai_settings', JSON.stringify(settings));
    toast('Settings saved successfully','success');
    setSaving(false);
  }

  function handleReset() {
    setSettings(DEFAULT_SETTINGS);
    toast('Settings reset to defaults','info');
  }

  const Toggle = ({ val, onChange }) => (
    <div onClick={()=>onChange(!val)} style={{ width:36, height:20, borderRadius:10, background:val?'var(--violet)':'rgba(255,255,255,0.1)', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
      <div style={{ position:'absolute', top:2, left:val?18:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ marginBottom:16 }}>
        <div className="st" style={{ marginBottom:1 }}>SYSTEM CONFIGURATION</div>
        <div style={{ fontSize:10, color:'var(--t3)' }}>Control tower settings · AI model · Alert thresholds</div>
      </div>

      <div className="g2" style={{ gap:16, marginBottom:16 }}>
        {/* Alert Thresholds */}
        <div className="gl-card">
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Alert Thresholds</div>
          {[
            { label:'HOS Warning (minutes)', sub:'Alert when drive time drops below', key:'hos_warning_minutes', type:'number' },
            { label:'Reefer Variance (°C)', sub:'Temperature deviation threshold', key:'reefer_variance_c', type:'number', step:0.1 },
            { label:'Capacity Alert (%)', sub:'Warehouse utilization trigger', key:'capacity_alert_pct', type:'number' },
            { label:'Detention Free Time (hours)', sub:'Free time before demurrage', key:'detention_free_hours', type:'number', step:0.5 },
          ].map(f=>(
            <div key={f.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div><div style={{ fontSize:13 }}>{f.label}</div><div style={{ fontSize:10, color:'var(--t3)' }}>{f.sub}</div></div>
              <input className="g-input" type={f.type} step={f.step||1} value={settings[f.key]} onChange={e=>update(f.key, parseFloat(e.target.value))} style={{ width:80, textAlign:'center', fontFamily:"'JetBrains Mono',monospace" }} />
            </div>
          ))}
        </div>

        {/* AI Settings */}
        <div className="gl-card">
          <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>AI Model Settings</div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><div style={{ fontSize:13 }}>Predictive Model Version</div><div style={{ fontSize:10, color:'var(--t3)' }}>Neural network release</div></div>
            <select className="g-input" value={settings.modelVersion} onChange={e=>update('modelVersion',e.target.value)} style={{ width:140, fontSize:12 }}>
              <option>v4.2 (Latest)</option><option>v4.1</option><option>v3.8</option>
            </select>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><div style={{ fontSize:13 }}>Emissions Standard</div><div style={{ fontSize:10, color:'var(--t3)' }}>Scope 3 reporting protocol</div></div>
            <div style={{ display:'flex', gap:6 }}>
              <button className={settings.emissionsStandard==='ISO 14064'?'btn-p':'btn-g'} style={{ padding:'4px 11px', fontSize:11 }} onClick={()=>update('emissionsStandard','ISO 14064')}>ISO 14064</button>
              <button className={settings.emissionsStandard==='GHG'?'btn-p':'btn-g'} style={{ padding:'4px 11px', fontSize:11 }} onClick={()=>update('emissionsStandard','GHG')}>GHG</button>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><div style={{ fontSize:13 }}>Refresh Interval</div><div style={{ fontSize:10, color:'var(--t3)' }}>Live data polling rate</div></div>
            <select className="g-input" value={settings.refreshInterval} onChange={e=>update('refreshInterval',e.target.value)} style={{ width:140, fontSize:12 }}>
              <option>30 seconds</option><option>1 minute</option><option>5 minutes</option>
            </select>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><div style={{ fontSize:13 }}>Ghost Route Suggestions</div><div style={{ fontSize:10, color:'var(--t3)' }}>AI rerouting recommendations</div></div>
            <Toggle val={settings.ghostRoutes} onChange={v=>update('ghostRoutes',v)} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div><div style={{ fontSize:13 }}>Auto-Reroute on Alert</div><div style={{ fontSize:10, color:'var(--t3)' }}>Automatically apply AI routes</div></div>
            <Toggle val={settings.autoReroute} onChange={v=>update('autoReroute',v)} />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="gl-card" style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:16 }}>Notification Preferences</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          {[
            { label:'Email Alerts', sub:'Critical events via email', key:'emailAlerts' },
            { label:'SMS Alerts', sub:'Urgent HOS & temp breaches via SMS', key:'smsAlerts' },
          ].map(n=>(
            <div key={n.key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:14, background:'rgba(255,255,255,0.03)', borderRadius:10, border:'1px solid var(--glass-border)' }}>
              <div><div style={{ fontSize:13, fontWeight:500 }}>{n.label}</div><div style={{ fontSize:10, color:'var(--t3)' }}>{n.sub}</div></div>
              <Toggle val={settings[n.key]} onChange={v=>update(n.key,v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Integration Status */}
      <div className="gl-card" style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Integration Status</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { label:'ELD MANDATE API', sub:'TruckerCloud · Connected', ok:true },
            { label:'EDI GATEWAY', sub:'ANSI X12 · Active', ok:true },
            { label:'REEFER TELEMETRY', sub:'Powerfleet · Degraded', ok:false },
            { label:'PORT AUTHORITY', sub:'UNLOCODE · Live', ok:true },
          ].map(int=>(
            <div key={int.label} style={{ padding:12, borderRadius:8, background:int.ok?'rgba(20,184,166,0.07)':'rgba(245,158,11,0.07)', border:`1px solid ${int.ok?'rgba(20,184,166,0.14)':'rgba(245,158,11,0.14)'}` }}>
              <div style={{ fontSize:11, fontWeight:600, color:int.ok?'#5eead4':'#fbbf24' }}>{int.label}</div>
              <div style={{ fontSize:10, color:'var(--t3)', marginTop:2 }}>{int.sub}</div>
              <div style={{ width:7, height:7, borderRadius:'50%', background:int.ok?'#14b8a6':'#f59e0b', marginTop:6, display:'inline-block', animation:'pulse-dot 1.5s infinite' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Supabase Config */}
      <div className="gl-card" style={{ marginBottom:16 }}>
        <div style={{ fontSize:14, fontWeight:600, marginBottom:14 }}>Supabase Configuration</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <div className="form-row">
            <label style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Project URL</label>
            <input className="g-input" type="url" placeholder="https://xyz.supabase.co" style={{ opacity:0.6 }} readOnly value={typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SUPABASE_URL || '') : ''} />
          </div>
          <div className="form-row">
            <label style={{ fontSize:11, color:'var(--t3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Anon Key (masked)</label>
            <input className="g-input" type="password" placeholder="eyJ..." style={{ opacity:0.6 }} readOnly value="••••••••••••••••••••" />
          </div>
        </div>
        <div style={{ marginTop:10, padding:'8px 12px', borderRadius:8, background:'rgba(20,184,166,0.07)', border:'1px solid rgba(20,184,166,0.14)', fontSize:11, color:'#5eead4' }}>
          ✓ Update credentials in <span className="mono">.env.local</span> and restart the dev server to change Supabase project.
        </div>
      </div>

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
        <button className="btn-g" onClick={handleReset}>Reset Defaults</button>
        <button className="btn-p" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : '✓ Save Settings'}</button>
      </div>
    </div>
  );
}
