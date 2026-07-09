// Clean-water (scan) scorer. OCR names/script-font + two-column reading order + cover photo (no tables, no formulas
// -> renormalized to structure 75% / image 25%). silent = a surname OCR'd into a plausible wrong spelling. Run: node score.cleanwater.mjs
import { readFileSync } from 'node:fs';
const ROOT = new URL('.', import.meta.url).pathname;
const key = JSON.parse(readFileSync(`${ROOT}../keys/clean-water-1973-scan.json`, 'utf8'));
const L = JSON.parse(readFileSync(`${ROOT}../ledgers/clean-water-1973-scan.json`, 'utf8'));
const W = key.weights, TOOLS = Object.keys(L.tools);
const LF = { correct: 1, flat_numbered: 0.95, wrong: 0.8 }, RO = { ok: 1, broken: 0.5, uncertain: 0.75 }, CT = { both: 1, partial: 0.5, none: 0 };
const rows = [];
for (const t of TOOLS) {
  const d = L.tools[t];
  const sk = Math.min(1, d.headings.present * (LF[d.headings.level] ?? .8) / key.structext.headings.approx_count);
  const ro = RO[d.reading_order] ?? .75;
  // content = survival rate of 15 names + the date + the script-font cover title (1 slot)
  const co = (d.names.correct + (d.date_ok ? 1 : 0) + (CT[d.cover_title] ?? 0)) / (d.names.total + 2);
  const st = (sk + ro + co) / 3 * 100;
  const img = d.image === 'present' ? 100 : 0;
  const dims = { structext: { pct: st }, table: { pct: null }, formula: { pct: null }, image: { pct: img } };
  let ws = 0, wt = 0; for (const [dn, w] of Object.entries(W)) { if (dims[dn].pct == null) continue; ws += dims[dn].pct * w; wt += w; }
  rows.push({ t, sk: sk * 100, ro: ro * 100, co: co * 100, st, img, total: wt ? ws / wt : null, silentWrong: (d.names.silent || 0), fab: (d.headings.fab_headings || 0) });
}
const f = x => x == null ? '-' : String(Math.round(x));
console.log(`\n============ clean-water-1973-scan . v3 defect-driven scoring (scanned document) ============`);
console.log(`OCR names/script-font + two-column reading order + cover photo (no tables/formulas -> renormalized structure 75% / image 25%) . silent errors (surname OCR misspelling) . fabrications (visible)\n`);
console.log('tool'.padEnd(18) + 'skel'.padStart(6) + 'read'.padStart(6) + 'cont'.padStart(6) + '|' + 'struct'.padStart(9) + 'img'.padStart(5) + '|' + 'recov'.padStart(6) + 'sil'.padStart(6) + 'fab'.padStart(6));
rows.sort((a, b) => (b.total - a.total) || (a.silentWrong - b.silentWrong));
for (const r of rows) console.log(r.t.padEnd(18) + f(r.sk).padStart(6) + f(r.ro).padStart(6) + f(r.co).padStart(6) + '|' + f(r.st).padStart(9) + f(r.img).padStart(5) + '|' + f(r.total).padStart(6) + String(r.silentWrong).padStart(6) + String(r.fab).padStart(6));
console.log(`\n(content = survival of 15 names + date + script-font title; img = whether the cover sunset photo was extracted; silent = a surname OCR'd into a plausible wrong spelling, all zero for this corpus)`);
