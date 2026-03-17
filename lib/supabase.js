// ─────────────────────────────────────────────
// Supabase client — with graceful demo fallback
// ─────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js';
import { DEMO_DATA } from './demoData.js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.startsWith('http') &&
  !supabaseUrl.includes('placeholder') &&
  supabaseAnonKey !== 'placeholder';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!isConfigured) {
  console.warn('⚠ LogiAI running in DEMO mode — add Supabase credentials to .env.local to enable live backend');
}

// ─────────────────────────────────────────────
// Generic CRUD helpers with demo fallback
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// Generic CRUD helpers with demo fallback
// ─────────────────────────────────────────────
export async function fetchAll(table, opts = {}) {
  if (!supabase) {
    let rows = [...(DEMO_DATA[table] ?? [])];
    if (opts.filter) {
      Object.entries(opts.filter).forEach(([k, v]) => { rows = rows.filter(r => r[k] === v); });
    }
    if (opts.order) {
      rows.sort((a, b) => {
        const va = a[opts.order] ?? ''; const vb = b[opts.order] ?? '';
        return opts.asc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      });
    }
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return rows;
  }
  let q = supabase.from(table).select('*');
  if (opts.order) q = q.order(opts.order, { ascending: opts.asc ?? false });
  if (opts.limit) q = q.limit(opts.limit);
  if (opts.filter) Object.entries(opts.filter).forEach(([k, v]) => { q = q.eq(k, v); });
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function insertRow(table, payload) {
  if (!supabase) {
    const row = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    (DEMO_DATA[table] = DEMO_DATA[table] ?? []).unshift(row);
    return row;
  }
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw error;
  return data;
}

export async function updateRow(table, id, payload) {
  if (!supabase) {
    const rows = DEMO_DATA[table] ?? [];
    const idx = rows.findIndex(r => r.id === id);
    if (idx !== -1) { rows[idx] = { ...rows[idx], ...payload, updated_at: new Date().toISOString() }; return rows[idx]; }
    throw new Error('Row not found');
  }
  const { data, error } = await supabase.from(table).update(payload).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRow(table, id) {
  if (!supabase) {
    const rows = DEMO_DATA[table] ?? [];
    const idx = rows.findIndex(r => r.id === id);
    if (idx !== -1) rows.splice(idx, 1);
    return;
  }
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}
