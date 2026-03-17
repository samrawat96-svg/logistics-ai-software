'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase, fetchAll, deleteRow } from '@/lib/supabase';
import { showToast, ToastContainer, Modal, StatusBadge, TierBadge, ProgressBar, FormRow, EmptyState, Spinner } from '@/components/ui';
import DashboardPage from '@/components/pages/DashboardPage';
import OrdersPage from '@/components/pages/OrdersPage';
import ShipmentsPage from '@/components/pages/ShipmentsPage';
import FleetPage from '@/components/pages/FleetPage';
import DriversPage from '@/components/pages/DriversPage';
import WarehousesPage from '@/components/pages/WarehousesPage';
import CustomersPage from '@/components/pages/CustomersPage';
import AIPage from '@/components/pages/AIPage';
import ReportsPage from '@/components/pages/ReportsPage';
import SettingsPage from '@/components/pages/SettingsPage';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, sect: 'Operations' },
  { id: 'orders', label: 'Orders', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 000 4h6a2 2 0 000-4M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>, badge: '10', badgeCls: 'bg-v' },
  { id: 'shipments', label: 'Shipments', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>, badge: '10', badgeCls: 'bg-g' },
  { id: 'fleet', label: 'Fleet', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m-3 12h8a2 2 0 002-2v-3M14 8h4l3 3v5h-7V8z"/></svg> },
  { id: 'drivers', label: 'Drivers', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
  { id: 'warehouses', label: 'Warehouses', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> },
  { id: 'customers', label: 'Customers', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> },
  { id: 'ai', label: 'AI Insights', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v3M12 20v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M1 12h3M20 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/></svg>, sect: 'Intelligence', aiPulse: true },
  { id: 'reports', label: 'Reports', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { id: 'settings', label: 'Settings', icon: <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>, sect: 'System' },
];

const TITLES = { dashboard:'DASHBOARD', orders:'ORDER MANAGEMENT', shipments:'SHIPMENT TRACKER', fleet:'FLEET MANAGEMENT', drivers:'DRIVER MANAGEMENT', warehouses:'WAREHOUSE NETWORK', customers:'CUSTOMER CRM', ai:'AI INTELLIGENCE', reports:'ANALYTICS & REPORTS', settings:'SETTINGS' };

export default function Home() {
  const [page, setPage] = useState('dashboard');
  const [clock, setClock] = useState('');
  const [alertCount, setAlertCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')} UTC`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchAll('alerts', { filter: { resolved: false } }).then(d => setAlertCount(d.length)).catch(() => {});
  }, []);

  const pages = { dashboard: DashboardPage, orders: OrdersPage, shipments: ShipmentsPage, fleet: FleetPage, drivers: DriversPage, warehouses: WarehousesPage, customers: CustomersPage, ai: AIPage, reports: ReportsPage, settings: SettingsPage };
  const PageComponent = pages[page] || DashboardPage;

  return (
    <>
      <div id="app" style={{ position:'relative', zIndex:1, display:'flex', height:'100vh', overflow:'hidden' }}>
        {/* SIDEBAR */}
        <div id="sidebar">
          <div className="logo-wrap">
            <div style={{ display:'flex', alignItems:'center', gap:11 }}>
              <div className="logo-mark">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2"><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              </div>
              <div>
                <div className="logo-text">LOGIAI</div>
                <div className="logo-sub">Control Tower</div>
              </div>
            </div>
          </div>

          <nav>
            {NAV.map((item, i) => {
              const prev = NAV[i - 1];
              return (
                <div key={item.id}>
                  {item.sect && <div className="nav-sect">{item.sect}</div>}
                  {item.id === 'settings' && <div style={{ padding:'10px 12px 4px', marginTop:4, borderTop:'1px solid var(--glass-border)' }} />}
                  <button className={`nav-a ${page === item.id ? 'active' : ''}`} onClick={() => setPage(item.id)}>
                    {item.icon}
                    <span>{item.label}</span>
                    {item.badge && <span className={`nav-badge ${item.badgeCls}`}>{item.badge}</span>}
                    {item.aiPulse && <span style={{ marginLeft:'auto', width:7, height:7, borderRadius:'50%', background:'var(--gold)', animation:'pulse-dot 2s infinite', display:'inline-block' }} />}
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="user-panel">
            <div className="avatar-initials">AM</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Alex Morgan</div>
              <div style={{ fontSize:10, color:'var(--t3)' }}>Operations Manager</div>
            </div>
            <div className="live-dot" />
          </div>
        </div>

        {/* MAIN */}
        <div id="main">
          <div id="topbar">
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div id="page-title">{TITLES[page]}</div>
              <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(20,184,166,0.09)', border:'1px solid rgba(20,184,166,0.18)', borderRadius:16, padding:'3px 10px' }}>
                <div className="live-dot" style={{ width:5, height:5 }} />
                <span style={{ fontSize:11, color:'#5eead4', fontWeight:600, letterSpacing:'0.05em' }}>LIVE</span>
              </div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <input className="g-input" placeholder="⌕  Search operations..." style={{ width:220, fontSize:12 }} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              <button style={{ position:'relative', background:'transparent', border:'1px solid var(--glass-border)', width:34, height:34, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--t2)', flexShrink:0 }}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
                {alertCount > 0 && <span style={{ position:'absolute', top:-4, right:-4, background:'#ef4444', width:15, height:15, borderRadius:'50%', fontSize:9, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700 }}>{alertCount}</span>}
              </button>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--t3)' }}>{clock}</div>
            </div>
          </div>

          <div id="content">
            <PageComponent key={page} searchQuery={searchQuery} onNavigate={setPage} />
          </div>
        </div>
      </div>
      <ToastContainer />
    </>
  );
}
