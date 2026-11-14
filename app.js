'use strict';
/* ============================================================
   Budget & Lists — single-page app, data stays on this device
   ============================================================ */

/* ---------- small helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const J = s => esc(JSON.stringify(s));            // safe string argument for inline handlers
const U = s => esc(encodeURIComponent(s));        // safe hash segment
const uid = () => Math.random().toString(36).slice(2, 9);
const pad = n => String(n).padStart(2, '0');
const isoDay = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const TODAY = isoDay(new Date());
const NOW = TODAY.slice(0, 7);
const addDays = (iso, n) => { const d = new Date(iso + 'T00:00'); d.setDate(d.getDate() + n); return isoDay(d); };
const addM = (m, n) => { const [y, mo] = m.split('-').map(Number); const d = new Date(y, mo - 1 + n, 1); return d.getFullYear() + '-' + pad(d.getMonth() + 1); };
const dim = m => new Date(+m.slice(0, 4), +m.slice(5), 0).getDate();
const mDate = m => new Date(+m.slice(0, 4), +m.slice(5) - 1, 1);
const mlabel = m => mDate(m).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const mshort = m => mDate(m).toLocaleDateString(undefined, { month: 'short' }).slice(0, 3);
const fmtD = d => new Date(d + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const fmtDL = d => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
const num = v => { const n = parseFloat(v); return isFinite(n) && n >= 0 ? n : null; };
const sum = a => a.reduce((t, x) => t + (+x.amt || 0), 0);
const money = n => { n = Number(n || 0); return (n < 0 ? '−' : '') + S.cur + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const money0 = n => { n = Number(n || 0); return (n < 0 ? '−' : '') + S.cur + Math.round(Math.abs(n)).toLocaleString(); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 's');

/* ---------- icons ---------- */
const ic = p => `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const I = {
  home: ic('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  activity: ic('<path d="M4 6h16M4 12h16M4 18h10"/>'),
  budget: ic('<path d="M12 3a9 9 0 1 0 9 9h-9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
  cart: ic('<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.3 12h11.2l2-8.5H6.2"/>'),
  more: ic('<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  bills: ic('<rect x="3" y="4.5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v3M16 3v3"/>'),
  goal: ic('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.2"/>'),
  debt: ic('<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 10h19M6.5 15h4"/>'),
  todo: ic('<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="m8 12 3 3 5-6"/>'),
  reports: ic('<path d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>'),
  settings: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  left: ic('<path d="M15 6l-6 6 6 6"/>'),
  right: ic('<path d="M9 6l6 6-6 6"/>'),
  chev: '<svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
  search: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  camera: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>',
  savings: ic('<path d="M5 11a7 6 0 0 1 13-2.5h1.5l-.5 3 1.5 1v3l-2 .5-1.5 3H15v-1.5h-4V20H8.5L7 16.5A6 6 0 0 1 5 11z"/><circle cx="15" cy="10.5" r=".6"/>'),
};

/* ---------- state ---------- */
const DEF_CATS = [['Housing', '🏠', '#4a7fb5'], ['Food', '🍎', '#2f9e7d'], ['Transport', '🚗', '#e0a030'], ['Bills', '💡', '#c0572f'], ['Health', '🩺', '#d96ba0'], ['Fun', '🎉', '#8a63b8'], ['Shopping', '🛍️', '#2fa3b5'], ['Subscriptions', '🔁', '#5d6fd6'], ['Debt', '💳', '#b5603a'], ['Savings', '🏦', '#5d8f3a'], ['Other', '📦', '#8c8577']].map(([n, i, c]) => ({ n, i, c }));
const PALETTE = ['#4a7fb5', '#2f9e7d', '#e0a030', '#c0572f', '#d96ba0', '#8a63b8', '#2fa3b5', '#5d6fd6', '#b5603a', '#5d8f3a', '#8c8577'];
const fresh = () => ({
  cur: '$', theme: 'auto', income: [], incRec: [], expenses: [], rec: [], vary: [], avgN: 3, repN: 6,
  notes: {}, rc: {}, dates: {}, lim: {}, ovr: {}, skip: {}, paid: {}, rules: {},
  savings: 0, useSav: true, lists: [{ id: uid(), name: 'Shopping list', items: [] }], todos: [],
  plan: { amt: '', per: 'month', date: '' }, cats: null, goals: [], debts: [], debtExtra: 0
});
let S = fresh();
let month = NOW;

function fix() {
  const f = fresh();
  for (const k of Object.keys(f)) if (S[k] === undefined || S[k] === null && k !== 'cats') S[k] = f[k];
  ['income', 'incRec', 'expenses', 'rec', 'vary', 'todos', 'lists', 'goals', 'debts'].forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });
  ['notes', 'rc', 'dates', 'lim', 'ovr', 'skip', 'paid', 'rules'].forEach(k => { if (!S[k] || typeof S[k] !== 'object') S[k] = {}; });
  if (!S.plan) S.plan = f.plan;
  S.rec.forEach(r => { if (!r.from) r.from = NOW; });
  S.incRec.forEach(r => { if (!r.from) r.from = NOW; });
  S.vary.forEach(v => { if (!v.hist) v.hist = {}; });
  if (!S.lists.length) S.lists = [{ id: uid(), name: 'Shopping list', items: [] }];
  S.lists.forEach(l => { if (!Array.isArray(l.items)) l.items = []; l.items.forEach(i => { if (!i.qty) i.qty = 1; }); });
  if (!Array.isArray(S.cats)) S.cats = DEF_CATS.map(c => ({ ...c }));
  const used = new Set();
  S.expenses.concat(S.rec, S.vary).forEach(x => x.cat && used.add(x.cat));
  Object.keys(S.lim).forEach(k => used.add(k));
  used.forEach(n => { if (!S.cats.find(c => c.n === n)) S.cats.push({ n, i: '🏷️', c: PALETTE[S.cats.length % PALETTE.length] }); });
  if (!S.cats.find(c => c.n === 'Other')) S.cats.push({ n: 'Other', i: '📦', c: '#8c8577' });
}
let timer;
function save() { clearTimeout(timer); timer = setTimeout(flush, 250); }
function flush() { clearTimeout(timer); try { localStorage.setItem('budget-tool', JSON.stringify(S)); } catch (e) { } }
addEventListener('pagehide', flush);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); });
try { const j = localStorage.getItem('budget-tool'); if (j) S = Object.assign(fresh(), JSON.parse(j)); } catch (e) { }
fix();

/* receipts in IndexedDB */
const IDB = new Promise((res, rej) => { const r = indexedDB.open('budget-tool', 1); r.onupgradeneeded = () => r.result.createObjectStore('rc'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
function idb(mode, fn) { return IDB.then(d => new Promise((res, rej) => { const t = d.transaction('rc', mode), q = fn(t.objectStore('rc')); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); })); }
const rcGet = k => idb('readonly', s => s.get(k)), rcSet = (k, v) => idb('readwrite', s => s.put(v, k)), rcDel = k => idb('readwrite', s => s.delete(k)),
  rcAll = () => idb('readonly', s => s.getAll()), rcKeys = () => idb('readonly', s => s.getAllKeys()), rcClear = () => idb('readwrite', s => s.clear());
/* delete receipts no longer referenced (done at start so "Undo" can restore them during a session) */
setTimeout(() => rcKeys().then(ks => (ks || []).forEach(k => { if (!S.rc[k]) rcDel(k); })).catch(() => { }), 4000);

/* ---------- categories ---------- */
const cat = n => S.cats.find(c => c.n === n) || { n: n || 'Other', i: '🏷️', c: '#8c8577' };
function ensureCat(n) { if (!S.cats.find(c => c.n === n)) { const d = DEF_CATS.find(c => c.n === n); S.cats.push(d ? { ...d } : { n, i: '🏷️', c: PALETTE[S.cats.length % PALETTE.length] }); } }
const KEYWORDS = {
  Food: ['grocer', 'market', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'doordash', 'uber eats', 'deliveroo', 'bakery', 'aldi', 'lidl', 'kroger', 'safeway', 'tesco', 'whole foods', 'trader joe', 'mcdonald', 'starbucks', 'chipotle', 'food'],
  Transport: ['uber', 'lyft', 'fuel', 'petrol', 'shell', 'chevron', 'exxon', 'parking', 'transit', 'metro', 'train', 'bus', 'toll', 'gas station'],
  Bills: ['electric', 'water', 'internet', 'phone', 'mobile', 'utility', 'insurance', 'verizon', 'comcast', 'at&t', 't-mobile', 'power', 'energy'],
  Housing: ['rent', 'mortgage', 'landlord', 'hoa', 'property'],
  Health: ['pharmacy', 'doctor', 'dental', 'clinic', 'hospital', 'cvs', 'walgreens', 'gym', 'fitness'],
  Subscriptions: ['netflix', 'spotify', 'hulu', 'disney', 'apple.com', 'icloud', 'youtube', 'prime', 'patreon', 'subscription'],
  Fun: ['cinema', 'movie', 'steam', 'playstation', 'xbox', 'bar ', 'pub', 'concert', 'ticket'],
  Shopping: ['amazon', 'target', 'walmart', 'ikea', 'best buy', 'ebay', 'etsy'],
};
function guessCat(name) {
  const k = name.trim().toLowerCase(); if (!k) return null;
  if (S.rules[k] && S.cats.find(c => c.n === S.rules[k])) return S.rules[k];
  for (const [c, ws] of Object.entries(KEYWORDS)) if (S.cats.find(x => x.n === c) && ws.some(w => k.includes(w))) return c;
  return null;
}

/* ---------- money model ---------- */
const active = (r, m) => (!r.from || r.from <= m) && (!r.until || m <= r.until);
const dueDate = (r, m) => r.day ? m + '-' + pad(Math.min(r.day, dim(m))) : '';
function histAvg(v, m) { const ks = Object.keys(v.hist).filter(k => k < m).sort().reverse().slice(0, S.avgN); return ks.length ? ks.reduce((s, k) => s + v.hist[k], 0) / ks.length : 0; }
function varyItem(v, m) {
  const key = v.id + '@' + m; if (S.skip[key]) return null;
  const has = v.hist[m] !== undefined, ks = Object.keys(v.hist).sort();
  if (!has && ks.length && m < ks[0]) return null;
  return { id: v.id, n: v.n, cat: v.cat, day: v.day, vary: true, kind: 'vary', src: 'vary', est: !has, amt: has ? v.hist[m] : histAvg(v, m), key, date: S.dates[key] || dueDate(v, m) };
}
function allEx(m = month) {
  const out = [];
  S.expenses.forEach(x => { if (x.m === m) out.push({ ...x, kind: 'one', src: 'expenses', key: x.id, date: S.dates[x.id] || '' }); });
  S.rec.forEach(r => {
    if (!active(r, m)) return; const key = r.id + '@' + m; if (S.skip[key]) return;
    out.push({ ...r, kind: 'rec', src: 'rec', rec: true, key, amt: S.ovr[key] ?? r.amt, date: S.dates[key] || dueDate(r, m) });
  });
  S.vary.forEach(v => { const it = varyItem(v, m); if (it) out.push(it); });
  return out;
}
function allInc(m = month) {
  const out = [];
  S.income.forEach(x => { if (x.m === m) out.push({ ...x, inc: true, kind: 'one', src: 'income', key: x.id, date: S.dates[x.id] || '' }); });
  S.incRec.forEach(r => {
    if (!active(r, m)) return; const key = r.id + '@' + m; if (S.skip[key]) return;
    out.push({ ...r, inc: true, kind: 'rec', src: 'incRec', rec: true, key, amt: S.ovr[key] ?? r.amt, date: S.dates[key] || dueDate(r, m) });
  });
  return out;
}
const txs = (m = month) => allInc(m).concat(allEx(m));
function calc(m = month) {
  const inc = sum(allInc(m)), sp = sum(allEx(m)), left = inc - sp;
  return { inc, sp, left, avail: Math.max(0, left) + (S.useSav ? (+S.savings || 0) : 0) };
}
function byCat(list) { const by = {}; list.forEach(x => { by[x.cat || 'Other'] = (by[x.cat || 'Other'] || 0) + x.amt; }); return by; }
function findTx(k) {
  if (k.includes('@')) { const i = k.lastIndexOf('@'), id = k.slice(0, i), m = k.slice(i + 1); const x = txs(m).find(x => x.id === id); return x && { x, m }; }
  let x = S.expenses.find(x => x.id === k); if (x) return { x: allEx(x.m).find(y => y.key === k), m: x.m };
  x = S.income.find(x => x.id === k); if (x) return { x: allInc(x.m).find(y => y.key === k), m: x.m };
  return null;
}
const series = x => (S[x.src] || []).find(o => o.id === x.id);
function allMonths() {
  const ks = [NOW];
  S.income.forEach(x => ks.push(x.m)); S.expenses.forEach(x => ks.push(x.m));
  S.rec.forEach(r => r.from && ks.push(r.from)); S.incRec.forEach(r => r.from && ks.push(r.from));
  S.vary.forEach(v => Object.keys(v.hist).forEach(k => ks.push(k)));
  ks.sort(); const out = []; let k = ks[0]; const end = ks[ks.length - 1];
  for (let i = 0; i < 600; i++) { out.push(k); if (k >= end) break; k = addM(k, 1); }
  return out;
}
function cleanup(id) {
  ['notes', 'dates', 'rc', 'ovr', 'skip', 'paid'].forEach(o => Object.keys(S[o]).forEach(k => { if (k === id || k.startsWith(id + '@')) { delete S[o][k]; delete rcCache[k]; } }));
}

/* ---------- router ---------- */
let R = { name: 'home', args: [] };
const stack = [location.hash || '#/'];
let replacing = false;
function parseHash() { const p = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(s => { try { return decodeURIComponent(s); } catch (e) { return s; } }); return { name: p[0] || 'home', args: p.slice(1) }; }
function go(p) { location.hash = '#/' + p; }
function replace(p) { replacing = true; location.replace('#/' + p); }
function back(parent = '') { if (stack.length > 1) history.back(); else replace(parent); }
addEventListener('hashchange', () => {
  const h = location.hash || '#/';
  if (replacing) { stack[stack.length - 1] = h; replacing = false; }
  else if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop();
  else stack.push(h);
  R = parseHash(); render(); scrollTo(0, 0);
});
addEventListener('keydown', e => { if (e.key === 'Escape' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && stack.length > 1) history.back(); });

/* ---------- layout ---------- */
const NAV = [['home', 'Home', I.home], ['activity', 'Activity', I.activity], ['budget', 'Budget', I.budget], ['bills', 'Bills', I.bills], ['savings', 'Savings & goals', I.savings], ['debts', 'Debts', I.debt], ['lists', 'Shopping lists', I.cart], ['todo', 'To-do', I.todo], ['reports', 'Reports & history', I.reports], ['settings', 'Settings', I.settings]];
const TABS = [['home', 'Home', I.home], ['activity', 'Activity', I.activity], ['budget', 'Budget', I.budget], ['lists', 'Lists', I.cart], ['more', 'More', I.more]];
const SECTION = { tx: 'activity', add: 'activity', cat: 'budget', bill: 'bills', goal: 'savings', debt: 'debts', list: 'lists', item: 'lists', todo: 'todo', month: 'reports', import: 'settings' };
function head(title, o = {}) {
  return `<header class="ph">${o.back !== undefined ? `<button class="icb" onclick="back(${J(o.back)})" aria-label="Back">${I.back}</button>` : ''}<div class="pt"><h1>${esc(title)}</h1>${o.sub ? `<div class="mute">${o.sub}</div>` : ''}</div>${o.right || ''}</header>${o.month ? monthBar() : ''}`;
}
function monthBar() {
  return `<div class="mbar"><button class="icb" onclick="shiftM(-1)" aria-label="Previous month">${I.left}</button><label class="mlbl">${mlabel(month)}<input type="month" value="${month}" aria-label="Choose month" onclick="try{this.showPicker()}catch(e){}" onchange="if(this.value){month=this.value;render()}"></label><button class="icb" onclick="shiftM(1)" aria-label="Next month">${I.right}</button>${month !== NOW ? `<button class="chip" onclick="month=NOW;render()">This month</button>` : ''}</div>`;
}
function shiftM(n) { month = addM(month, n); render(); }
let post = [];
function render() {
  document.documentElement.toggleAttribute('data-theme', S.theme !== 'auto');
  if (S.theme !== 'auto') document.documentElement.setAttribute('data-theme', S.theme);
  const V = VIEWS[R.name] || VIEWS.home;
  const sec = SECTION[R.name] || R.name;
  $('#side').innerHTML = `<div class="brand"><img src="icon.svg" alt="">Budget</div>` + NAV.map(([k, l, i], n) => (n === 6 ? '<div class="sep"></div>' : '') + `<a href="#/${k}" class="${sec === k ? 'on' : ''}">${i}<span>${l}</span></a>`).join('');
  const moreOn = !['home', 'activity', 'budget', 'lists'].includes(sec);
  $('#tabbar').innerHTML = TABS.map(([k, l, i]) => `<a href="#/${k}" class="${(k === 'more' ? moreOn : sec === k) ? 'on' : ''}">${i}<span>${l}</span></a>`).join('');
  $('#fab').classList.toggle('hide', !['home', 'activity', 'budget', 'cat', 'bills'].includes(R.name));
  post = [];
  openKey = null;
  $('#app').innerHTML = V(...R.args);
  post.forEach(f => f());
  if (refocus) { const el = document.getElementById(refocus); refocus = null; if (el) el.focus(); }
}
let refocus = null;
function fabAdd() { go(R.name === 'cat' ? 'add/expense/' + encodeURIComponent(R.args[0]) : 'add/expense'); }

/* ---------- toast & undo ---------- */
let toastT, toastU;
function toast(msg, undo) {
  const t = $('#toast'); toastU = undo || null;
  t.innerHTML = `<span>${esc(msg)}</span>${undo ? '<button onclick="doUndo()">Undo</button>' : ''}`;
  t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), undo ? 6000 : 2400);
}
function doUndo() { if (toastU) { toastU(); toastU = null; } $('#toast').classList.remove('on'); }
function undoable(msg, fn, then) {
  const snap = JSON.stringify(S); fn(); save();
  toast(msg, () => { S = JSON.parse(snap); fix(); save(); render(); toast('Restored'); });
  if (then) then(); else render();
}

/* ---------- charts ---------- */
function donut(entries, centerTop, centerBottom, size = 168) {
  const t = entries.reduce((s, e) => s + e[1], 0); if (!t) return '';
  const r = 62, C = 2 * Math.PI * r, gap = entries.length > 1 ? 2 : 0; let off = 0;
  const segs = entries.map(([l, v, c]) => { const len = Math.max(0, v / t * C - gap); const s = `<circle cx="80" cy="80" r="${r}" fill="none" stroke="${c}" stroke-width="20" stroke-dasharray="${len} ${C - len}" stroke-dashoffset="${-off}" transform="rotate(-90 80 80)"><title>${esc(l)}: ${money(v)}</title></circle>`; off += v / t * C; return s; }).join('');
  return `<svg viewBox="0 0 160 160" width="${size}" height="${size}" role="img" aria-label="Breakdown">${segs}<text x="80" y="76" text-anchor="middle" font-size="11" fill="var(--mute)">${esc(centerTop)}</text><text x="80" y="95" text-anchor="middle" font-size="17" font-weight="700" fill="var(--ink)">${esc(centerBottom)}</text></svg>`;
}
function catDonut(by, label = 'Spent') {
  const e = Object.entries(by).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]), t = e.reduce((s, x) => s + x[1], 0);
  if (!t) return '';
  return `<div class="donut-wrap">${donut(e.map(([k, v]) => [k, v, cat(k).c]), label, money0(t))}<div class="lg">${e.map(([k, v]) => `<div><span><i style="display:inline-block;width:10px;height:10px;border-radius:3px;background:${cat(k).c};margin-right:8px"></i>${esc(cat(k).i)} ${esc(k)}</span><span class="num">${money(v)} <span class="mute">${pct(v, t)}%</span></span></div>`).join('')}</div></div>`;
}
function barsChart(rows) { // rows: {m, inc, sp}
  const W = 320, H = 96, n = rows.length, mx = Math.max(1, ...rows.map(r => Math.max(r.inc, r.sp))), bw = W / n, w = Math.min(14, (bw - 6) / 2);
  const grid = [0, .5, 1].map(f => `<line x1="0" x2="${W}" y1="${10 + H - f * H}" y2="${10 + H - f * H}" stroke="var(--line)" stroke-width="1"/>`).join('');
  const bars = rows.map((r, i) => {
    const cx = i * bw + bw / 2, h1 = r.inc / mx * H, h2 = r.sp / mx * H;
    return `<g><title>${mlabel(r.m)} — income ${money(r.inc)}, spent ${money(r.sp)}</title><rect x="${cx - w - 1}" y="${10 + H - h1}" width="${w}" height="${Math.max(h1, 0)}" rx="2.5" fill="var(--inc)"/><rect x="${cx + 1}" y="${10 + H - h2}" width="${w}" height="${Math.max(h2, 0)}" rx="2.5" fill="var(--sp)"/><text x="${cx}" y="${H + 24}" text-anchor="middle">${mshort(r.m)}</text></g>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 30}" width="100%" role="img" aria-label="Income and spending by month">${grid}${bars}<text x="${W}" y="8" text-anchor="end">${money0(mx)}</text></svg><div class="legend"><span><i style="background:var(--inc)"></i>Income</span><span><i style="background:var(--sp)"></i>Spent</span></div>`;
}
function monthBars(ms, vals, color, limit, curM) {
  const W = 320, H = 90, mx = Math.max(1, limit || 0, ...vals), bw = W / ms.length;
  const bars = ms.map((m, i) => { const v = vals[i] || 0, h = v / mx * H; return `<g><title>${mlabel(m)}: ${money(v)}</title>${v ? `<rect x="${i * bw + bw * .18}" y="${10 + H - h}" width="${bw * .64}" height="${h}" rx="3" fill="${color}" opacity="${m === curM ? 1 : .55}"/>` : ''}<text x="${i * bw + bw / 2}" y="${H + 24}" text-anchor="middle">${mshort(m)}</text></g>`; }).join('');
  const ly = limit ? 10 + H - limit / mx * H : 0;
  return `<svg class="chart" viewBox="0 0 ${W} ${H + 30}" width="100%" role="img" aria-label="Monthly amounts"><line x1="0" x2="${W}" y1="${10 + H}" y2="${10 + H}" stroke="var(--line)"/>${bars}${limit ? `<line x1="0" x2="${W}" y1="${ly}" y2="${ly}" stroke="var(--bad)" stroke-width="1.5" stroke-dasharray="4 3"/>` : ''}</svg>`;
}
function spark(vals, color) {
  const W = 80, H = 24, mx = Math.max(1, ...vals), n = vals.length;
  if (n < 2) return '';
  const pts = vals.map((v, i) => `${(i / (n - 1) * W).toFixed(1)},${(H - 2 - v / mx * (H - 4)).toFixed(1)}`).join(' ');
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}
function ring(p, size = 96, color = 'var(--acc)', label = '') {
  const r = 40, C = 2 * Math.PI * r, len = Math.max(0, Math.min(1, p)) * C;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 100 100" role="img" aria-label="${Math.round(p * 100)}%"><circle cx="50" cy="50" r="${r}" fill="none" stroke="var(--soft)" stroke-width="10"/><circle cx="50" cy="50" r="${r}" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len} ${C}" transform="rotate(-90 50 50)"/><text x="50" y="56" text-anchor="middle" font-size="19" font-weight="700" fill="var(--ink)">${label || Math.round(p * 100) + '%'}</text></svg>`;
}
const lastMonths = (end, n) => { const out = []; for (let i = n - 1; i >= 0; i--) out.push(addM(end, -i)); return out; };
function bar(p, color) { return `<div class="bar"><i style="width:${Math.max(0, Math.min(100, p))}%;background:${color}"></i></div>`; }

/* ---------- shared rows ---------- */
function txMeta(x, showMonth) {
  const bits = [];
  if (!x.inc) bits.push(esc(x.cat || 'Other')); else bits.push('Income');
  if (x.date) bits.push(fmtD(x.date)); else if (showMonth) bits.push(mshort(x.m || ''));
  let tags = '';
  if (x.kind === 'rec') tags += '<span class="tag">Monthly</span>';
  if (x.vary) tags += x.est ? '<span class="tag warn">Estimate</span>' : '<span class="tag">Varies</span>';
  if (S.paid[x.key]) tags += '<span class="tag acc">Paid</span>';
  if (S.notes[x.key]) tags += ' 📝'; if (S.rc[x.key]) tags += ' 📎';
  return bits.join(' · ') + tags;
}
function txRow(x, showMonth) {
  const c = x.inc ? { i: '💰', c: '#2f7d6d' } : cat(x.cat);
  return `<a class="tx" href="#/tx/${U(x.key)}"><span class="ic" style="background:${c.c}22">${esc(c.i)}</span><span class="n"><b>${esc(x.n)}</b><small>${txMeta(x, showMonth)}</small></span><span class="amt ${x.inc ? 'pos' : ''}">${x.inc ? '+' : '−'}${money(x.amt)}</span></a>`;
}
const sortTx = list => list.slice().sort((a, b) => (b.date || '0').localeCompare(a.date || '0'));
function empty(t, s, act) { return `<div class="empty"><b>${t}</b>${s}${act ? `<div class="mt">${act}</div>` : ''}</div>`; }

/* ============================================================
   VIEWS
   ============================================================ */
const VIEWS = {};

/* ---------- Home ---------- */
VIEWS.home = () => {
  const c = calc(), ex = allEx(), cur = month === NOW, prev = calc(addM(month, -1));
  const dleft = cur ? dim(month) - new Date().getDate() + 1 : 0;
  const spentPct = c.inc ? c.sp / c.inc * 100 : (c.sp ? 100 : 0);
  const third = cur ? ['Per day left', money(c.left > 0 ? c.left / dleft : 0)] : ['Saved', pct(Math.max(0, c.left), c.inc) + '%'];
  const greet = (h => h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening')(new Date().getHours());
  let h = head(greet, { sub: new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }), right: `<a class="icb" href="#/settings" aria-label="Settings">${I.settings}</a>` }) + monthBar();
  h += `<section class="card hero"><div class="lbl">Left to spend in ${mlabel(month)}</div><div class="big">${money(c.left)}</div><div class="meter"><i style="width:${Math.min(100, spentPct)}%"></i></div>
    <div class="hr"><div><small>Income</small><b>${money(c.inc)}</b></div><div><small>Spent</small><b>${money(c.sp)}</b></div><div><small>${third[0]}</small><b>${third[1]}</b></div></div></section>`;

  if (!S.income.length && !S.expenses.length && !S.rec.length && !S.vary.length && !S.incRec.length) {
    h += `<div class="card"><div class="ch"><h2>Get started</h2></div>
      <a class="note good" href="#/add/income"><span>💰</span><span><b>Add your income</b><br><span class="mute">Salary, side jobs — mark it monthly so it carries forward.</span></span></a>
      <a class="note" href="#/add/expense/_/fixed"><span>🏠</span><span><b>Add your regular bills</b><br><span class="mute">Rent, phone, subscriptions. They repeat automatically.</span></span></a>
      <a class="note" href="#/budget"><span>🎯</span><span><b>Set category budgets</b><br><span class="mute">Get warned before you overspend.</span></span></a>
      <a class="note" href="#/import"><span>📄</span><span><b>Import a bank statement</b><br><span class="mute">Bring in transactions from a CSV file.</span></span></a></div>`;
  }

  /* insights */
  const ins = [];
  const by = byCat(ex);
  S.cats.forEach(k => { const l = +S.lim[k.n] || 0, v = by[k.n] || 0; if (l && v > l) ins.push(['bad', '⚠️', `<b>${esc(k.n)}</b> is ${money(v - l)} over its ${money(l)} budget.`, '#/cat/' + U(k.n)]); else if (l && v > l * .85) ins.push(['warn', '⏳', `<b>${esc(k.n)}</b> has ${money(l - v)} left (${pct(v, l)}% used).`, '#/cat/' + U(k.n)]); });
  const est = ex.filter(x => x.vary && x.est);
  if (est.length) ins.push(['warn', '🧾', `${plural(est.length, 'varying bill')} still ${est.length === 1 ? 'uses an estimate' : 'use estimates'} — enter the real amount when it arrives.`, '#/bills']);
  const overdue = upcoming(-31, -1).filter(x => x.date >= NOW + '-01');
  if (overdue.length) ins.push(['bad', '📅', `${plural(overdue.length, 'bill')} past due and not marked paid.`, '#/bills']);
  if (prev.sp > 0 && c.sp > 0 && !cur) { const d = (c.sp - prev.sp) / prev.sp * 100; ins.push([d > 0 ? 'warn' : 'good', d > 0 ? '📈' : '📉', `Spending was ${Math.abs(Math.round(d))}% ${d > 0 ? 'higher' : 'lower'} than ${mlabel(addM(month, -1))}.`, '#/reports']); }
  if (cur && prev.sp > 0 && c.sp > 0) {
    const day = new Date().getDate(), sameDay = sum(allEx(addM(month, -1)).filter(x => x.kind === 'one' && x.date && +x.date.slice(8) <= day)), nowSoFar = sum(ex.filter(x => x.kind === 'one' && x.date && +x.date.slice(8) <= day));
    if (sameDay > 0 && nowSoFar > 0) { const d = (nowSoFar - sameDay) / sameDay * 100; if (Math.abs(d) >= 10) ins.push([d > 0 ? 'warn' : 'good', d > 0 ? '📈' : '📉', `Day-to-day spending is ${Math.abs(Math.round(d))}% ${d > 0 ? 'ahead of' : 'behind'} last month at this point.`, '#/reports']); }
  }
  if (c.inc > 0 && c.left > 0 && !cur) ins.push(['good', '🌱', `You kept ${pct(c.left, c.inc)}% of your income this month.`, '#/savings']);
  if (ins.length) h += ins.slice(0, 4).map(([t, e, s, l]) => `<a class="note ${t}" href="${l}"><span>${e}</span><span>${s}</span></a>`).join('') + '<div style="height:6px"></div>';

  h += '<div class="cols">';
  /* upcoming */
  const up = upcoming(0, 14);
  h += `<div class="card flush"><div class="ch"><h2>Upcoming bills</h2><a href="#/bills">All bills</a></div><div class="rows">${up.length ? up.slice(0, 5).map(billRow).join('') : `<div class="empty small">Nothing due in the next two weeks.${S.rec.length || S.vary.length ? '' : '<br>Add a due day to recurring bills to see them here.'}</div>`}</div></div>`;
  /* budgets */
  const lims = S.cats.filter(k => +S.lim[k.n]).map(k => ({ k, v: by[k.n] || 0, l: +S.lim[k.n] })).sort((a, b) => b.v / b.l - a.v / a.l).slice(0, 5);
  h += `<div class="card"><div class="ch"><h2>Budgets</h2><a href="#/budget">Manage</a></div>${lims.length ? lims.map(({ k, v, l }) => `<a href="#/cat/${U(k.n)}" style="display:block;color:inherit;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>${esc(k.i)} ${esc(k.n)}</span><span class="num ${v > l ? 'neg' : ''}">${money(v)} <span class="mute">/ ${money0(l)}</span></span></div>${bar(v / l * 100, v > l ? 'var(--bad)' : v > l * .85 ? 'var(--warn)' : k.c)}</a>`).join('') : `<div class="empty small">No category budgets yet.<div class="mt"><a class="btn sm" href="#/budget">Set budgets</a></div></div>`}</div>`;
  h += '</div><div class="cols">';
  /* recent */
  const rec = sortTx(txs()).slice(0, 6);
  h += `<div class="card flush"><div class="ch"><h2>Recent activity</h2><a href="#/activity">See all</a></div><div class="rows">${rec.length ? rec.map(x => txRow(x)).join('') : empty('No activity yet', 'Tap + to add income or an expense.')}</div></div>`;
  /* goals + todos */
  const tdue = S.todos.filter(t => !t.done && t.due && t.due <= addDays(TODAY, 2)).sort((a, b) => a.due.localeCompare(b.due));
  h += `<div>`;
  if (S.goals.length) h += `<div class="card"><div class="ch"><h2>Goals</h2><a href="#/savings">All goals</a></div>${S.goals.slice(0, 3).map(g => `<a href="#/goal/${g.id}" style="display:block;color:inherit;margin-bottom:12px"><div style="display:flex;justify-content:space-between;gap:8px;font-size:14px"><span>${esc(g.i || '🎯')} ${esc(g.n)}</span><span class="num">${money0(g.saved)} <span class="mute">/ ${money0(g.target)}</span></span></div>${bar(g.target ? g.saved / g.target * 100 : 0, 'var(--acc)')}</a>`).join('')}</div>`;
  else h += `<a class="card" href="#/goal/new" style="display:block;color:inherit"><div class="ch"><h2>Goals</h2></div><div class="mute">🎯 Saving for something? Create a goal and track progress.</div></a>`;
  h += `<div class="card flush"><div class="ch"><h2>Tasks due soon</h2><a href="#/todo">To-do</a></div><div class="rows">${tdue.length ? tdue.slice(0, 4).map(todoRow).join('') : '<div class="empty small">No tasks due in the next few days.</div>'}</div></div>`;
  h += `</div></div>`;
  return h;
};
function upcoming(fromDays, toDays) {
  const a = addDays(TODAY, fromDays), b = addDays(TODAY, toDays), out = [];
  const ms = new Set([a.slice(0, 7), b.slice(0, 7), NOW]);
  ms.forEach(m => allEx(m).forEach(x => { if (x.date && x.date >= a && x.date <= b && !S.paid[x.key] && (x.kind !== 'one' || x.date > TODAY)) out.push(x); }));
  return out.sort((x, y) => x.date.localeCompare(y.date));
}
function billRow(x) {
  const d = x.date, days = Math.round((new Date(d + 'T00:00') - new Date(TODAY + 'T00:00')) / 864e5);
  const when = days < 0 ? `<span class="neg">${-days}d overdue</span>` : days === 0 ? '<span class="warn">Due today</span>' : days === 1 ? 'Tomorrow' : fmtD(d);
  const c = cat(x.cat);
  return `<div class="tx"><input type="checkbox" ${S.paid[x.key] ? 'checked' : ''} onchange="setPaid(${J(x.key)},this.checked)" aria-label="Mark ${esc(x.n)} paid"><a class="n" href="#/tx/${U(x.key)}" style="color:inherit"><b>${esc(c.i)} ${esc(x.n)}</b><small>${when}${x.est ? ' · estimate' : ''}</small></a><span class="amt">${money(x.amt)}</span></div>`;
}
function setPaid(k, v) { if (v) S.paid[k] = 1; else delete S.paid[k]; save(); toast(v ? 'Marked as paid' : 'Marked unpaid'); render(); }

/* ---------- Activity ---------- */
let actQ = '', actF = 'all', actCat = '', actAll = false;
VIEWS.activity = () => {
  const c = calc();
  let h = head('Activity', { right: `<a class="icb" href="#/import" title="Import CSV" aria-label="Import CSV">${I.plus}</a>` }) + monthBar();
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Money in</small><b class="pos">${money(c.inc)}</b></div><div class="tile"><small>Money out</small><b>${money(c.sp)}</b></div><div class="tile"><small>Net</small><b class="${c.left < 0 ? 'neg' : ''}">${money(c.left)}</b></div></div>`;
  h += `<div class="search">${I.search}<input id="actq" type="search" placeholder="Search transactions" value="${esc(actQ)}" oninput="actQ=this.value;actRefresh()"></div>
  <div class="chips">${[['all', 'All'], ['out', 'Expenses'], ['in', 'Income'], ['bills', 'Recurring'], ['notes', 'With notes/receipts']].map(([k, l]) => `<button class="chip ${actF === k ? 'on' : ''}" onclick="actF='${k}';render()">${l}</button>`).join('')}
  <select class="chip" style="width:auto;padding:6px 10px" onchange="actCat=this.value;render()"><option value="">All categories</option>${S.cats.map(k => `<option ${actCat === k.n ? 'selected' : ''} value="${esc(k.n)}">${esc(k.i)} ${esc(k.n)}</option>`).join('')}</select>
  <label class="chip" style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" style="width:16px;height:16px;flex:0 0 16px" ${actAll ? 'checked' : ''} onchange="actAll=this.checked;render()">All months</label></div>`;
  h += `<div class="card flush" id="actlist">${actList()}</div>`;
  return h;
};
function actRefresh() { const el = $('#actlist'); if (el) el.innerHTML = actList(); }
function actList() {
  let list = actAll ? allMonths().flatMap(m => txs(m).map(x => ({ ...x, m }))) : txs().map(x => ({ ...x, m: month }));
  const q = actQ.trim().toLowerCase();
  list = list.filter(x => (actF === 'all' || actF === 'out' && !x.inc || actF === 'in' && x.inc || actF === 'bills' && x.kind !== 'one' || actF === 'notes' && (S.notes[x.key] || S.rc[x.key]))
    && (!actCat || x.cat === actCat && !x.inc)
    && (!q || x.n.toLowerCase().includes(q) || (x.cat || '').toLowerCase().includes(q) || (S.notes[x.key] || '').toLowerCase().includes(q) || String(x.amt).includes(q)));
  if (actAll) list = list.filter(x => !x.est);
  if (!list.length) return empty(q || actF !== 'all' || actCat ? 'No matches' : 'Nothing here yet', q || actF !== 'all' || actCat ? 'Try a different search or filter.' : 'Tap + to add income or an expense.', q || actF !== 'all' || actCat ? '' : '<a class="btn" href="#/add/expense">Add a transaction</a>');
  const groups = {};
  list.forEach(x => { const g = x.date || (actAll ? x.m + '-00' : 'none'); (groups[g] = groups[g] || []).push(x); });
  const keys = Object.keys(groups).sort((a, b) => a === 'none' ? 1 : b === 'none' ? -1 : b.localeCompare(a));
  const tot = list.reduce((s, x) => s + (x.inc ? x.amt : -x.amt), 0);
  return `<div class="rows">${keys.map(k => { const g = groups[k], net = g.reduce((s, x) => s + (x.inc ? x.amt : -x.amt), 0); return `<div class="day"><span>${k === 'none' ? 'No date' : k.endsWith('-00') ? mlabel(k.slice(0, 7)) + ' · no date' : fmtDL(k)}</span><span class="num">${net >= 0 ? '+' : ''}${money(net)}</span></div>` + g.map(x => txRow(x, actAll)).join(''); }).join('')}</div><div class="day" style="padding-bottom:12px"><span>${plural(list.length, 'transaction')}</span><span class="num">${tot >= 0 ? '+' : ''}${money(tot)}</span></div>`;
}

/* ---------- Add transaction ---------- */
VIEWS.add = (type = 'expense', preCat, preRep) => {
  const isInc = type === 'income';
  if (preCat === '_') preCat = '';
  const defDate = month === NOW ? TODAY : '';
  const names = [...new Set(S.expenses.map(x => x.n).concat(S.rec.map(x => x.n), S.vary.map(x => x.n), S.income.map(x => x.n)))].slice(-200);
  post.push(() => { const a = $('#f-amt'); if (a && !matchMedia('(pointer:coarse)').matches) a.focus(); });
  return head(isInc ? 'Add income' : 'Add expense', { back: 'activity' }) + `
  <form class="card" id="addf" onsubmit="return submitAdd(event)">
    <div class="seg"><button type="button" class="${isInc ? '' : 'on'}" onclick="replace('add/expense')">Expense</button><button type="button" class="${isInc ? 'on' : ''}" onclick="replace('add/income')">Income</button></div>
    <input type="hidden" name="type" value="${type}">
    <div class="bigamt"><span>${esc(S.cur)}</span><input id="f-amt" name="a" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00" required aria-label="Amount"></div>
    <label class="fld"><span>${isInc ? 'Source' : 'What for?'}</span><input name="n" required list="names" placeholder="${isInc ? 'e.g. Salary' : 'e.g. Groceries'}" autocomplete="off" ${isInc ? '' : 'oninput="autoCat(this.value)"'}></label>
    <datalist id="names">${names.map(n => `<option value="${esc(n)}">`).join('')}</datalist>
    ${isInc ? '' : `<div class="fld"><span>Category</span><div class="catpick">${S.cats.map((k, i) => `<label><input type="radio" name="c" value="${esc(k.n)}" ${(preCat ? preCat === k.n : k.n === 'Other') ? 'checked' : ''} onchange="this.form.dataset.manual=1"><span>${esc(k.i)}</span><span>${esc(k.n)}</span></label>`).join('')}</div></div>`}
    <div class="form-grid"><label class="fld"><span>Date (optional)</span><input name="d" type="date" value="${defDate}"></label>
    <label class="fld"><span>Repeats</span><select name="rep">${isInc ? `<option value="none">One time</option><option value="fixed" ${preRep === 'fixed' ? 'selected' : ''}>Every month</option>` : `<option value="none">One time</option><option value="fixed" ${preRep === 'fixed' ? 'selected' : ''}>Every month · same amount (rent, subscriptions)</option><option value="vary" ${preRep === 'vary' ? 'selected' : ''}>Every month · amount varies (electric, water)</option>`}</select></label></div>
    <label class="fld"><span>Note (optional)</span><textarea name="note" rows="2" placeholder="Add a description…" style="min-height:60px"></textarea></label>
    <div class="row"><button class="btn" style="flex:1">Save</button><button type="button" class="btn ghost" onclick="submitAdd(null,true)">Save &amp; add another</button></div>
    <p class="mute mb0" style="margin-top:10px">Monthly items start from the month of the date (or the month you're viewing) and carry forward. The date's day becomes the due day. You can add a receipt after saving.</p>
  </form>`;
};
function autoCat(v) { const f = $('#addf'); if (!f || f.dataset.manual) return; const g = guessCat(v); if (g) { const r = [...f.querySelectorAll('input[name=c]')].find(r => r.value === g); if (r) r.checked = true; } }
function submitAdd(e, again) {
  if (e) e.preventDefault();
  const f = $('#addf'); if (!f.reportValidity()) return false;
  const type = f.type.value, n = f.n.value.trim(), a = num(f.a.value), dt = f.d.value, rep = f.rep.value, note = f.note.value.trim();
  if (!n || a === null) return false;
  const m = dt ? dt.slice(0, 7) : month, day = dt ? +dt.slice(8) : 0; let key;
  if (type === 'income') {
    if (rep === 'fixed') { const o = { id: uid(), n, amt: a, from: m, day }; S.incRec.push(o); key = o.id + '@' + m; }
    else { const o = { id: uid(), n, amt: a, m }; S.income.push(o); key = o.id; if (dt) S.dates[key] = dt; }
  } else {
    const c = (f.querySelector('input[name=c]:checked') || {}).value || 'Other';
    if (rep === 'vary') { let b = S.vary.find(x => x.n.toLowerCase() === n.toLowerCase()); if (!b) { b = { id: uid(), n, cat: c, hist: {}, day }; S.vary.push(b); } b.hist[m] = a; if (day) b.day = day; key = b.id + '@' + m; }
    else if (rep === 'fixed') { const o = { id: uid(), n, amt: a, cat: c, from: m, day }; S.rec.push(o); key = o.id + '@' + m; }
    else { const o = { id: uid(), n, amt: a, cat: c, m }; S.expenses.push(o); key = o.id; if (dt) S.dates[key] = dt; }
    S.rules[n.toLowerCase()] = c;
  }
  if (note) S.notes[key] = note;
  save();
  toast((type === 'income' ? 'Income' : 'Expense') + ' added' + (m !== month ? ' to ' + mlabel(m) : ''));
  if (again) { f.n.value = ''; f.a.value = ''; f.note.value = ''; delete f.dataset.manual; f.a.focus(); }
  else back('activity');
  return false;
}

/* ---------- Transaction detail ---------- */
let openKey = null; const rcCache = {};
VIEWS.tx = (k) => {
  const f = k && findTx(k);
  if (!f || !f.x) return head('Not found', { back: 'activity' }) + `<div class="card">${empty('This item no longer exists', 'It may have been deleted.')}</div>`;
  const x = f.x, m = f.m, s = series(x), c = x.inc ? { i: '💰', c: '#2f7d6d' } : cat(x.cat);
  openKey = k;
  const kindLbl = x.kind === 'rec' ? 'Repeats monthly' : x.vary ? 'Monthly bill · amount varies' : 'One-time';
  let h = head(x.n, { back: 'activity', sub: `${mlabel(m)} · ${kindLbl}` });
  h += `<div class="card" style="text-align:center"><div class="ic" style="margin:0 auto 8px;width:52px;height:52px;font-size:26px;background:${c.c}22">${esc(c.i)}</div><div style="font-size:34px;font-weight:750;letter-spacing:-.02em" class="num ${x.inc ? 'pos' : ''}">${x.inc ? '+' : '−'}${money(x.amt)}</div><div class="mute">${x.inc ? 'Income' : esc(x.cat || 'Other')}${x.date ? ' · ' + fmtDL(x.date) : ''}${x.est ? ' · <span class="warn">estimate</span>' : ''}</div></div>`;

  h += `<h2 class="sec">Details</h2><div class="card"><div class="form-grid">
    <label class="fld"><span>Name</span><input value="${esc(x.n)}" onchange="txSet(${J(k)},'n',this.value)"></label>`;
  if (x.kind === 'one') h += `<label class="fld"><span>Amount</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${x.amt}" onchange="txSet(${J(k)},'amt',this.value)"></label>`;
  if (x.kind === 'rec') h += `<label class="fld"><span>Usual amount (every month)</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${s.amt}" onchange="txSet(${J(k)},'amt',this.value)"></label>
    <label class="fld"><span>This month only</span><input type="number" inputmode="decimal" step="0.01" min="0" placeholder="${s.amt}" value="${S.ovr[k] ?? ''}" onchange="setOvr(${J(k)},this.value)"></label>`;
  if (x.vary) h += `<label class="fld"><span>Actual amount for ${mlabel(m)}</span><input type="number" inputmode="decimal" step="0.01" min="0" placeholder="${x.est ? 'Estimate ' + x.amt.toFixed(2) : ''}" value="${x.est ? '' : x.amt}" onchange="setVaryM(${J(x.id)},${J(m)},this.value)"></label>`;
  if (!x.inc) h += `<label class="fld"><span>Category</span><select onchange="txSet(${J(k)},'cat',this.value)">${S.cats.map(q => `<option value="${esc(q.n)}" ${q.n === x.cat ? 'selected' : ''}>${esc(q.i)} ${esc(q.n)}</option>`).join('')}</select></label>`;
  h += `<label class="fld"><span>${x.kind === 'one' ? 'Date' : 'Date this month'}</span><input type="date" value="${x.date || ''}" onchange="setDate(${J(k)},this.value)"></label>`;
  if (x.kind !== 'one') h += `<label class="fld"><span>Due day (every month)</span><input type="number" min="1" max="31" placeholder="—" value="${s.day || ''}" onchange="txSet(${J(k)},'day',this.value)"></label>`;
  h += `</div>`;
  if (!x.inc && (x.kind !== 'one' || x.date >= TODAY)) h += `<label class="toggle"><input type="checkbox" ${S.paid[k] ? 'checked' : ''} onchange="setPaid(${J(k)},this.checked)"><span class="n">Paid${x.kind !== 'one' ? ' for ' + mlabel(m) : ''}<small>Paid bills drop off your upcoming list.</small></span></label>`;
  h += `</div>`;

  h += `<h2 class="sec">Note</h2><div class="card"><textarea rows="3" placeholder="Add a description or note…" oninput="setNote(${J(k)},this.value)">${esc(S.notes[k] || '')}</textarea></div>`;
  h += `<h2 class="sec">Receipt</h2><div class="card">${receiptBlock(k)}</div>`;

  h += `<h2 class="sec">Actions</h2><div class="card"><div class="row">`;
  if (x.kind !== 'one') {
    const sv = s;
    h += `<a class="btn ghost" href="#/bill/${x.id}">${x.vary ? 'Bill history & chart' : 'Manage series'}</a>`;
    h += `<button class="btn ghost" onclick="skipMonth(${J(k)})">Skip ${mshort(m)} only</button>`;
    h += sv.until ? `<button class="btn ghost" onclick="txSet(${J(k)},'until','')">Resume repeating</button>` : `<button class="btn ghost" onclick="stopAfter(${J(k)},${J(m)})">Stop after ${mshort(m)}</button>`;
    h += `<button class="btn danger" onclick="delTx(${J(k)})">Delete series</button>`;
  } else {
    h += `<button class="btn ghost" onclick="dupTx(${J(k)})">Duplicate</button>`;
    if (!x.inc) h += `<button class="btn ghost" onclick="makeRec(${J(k)})">Make it monthly</button>`;
    h += `<button class="btn danger" onclick="delTx(${J(k)})">Delete</button>`;
  }
  h += `</div>${s && s.until ? `<p class="mute mb0">Repeats until ${mlabel(s.until)}.</p>` : ''}</div>`;
  return h;
};
function txObj(k) { const f = findTx(k); return f && { f, o: series(f.x) }; }
function txSet(k, field, val) {
  const t = txObj(k); if (!t || !t.o) return; const o = t.o;
  if (field === 'n') { val = val.trim(); if (!val) return render(); o.n = val; }
  else if (field === 'amt') { const n = num(val); if (n === null) return render(); o.amt = n; }
  else if (field === 'cat') { o.cat = val; S.rules[o.n.toLowerCase()] = val; }
  else if (field === 'day') { const d = parseInt(val); if (d >= 1 && d <= 31) o.day = d; else delete o.day; }
  else if (field === 'until') { if (val) o.until = val; else delete o.until; }
  save(); render(); toast('Saved');
}
function setOvr(k, v) { const n = num(v); if (n === null) delete S.ovr[k]; else S.ovr[k] = n; save(); render(); }
function setVaryM(id, m, v) { const b = S.vary.find(x => x.id === id); if (!b) return; const n = num(v); if (n === null) delete b.hist[m]; else b.hist[m] = n; save(); render(); }
function setDate(k, v) {
  if (v) S.dates[k] = v; else delete S.dates[k];
  if (!k.includes('@')) { const o = S.expenses.find(x => x.id === k) || S.income.find(x => x.id === k); if (o && v && o.m !== v.slice(0, 7)) { o.m = v.slice(0, 7); toast('Moved to ' + mlabel(o.m)); } }
  save(); render();
}
function setNote(k, v) { if (v.trim()) S.notes[k] = v; else delete S.notes[k]; save(); }
function skipMonth(k) { undoable('Skipped this month', () => { S.skip[k] = 1; }, () => back('activity')); }
function stopAfter(k, m) { const t = txObj(k); if (!t) return; t.o.until = m; save(); render(); toast('Stops after ' + mlabel(m)); }
function delTx(k) {
  const t = txObj(k); if (!t) return; const src = t.f.x.src, id = t.f.x.id;
  undoable(t.f.x.kind === 'one' ? 'Deleted' : 'Series deleted', () => { S[src] = S[src].filter(o => o.id !== id); cleanup(id); }, () => back('activity'));
}
function dupTx(k) {
  const t = txObj(k); if (!t) return; const o = t.o, src = t.f.x.src, n = { ...o, id: uid(), m: month };
  S[src].push(n); if (month === NOW) S.dates[n.id] = TODAY; save(); toast('Duplicated'); replace('tx/' + encodeURIComponent(n.id));
}
function makeRec(k) {
  const t = txObj(k); if (!t) return; const o = t.o, d = S.dates[k];
  const r = { id: uid(), n: o.n, amt: o.amt, cat: o.cat, from: o.m, day: d ? +d.slice(8) : 0 };
  ['notes', 'rc', 'paid'].forEach(z => { if (S[z][k]) { S[z][r.id + '@' + o.m] = S[z][k]; delete S[z][k]; } });
  S.expenses = S.expenses.filter(x => x.id !== o.id); S.rec.push(r); delete S.dates[k];
  if (S.rc[r.id + '@' + o.m]) rcGet(k).then(v => v && rcSet(r.id + '@' + o.m, { ...v, k: r.id + '@' + o.m })).catch(() => { });
  save(); toast('Now repeats every month'); replace('tx/' + encodeURIComponent(r.id + '@' + o.m));
}

/* receipts */
function receiptBlock(k) {
  const r = S.rc[k];
  if (r) post.push(() => loadReceipt(k));
  return `<div id="rcv" class="rc">${r ? '<div class="mute">Loading receipt…</div>' : '<div class="rc-empty">No receipt attached</div>'}</div><div id="rcm" class="mute"></div>
  <div class="row mt"><label class="btn" style="flex:1 1 160px">${I.camera}${r ? 'Replace receipt' : 'Add photo or PDF'}<input type="file" accept="image/*,application/pdf" hidden onchange="addReceipt(this,${J(k)})"></label>${r ? `<button class="btn ghost" onclick="rmReceipt(${J(k)})">Remove</button>` : ''}</div>`;
}
async function loadReceipt(k) {
  const box = () => $('#rcv');
  try {
    let d = rcCache[k]; if (!d) { const s = await rcGet(k); d = s ? s.data : null; if (d) rcCache[k] = d; }
    if (k !== openKey || !box()) return;
    if (!d) { box().innerHTML = '<div class="rc-empty">Receipt not found on this device.</div>'; return; }
    if (d.startsWith('data:image')) box().innerHTML = `<a href="${d}" target="_blank" rel="noopener"><img src="${d}" alt="Receipt"></a>`;
    else { box().innerHTML = `<div id="pdfv" class="mute">Loading PDF…</div><a href="${d}" download="${esc(S.rc[k].name)}" style="display:inline-block;margin-top:6px">Download ${esc(S.rc[k].name)}</a>`; renderPdf(d, k); }
  } catch (e) { if (box()) box().innerHTML = '<div class="rc-empty">Couldn’t load the receipt.</div>'; }
}
let pdfLib;
async function loadPdfJs() { if (!pdfLib) { pdfLib = await import('./pdf.min.mjs'); pdfLib.GlobalWorkerOptions.workerSrc = new URL('./pdf.worker.min.mjs', location.href).href; } return pdfLib; }
async function renderPdf(d, k) {
  const v = () => $('#pdfv'), bin = atob(d.split(',')[1]), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
  try {
    const lib = await loadPdfJs(), doc = await lib.getDocument({ data: u.slice() }).promise; if (k !== openKey || !v()) return; v().innerHTML = '';
    const w = v().clientWidth || 320, dpr = Math.min(2, devicePixelRatio || 1), n = Math.min(doc.numPages, 10);
    for (let i = 1; i <= n; i++) { const pg = await doc.getPage(i), sc = w / pg.getViewport({ scale: 1 }).width, vp = pg.getViewport({ scale: sc * dpr }), c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height; if (k !== openKey || !v()) return; v().appendChild(c); await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise; }
    if (doc.numPages > n && v()) v().insertAdjacentHTML('beforeend', '<div class="mute">Showing the first ' + n + ' pages. Use the download link for the rest.</div>');
  } catch (e) { if (v()) v().innerHTML = '<iframe title="Receipt" src="' + URL.createObjectURL(new Blob([u], { type: 'application/pdf' })) + '" style="width:100%;height:60vh;border:1px solid var(--line);border-radius:10px"></iframe>'; }
}
function shrink(f) { return new Promise((res, rej) => { const u = URL.createObjectURL(f), im = new Image(); im.onload = () => { const s = Math.min(1, 1400 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); URL.revokeObjectURL(u); res(c.toDataURL('image/jpeg', .72)); }; im.onerror = rej; im.src = u; }); }
async function addReceipt(inp, k) {
  const f = inp.files[0], msg = t => { const e = $('#rcm'); if (e) e.textContent = t; }; if (!f) return;
  try {
    let d;
    if (f.type.startsWith('image/')) d = await shrink(f);
    else if (f.type === 'application/pdf' && f.size < 3e6) d = await new Promise((a, b) => { const r = new FileReader(); r.onload = () => a(r.result); r.onerror = b; r.readAsDataURL(f); });
    else return msg('Please choose a photo or a PDF under 3 MB.');
    await rcSet(k, { k, name: f.name, data: d }); rcCache[k] = d; S.rc[k] = { name: f.name }; save(); render(); toast('Receipt saved');
  } catch (e) { msg('Could not save that file. Please try again.'); }
}
function rmReceipt(k) { undoable('Receipt removed', () => { delete S.rc[k]; delete rcCache[k]; }); }

/* ---------- Budget ---------- */
let editLim = false;
VIEWS.budget = () => {
  const c = calc(), ex = allEx(), by = byCat(ex), budgeted = S.cats.reduce((s, k) => s + (+S.lim[k.n] || 0), 0);
  const unb = c.inc - budgeted;
  let h = head('Budget', { right: `<button class="btn ${editLim ? '' : 'ghost'} sm" onclick="editLim=!editLim;render()">${editLim ? 'Done' : 'Edit limits'}</button>` }) + monthBar();
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Income</small><b>${money(c.inc)}</b></div><div class="tile"><small>Budgeted</small><b>${money(budgeted)}</b></div><div class="tile"><small>Spent</small><b>${money(c.sp)}</b></div></div>`;
  if (budgeted && c.inc) h += `<div class="note ${unb < 0 ? 'bad' : 'good'}"><span>${unb < 0 ? '⚠️' : '✅'}</span><span>${unb < 0 ? `Your budgets are ${money(-unb)} more than your income.` : `${money(unb)} of income isn’t assigned to a budget — that’s room to save.`}</span></div>`;
  if (Object.keys(by).length) h += `<div class="card">${catDonut(by)}</div>`;
  h += `<h2 class="sec">Categories</h2><div class="card flush"><div class="rows">`;
  const cats = S.cats.slice().sort((a, b) => (by[b.n] || 0) - (by[a.n] || 0) || (+S.lim[b.n] || 0) - (+S.lim[a.n] || 0));
  h += cats.map(k => {
    const v = by[k.n] || 0, l = +S.lim[k.n] || 0, over = l && v > l, mx = Math.max(1, ...Object.values(by));
    const col = over ? 'var(--bad)' : l && v > l * .85 ? 'var(--warn)' : k.c;
    if (editLim) return `<div class="li"><span class="ic" style="background:${k.c}22">${esc(k.i)}</span><span class="n"><b>${esc(k.n)}</b><small>Spent ${money(v)}</small></span><input type="number" inputmode="decimal" step="1" min="0" placeholder="No limit" value="${l || ''}" style="width:120px;flex:0 0 120px" onchange="setLim(${J(k.n)},this.value)" aria-label="${esc(k.n)} monthly limit"></div>`;
    return `<a class="li" href="#/cat/${U(k.n)}"><span class="ic" style="background:${k.c}22">${esc(k.i)}</span><span class="n"><span style="display:flex;justify-content:space-between;gap:8px"><b>${esc(k.n)}</b><span class="num ${over ? 'neg' : ''}" style="font-weight:600">${money(v)}${l ? ` <span class="mute">/ ${money0(l)}</span>` : ''}</span></span>${bar(l ? v / l * 100 : v / mx * 100, col)}<small>${l ? (over ? `<span class="neg">${money(v - l)} over</span>` : `${money(l - v)} left`) : 'No limit set'}</small></span>${I.chev}</a>`;
  }).join('');
  h += `</div></div>`;
  h += `<div class="card"><div class="ch"><h2>Add a category</h2></div><form class="row" onsubmit="return addCat(event)"><input name="i" placeholder="🏷️" maxlength="4" style="flex:0 0 64px;text-align:center"><input name="n" placeholder="Category name" required><button class="btn">Add</button></form></div>`;
  h += `<p class="mute">Limits are monthly and apply to every month. Tap a category to see its trend and transactions.</p>`;
  return h;
};
function setLim(k, v) { const n = num(v); if (n) S.lim[k] = n; else delete S.lim[k]; save(); render(); }
function addCat(e) { e.preventDefault(); const n = e.target.n.value.trim(), i = e.target.i.value.trim() || '🏷️'; if (!n) return false; if (S.cats.find(c => c.n.toLowerCase() === n.toLowerCase())) { toast('That category already exists'); return false; } S.cats.push({ n, i, c: PALETTE[S.cats.length % PALETTE.length] }); save(); render(); toast('Category added'); return false; }

/* ---------- Category detail ---------- */
VIEWS.cat = (name) => {
  const k = S.cats.find(c => c.n === name);
  if (!k) return head('Not found', { back: 'budget' }) + `<div class="card">${empty('Category not found', '')}</div>`;
  const list = sortTx(allEx().filter(x => x.cat === k.n)), v = sum(list), l = +S.lim[k.n] || 0;
  const ms = lastMonths(month, 6), vals = ms.map(m => sum(allEx(m).filter(x => x.cat === k.n && !x.est)));
  const avg = vals.slice(0, 5).filter(Boolean); const av = avg.length ? avg.reduce((a, b) => a + b, 0) / avg.length : 0;
  let h = head(`${k.i} ${k.n}`, { back: 'budget' }) + monthBar();
  h += `<div class="card"><div class="gprog">${ring(l ? v / l : 0, 104, v > l && l ? 'var(--bad)' : k.c, l ? pct(v, l) + '%' : '—')}<div style="flex:1;min-width:180px">
    <div class="kv"><span>Spent this month</span><b>${money(v)}</b></div><div class="kv"><span>Monthly limit</span><b>${l ? money(l) : 'None'}</b></div><div class="kv"><span>${l && v > l ? 'Over by' : 'Left'}</span><b class="${l && v > l ? 'neg' : ''}">${l ? money(Math.abs(l - v)) : '—'}</b></div><div class="kv"><span>Average (prev. 5 months)</span><b>${money(av)}</b></div></div></div>
    <label class="fld mt mb0"><span>Monthly limit</span><input type="number" inputmode="decimal" min="0" step="1" placeholder="No limit" value="${l || ''}" onchange="setLim(${J(k.n)},this.value)"></label></div>`;
  h += `<div class="card"><div class="ch"><h2>Last 6 months</h2></div>${monthBars(ms, vals, k.c, l, month)}${l ? '<div class="legend"><span><i style="background:var(--bad)"></i>Limit</span></div>' : ''}</div>`;
  h += `<div class="card flush"><div class="ch"><h2>${mlabel(month)}</h2><a href="#/add/expense/${U(k.n)}">+ Add</a></div><div class="rows">${list.length ? list.map(x => txRow(x)).join('') : '<div class="empty small">No spending in this category this month.</div>'}</div></div>`;
  h += `<h2 class="sec">Edit category</h2><div class="card"><div class="row"><label class="fld" style="flex:0 0 70px"><span>Icon</span><input value="${esc(k.i)}" maxlength="4" style="text-align:center" onchange="catEdit(${J(k.n)},'i',this.value)"></label><label class="fld"><span>Name</span><input value="${esc(k.n)}" onchange="catEdit(${J(k.n)},'n',this.value)"></label><label class="fld" style="flex:0 0 60px"><span>Color</span><input type="color" value="${esc(k.c)}" onchange="catEdit(${J(k.n)},'c',this.value)"></label></div>
    ${k.n !== 'Other' ? `<button class="btn danger" onclick="catDel(${J(k.n)})">Delete category</button><p class="mute mb0">Deleting moves its transactions to “Other”.</p>` : ''}</div>`;
  return h;
};
function catEdit(name, f, v) {
  const k = S.cats.find(c => c.n === name); if (!k) return; v = v.trim();
  if (f === 'n') {
    if (!v || v === name) return render(); if (S.cats.find(c => c.n === v)) { toast('That name is taken'); return render(); }
    k.n = v; S.expenses.concat(S.rec, S.vary).forEach(x => { if (x.cat === name) x.cat = v; });
    if (S.lim[name]) { S.lim[v] = S.lim[name]; delete S.lim[name]; }
    Object.keys(S.rules).forEach(r => { if (S.rules[r] === name) S.rules[r] = v; });
    save(); toast('Renamed'); return replace('cat/' + encodeURIComponent(v));
  }
  k[f] = v || k[f]; save(); render();
}
function catDel(name) {
  undoable('Category deleted', () => { S.cats = S.cats.filter(c => c.n !== name); S.expenses.concat(S.rec, S.vary).forEach(x => { if (x.cat === name) x.cat = 'Other'; }); delete S.lim[name]; Object.keys(S.rules).forEach(r => { if (S.rules[r] === name) delete S.rules[r]; }); }, () => back('budget'));
}

/* ---------- Bills ---------- */
let calDay = '';
VIEWS.bills = () => {
  const ex = allEx(), inc = allInc();
  const fixed = ex.filter(x => x.kind === 'rec'), vary = ex.filter(x => x.vary), rinc = inc.filter(x => x.kind === 'rec');
  const unpaid = fixed.concat(vary).filter(x => !S.paid[x.key]);
  let h = head('Bills & recurring', { right: `<a class="btn sm" href="#/add/expense/_/fixed">${I.plus}Bill</a>` }) + monthBar();
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Fixed bills</small><b>${money(sum(fixed))}</b></div><div class="tile"><small>Varying bills</small><b>${money(sum(vary))}</b></div><div class="tile"><small>Still to pay</small><b class="${sum(unpaid) ? 'warn' : 'pos'}">${money(sum(unpaid))}</b></div></div>`;
  h += `<div class="card">${calendar(month)}</div>`;
  if (calDay && calDay.startsWith(month)) {
    const dl = txs().filter(x => x.date === calDay);
    h += `<div class="card flush"><div class="ch"><h2>${fmtDL(calDay)}</h2><button class="x" onclick="calDay='';render()" aria-label="Close">${I.x}</button></div><div class="rows">${dl.length ? dl.map(x => txRow(x)).join('') : '<div class="empty small">Nothing on this day.</div>'}</div></div>`;
  }
  const brow = x => `<div class="tx"><input type="checkbox" ${S.paid[x.key] ? 'checked' : ''} onchange="setPaid(${J(x.key)},this.checked)" aria-label="Paid"><a class="n" href="#/bill/${x.id}" style="color:inherit"><b>${esc(cat(x.cat).i)} ${esc(x.n)}</b><small>${x.date ? 'Due ' + fmtD(x.date) : 'No due day'}${x.until ? ' · ends ' + mshort(x.until) : ''}${S.paid[x.key] ? ' · <span class="pos">paid</span>' : ''}</small></a><span class="amt">${money(x.amt)}</span></div>`;
  h += `<h2 class="sec">Fixed monthly bills</h2><div class="card flush"><div class="rows">${fixed.length ? fixed.sort((a, b) => (a.date || 'z').localeCompare(b.date || 'z')).map(brow).join('') : empty('No fixed bills', 'Rent, phone plans, subscriptions…', '<a class="btn sm" href="#/add/expense/_/fixed">Add a bill</a>')}</div></div>`;
  h += `<h2 class="sec">Varying bills</h2><div class="card flush"><div class="ch" style="justify-content:flex-start"><span class="mute">Estimate from the average of the last</span><select style="width:auto;padding:5px 8px" onchange="S.avgN=+this.value;save();render()">${[3, 6, 12].map(n => `<option value="${n}" ${S.avgN === n ? 'selected' : ''}>${n} months</option>`).join('')}</select></div><div class="rows">${vary.length ? vary.map(x => `<div class="tx"><input type="checkbox" ${S.paid[x.key] ? 'checked' : ''} onchange="setPaid(${J(x.key)},this.checked)" aria-label="Paid"><a class="n" href="#/bill/${x.id}" style="color:inherit"><b>${esc(cat(x.cat).i)} ${esc(x.n)}</b><small>${x.est ? '<span class="warn">Estimate</span> — enter the actual' : 'Actual'}${x.date ? ' · due ' + fmtD(x.date) : ''}</small></a><input type="number" inputmode="decimal" step="0.01" min="0" style="width:110px;flex:0 0 110px" placeholder="${x.amt.toFixed(2)}" value="${x.est ? '' : x.amt}" onchange="setVaryM(${J(x.id)},${J(month)},this.value)" aria-label="${esc(x.n)} amount"></div>`).join('') : empty('No varying bills', 'Electric, gas, water — amounts that change.', '<a class="btn sm" href="#/add/expense/_/vary">Add a varying bill</a>')}</div></div>`;
  h += `<h2 class="sec">Recurring income</h2><div class="card flush"><div class="rows">${rinc.length ? rinc.map(x => `<a class="tx" href="#/bill/${x.id}"><span class="ic" style="background:#2f7d6d22">💰</span><span class="n"><b>${esc(x.n)}</b><small>${x.date ? 'Paid ' + fmtD(x.date) : 'Monthly'}</small></span><span class="amt pos">+${money(x.amt)}</span>${I.chev}</a>`).join('') : empty('No recurring income', 'Add your salary as monthly income so it carries forward.', '<a class="btn sm" href="#/add/income/_/fixed">Add income</a>')}</div></div>`;
  const yearly = sum(S.rec.filter(r => active(r, NOW))) * 12;
  if (yearly) h += `<div class="note"><span>💸</span><span>Your fixed bills cost about <b>${money(yearly)}</b> a year. ${S.rec.filter(r => r.cat === 'Subscriptions' && active(r, NOW)).length ? `Subscriptions alone: <b>${money(sum(S.rec.filter(r => r.cat === 'Subscriptions' && active(r, NOW))) * 12)}</b>/yr.` : ''}</span></div>`;
  const skipped = Object.keys(S.skip).filter(k => k.endsWith('@' + month));
  if (skipped.length) h += `<div class="card"><div class="ch"><h2>Skipped this month</h2></div>${skipped.map(k => { const id = k.split('@')[0], o = S.rec.find(x => x.id === id) || S.vary.find(x => x.id === id) || S.incRec.find(x => x.id === id); return o ? `<div class="kv"><span>${esc(o.n)}</span><button class="btn ghost sm" onclick="delete S.skip[${J(k)}];save();render()">Restore</button></div>` : ''; }).join('')}</div>`;
  return h;
};
function calendar(m) {
  const first = mDate(m).getDay(), n = dim(m), list = txs(m).filter(x => x.date && x.date.startsWith(m)), by = {};
  list.forEach(x => { (by[x.date] = by[x.date] || []).push(x); });
  const wd = [...Array(7)].map((_, i) => new Date(2023, 0, 1 + i).toLocaleDateString(undefined, { weekday: 'narrow' }));
  let h = `<div class="ch"><h2>Calendar</h2><span class="mute small">Tap a day</span></div><div class="cal">${wd.map(d => `<div class="wd">${d}</div>`).join('')}${'<div></div>'.repeat(first)}`;
  for (let d = 1; d <= n; d++) {
    const iso = m + '-' + pad(d), it = by[iso] || [], out = it.filter(x => !x.inc).reduce((s, x) => s + x.amt, 0), inn = it.filter(x => x.inc).reduce((s, x) => s + x.amt, 0);
    h += `<button class="${iso === TODAY ? 'today' : ''} ${iso === calDay ? 'sel' : ''}" onclick="calDay=${J(iso)};render()" aria-label="${fmtDL(iso)}">${d}${out ? `<small class="${it.some(x => !x.inc && !S.paid[x.key] && x.kind !== 'one') ? 'neg' : 'mute'}">${money0(out).replace(S.cur, '')}</small>` : ''}${inn ? `<small class="pos">+${money0(inn).replace(S.cur, '')}</small>` : ''}</button>`;
  }
  return h + '</div>';
}

/* ---------- Bill / series detail ---------- */
VIEWS.bill = (id) => {
  const v = S.vary.find(x => x.id === id), r = S.rec.find(x => x.id === id), ri = S.incRec.find(x => x.id === id), o = v || r || ri;
  if (!o) return head('Not found', { back: 'bills' }) + `<div class="card">${empty('This bill no longer exists', '')}</div>`;
  const ms = lastMonths(month, 12);
  let h = head(o.n, { back: 'bills', sub: v ? 'Varying monthly bill' : ri ? 'Recurring income' : 'Fixed monthly bill' });
  if (v) {
    const got = ms.filter(k => v.hist[k] !== undefined), last = got.slice(-S.avgN), avg = last.length ? last.reduce((s, k) => s + v.hist[k], 0) / last.length : 0;
    const prev = got.length > 1 ? v.hist[got[got.length - 2]] : 0, cur = got.length ? v.hist[got[got.length - 1]] : 0;
    h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Average (${S.avgN} mo)</small><b>${money(avg)}</b></div><div class="tile"><small>Latest</small><b>${money(cur)}</b></div><div class="tile"><small>Change</small><b class="${cur > prev ? 'neg' : 'pos'}">${prev ? (cur >= prev ? '▲ ' : '▼ ') + Math.abs(Math.round((cur - prev) / prev * 100)) + '%' : '—'}</b></div></div>`;
    h += `<div class="card"><div class="ch"><h2>Last 12 months</h2></div>${monthBars(ms, ms.map(k => v.hist[k] || 0), cat(v.cat).c, avg, month)}<div class="legend"><span><i style="background:var(--bad)"></i>Average</span></div>${got.length < 2 ? '<p class="mute mb0">Log a few months and the trend will show here.</p>' : ''}</div>`;
    h += `<h2 class="sec">Monthly amounts</h2><div class="card"><table class="t"><tbody>${ms.slice().reverse().map(k => `<tr><td>${mlabel(k)}</td><td style="width:140px"><input type="number" inputmode="decimal" step="0.01" min="0" value="${v.hist[k] ?? ''}" placeholder="—" onchange="setVaryM(${J(v.id)},${J(k)},this.value)" aria-label="${mlabel(k)}"></td><td style="width:34px"><a href="#/tx/${U(v.id + '@' + k)}" aria-label="Open">${I.chev}</a></td></tr>`).join('')}</tbody></table></div>`;
  } else {
    h += `<div class="card"><div class="kv"><span>Started</span><b>${mlabel(o.from)}</b></div><div class="kv"><span>Ends</span><b>${o.until ? mlabel(o.until) : 'Never'}</b></div><div class="kv"><span>Per year</span><b>${money(o.amt * 12)}</b></div></div>`;
    const act = ms.filter(m => active(o, m));
    h += `<h2 class="sec">History</h2><div class="card flush"><div class="rows">${act.length ? act.slice().reverse().map(m => { const k = o.id + '@' + m; return `<a class="tx" href="#/tx/${U(k)}"><span class="n"><b>${mlabel(m)}</b><small>${S.skip[k] ? 'Skipped' : S.paid[k] ? '<span class="pos">Paid</span>' : ri ? 'Received' : m <= NOW ? 'Not marked paid' : 'Upcoming'}${S.ovr[k] !== undefined ? ' · adjusted' : ''}</small></span><span class="amt">${S.skip[k] ? '—' : money(S.ovr[k] ?? o.amt)}</span>${I.chev}</a>`; }).join('') : '<div class="empty small">Not active in the last 12 months.</div>'}</div></div>`;
  }
  h += `<h2 class="sec">Settings</h2><div class="card"><div class="form-grid">
    <label class="fld"><span>Name</span><input value="${esc(o.n)}" onchange="serSet(${J(id)},'n',this.value)"></label>
    ${v ? '' : `<label class="fld"><span>Amount</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${o.amt}" onchange="serSet(${J(id)},'amt',this.value)"></label>`}
    ${ri ? '' : `<label class="fld"><span>Category</span><select onchange="serSet(${J(id)},'cat',this.value)">${S.cats.map(q => `<option value="${esc(q.n)}" ${q.n === o.cat ? 'selected' : ''}>${esc(q.i)} ${esc(q.n)}</option>`).join('')}</select></label>`}
    <label class="fld"><span>Due day</span><input type="number" min="1" max="31" placeholder="—" value="${o.day || ''}" onchange="serSet(${J(id)},'day',this.value)"></label>
    ${v ? '' : `<label class="fld"><span>Starts</span><input type="month" value="${o.from}" onchange="serSet(${J(id)},'from',this.value)"></label><label class="fld"><span>Ends (optional)</span><input type="month" value="${o.until || ''}" onchange="serSet(${J(id)},'until',this.value)"></label>`}
  </div><button class="btn danger" onclick="serDel(${J(id)})">Delete ${v || r ? 'bill' : 'income'}</button></div>`;
  return h;
};
function serSet(id, f, val) {
  const o = S.vary.find(x => x.id === id) || S.rec.find(x => x.id === id) || S.incRec.find(x => x.id === id); if (!o) return;
  if (f === 'n') { if (!val.trim()) return render(); o.n = val.trim(); }
  else if (f === 'amt') { const n = num(val); if (n === null) return render(); o.amt = n; }
  else if (f === 'day') { const d = parseInt(val); if (d >= 1 && d <= 31) o.day = d; else delete o.day; }
  else if (f === 'until') { if (val) o.until = val; else delete o.until; }
  else if (f === 'from') { if (val) o.from = val; }
  else o[f] = val;
  save(); render(); toast('Saved');
}
function serDel(id) { const src = S.vary.find(x => x.id === id) ? 'vary' : S.rec.find(x => x.id === id) ? 'rec' : 'incRec'; undoable('Deleted', () => { S[src] = S[src].filter(x => x.id !== id); cleanup(id); }, () => back('bills')); }

/* ---------- Savings & goals ---------- */
VIEWS.savings = () => {
  const gs = S.goals.reduce((s, g) => s + (+g.saved || 0), 0), debt = S.debts.reduce((s, d) => s + (+d.bal || 0), 0), net = (+S.savings || 0) + gs - debt;
  const ms = lastMonths(NOW, 6).map(m => ({ m, ...calc(m) })).filter(r => r.inc), rate = ms.length ? ms.reduce((s, r) => s + Math.max(0, r.left), 0) / ms.reduce((s, r) => s + r.inc, 0) : 0;
  let h = head('Savings & goals');
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Savings</small><b>${money(S.savings)}</b></div><div class="tile"><small>In goals</small><b>${money(gs)}</b></div><div class="tile"><small>Net position</small><b class="${net < 0 ? 'neg' : 'pos'}">${money(net)}</b></div></div>`;
  h += `<div class="card"><div class="ch"><h2>Savings balance</h2></div><div class="row"><input type="number" inputmode="decimal" step="0.01" min="0" value="${S.savings || ''}" placeholder="0.00" onchange="S.savings=num(this.value)||0;save();render()" aria-label="Savings balance"></div>
    <label class="toggle"><input type="checkbox" ${S.useSav ? 'checked' : ''} onchange="S.useSav=this.checked;save()"><span class="n">Count savings when checking what I can afford<small>Used by shopping lists to tell you if you can buy everything.</small></span></label>
    ${ms.length ? `<div class="kv"><span>Average savings rate (6 mo)</span><b>${Math.round(rate * 100)}%</b></div>` : ''}${debt ? `<div class="kv"><span>Total debt</span><b class="neg">${money(debt)}</b></div>` : ''}</div>`;
  h += `<div class="ch" style="margin-top:22px;padding:0 4px"><h2>Goals</h2><a class="btn sm" href="#/goal/new">${I.plus}New goal</a></div>`;
  h += S.goals.length ? `<div class="card flush"><div class="rows">${S.goals.map(goalRow).join('')}</div></div>` : `<div class="card">${empty('No goals yet', 'Emergency fund, holiday, new laptop — set a target and a date and we’ll work out how much to put aside.', '<a class="btn" href="#/goal/new">Create a goal</a>')}</div>`;
  h += `<a class="card li link" href="#/debts" style="color:inherit"><span class="ic">💳</span><span class="n"><b>Debts</b><small>${S.debts.length ? plural(S.debts.length, 'debt') + ' · ' + money(debt) : 'Track loans & cards and plan your payoff'}</small></span>${I.chev}</a>`;
  return h;
};
function goalRow(g) {
  const p = g.target ? g.saved / g.target : 0, need = goalNeed(g);
  return `<a class="li" href="#/goal/${g.id}"><span class="ic" style="background:var(--accbg)">${esc(g.i || '🎯')}</span><span class="n"><span style="display:flex;justify-content:space-between;gap:8px"><b>${esc(g.n)}</b><span class="num" style="font-weight:600">${money0(g.saved)} <span class="mute">/ ${money0(g.target)}</span></span></span>${bar(p * 100, p >= 1 ? 'var(--acc)' : 'var(--acc)')}<small>${p >= 1 ? '🎉 Reached!' : need ? need : Math.round(p * 100) + '% there'}</small></span>${I.chev}</a>`;
}
function goalNeed(g) {
  const left = g.target - g.saved; if (left <= 0 || !g.date) return '';
  const days = (new Date(g.date + 'T00:00') - new Date(TODAY + 'T00:00')) / 864e5;
  if (days <= 0) return `<span class="neg">Target date passed · ${money(left)} to go</span>`;
  return `${money(left / Math.max(1, days / 30.44))}/month to reach by ${fmtD(g.date)}`;
}
VIEWS.goal = (id) => {
  if (id === 'new') return head('New goal', { back: 'savings' }) + `<form class="card" onsubmit="return newGoal(event)"><div class="form-grid">
    <label class="fld" style="grid-column:1/-1"><span>What are you saving for?</span><div class="row"><input name="i" placeholder="🎯" maxlength="4" style="flex:0 0 64px;text-align:center"><input name="n" required placeholder="e.g. Emergency fund"></div></label>
    <label class="fld"><span>Target amount</span><input name="t" type="number" inputmode="decimal" step="0.01" min="0" required></label>
    <label class="fld"><span>Already saved</span><input name="s" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0.00"></label>
    <label class="fld"><span>Target date (optional)</span><input name="d" type="date"></label></div><button class="btn wide">Create goal</button></form>`;
  const g = S.goals.find(x => x.id === id);
  if (!g) return head('Not found', { back: 'savings' }) + `<div class="card">${empty('Goal not found', '')}</div>`;
  const p = g.target ? g.saved / g.target : 0, left = Math.max(0, g.target - g.saved);
  let h = head(`${g.i || '🎯'} ${g.n}`, { back: 'savings' });
  h += `<div class="card"><div class="gprog">${ring(p, 120)}<div style="flex:1;min-width:180px"><div class="kv"><span>Saved</span><b>${money(g.saved)}</b></div><div class="kv"><span>Target</span><b>${money(g.target)}</b></div><div class="kv"><span>To go</span><b>${money(left)}</b></div>${g.date ? `<div class="kv"><span>Target date</span><b>${fmtD(g.date)} ${g.date.slice(0, 4)}</b></div>` : ''}</div></div>
    ${p >= 1 ? '<div class="verdict y mt mb0">🎉 Goal reached — nice work!</div>' : g.date ? `<div class="note good mt mb0"><span>📆</span><span>${goalPlan(g)}</span></div>` : ''}</div>`;
  h += `<div class="card"><div class="ch"><h2>Add or withdraw</h2></div><form onsubmit="return goalMove(event,${J(g.id)})"><div class="row"><input name="a" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Amount" required><button class="btn" name="dir" value="in">Add</button><button class="btn ghost" name="dir" value="out" onclick="this.form.dataset.dir='out'">Withdraw</button></div>
    <label class="toggle"><input type="checkbox" name="ex"><span class="n">Also record as spending this month<small>Adds it to the “Savings” category so it comes out of what’s left to spend.</small></span></label></form></div>`;
  if (g.log && g.log.length) h += `<h2 class="sec">History</h2><div class="card flush"><div class="rows">${g.log.slice().reverse().slice(0, 30).map(e => `<div class="tx"><span class="n"><b>${e.amt >= 0 ? 'Added' : 'Withdrew'}</b><small>${fmtD(e.d)} ${e.d.slice(0, 4)}</small></span><span class="amt ${e.amt >= 0 ? 'pos' : 'neg'}">${e.amt >= 0 ? '+' : '−'}${money(Math.abs(e.amt))}</span></div>`).join('')}</div></div>`;
  h += `<h2 class="sec">Edit goal</h2><div class="card"><div class="form-grid"><label class="fld"><span>Name</span><input value="${esc(g.n)}" onchange="goalSet(${J(g.id)},'n',this.value)"></label><label class="fld"><span>Icon</span><input value="${esc(g.i || '')}" maxlength="4" onchange="goalSet(${J(g.id)},'i',this.value)"></label>
    <label class="fld"><span>Target</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${g.target}" onchange="goalSet(${J(g.id)},'target',this.value)"></label><label class="fld"><span>Target date</span><input type="date" value="${g.date || ''}" onchange="goalSet(${J(g.id)},'date',this.value)"></label>
    <label class="fld"><span>Saved (set directly)</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${g.saved}" onchange="goalSet(${J(g.id)},'saved',this.value)"></label></div>
    <button class="btn danger" onclick="goalDel(${J(g.id)})">Delete goal</button></div>`;
  return h;
};
function goalPlan(g) {
  const left = g.target - g.saved, days = (new Date(g.date + 'T00:00') - new Date(TODAY + 'T00:00')) / 864e5;
  if (days <= 0) return `The target date has passed. ${money(left)} still to go.`;
  const wk = days / 7, mo = days / 30.44;
  return `To reach it by ${fmtD(g.date)}, put aside <b>${money(left / Math.max(1, mo))} a month</b> or <b>${money(left / Math.max(1, wk))} a week</b>.`;
}
function newGoal(e) { e.preventDefault(); const f = e.target, t = num(f.t.value), s = num(f.s.value) || 0; if (!t) return false; const g = { id: uid(), n: f.n.value.trim(), i: f.i.value.trim() || '🎯', target: t, saved: s, date: f.d.value, log: s ? [{ d: TODAY, amt: s }] : [] }; S.goals.push(g); save(); toast('Goal created'); replace('goal/' + g.id); return false; }
function goalMove(e, id) {
  e.preventDefault(); const f = e.target, a = num(f.a.value), g = S.goals.find(x => x.id === id); if (!a || !g) return false;
  const dir = (e.submitter && e.submitter.value) || f.dataset.dir || 'in', amt = dir === 'out' ? -Math.min(a, g.saved) : a;
  g.saved = Math.max(0, (+g.saved || 0) + amt); (g.log = g.log || []).push({ d: TODAY, amt });
  if (f.ex.checked && amt > 0) { ensureCat('Savings'); const o = { id: uid(), n: 'Saved to ' + g.n, amt, cat: 'Savings', m: NOW }; S.expenses.push(o); S.dates[o.id] = TODAY; }
  save(); render(); toast(amt >= 0 ? 'Added to goal' : 'Withdrawn'); return false;
}
function goalSet(id, f, v) { const g = S.goals.find(x => x.id === id); if (!g) return; if (f === 'target' || f === 'saved') { const n = num(v); if (n === null) return render(); g[f] = n; } else g[f] = v.trim(); save(); render(); }
function goalDel(id) { undoable('Goal deleted', () => { S.goals = S.goals.filter(g => g.id !== id); }, () => back('savings')); }

/* ---------- Debts ---------- */
function simulate(list, extra, mode) {
  const ds = list.filter(d => +d.bal > 0).map(d => ({ id: d.id, b: +d.bal, apr: +d.apr || 0, min: +d.min || 0 }));
  if (!ds.length) return { mo: 0, int: 0, order: [] };
  const budget = ds.reduce((s, d) => s + d.min, 0) + (+extra || 0); let mo = 0, int = 0; const order = [];
  while (ds.some(d => d.b > 0.005) && mo < 600) {
    mo++; ds.forEach(d => { if (d.b > 0) { const i = d.b * d.apr / 1200; d.b += i; int += i; } });
    let pool = budget;
    ds.forEach(d => { if (d.b > 0) { const p = Math.min(d.b, d.min, pool); d.b -= p; pool -= p; } });
    ds.filter(d => d.b > 0).sort(mode === 'snow' ? (a, b) => a.b - b.b : (a, b) => b.apr - a.apr || a.b - b.b).forEach(d => { if (pool > 0) { const p = Math.min(d.b, pool); d.b -= p; pool -= p; } });
    ds.forEach(d => { if (d.b <= 0.005 && !order.includes(d.id)) order.push(d.id); });
  }
  return mo >= 600 ? null : { mo, int, order };
}
const moLabel = n => n == null ? 'Never at this rate' : n < 12 ? plural(n, 'month') : `${Math.floor(n / 12)}y ${n % 12}m`;
const freeDate = n => n == null ? '—' : mDate(addM(NOW, n)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
VIEWS.debts = () => {
  const tot = S.debts.reduce((s, d) => s + (+d.bal || 0), 0), mins = S.debts.reduce((s, d) => s + (+d.min || 0), 0);
  let h = head('Debts', { back: 'savings', right: `<a class="btn sm" href="#/debt/new">${I.plus}Debt</a>` });
  if (!S.debts.length) return h + `<div class="card">${empty('No debts tracked', 'Add credit cards, loans or anything you owe to see when you’ll be debt-free and how to get there faster.', '<a class="btn" href="#/debt/new">Add a debt</a>')}</div>`;
  const av = simulate(S.debts, S.debtExtra, 'aval'), sn = simulate(S.debts, S.debtExtra, 'snow'), base = simulate(S.debts, 0, 'aval');
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Total owed</small><b class="neg">${money(tot)}</b></div><div class="tile"><small>Min. payments</small><b>${money(mins)}/mo</b></div><div class="tile"><small>Debt-free</small><b>${freeDate(av && av.mo)}</b></div></div>`;
  h += `<div class="card flush"><div class="rows">${S.debts.map(d => { const s = simulate([d], 0); return `<a class="li" href="#/debt/${d.id}"><span class="ic">💳</span><span class="n"><b>${esc(d.n)}</b><small>${d.apr || 0}% APR · ${money(d.min || 0)}/mo · ${s ? 'paid off ' + freeDate(s.mo) : '<span class="neg">payment too low</span>'}</small></span><span class="amt">${money(d.bal)}</span>${I.chev}</a>`; }).join('')}</div></div>`;
  h += `<h2 class="sec">Payoff plan</h2><div class="card"><label class="fld"><span>Extra I can pay each month (on top of minimums)</span><input type="number" inputmode="decimal" step="1" min="0" value="${S.debtExtra || ''}" placeholder="0" onchange="S.debtExtra=num(this.value)||0;save();render()"></label>
    <table class="t"><thead><tr><th>Strategy</th><th>Debt-free in</th><th>Total interest</th></tr></thead><tbody>
    <tr><td><b>Avalanche</b><br><span class="mute">Highest interest first</span></td><td>${moLabel(av && av.mo)}</td><td>${av ? money(av.int) : '—'}</td></tr>
    <tr><td><b>Snowball</b><br><span class="mute">Smallest balance first</span></td><td>${moLabel(sn && sn.mo)}</td><td>${sn ? money(sn.int) : '—'}</td></tr>
    <tr><td><b>Minimums only</b></td><td>${moLabel(base && base.mo)}</td><td>${base ? money(base.int) : '—'}</td></tr></tbody></table>
    ${av && base && S.debtExtra ? `<div class="note good mt mb0"><span>💡</span><span>Paying ${money(S.debtExtra)} extra saves about <b>${money(base.int - av.int)}</b> in interest and ${plural(base.mo - av.mo, 'month')}.</span></div>` : ''}
    ${av && av.order.length > 1 ? `<p class="mute mb0">Avalanche order: ${av.order.map(id => esc((S.debts.find(d => d.id === id) || {}).n)).join(' → ')}</p>` : ''}</div>`;
  return h;
};
VIEWS.debt = (id) => {
  if (id === 'new') return head('Add a debt', { back: 'debts' }) + `<form class="card" onsubmit="return newDebt(event)"><div class="form-grid">
    <label class="fld full"><span>Name</span><input name="n" required placeholder="e.g. Visa card, Car loan"></label>
    <label class="fld"><span>Balance owed</span><input name="b" type="number" inputmode="decimal" step="0.01" min="0" required></label>
    <label class="fld"><span>Interest rate (APR %)</span><input name="r" type="number" inputmode="decimal" step="0.01" min="0" placeholder="0"></label>
    <label class="fld"><span>Minimum monthly payment</span><input name="p" type="number" inputmode="decimal" step="0.01" min="0" required></label>
    <label class="fld"><span>Payment due day (optional)</span><input name="d" type="number" min="1" max="31"></label></div>
    <label class="toggle"><input type="checkbox" name="bill" checked><span class="n">Add the minimum payment as a monthly bill<small>So it’s counted in your budget every month.</small></span></label>
    <button class="btn wide">Add debt</button></form>`;
  const d = S.debts.find(x => x.id === id);
  if (!d) return head('Not found', { back: 'debts' }) + `<div class="card">${empty('Debt not found', '')}</div>`;
  const s = simulate([d], 0), s2 = simulate([d], S.debtExtra), orig = d.orig || d.bal, p = orig ? 1 - d.bal / orig : 0;
  let h = head(d.n, { back: 'debts' });
  h += `<div class="card"><div class="gprog">${ring(p, 110, 'var(--acc)')}<div style="flex:1;min-width:180px"><div class="kv"><span>Balance</span><b class="neg">${money(d.bal)}</b></div><div class="kv"><span>Paid off so far</span><b>${money(Math.max(0, orig - d.bal))}</b></div><div class="kv"><span>APR</span><b>${d.apr || 0}%</b></div><div class="kv"><span>Monthly interest now</span><b>${money(d.bal * (d.apr || 0) / 1200)}</b></div></div></div>
    <div class="note ${s ? '' : 'bad'} mt mb0"><span>${s ? '📆' : '⚠️'}</span><span>${s ? `Paying ${money(d.min)} a month, it’s gone by <b>${freeDate(s.mo)}</b> (${moLabel(s.mo)}), costing ${money(s.int)} in interest.` : 'The minimum payment doesn’t cover the interest — the balance will never go down.'}${S.debtExtra && s2 ? ` With ${money(S.debtExtra)} extra: ${freeDate(s2.mo)}.` : ''}</span></div></div>`;
  h += `<div class="card"><div class="ch"><h2>Log a payment</h2></div><form onsubmit="return debtPay(event,${J(d.id)})"><div class="row"><input name="a" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Amount" required value="${d.min || ''}"><button class="btn">Record</button></div>
    <label class="toggle"><input type="checkbox" name="ex" ${d.bill ? '' : 'checked'}><span class="n">Also record as spending this month<small>${d.bill ? 'Leave off if the monthly bill already covers it.' : 'Adds it to the “Debt” category.'}</small></span></label></form></div>`;
  if (d.log && d.log.length) h += `<h2 class="sec">Payments</h2><div class="card flush"><div class="rows">${d.log.slice().reverse().slice(0, 30).map(e => `<div class="tx"><span class="n"><b>Payment</b><small>${fmtD(e.d)} ${e.d.slice(0, 4)}</small></span><span class="amt pos">${money(e.amt)}</span></div>`).join('')}</div></div>`;
  h += `<h2 class="sec">Edit</h2><div class="card"><div class="form-grid"><label class="fld"><span>Name</span><input value="${esc(d.n)}" onchange="debtSet(${J(d.id)},'n',this.value)"></label><label class="fld"><span>Balance</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${d.bal}" onchange="debtSet(${J(d.id)},'bal',this.value)"></label>
    <label class="fld"><span>APR %</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${d.apr || 0}" onchange="debtSet(${J(d.id)},'apr',this.value)"></label><label class="fld"><span>Minimum payment</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${d.min || 0}" onchange="debtSet(${J(d.id)},'min',this.value)"></label></div>
    <button class="btn danger" onclick="debtDel(${J(d.id)})">Delete debt</button></div>`;
  return h;
};
function newDebt(e) {
  e.preventDefault(); const f = e.target, b = num(f.b.value); if (b === null) return false;
  const d = { id: uid(), n: f.n.value.trim(), bal: b, orig: b, apr: num(f.r.value) || 0, min: num(f.p.value) || 0, log: [] };
  if (f.bill.checked && d.min) { ensureCat('Debt'); const r = { id: uid(), n: d.n + ' payment', amt: d.min, cat: 'Debt', from: NOW, day: parseInt(f.d.value) || 0 }; S.rec.push(r); d.bill = r.id; }
  S.debts.push(d); save(); toast('Debt added'); replace('debt/' + d.id); return false;
}
function debtPay(e, id) {
  e.preventDefault(); const f = e.target, a = num(f.a.value), d = S.debts.find(x => x.id === id); if (!a || !d) return false;
  d.bal = Math.max(0, +(d.bal - a).toFixed(2)); (d.log = d.log || []).push({ d: TODAY, amt: a });
  if (f.ex.checked) { ensureCat('Debt'); const o = { id: uid(), n: d.n + ' payment', amt: a, cat: 'Debt', m: NOW }; S.expenses.push(o); S.dates[o.id] = TODAY; }
  if (d.bill) S.paid[d.bill + '@' + NOW] = 1;
  save(); render(); toast(d.bal ? 'Payment recorded' : '🎉 Paid off!'); return false;
}
function debtSet(id, f, v) { const d = S.debts.find(x => x.id === id); if (!d) return; if (f === 'n') d.n = v.trim() || d.n; else { const n = num(v); if (n === null) return render(); d[f] = n; if (f === 'bal' && n > (d.orig || 0)) d.orig = n; } save(); render(); }
function debtDel(id) { undoable('Debt deleted', () => { S.debts = S.debts.filter(d => d.id !== id); }, () => back('debts')); }

/* ---------- Shopping lists ---------- */
const listTot = L => L.items.filter(i => !i.done).reduce((s, i) => s + (+i.price || 0) * (i.qty || 1), 0);
VIEWS.lists = () => {
  const c = calc(NOW);
  let h = head('Shopping lists', { sub: `You can spend ${money(c.avail)} right now` });
  h += `<div class="card flush"><div class="rows">${S.lists.map(L => { const open = L.items.filter(i => !i.done).length, t = listTot(L), ok = t <= c.avail; return `<a class="li" href="#/list/${L.id}"><span class="ic">🛒</span><span class="n"><b>${esc(L.name)}</b><small>${open ? plural(open, 'item') + ' to buy' : L.items.length ? 'All bought ✓' : 'Empty'}${open && t ? ` · ${ok ? '<span class="pos">affordable</span>' : '<span class="neg">' + money(t - c.avail) + ' short</span>'}` : ''}</small></span><span class="amt">${money(t)}</span>${I.chev}</a>`; }).join('')}</div></div>`;
  h += `<div class="card"><div class="ch"><h2>New list</h2></div><form class="row" onsubmit="return newList(event)"><input name="n" placeholder="e.g. Groceries, Birthday gifts" required><button class="btn">Create</button></form></div>`;
  h += `<p class="mute">“You can spend” = what’s left this month${S.useSav ? ' plus your savings' : ''}. Change this in Savings.</p>`;
  return h;
};
function newList(e) { e.preventDefault(); const n = e.target.n.value.trim(); if (!n) return false; const l = { id: uid(), name: n, items: [] }; S.lists.push(l); save(); go('list/' + l.id); return false; }
VIEWS.list = (id) => {
  const L = S.lists.find(l => l.id === id);
  if (!L) return head('Not found', { back: 'lists' }) + `<div class="card">${empty('List not found', '')}</div>`;
  const open = L.items.filter(i => !i.done), done = L.items.filter(i => i.done), tot = listTot(L), c = calc(NOW), short = tot - c.avail;
  const doneTot = done.reduce((s, i) => s + (+i.price || 0) * (i.qty || 1), 0);
  let h = head(L.name, { back: 'lists', sub: `${plural(open.length, 'item')} · ${money(tot)}` });
  h += `<form class="card" onsubmit="return addItem(event,${J(L.id)})"><div class="row"><input id="itn" name="n" placeholder="Add an item" required style="flex:3 1 160px"><input name="q" type="number" min="1" step="1" value="1" style="flex:0 0 64px" aria-label="Quantity"><input name="a" type="number" inputmode="decimal" step="0.01" min="0" placeholder="Price" style="flex:1 1 90px" aria-label="Price each"><button class="btn">Add</button></div></form>`;
  const irow = i => `<div class="tx ${i.done ? 'done' : ''}"><input type="checkbox" ${i.done ? 'checked' : ''} onchange="togItem(${J(L.id)},${J(i.id)})" aria-label="Bought"><span class="n"><b>${esc(i.n)}</b>${(i.qty || 1) > 1 ? `<small>${i.qty} × ${money(i.price)}</small>` : ''}</span><input type="number" inputmode="decimal" step="0.01" min="0" value="${i.price || ''}" placeholder="Price" style="width:92px;flex:0 0 92px" onchange="itemPrice(${J(L.id)},${J(i.id)},this.value)" aria-label="Price"><button class="x" onclick="delItem(${J(L.id)},${J(i.id)})" aria-label="Remove">${I.x}</button></div>`;
  h += `<div class="card flush"><div class="rows">${open.length ? open.map(irow).join('') : '<div class="empty small">Nothing left to buy.</div>'}</div></div>`;
  if (open.length && tot > 0) {
    h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>To buy</small><b>${money(tot)}</b></div><div class="tile"><small>I can spend</small><b>${money(c.avail)}</b></div><div class="tile"><small>${short > 0 ? 'Short by' : 'Spare'}</small><b class="${short > 0 ? 'neg' : 'pos'}">${money(Math.abs(short))}</b></div></div>`;
    if (short <= 0) h += `<div class="verdict y">✅ Yes — you can afford everything on this list.</div>`;
    else {
      h += `<div class="verdict n">Not quite. You need ${money(short)} more.</div><div class="card"><div class="ch"><h2>Savings plan</h2></div>
      <div class="row"><input id="pa" type="number" inputmode="decimal" step="0.01" min="0" placeholder="I can save" value="${esc(S.plan.amt)}" oninput="S.plan.amt=this.value;plan(${J(L.id)})"><select id="pp" class="sm" style="width:auto" onchange="S.plan.per=this.value;plan(${J(L.id)})"><option value="week" ${S.plan.per === 'week' ? 'selected' : ''}>per week</option><option value="month" ${S.plan.per === 'month' ? 'selected' : ''}>per month</option></select></div>
      <div class="row mt"><span class="sm mute">Or buy by</span><input id="pd" type="date" value="${esc(S.plan.date)}" onchange="S.plan.date=this.value;plan(${J(L.id)})"></div>
      <div id="planout" class="mute mt"></div><button class="btn ghost mt" onclick="listGoal(${J(L.id)},${short})">🎯 Turn this into a savings goal</button></div>`;
      post.push(() => plan(L.id));
    }
  }
  if (done.length) h += `<div class="ch" style="margin-top:22px;padding:0 4px"><h2>Bought · ${money(doneTot)}</h2><button class="btn ghost sm" onclick="clearBought(${J(L.id)})">Clear</button></div><div class="card flush"><div class="rows">${done.map(irow).join('')}</div></div>
    ${doneTot ? `<div class="card"><div class="ch"><h2>Log purchase in budget</h2></div><div class="row"><select id="lcat">${S.cats.map(k => `<option value="${esc(k.n)}" ${k.n === 'Shopping' ? 'selected' : ''}>${esc(k.i)} ${esc(k.n)}</option>`).join('')}</select><button class="btn" onclick="logBought(${J(L.id)})">Add ${money(doneTot)} as expense</button></div><p class="mute mb0">Records the bought items as one expense today and clears them from the list.</p></div>` : ''}`;
  h += `<h2 class="sec">List settings</h2><div class="card"><label class="fld"><span>Name</span><input value="${esc(L.name)}" onchange="if(this.value.trim()){S.lists.find(l=>l.id===${J(L.id)}).name=this.value.trim();save();render()}"></label><button class="btn danger" onclick="delList(${J(L.id)})">Delete list</button></div>`;
  return h;
};
function plan(id) {
  save(); const o = $('#planout'); if (!o) return; const L = S.lists.find(l => l.id === id); if (!L) return;
  const short = listTot(L) - calc(NOW).avail; let h = ''; const a = num(S.plan.amt);
  if (a > 0) { const n = Math.ceil(short / a), t = new Date(); if (S.plan.per === 'week') t.setDate(t.getDate() + n * 7); else t.setMonth(t.getMonth() + n); h += `Saving ${money(a)} per ${S.plan.per}: about <b>${n} ${S.plan.per}${n > 1 ? 's' : ''}</b> (around ${t.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}).<br>`; }
  if (S.plan.date) { const wk = (new Date(S.plan.date + 'T00:00') - new Date()) / 6048e5; if (wk <= 0) h += 'Pick a date in the future.'; else h += `To buy by then, save <b>${money(short / wk)} per week</b> or <b>${money(short / (wk / 4.345))} per month</b>.`; }
  o.innerHTML = h || 'Enter an amount or a date to see how long it will take.';
}
function addItem(e, id) { e.preventDefault(); const f = e.target, n = f.n.value.trim(); if (!n) return false; const L = S.lists.find(l => l.id === id); L.items.push({ id: uid(), n, price: num(f.a.value) || 0, qty: Math.max(1, parseInt(f.q.value) || 1), done: false }); save(); refocus = 'itn'; render(); return false; }
function togItem(lid, id) { const i = S.lists.find(l => l.id === lid).items.find(i => i.id === id); i.done = !i.done; save(); render(); }
function itemPrice(lid, id, v) { const i = S.lists.find(l => l.id === lid).items.find(i => i.id === id); i.price = num(v) || 0; save(); render(); }
function delItem(lid, id) { undoable('Item removed', () => { const L = S.lists.find(l => l.id === lid); L.items = L.items.filter(i => i.id !== id); }); }
function clearBought(lid) { undoable('Cleared bought items', () => { const L = S.lists.find(l => l.id === lid); L.items = L.items.filter(i => !i.done); }); }
function logBought(lid) {
  const L = S.lists.find(l => l.id === lid), done = L.items.filter(i => i.done), t = done.reduce((s, i) => s + (+i.price || 0) * (i.qty || 1), 0), c = ($('#lcat') || {}).value || 'Shopping';
  undoable(`Added ${money(t)} to ${mlabel(NOW)}`, () => { const o = { id: uid(), n: L.name, amt: +t.toFixed(2), cat: c, m: NOW }; S.expenses.push(o); S.dates[o.id] = TODAY; S.notes[o.id] = done.map(i => (i.qty > 1 ? i.qty + ' × ' : '') + i.n).join(', '); L.items = L.items.filter(i => !i.done); });
}
function listGoal(lid, short) { const L = S.lists.find(l => l.id === lid); const g = { id: uid(), n: L.name, i: '🛒', target: +short.toFixed(2), saved: 0, date: S.plan.date || '', log: [] }; S.goals.push(g); save(); toast('Goal created'); go('goal/' + g.id); }
function delList(id) { undoable('List deleted', () => { S.lists = S.lists.filter(l => l.id !== id); fix(); }, () => back('lists')); }

/* ---------- To-do ---------- */
let flt = 'open';
const PRI = { h: ['High', 'var(--bad)'], m: ['Medium', 'var(--warn)'], l: ['Low', 'var(--acc)'] };
function todoRow(x) {
  const od = !x.done && x.due && x.due < TODAY, td = !x.done && x.due === TODAY;
  return `<div class="tx ${x.done ? 'done' : ''}"><input type="checkbox" ${x.done ? 'checked' : ''} onchange="togT(${J(x.id)})" aria-label="Done"><a class="n" href="#/todo/${x.id}" style="color:inherit"><b>${x.pri ? `<span style="color:${PRI[x.pri][1]}">●</span> ` : ''}${esc(x.n)}</b>${x.due || x.note ? `<small>${x.due ? `<span class="${od ? 'neg' : td ? 'warn' : ''}">${od ? 'Overdue · ' : td ? 'Today · ' : ''}${fmtD(x.due)}</span>` : ''}${x.note ? (x.due ? ' · ' : '') + '📝' : ''}</small>` : ''}</a><button class="x" onclick="delT(${J(x.id)})" aria-label="Delete">${I.x}</button></div>`;
}
VIEWS.todo = (id) => {
  if (id) return todoDetail(id);
  const open = S.todos.filter(x => !x.done).length, done = S.todos.length - open;
  let h = head('To-do', { sub: `${open} open · ${done} done` });
  h += `<form class="card" onsubmit="return addTodo(event)"><div class="row"><input id="tdn" name="n" placeholder="New task" required style="flex:3 1 180px"><input name="d" type="date" style="flex:1 1 130px" aria-label="Due date"><select name="p" style="flex:0 0 auto;width:auto" aria-label="Priority"><option value="">Priority</option><option value="h">High</option><option value="m">Medium</option><option value="l">Low</option></select><button class="btn">Add</button></div></form>`;
  h += `<div class="chips">${[['open', 'Open'], ['all', 'All'], ['done', 'Done']].map(([f, l]) => `<button class="chip ${flt === f ? 'on' : ''}" onclick="flt='${f}';render()">${l}</button>`).join('')}</div>`;
  const list = S.todos.filter(x => flt === 'all' || (flt === 'open') === !x.done);
  const pr = { h: 0, m: 1, l: 2, '': 3 }, srt = a => a.slice().sort((a, b) => (a.due || '9').localeCompare(b.due || '9') || pr[a.pri || ''] - pr[b.pri || '']);
  const groups = [['Overdue', x => !x.done && x.due && x.due < TODAY], ['Today', x => !x.done && x.due === TODAY], ['Upcoming', x => !x.done && x.due > TODAY], ['No date', x => !x.done && !x.due], ['Done', x => x.done]];
  const parts = groups.map(([l, f]) => { const g = srt(list.filter(f)); return g.length ? `<h2 class="sec">${l} · ${g.length}</h2><div class="card flush"><div class="rows">${g.map(todoRow).join('')}</div></div>` : ''; }).join('');
  h += parts || `<div class="card">${empty(flt === 'done' ? 'Nothing done yet' : 'All clear', flt === 'done' ? '' : 'Add a task above.')}</div>`;
  if (done && flt !== 'open') h += `<button class="btn ghost" onclick="clearDone()">Clear completed</button>`;
  return h;
};
function todoDetail(id) {
  const t = S.todos.find(x => x.id === id);
  if (!t) return head('Not found', { back: 'todo' }) + `<div class="card">${empty('Task not found', '')}</div>`;
  return head('Task', { back: 'todo' }) + `<div class="card"><label class="toggle" style="padding-top:0"><input type="checkbox" ${t.done ? 'checked' : ''} onchange="togT(${J(t.id)})"><span class="n"><b style="font-size:18px">${esc(t.n)}</b><small>${t.done ? 'Completed' : 'Open'}</small></span></label>
    <div class="form-grid"><label class="fld full"><span>Task</span><input value="${esc(t.n)}" onchange="tSet(${J(t.id)},'n',this.value)"></label><label class="fld"><span>Due date</span><input type="date" value="${t.due || ''}" onchange="tSet(${J(t.id)},'due',this.value)"></label>
    <label class="fld"><span>Priority</span><select onchange="tSet(${J(t.id)},'pri',this.value)"><option value="">None</option>${Object.entries(PRI).map(([k, [l]]) => `<option value="${k}" ${t.pri === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="fld full"><span>Notes</span><textarea rows="5" placeholder="Details, links, sub-steps…" oninput="S.todos.find(x=>x.id===${J(t.id)}).note=this.value;save()">${esc(t.note || '')}</textarea></label></div>
    <button class="btn danger" onclick="delT(${J(t.id)},true)">Delete task</button></div>`;
}
function addTodo(e) { e.preventDefault(); const f = e.target, n = f.n.value.trim(); if (!n) return false; S.todos.push({ id: uid(), n, due: f.d.value, pri: f.p.value, done: false }); save(); refocus = 'tdn'; render(); return false; }
function togT(id) { const t = S.todos.find(x => x.id === id); t.done = !t.done; save(); render(); }
function tSet(id, f, v) { const t = S.todos.find(x => x.id === id); if (f === 'n' && !v.trim()) return render(); t[f] = f === 'n' ? v.trim() : v; save(); render(); }
function delT(id, nav) { undoable('Task deleted', () => { S.todos = S.todos.filter(x => x.id !== id); }, nav ? () => back('todo') : null); }
function clearDone() { undoable('Cleared completed', () => { S.todos = S.todos.filter(x => !x.done); }); }

/* ---------- Reports & history ---------- */
VIEWS.reports = () => {
  const N = S.repN || 6, ms = lastMonths(NOW, N);
  const rows = ms.map(m => { const it = allEx(m).filter(x => !x.est), inc = sum(allInc(m)); return { m, it, inc, sp: sum(it) }; });
  const withData = rows.filter(r => r.inc || r.sp), n = Math.max(1, withData.length);
  const ai = withData.reduce((s, r) => s + r.inc, 0) / n, as = withData.reduce((s, r) => s + r.sp, 0) / n, rate = ai ? (ai - as) / ai : 0;
  let h = head('Reports & history');
  h += `<div class="chips">${[3, 6, 12].map(k => `<button class="chip ${N === k ? 'on' : ''}" onclick="S.repN=${k};save();render()">${k} months</button>`).join('')}</div>`;
  if (!withData.length) return h + `<div class="card">${empty('No history yet', 'Your months will show up here once you add income or expenses.')}</div>`;
  h += `<div class="grid4" style="margin-bottom:14px"><div class="tile"><small>Avg income</small><b>${money0(ai)}</b></div><div class="tile"><small>Avg spending</small><b>${money0(as)}</b></div><div class="tile"><small>Avg saved</small><b class="${ai - as < 0 ? 'neg' : 'pos'}">${money0(ai - as)}</b></div><div class="tile"><small>Savings rate</small><b>${Math.round(rate * 100)}%</b></div></div>`;
  h += `<div class="card"><div class="ch"><h2>Income vs spending</h2></div>${barsChart(rows)}</div>`;
  /* by category */
  const catT = {}; rows.forEach((r, i) => r.it.forEach(x => { const k = x.cat || 'Other'; (catT[k] = catT[k] || Array(N).fill(0))[i] += x.amt; }));
  const ce = Object.entries(catT).map(([k, v]) => [k, v, v.reduce((a, b) => a + b, 0)]).sort((a, b) => b[2] - a[2]), mx = Math.max(1, ...ce.map(e => e[2]));
  h += `<div class="card flush"><div class="ch"><h2>Spending by category</h2><span class="mute small">avg / month</span></div><div class="rows">${ce.map(([k, v, t]) => { const c = cat(k); return `<a class="li" href="#/cat/${U(k)}"><span class="ic" style="background:${c.c}22">${esc(c.i)}</span><span class="n"><span style="display:flex;justify-content:space-between;gap:8px"><b>${esc(k)}</b><span class="num" style="font-weight:600">${money(t / n)}</span></span>${bar(t / mx * 100, c.c)}</span>${spark(v, c.c)}</a>`; }).join('')}</div></div>`;
  /* this vs last */
  const a = byCat(allEx(NOW).filter(x => !x.est)), b = byCat(allEx(addM(NOW, -1)).filter(x => !x.est)), ks = [...new Set(Object.keys(a).concat(Object.keys(b)))];
  if (ks.length) h += `<div class="card"><div class="ch"><h2>${mshort(NOW)} vs ${mshort(addM(NOW, -1))}</h2></div><table class="t"><thead><tr><th>Category</th><th>${mshort(addM(NOW, -1))}</th><th>${mshort(NOW)} so far</th><th>Change</th></tr></thead><tbody>${ks.sort((x, y) => (a[y] || 0) - (a[x] || 0)).map(k => { const d = (a[k] || 0) - (b[k] || 0); return `<tr><td>${esc(cat(k).i)} ${esc(k)}</td><td class="num">${money0(b[k])}</td><td class="num">${money0(a[k])}</td><td class="num ${d > 0 ? 'neg' : 'pos'}">${d > 0 ? '+' : d < 0 ? '−' : ''}${money0(Math.abs(d)).replace('−', '')}</td></tr>`; }).join('')}</tbody></table></div>`;
  /* top expenses */
  const top = rows.flatMap(r => r.it.map(x => ({ ...x, m: r.m }))).sort((x, y) => y.amt - x.amt).slice(0, 5);
  if (top.length) h += `<div class="card flush"><div class="ch"><h2>Biggest expenses (${N} mo)</h2></div><div class="rows">${top.map(x => txRow(x, true)).join('')}</div></div>`;
  /* month list */
  const all = allMonths().map(m => { const it = allEx(m).filter(x => !x.est), inc = sum(allInc(m)); return { m, inc, sp: sum(it) }; }).filter(r => r.inc || r.sp).reverse();
  h += `<h2 class="sec">Month by month</h2><div class="card flush"><div class="rows">${all.map(r => { const net = r.inc - r.sp; return `<a class="li" href="#/month/${r.m}"><span class="n"><b>${mlabel(r.m)}${r.m === NOW ? ' <span class="tag">so far</span>' : ''}</b><small>Income ${money(r.inc)} · Spent ${money(r.sp)}</small></span><span class="amt ${net < 0 ? 'neg' : 'pos'}">${net < 0 ? '−' : '+'}${money(Math.abs(net))}</span>${I.chev}</a>`; }).join('')}</div></div>`;
  h += `<p class="mute">Varying bills you haven’t entered yet are only estimates, so they’re left out of history until you add the real amount.</p>`;
  return h;
};
VIEWS.month = (m) => {
  if (!/^\d{4}-\d{2}$/.test(m || '')) return head('Not found', { back: 'reports' });
  const it = allEx(m).filter(x => !x.est), inc = allInc(m), ti = sum(inc), ts = sum(it), net = ti - ts;
  let h = head(mlabel(m), { back: 'reports', right: `<button class="btn ghost sm" onclick="month=${J(m)};go('home')">Open month</button>` });
  h += `<div class="grid3" style="margin-bottom:14px"><div class="tile"><small>Income</small><b>${money(ti)}</b></div><div class="tile"><small>Spent</small><b>${money(ts)}</b></div><div class="tile"><small>${net < 0 ? 'Overspent' : 'Saved'}</small><b class="${net < 0 ? 'neg' : 'pos'}">${money(Math.abs(net))}</b></div></div>`;
  const by = byCat(it); if (Object.keys(by).length) h += `<div class="card">${catDonut(by)}</div>`;
  if (inc.length) h += `<div class="card flush"><div class="ch"><h2>Income</h2></div><div class="rows">${sortTx(inc).map(x => txRow(x)).join('')}</div></div>`;
  h += `<div class="card flush"><div class="ch"><h2>Expenses</h2></div><div class="rows">${it.length ? sortTx(it).map(x => txRow(x)).join('') : '<div class="empty small">No expenses.</div>'}</div></div>`;
  return h;
};

/* ---------- More (mobile menu) ---------- */
VIEWS.more = () => head('More') + `<div class="card flush"><div class="rows">${NAV.filter(([k]) => !['home', 'activity', 'budget', 'lists'].includes(k)).map(([k, l, i]) => `<a class="li" href="#/${k}"><span class="ic">${i}</span><span class="n"><b>${l}</b><small>${({ bills: 'Recurring bills, varying bills, calendar', savings: 'Savings balance and goals', debts: 'Loans, cards and payoff plan', todo: 'Tasks and due dates', reports: 'Trends, past months, category history', settings: 'Currency, theme, backup, import & export' })[k] || ''}</small></span>${I.chev}</a>`).join('')}</div></div>`;

/* ---------- Settings ---------- */
VIEWS.settings = () => {
  let h = head('Settings');
  h += `<div class="card"><div class="ch"><h2>Preferences</h2></div><div class="form-grid">
    <label class="fld"><span>Currency symbol</span><select onchange="S.cur=this.value;save();render()">${['$', '£', '€', '¥', '₹', '₩', '₽', '₺', 'R$', 'A$', 'C$', 'CHF ', 'kr ', 'zł '].map(s => `<option ${S.cur === s ? 'selected' : ''} value="${esc(s)}">${esc(s.trim())}</option>`).join('')}</select></label>
    <label class="fld"><span>Theme</span><select onchange="S.theme=this.value;save();render()">${[['auto', 'Match device'], ['light', 'Light'], ['dark', 'Dark']].map(([k, l]) => `<option value="${k}" ${S.theme === k ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="fld"><span>Varying bill estimate</span><select onchange="S.avgN=+this.value;save();render()">${[3, 6, 12].map(n => `<option value="${n}" ${S.avgN === n ? 'selected' : ''}>Average of last ${n} months</option>`).join('')}</select></label></div>
    <label class="toggle"><input type="checkbox" ${S.useSav ? 'checked' : ''} onchange="S.useSav=this.checked;save()"><span class="n">Count savings when checking what I can afford</span></label></div>`;
  h += `<div class="card"><div class="ch"><h2>Backup</h2></div><p class="mute" style="margin-top:0">Your data lives only on this device. Save a backup now and then, and use it to move to a new phone or computer. Backups include receipts.</p>
    <div class="row"><button class="btn" onclick="exportAll()">Save backup</button><label class="btn ghost">Restore backup<input type="file" accept="application/json,.json" hidden onchange="importAll(this)"></label></div><div id="bkm" class="mute mt"></div></div>`;
  h += `<div class="card"><div class="ch"><h2>Spreadsheets</h2></div><p class="mute" style="margin-top:0">Export every transaction to open in Excel or Google Sheets, or import a CSV statement from your bank.</p>
    <div class="row"><button class="btn ghost" onclick="exportCSV()">Export CSV</button><a class="btn ghost" href="#/import">Import bank CSV</a></div></div>`;
  h += `<div class="card"><div class="ch"><h2>Categories</h2><a href="#/budget">Manage</a></div><div class="chips mb0">${S.cats.map(k => `<a class="chip" href="#/cat/${U(k.n)}">${esc(k.i)} ${esc(k.n)}</a>`).join('')}</div></div>`;
  h += `<div class="card"><div class="ch"><h2>Danger zone</h2></div><button class="btn danger" onclick="eraseAll()">Erase all data</button><p class="mute mb0">Removes everything from this device, including receipts. Save a backup first.</p></div>`;
  h += `<p class="mute" style="text-align:center">Works offline · Add to your home screen for an app-like experience.</p>`;
  return h;
};
async function exportAll() { const m = $('#bkm'); try { const rc = await rcAll(), blob = new Blob([JSON.stringify({ v: 2, saved: new Date().toISOString(), state: S, receipts: rc })], { type: 'application/json' }); download(blob, 'budget-backup-' + TODAY + '.json'); m.textContent = 'Backup saved to your downloads.'; } catch (e) { m.textContent = 'Could not create the backup.'; } }
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); }
async function importAll(inp) {
  const f = inp.files[0], m = $('#bkm'); if (!f) return; let j;
  try { j = JSON.parse(await f.text()); if (!j.state || !Array.isArray(j.state.income)) throw 0; } catch (e) { m.textContent = 'That file isn’t a valid backup.'; return; }
  if (!confirm('Replace everything in this app with the backup?')) { inp.value = ''; return; }
  try { S = Object.assign(fresh(), j.state); fix(); for (const r of j.receipts || []) { if (r && r.k) await rcSet(r.k, r); } Object.keys(rcCache).forEach(k => delete rcCache[k]); flush(); render(); toast('Backup restored'); } catch (e) { m.textContent = 'Could not restore everything.'; }
}
function exportCSV() {
  const q = v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  const lines = [['Date', 'Month', 'Type', 'Name', 'Category', 'Amount', 'Repeats', 'Note'].join(',')];
  allMonths().forEach(m => txs(m).filter(x => !x.est).forEach(x => lines.push([x.date, m, x.inc ? 'Income' : 'Expense', x.n, x.inc ? '' : x.cat, (x.inc ? 1 : -1) * x.amt, x.kind === 'one' ? '' : 'Monthly', S.notes[x.key] || ''].map(q).join(','))));
  download(new Blob([lines.join('\n')], { type: 'text/csv' }), 'budget-transactions-' + TODAY + '.csv'); toast('CSV exported');
}
function eraseAll() { if (!confirm('Erase all budget data, lists, tasks and receipts from this device? This cannot be undone.')) return; S = fresh(); fix(); rcClear().catch(() => { }); flush(); go('home'); toast('All data erased'); }

/* ---------- CSV import ---------- */
let IMP = null;
function parseCSV(t) {
  const rows = [], d = (t.split('\n')[0].split(';').length > t.split('\n')[0].split(',').length) ? ';' : ','; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true; else if (c === d) { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); f = ''; if (row.some(x => x.trim())) rows.push(row); row = []; } else f += c;
  }
  row.push(f); if (row.some(x => x.trim())) rows.push(row); return rows;
}
const amtParse = v => { v = String(v || '').trim(); if (!v) return null; let neg = /^\(.*\)$/.test(v) || /-/.test(v); v = v.replace(/[^\d.,]/g, ''); if (/,\d{2}$/.test(v) && !/\.\d{2}$/.test(v)) v = v.replace(/\./g, '').replace(',', '.'); else v = v.replace(/,/g, ''); const n = parseFloat(v); return isFinite(n) ? (neg ? -n : n) : null; };
function dateParse(v, fmt) {
  v = String(v || '').trim(); let m;
  if ((m = v.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/))) return m[1] + '-' + pad(m[2]) + '-' + pad(m[3]);
  if ((m = v.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/))) { let y = m[3].length === 2 ? '20' + m[3] : m[3], a = +m[1], b = +m[2]; const [mo, dd] = fmt === 'dmy' ? [b, a] : [a, b]; if (mo < 1 || mo > 12 || dd < 1 || dd > 31) return ''; return y + '-' + pad(mo) + '-' + pad(dd); }
  const d = new Date(v); return isNaN(d) ? '' : isoDay(d);
}
async function impFile(inp) {
  const f = inp.files[0]; if (!f) return; const rows = parseCSV(await f.text()); if (rows.length < 2) { toast('That file has no rows'); return; }
  const hd = rows[0].map(h => h.trim().toLowerCase()), find = re => hd.findIndex(h => re.test(h));
  IMP = { name: f.name, head: rows[0], rows: rows.slice(1), d: Math.max(0, find(/date|posted|time/)), n: Math.max(0, find(/desc|name|payee|merchant|memo|details|narrative|reference/)), a: find(/^amount|amount|value|sum/), deb: find(/debit|withdraw|out/), cred: find(/credit|deposit|in$|paid in/), df: 'mdy', sign: 'neg', ex: {}, cat: {} };
  if (IMP.a < 0 && IMP.deb < 0) IMP.a = hd.length - 1;
  if (IMP.a >= 0 && IMP.deb >= 0 && IMP.a !== IMP.deb) IMP.deb = -1;
  if (IMP.rows.slice(0, 30).some(r => { const m = String(r[IMP.d] || '').match(/^(\d{1,2})[-/.](\d{1,2})/); return m && +m[1] > 12; })) IMP.df = 'dmy';
  render();
}
function impRows() {
  if (!IMP) return [];
  return IMP.rows.map((r, i) => {
    const date = dateParse(r[IMP.d], IMP.df), n = String(r[IMP.n] || '').trim().replace(/\s+/g, ' ');
    let amt, inc;
    if (IMP.deb >= 0) { const d = amtParse(r[IMP.deb]), c = IMP.cred >= 0 ? amtParse(r[IMP.cred]) : null; if (d) { amt = Math.abs(d); inc = false; } else if (c) { amt = Math.abs(c); inc = true; } else return null; }
    else { const a = amtParse(r[IMP.a]); if (a === null || a === 0) return null; amt = Math.abs(a); inc = IMP.sign === 'neg' ? a > 0 : a < 0; }
    if (!date || !n) return null;
    const dup = (inc ? S.income : S.expenses).some(x => x.m === date.slice(0, 7) && Math.abs(x.amt - amt) < .005 && x.n.toLowerCase() === n.toLowerCase() && (S.dates[x.id] || '') === date);
    return { i, date, n, amt, inc, dup, cat: IMP.cat[i] || guessCat(n) || 'Other' };
  }).filter(Boolean);
}
VIEWS.import = () => {
  let h = head('Import bank CSV', { back: 'settings' });
  h += `<div class="card"><p class="mute" style="margin-top:0">Download a CSV statement from your bank's website, then pick it here. Nothing leaves your device.</p><label class="btn">Choose CSV file<input type="file" accept=".csv,text/csv" hidden onchange="impFile(this)"></label>${IMP ? ` <span class="mute">${esc(IMP.name)} · ${IMP.rows.length} rows</span>` : ''}</div>`;
  if (!IMP) return h;
  const opt = (sel, allowNone) => (allowNone ? `<option value="-1">—</option>` : '') + IMP.head.map((c, i) => `<option value="${i}" ${sel === i ? 'selected' : ''}>${esc(c || 'Column ' + (i + 1))}</option>`).join('');
  h += `<div class="card"><div class="ch"><h2>Columns</h2></div><div class="form-grid">
    <label class="fld"><span>Date</span><select onchange="IMP.d=+this.value;render()">${opt(IMP.d)}</select></label>
    <label class="fld"><span>Description</span><select onchange="IMP.n=+this.value;render()">${opt(IMP.n)}</select></label>
    <label class="fld"><span>Amount (single column)</span><select onchange="IMP.a=+this.value;if(IMP.a>=0)IMP.deb=-1;render()">${opt(IMP.deb >= 0 ? -1 : IMP.a, true)}</select></label>
    <label class="fld"><span>…or Debit / Credit columns</span><div class="row"><select onchange="IMP.deb=+this.value;render()" aria-label="Debit">${opt(IMP.deb, true)}</select><select onchange="IMP.cred=+this.value;render()" aria-label="Credit">${opt(IMP.cred, true)}</select></div></label>
    <label class="fld"><span>Date format</span><select onchange="IMP.df=this.value;render()"><option value="mdy" ${IMP.df === 'mdy' ? 'selected' : ''}>MM/DD/YYYY</option><option value="dmy" ${IMP.df === 'dmy' ? 'selected' : ''}>DD/MM/YYYY</option></select></label>
    ${IMP.deb < 0 ? `<label class="fld"><span>Spending shows as</span><select onchange="IMP.sign=this.value;render()"><option value="neg" ${IMP.sign === 'neg' ? 'selected' : ''}>Negative numbers (−12.50)</option><option value="pos" ${IMP.sign === 'pos' ? 'selected' : ''}>Positive numbers (12.50)</option></select></label>` : ''}</div></div>`;
  const rows = impRows(), sel = rows.filter(r => IMP.ex[r.i] === undefined ? !r.dup : IMP.ex[r.i]);
  h += `<div class="card"><div class="ch"><h2>Preview · ${rows.length} transactions</h2></div>${rows.length ? `<div class="scroll"><table class="t"><thead><tr><th></th><th>Date</th><th>Description</th><th>Category</th><th style="text-align:right">Amount</th></tr></thead><tbody>${rows.map(r => { const on = IMP.ex[r.i] === undefined ? !r.dup : IMP.ex[r.i]; return `<tr><td><input type="checkbox" ${on ? 'checked' : ''} onchange="IMP.ex[${r.i}]=this.checked;render()" aria-label="Include"></td><td style="white-space:nowrap">${fmtD(r.date)}</td><td>${esc(r.n)}${r.dup ? ' <span class="tag warn">already added</span>' : ''}</td><td>${r.inc ? '<span class="pos">Income</span>' : `<select onchange="IMP.cat[${r.i}]=this.value">${S.cats.map(k => `<option ${k.n === r.cat ? 'selected' : ''} value="${esc(k.n)}">${esc(k.i)} ${esc(k.n)}</option>`).join('')}</select>`}</td><td class="num ${r.inc ? 'pos' : ''}" style="text-align:right;white-space:nowrap">${r.inc ? '+' : '−'}${money(r.amt)}</td></tr>`; }).join('')}</tbody></table></div>
    <button class="btn wide mt" onclick="impGo()" ${sel.length ? '' : 'disabled'}>Import ${plural(sel.length, 'transaction')}</button>` : '<div class="empty small">No rows could be read. Check the column choices above.</div>'}</div>`;
  return h;
};
function impGo() {
  const rows = impRows().filter(r => IMP.ex[r.i] === undefined ? !r.dup : IMP.ex[r.i]); if (!rows.length) return;
  undoable(`Imported ${plural(rows.length, 'transaction')}`, () => {
    rows.forEach(r => { const o = { id: uid(), n: r.n, amt: r.amt, m: r.date.slice(0, 7) }; if (r.inc) S.income.push(o); else { o.cat = IMP.cat[r.i] || r.cat; S.expenses.push(o); S.rules[r.n.toLowerCase()] = o.cat; } S.dates[o.id] = r.date; });
    month = rows.map(r => r.date.slice(0, 7)).sort().pop(); IMP = null;
  }, () => go('activity'));
}

/* ---------- start ---------- */
R = parseHash();
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => { });
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { }
