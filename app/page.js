'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { ToastStack } from '@/components/ui';
import DashboardPage  from '@/components/pages/DashboardPage';
import OrdersPage     from '@/components/pages/OrdersPage';
import ShipmentsPage  from '@/components/pages/ShipmentsPage';
import FleetPage      from '@/components/pages/FleetPage';
import DriversPage    from '@/components/pages/DriversPage';
import WarehousesPage from '@/components/pages/WarehousesPage';
import CustomersPage  from '@/components/pages/CustomersPage';
import AIPage         from '@/components/pages/AIPage';
import ReportsPage    from '@/components/pages/ReportsPage';
import SettingsPage   from '@/components/pages/SettingsPage';
import { fetchAll } from '@/lib/supabase';

const NAV = [
  { section:'Operations', items:[
    { id:'dashboard',  label:'Dashboard',   icon:'⊞' },
    { id:'orders',     label:'Orders',      icon:'📋', badge:'10', badgeCls:'bdg-v' },
    { id:'shipments',  label:'Shipments',   icon:'🚛', badge:'10', badgeCls:'bdg-t' },
    { id:'fleet',      label:'Fleet',       icon:'🚐' },
    { id:'drivers',    label:'Drivers',     icon:'👤' },
    { id:'warehouses', label:'Warehouses',  icon:'🏭' },
    { id:'customers',  label:'Customers',   icon:'🏢' },
  ]},
  { section:'Intelligence', items:[
    { id:'ai',         label:'AI Insights', icon:'⬡', aiPulse:true },
    { id:'reports',    label:'Reports',     icon:'📊' },
  ]},
  { section:'System', items:[
    { id:'settings',   label:'Settings',    icon:'⚙' },
  ]},
];

const TITLES = {
  dashboard:'DASHBOARD', orders:'ORDER MANAGEMENT', shipments:'SHIPMENT TRACKER',
  fleet:'FLEET MANAGEMENT', drivers:'DRIVER MANAGEMENT', warehouses:'WAREHOUSE NETWORK',
  customers:'CUSTOMER CRM', ai:'AI INTELLIGENCE', reports:'ANALYTICS & REPORTS', settings:'SETTINGS',
};

const PAGES = {
  dashboard:DashboardPage, orders:OrdersPage, shipments:ShipmentsPage,
  fleet:FleetPage, drivers:DriversPage, warehouses:WarehousesPage,
  customers:CustomersPage, ai:AIPage, reports:ReportsPage, settings:SettingsPage,
};

const IS_DEMO = !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder');

export default function Home() {
  const [page,         setPage]       = useState('dashboard');
  const [clock,        setClock]      = useState('');
  const [alertCount,   setAlertCount] = useState(5);
  const [searchQuery,  setSearch]     = useState('');
  const [sidebarOpen,  setSidebar]    = useState(false);
  const [collapsed,    setCollapsed]  = useState(false);
  const [theme,        setTheme]      = useState('dark');
  const [showMobSearch,setMobSearch]  = useState(false);
  const overlayRef = useRef(null);

  /* Init theme from localStorage */
  useEffect(() => {
    const saved = localStorage.getItem('logiai-theme') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  /* Toggle theme */
  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('logiai-theme', next);
  }, [theme]);

  /* Clock */
  useEffect(() => {
    const tick = () => {
      const n = new Date();
      setClock(`${String(n.getUTCHours()).padStart(2,'0')}:${String(n.getUTCMinutes()).padStart(2,'0')}:${String(n.getUTCSeconds()).padStart(2,'0')} UTC`);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  /* Alert count */
  useEffect(() => {
    fetchAll('alerts',{filter:{resolved:false}}).then(d=>setAlertCount(d.length)).catch(()=>{});
  }, []);

  /* Clear search on page change */
  function navigate(id) {
    setPage(id);
    setSidebar(false);
    setSearch('');
    setMobSearch(false);
  }

  /* Mobile overlay */
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    if (sidebarOpen) { el.style.display='block'; requestAnimationFrame(()=>el.classList.add('visible')); }
    else { el.classList.remove('visible'); setTimeout(()=>{ el.style.display='none'; },250); }
  }, [sidebarOpen]);

  const PageComponent = PAGES[page] || DashboardPage;

  return (
    <>
      <div id="app-shell">
        {/* ── SIDEBAR ── */}
        <aside id="sidebar" className={[collapsed?'collapsed':'', sidebarOpen?'mobile-open':''].filter(Boolean).join(' ')}>

          <div className="logo-wrap">
            <div className="logo-mark">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="logo-text-wrap">
              <div className="logo-text">LOGIAI</div>
              <div className="logo-sub">Control Tower</div>
            </div>
          </div>

          <nav id="sidebar-nav">
            {NAV.map(section=>(
              <div key={section.section}>
                <div className="nav-section-label">{section.section}</div>
                {section.items.map(item=>(
                  <button
                    key={item.id}
                    className={`nav-item ${page===item.id?'active':''}`}
                    onClick={()=>navigate(item.id)}
                    title={collapsed ? item.label : undefined}
                    aria-label={item.label}
                    aria-current={page===item.id ? 'page' : undefined}
                  >
                    <span className="nav-icon" style={{fontSize:15}}>{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                    {item.badge && (
                      <span className={`nav-badge ${item.badgeCls}`}>{item.badge}</span>
                    )}
                    {item.aiPulse && (
                      <span style={{width:7,height:7,borderRadius:'50%',background:'var(--gold)',display:'inline-block',animation:'pulse-dot 2s infinite',marginLeft:'auto',flexShrink:0}} />
                    )}
                  </button>
                ))}
                <hr className="nav-sep"/>
              </div>
            ))}
          </nav>

          <div className="user-panel">
            <div className="user-avatar" aria-hidden>AM</div>
            <div className="user-info">
              <div className="user-name">Alex Morgan</div>
              <div className="user-role">Operations Manager</div>
            </div>
          </div>
        </aside>

        {/* Mobile overlay */}
        <div id="sidebar-overlay" ref={overlayRef} style={{display:'none'}} onClick={()=>setSidebar(false)}/>

        {/* ── MAIN ── */}
        <div id="main">
          {IS_DEMO && (
            <div className="demo-banner" role="status">
              <span>🔵</span>
              <span><strong>Demo Mode</strong> — Add Supabase credentials to <code>.env.local</code> for a live database.</span>
            </div>
          )}

          {/* ── TOPBAR ── */}
          <header id="topbar">
            <div className="topbar-left">
              {/* Hamburger (mobile) */}
              <button id="hamburger" onClick={()=>setSidebar(v=>!v)} aria-label="Toggle navigation menu">
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                </svg>
              </button>

              <span className="page-title">{TITLES[page]}</span>

              <div className="live-chip" aria-label="Live data status">
                <div className="live-dot" aria-hidden/>
                <span className="live-label">LIVE</span>
              </div>
            </div>

            <div className="topbar-right">
              {/* Desktop search */}
              <div className="search-wrap" role="search">
                <svg className="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  className="search-input"
                  placeholder={`Search ${TITLES[page].toLowerCase()}…`}
                  value={searchQuery}
                  onChange={e=>setSearch(e.target.value)}
                  aria-label="Search"
                />
              </div>

              {/* Mobile search toggle */}
              <button
                className="topbar-btn search-mobile-btn"
                style={{display:'none'}}
                onClick={()=>setMobSearch(v=>!v)}
                aria-label="Toggle search"
              >
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>

              {/* Notifications */}
              <button className="topbar-btn" aria-label={`${alertCount} notifications`}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {alertCount > 0 && <span className="badge-dot" aria-hidden>{alertCount}</span>}
              </button>

              {/* Theme toggle */}
              <button
                className="theme-toggle"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme==='dark'?'light':'dark'} mode`}
                title={`${theme==='dark'?'Light':'Dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              <div className="clock" aria-live="off">{clock}</div>
            </div>
          </header>

          {/* Mobile search bar */}
          {showMobSearch && (
            <div id="mobile-search-bar" style={{display:'flex',alignItems:'center',position:'relative'}}>
              <svg className="search-icon" width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden style={{position:'absolute',left:22,top:'50%',transform:'translateY(-50%)',color:'var(--t3)',pointerEvents:'none'}}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                autoFocus
                className="search-input"
                placeholder={`Search ${TITLES[page].toLowerCase()}…`}
                value={searchQuery}
                onChange={e=>setSearch(e.target.value)}
                aria-label="Search"
                style={{width:'100%',paddingLeft:36}}
              />
              {searchQuery && (
                <button
                  onClick={()=>setSearch('')}
                  style={{position:'absolute',right:20,background:'none',border:'none',color:'var(--t3)',cursor:'pointer',fontSize:16}}
                  aria-label="Clear search"
                >×</button>
              )}
            </div>
          )}

          {/* Page content */}
          <main id="content" role="main">
            <div key={page} className="page-enter">
              <PageComponent searchQuery={searchQuery} onNavigate={navigate}/>
            </div>
          </main>
        </div>
      </div>

      <ToastStack/>
    </>
  );
}
