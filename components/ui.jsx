'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

/* ─── Toast ─── */
const listeners = new Set();
let toastCount = 0;

export function toast(message, type = 'info', duration = 3500) {
  const id = ++toastCount;
  listeners.forEach(fn => fn({ id, message, type, duration }));
}

export function ToastStack() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    function add(t) {
      setToasts(p => [...p, t]);
      setTimeout(() => setToasts(p => p.map(x => x.id === t.id ? { ...x, out: true } : x)), t.duration - 200);
      setTimeout(() => setToasts(p => p.filter(x => x.id !== t.id)), t.duration);
    }
    listeners.add(add);
    return () => listeners.delete(add);
  }, []);

  const icons = { success: '✓', error: '✕', info: 'ℹ' };

  return (
    <div className="toast-stack" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}${t.out ? ' out' : ''}`} role="alert">
          <span className="toast-icon">{icons[t.type] || 'ℹ'}</span>
          <span className="toast-msg">{t.message}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Spinner ─── */
export function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: size, height: size }} />;
}

/* ─── Modal ─── */
export function Modal({ title, onClose, children, size = 'md' }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const maxW = size === 'sm' ? 380 : size === 'lg' ? 700 : 540;

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box" style={{ maxWidth: maxW }}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ─── Confirm Dialog ─── */
export function ConfirmModal({ title, description, confirmText = 'Confirm', cancelText = 'Cancel', variant = 'danger', onConfirm, onClose }) {
  const icons = { danger: '🗑', info: 'ℹ', warning: '⚠' };
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-box confirm-box">
        <div className="modal-body" style={{ paddingTop: 32, textAlign: 'center' }}>
          <div className={`confirm-icon ${variant}`}>{icons[variant]}</div>
          <div className="confirm-title">{title}</div>
          <div className="confirm-desc">{description}</div>
          <div className="flex gap-8" style={{ justifyContent: 'center' }}>
            <button className="btn btn-ghost" onClick={onClose}>{cancelText}</button>
            <button className={`btn ${variant === 'danger' ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── useConfirm hook ─── */
export function useConfirm() {
  const [cfg, setCfg] = useState(null);
  const confirm = useCallback((opts) => {
    return new Promise(resolve => {
      setCfg({ ...opts, onConfirm: () => resolve(true), onClose: () => { setCfg(null); resolve(false); } });
    });
  }, []);
  const el = cfg ? <ConfirmModal {...cfg} onClose={() => { cfg.onClose(); setCfg(null); }} /> : null;
  return [confirm, el];
}

/* ─── Skeleton ─── */
export function SkeletonTable({ rows = 6, cols = 5 }) {
  return (
    <table className="dt" style={{ width: '100%' }}>
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c} style={{ padding: '12px 14px' }}>
                <div className="skeleton" style={{ height: 13, width: c === 0 ? '80%' : c % 2 === 0 ? '55%' : '70%' }} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function SkeletonCards({ count = 6 }) {
  return (
    <div className="grid-auto">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton mb-12" style={{ height: 14, width: '50%' }} />
          <div className="skeleton mb-8" style={{ height: 28, width: '70%' }} />
          <div className="skeleton mb-16" style={{ height: 10, width: '40%' }} />
          <div className="skeleton" style={{ height: 5 }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI({ count = 4 }) {
  return (
    <div className="kpi-grid mb-16">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card">
          <div className="skeleton mb-12" style={{ height: 10, width: '45%' }} />
          <div className="skeleton mb-8" style={{ height: 28, width: '60%' }} />
          <div className="skeleton" style={{ height: 10, width: '35%' }} />
        </div>
      ))}
    </div>
  );
}

/* ─── Status / Tier Badges ─── */
const STATUS_MAP = {
  'In Transit': 'badge-green', 'Moving': 'badge-green', 'Delivered': 'badge-green',
  'Connected': 'badge-green', 'Active': 'badge-green', 'POD Signed': 'badge-green',
  'Booked': 'badge-violet', 'Pending': 'badge-violet', 'Processing': 'badge-violet',
  'Gate In': 'badge-blue', 'Gate Out': 'badge-blue',
  'Stopped': 'badge-amber', 'On Duty': 'badge-amber', 'Customs Hold': 'badge-amber',
  'Data Transfer': 'badge-amber', 'Off Duty': 'badge-amber', 'SB': 'badge-violet',
  'Delayed': 'badge-red', 'Alert': 'badge-red', 'On Hold': 'badge-red', 'Malfunction': 'badge-red',
  'Off': 'badge-blue',
};
export function StatusBadge({ status }) {
  return <span className={`badge ${STATUS_MAP[status] || 'badge-violet'}`}>{status}</span>;
}
export function TierBadge({ tier }) {
  const c = tier === 'Platinum' ? 'badge-gold' : tier === 'Gold' ? 'badge-amber' : 'badge-blue';
  return <span className={`badge ${c}`}>{tier}</span>;
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, color = '#a855f7' }) {
  return (
    <div className="pbar">
      <div className="pfill" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }} />
    </div>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ icon = '◎', title = 'No data found', description = '', action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action}
    </div>
  );
}

/* ─── Toggle ─── */
export function Toggle({ value, onChange }) {
  return (
    <div className={`toggle ${value ? 'on' : ''}`} onClick={() => onChange(!value)} role="switch" aria-checked={value}>
      <div className="toggle-knob" />
    </div>
  );
}

/* ─── Field wrapper ─── */
export function Field({ label, error, children, className = '' }) {
  return (
    <div className={`field${error ? ' error' : ''} ${className}`}>
      {label && <label>{label}</label>}
      {children}
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

/* ─── Page header helper ─── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex items-center justify-between mb-20">
      <div>
        <div className="sect-label" style={{ marginBottom: 2 }}>{title}</div>
        {subtitle && <div className="text-xs text-t3">{subtitle}</div>}
      </div>
      {actions && <div className="flex gap-8 items-center">{actions}</div>}
    </div>
  );
}
