// Toyota scorer. Structure&Text = avg(KV / TOC / headings / reading-order); formula = the single TSR item; no images -> weights renormalized.
// Rate card same as attention. Fabrications only affect the deception axes. Run: node score.toyota.mjs
import { readFileSync } from 'node:fs';
const ROOT = new URL('.', import.meta.url).pathname;
const key = JSON.parse(readFileSync(`${ROOT}../keys/toyota-securities.json`, 'utf8'));
const L = JSON.parse(readFileSync(`${ROOT}../ledgers/toyota-securities.json`, 'utf8'));
const TOOLS = Object.keys(L.tools);
const W = key.weights;
const DED = { P1: 0.5, P2: 0.2, P3: 0.05 };
const LEVELFACTOR = { correct: 1.0, flat_numbered: 0.95, wrong: 0.8 };
const TOCF = { ok: 1, degraded: 0.8, broken: 0.5 };
const ROF = { ok: 1, broken: 0.5, uncertain: 0.75 };

function objScore(v, sev) {
  if (v === 'na' || v == null) return { s: null, silent: 0 };
  if (v === 'faithful') return { s: 1, silent: 0 };
  if (v === 'missing') return { s: 0, silent: 0 };
  if (v === 'silent_wrong') return { s: 0, silent: 1 };
  if (v === 'degraded') return { s: Math.max(0, 1 - (DED[sev] ?? DED.P2)), silent: 0 };
  return { s: 0, silent: 0 };
}
function objDim(items, verdicts, sevs, fab) {
  let num = 0, nreal = 0, sw = 0;
  for (const it of items) {
    const r = objScore(verdicts[it.id], sevs?.[it.id]); if (r.s === null) continue;
    num += r.s; nreal += 1; sw += r.silent;
  }
  return { pct: nreal ? (num / nreal) * 100 : null, sw, fab: fab || 0 };
}

const rows = [];
for (const tool of TOOLS) {
  const d = L.tools[tool];
  // structext: 4 sub-parts
  const kv = d.kv.total ? Math.max(0, (d.kv.present - (d.kv.silent || 0)) / d.kv.total) : null; // silently-changed KVs are removed from present and counted as deception
  const toc = d.toc === 'na' ? null : (TOCF[d.toc] ?? 0.5);
  const skeleton = (d.headings.present * (LEVELFACTOR[d.headings.level] ?? 0.8)) / (key.structext.headings.approx_count);
  const ro = ROF[d.reading_order] ?? 0.75;
  const stParts = [kv, toc, Math.min(1, skeleton), ro].filter((x) => x != null);
  const structextPct = (stParts.reduce((a, b) => a + b, 0) / stParts.length) * 100;

  const table = objDim(key.objects.table, d.table.verdict, d.table.severity, d.table.fab_tables);
  const formula = objDim(key.objects.formula, d.formula.verdict, d.formula.severity, 0);
  const image = { pct: null }; // this corpus has no images

  const dims = { structext: { pct: structextPct }, table, formula, image };
  let wsum = 0, wtot = 0;
  for (const [dn, w] of Object.entries(W)) { if (dims[dn].pct == null) continue; wsum += dims[dn].pct * w; wtot += w; }
  const total = wtot ? wsum / wtot : null;
  const silentWrong = table.sw + formula.sw + (d.kv.silent || 0); // silently-changed KVs also count as dangerous
  const fab = (d.headings.fab_headings || 0) + table.fab; // fabricated structure
  rows.push({ tool, kv: kv == null ? null : kv * 100, toc: toc == null ? null : toc * 100, skeleton: Math.min(1, skeleton) * 100, ro: ro * 100, structext: structextPct, table: table.pct, formula: formula.pct, total, silentWrong, fab, partial: d.partial });
}

const f = (x) => x == null ? '-' : String(Math.round(x));
console.log(`\n============ toyota-securities . v3 defect-driven scoring ============`);
console.log(`Financial filing (table/KV dominated, no images -> weights renormalized) . recovery score . silent errors (dangerous) . fabrications (visible junk)\n`);
console.log('tool'.padEnd(18) + 'KV'.padStart(5) + 'TOC'.padStart(6) + 'head'.padStart(6) + 'read'.padStart(6) + '|' + 'struct'.padStart(9) + 'tbl'.padStart(5) + 'form'.padStart(6) + '|' + 'recov'.padStart(6) + 'sil'.padStart(6) + 'fab'.padStart(6));
rows.sort((a, b) => (b.total - a.total) || (a.silentWrong - b.silentWrong));
for (const r of rows) {
  console.log(
    (r.tool + (r.partial ? '*' : '')).padEnd(18) + f(r.kv).padStart(5) + f(r.toc).padStart(6) + f(r.skeleton).padStart(6) + f(r.ro).padStart(6) + '|' +
    f(r.structext).padStart(9) + f(r.table).padStart(5) + f(r.formula).padStart(6) + '|' + f(r.total).padStart(6) + String(r.silentWrong).padStart(6) + String(r.fab).padStart(6)
  );
}
console.log(`\n(silent = looks right but is wrong, the most dangerous; fab = fake headings and other visible junk; formula is a single coarse TSR item; KV full marks = all 13 label->value bindings correct)`);
