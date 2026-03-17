'use client';
import { useEffect, useRef } from 'react';

let toastId = 0;
const listeners = new Set();

export function showToast(message, type = 'info') {
  const id = ++toastId;
  listeners.forEach(fn => fn({ id, message, type }));
  return id;
}

export function ToastContainer() {
  const containerRef = useRef(null);

  useEffect(() => {
    function addToast({ id, message, type }) {
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      el.dataset.id = id;
      const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
      el.innerHTML = `<span style="font-weight:700;font-size:14px;">${icon}</span><span>${message}</span>`;
      containerRef.current?.appendChild(el);
      setTimeout(() => el.classList.add('toast-exit'), 2800);
      setTimeout(() => el.remove(), 3200);
    }
    listeners.add(addToast);
    return () => listeners.delete(addToast);
  }, []);

  return <div className="toast-container" ref={containerRef} />;
}

export function Spinner() {
  return <span className="spinner" />;
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--glass-border)' }}>
          <h2 style={{ marginBottom: 0, borderBottom: 'none', paddingBottom: 0, fontFamily: "'Orbitron',monospace", fontSize: 13, letterSpacing: '0.1em' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--t2)', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function StatusBadge({ status }) {
  const map = {
    'In Transit': 'bg-g', 'Delivered': 'bg-g', 'Moving': 'bg-g', 'Active': 'bg-g', 'Connected': 'bg-g', 'POD Signed': 'bg-g', 'Gate Out': 'bg-b',
    'Booked': 'bg-v', 'Pending': 'bg-v', 'Processing': 'bg-v', 'Gate In': 'bg-b',
    'Customs Hold': 'bg-a', 'Stopped': 'bg-a', 'Off Duty': 'bg-a', 'Data Transfer': 'bg-a', 'Degraded': 'bg-a',
    'Delayed': 'bg-r', 'Alert': 'bg-r', 'On Hold': 'bg-r', 'Malfunction': 'bg-r',
    'Driving': 'bg-g', 'On Duty': 'bg-a', 'Sleeper Berth': 'bg-v', 'Off': 'bg-b',
  };
  return <span className={`bdg ${map[status] || 'bg-v'}`}>{status}</span>;
}

export function TierBadge({ tier }) {
  const c = tier === 'Platinum' ? 'bg-gold' : tier === 'Gold' ? 'bg-a' : 'bg-b';
  return <span className={`bdg ${c}`}>{tier}</span>;
}

export function ProgressBar({ value, color }) {
  return (
    <div className="pbar">
      <div className="pfill" style={{ width: `${Math.min(100, value)}%`, background: color || '#a855f7' }} />
    </div>
  );
}

export function FormRow({ label, children }) {
  return (
    <div className="form-row">
      <label>{label}</label>
      {children}
    </div>
  );
}

export function EmptyState({ message = 'No data found' }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--t3)' }}>
      <div style={{ fontSize: 36, marginBottom: 10 }}>◎</div>
      <div style={{ fontSize: 13 }}>{message}</div>
    </div>
  );
}
