// Landuse scorer. Pure data tables -> recovery score = the table score itself (not blended with structure). Run: node score.landuse.mjs
import { readFileSync } from 'node:fs';
const ROOT = new URL('.', import.meta.url).pathname;
const key = JSON.parse(readFileSync(`${ROOT}../keys/landuse-plan-tables.json`, 'utf8'));
const L = JSON.parse(readFileSync(`${ROOT}../ledgers/landuse-plan-tables.json`, 'utf8'));
const W = key.weights, TOOLS = Object.keys(L.tools);
const DED = { P1: 0.5, P2: 0.2, P3: 0.05 }, LF = { correct: 1, flat_numbered: 0.95, wrong: 0.8 }, RO = { ok: 1, broken: 0.5, uncertain: 0.75 };
const os = (v, s) => v === 'na' || v == null ? { s: null, si: 0 } : v === 'faithful' ? { s: 1, si: 0 } : v === 'missing' ? { s: 0, si: 0 } : v === 'silent_wrong' ? { s: 0, si: 1 } : v === 'degraded' ? { s: Math.max(0, 1 - (DED[s] ?? .2)), si: 0 } : { s: 0, si: 0 };
function objDim(items, vd, sev, fab) { let n = 0, nr = 0, sw = 0; for (const it of items) { const r = os(vd[it.id], sev?.[it.id]); if (r.s === null) continue; n += r.s; nr++; sw += r.si; } return { pct: nr ? n / nr * 100 : null, sw, fab: fab || 0 }; }
const rows = [];
for (const t of TOOLS) {
  const d = L.tools[t];
  const sk = Math.min(1, d.headings.present * (LF[d.headings.level] ?? .8) / key.structext.headings.approx_count);
  const ro = RO[d.reading_order] ?? .75;
  const co = d.anchors.total ? d.anchors.hit / d.anchors.total : null;
  const stp = [sk, ro, co].filter(x => x != null); const st = stp.reduce((a, b) => a + b, 0) / stp.length * 100;
  const table = objDim(key.objects.table, d.table.verdict, d.table.severity, d.table.fab_tables);
  // Pure-table document: recovery score = the table score itself, not blended with structure (owner decision: "tables only").
  rows.push({ t, sk: sk * 100, ro: ro * 100, co: co == null ? null : co * 100, st, table: table.pct, total: table.pct, silentWrong: table.sw, fab: (d.headings.fab_headings || 0) + table.fab });
}
const f = x => x == null ? '-' : String(Math.round(x));
console.log(`\n============ landuse-plan-tables . v3 defect-driven scoring (pure tables -> recovery = table score) ============`);
console.log(`5 data tables, recovery looks only at the tables . silent errors (dangerous: numbers silently changed) . fabrications (visible junk)`);
console.log(`(the structure column is shown for reference only and is not part of the recovery score, because this document is all tables)\n`);
console.log('tool'.padEnd(18) + 'skel'.padStart(6) + 'read'.padStart(6) + 'cont'.padStart(6) + '|' + '(ref)struct'.padStart(11) + '|' + 'tbl=recov'.padStart(10) + 'sil'.padStart(6) + 'fab'.padStart(6));
rows.sort((a, b) => (b.total - a.total) || (a.silentWrong - b.silentWrong));
for (const r of rows) console.log(r.t.padEnd(18) + f(r.sk).padStart(6) + f(r.ro).padStart(6) + f(r.co).padStart(6) + '|' + f(r.st).padStart(11) + '|' + f(r.table).padStart(10) + String(r.silentWrong).padStart(6) + String(r.fab).padStart(6));
console.log(`\n(pure-table document: recovery = mean of the 5 tables; silent = a value that looks right but is wrong; fab = fake headings, etc.)`);
