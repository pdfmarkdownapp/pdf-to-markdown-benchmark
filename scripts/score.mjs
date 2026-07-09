// Attention scorer. Scores are derived deterministically from the defect ledger + rate card, never hand-set.
// Ledger sources: 4 sweeper passes (headings/junctions/tables/formulas) + mechanical anchors + crop-review image scores.
// Each item starts at 1.0: P0 -> 0 and silent+1 / P1 -0.5 / P2 -0.2 / P3 -0.05, floored at 0.
// structext = avg(skeleton, reading-order, content); object dims = sum(item scores) / true item count.
// Two axes: recovery score (weighted 45/20/20/15, absent categories renormalized) + silent-error count (its own column).
// Run: node score.mjs
import { readFileSync } from 'node:fs';
const ROOT = new URL('.', import.meta.url).pathname;
const key = JSON.parse(readFileSync(`${ROOT}../keys/attention.json`, 'utf8'));
const L = JSON.parse(readFileSync(`${ROOT}../ledgers/attention.json`, 'utf8'));
const TOOLS = Object.keys(L.tools);
const W = key.weights;

// Rate card: defect level -> how much this item loses (P0 handled specially)
const DED = { P1: 0.5, P2: 0.2, P3: 0.05 };
const LEVELFACTOR = { correct: 1.0, flat_numbered: 0.95, wrong: 0.8 }; // heading-level recovery: flattened-but-numbered = P3, jumbled level = P2

function objScore(v, sev) {
  // v: faithful|degraded|missing|silent_wrong|na ; sev: P1|P2 (degraded only)
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
    const r = objScore(verdicts[it.id], sevs?.[it.id]);
    if (r.s === null) continue;
    num += r.s; nreal += 1; sw += r.silent; // sw = silent-error count (silent_wrong)
  }
  // Recovery score = pure "how well the real things were reconstructed"; fabrications (fab) and silent errors (sw)
  // do not drag down the recovery score, they each get their own column.
  return { pct: nreal ? (num / nreal) * 100 : null, nreal, fab: fab || 0, sw };
}

const rows = [];
for (const tool of TOOLS) {
  const d = L.tools[tool];

  // -- Structure & Text: skeleton / readorder / content --
  const H = d.headings;
  const totalHead = key.structext.headings.level1.length + key.structext.headings.level2.length + key.structext.headings.level3.length; // 24
  const skeleton = (H.present * (LEVELFACTOR[H.level] ?? 0.8)) / totalHead; // denominator counts only true headings; fake ones go on the fabrication axis

  const Jv = d.junctions; let jnum = 0, jn = 0;
  for (const jk of ['J1', 'J2', 'J3', 'J4', 'J5']) {
    const v = Jv[jk]; if (v === 'na' || v == null) continue;
    jnum += (v === 'ok' ? 1 : v === 'broken' ? 0.5 : 0.75); jn += 1; // broken = P1 (-0.5), uncertain = conservative -0.25
  }
  const readorder = jn ? jnum / jn : null;

  const A = d.anchors; const content = A.total ? A.hit / A.total : null;

  const stParts = [skeleton, readorder, content].filter((x) => x != null);
  const structextPct = (stParts.reduce((a, b) => a + b, 0) / stParts.length) * 100;
  const structSilent = (H.fab_headings || 0); // fake headings go on the fabrication axis

  // -- Object dimensions --
  const table = objDim(key.objects.table, d.table.verdict, d.table.severity, d.table.fab_tables);
  const formula = objDim(key.objects.formula, d.formula.verdict, d.formula.severity, d.formula.fab_formulas);
  const image = { pct: (d.image?.score ?? 0) * 100, silent: 0 };

  // -- Total: 45/20/20/15, absent categories renormalized --
  const dims = { structext: { pct: structextPct }, table, formula, image };
  let wsum = 0, wtot = 0;
  for (const [dn, w] of Object.entries(W)) { if (dims[dn].pct == null) continue; wsum += dims[dn].pct * w; wtot += w; }
  const total = wtot ? wsum / wtot : null;

  // Split the deception axis into two columns: silent errors (dangerous, invisible) = silent_wrong;
  // fabricated structure (visible junk) = fake headings/tables/formulas.
  const silentWrong = table.sw + formula.sw;
  const fab = structSilent + table.fab + formula.fab;

  rows.push({
    tool,
    skeleton: skeleton * 100, readorder: readorder == null ? null : readorder * 100, content: content == null ? null : content * 100,
    structext: structextPct, table: table.pct, formula: formula.pct, image: image.pct,
    total, silentWrong, fab,
  });
}

const f = (x) => x == null ? '-' : String(Math.round(x));
console.log(`\n============ attention . v3 defect-driven scoring ============`);
console.log(`Recovery 0-100 . silent errors (dangerous: looks right, is wrong) . fabrications (visible junk: fake headings/tables) . weights skeleton 45 / table 20 / formula 20 / image 15`);
console.log(`Structure & Text = avg(skeleton / readorder / content)\n`);
const H = 'tool'.padEnd(18) + 'skel'.padStart(6) + 'read'.padStart(6) + 'cont'.padStart(6) + '|' + 'struct'.padStart(9) + 'tbl'.padStart(5) + 'form'.padStart(6) + 'img'.padStart(5) + '|' + 'recov'.padStart(6) + 'sil'.padStart(6) + 'fab'.padStart(6);
console.log(H);
rows.sort((a, b) => (b.total - a.total) || (a.silentWrong - b.silentWrong));
for (const r of rows) {
  console.log(
    r.tool.padEnd(18) + f(r.skeleton).padStart(6) + f(r.readorder).padStart(6) + f(r.content).padStart(6) + '|' +
    f(r.structext).padStart(9) + f(r.table).padStart(5) + f(r.formula).padStart(6) + f(r.image).padStart(5) + '|' +
    f(r.total).padStart(6) + String(r.silentWrong).padStart(6) + String(r.fab).padStart(6)
  );
}
console.log(`\n(Silent errors = the dangerous column to watch; image reuses the crop review.)`);
