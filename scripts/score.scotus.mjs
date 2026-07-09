// Scotus scorer. Pure legal prose: Structure&Text = avg(skeleton / reading-order J1-5 / content anchors / footnote survival).
// Table/formula/image are 'na' -> excluded. Rate card same as attention. Fabrications only affect the deception axes. Run: node score.scotus.mjs
import { readFileSync } from 'node:fs';
const ROOT = new URL('.', import.meta.url).pathname;
const key = JSON.parse(readFileSync(`${ROOT}../keys/scotus-amicus-brief.json`, 'utf8'));
const L = JSON.parse(readFileSync(`${ROOT}../ledgers/scotus-amicus-brief.json`, 'utf8'));
const TOOLS = Object.keys(L.tools);
const LEVELFACTOR = { correct: 1.0, flat_numbered: 0.95, wrong: 0.8 };
const JF = { ok: 1, broken: 0.5, uncertain: 0.75 };

const rows = [];
for (const tool of TOOLS) {
  const d = L.tools[tool];
  const totalHead = key.structext.headings.approx_count; // 14
  const skeleton = Math.min(1, (d.headings.present * (LEVELFACTOR[d.headings.level] ?? 0.8)) / totalHead);

  let jn = 0, js = 0;
  for (const jk of ['J1', 'J2', 'J3', 'J4', 'J5']) { const v = d.junctions[jk]; if (v === 'na' || v == null) continue; js += (JF[v] ?? 0.5); jn++; }
  const readorder = jn ? js / jn : null;

  const content = d.anchors.total ? d.anchors.hit / d.anchors.total : null;
  const footnotes = d.footnotes.total ? d.footnotes.survive / d.footnotes.total : null;

  const parts = [skeleton, readorder, content, footnotes].filter((x) => x != null);
  const structextPct = (parts.reduce((a, b) => a + b, 0) / parts.length) * 100;
  const silentWrong = (d.anchors.silent || 0); // prose has no silently-changed values here (no anchor was silently altered)
  const fab = (d.headings.fab_headings || 0);

  rows.push({ tool, skeleton: skeleton * 100, readorder: readorder == null ? null : readorder * 100, content: content == null ? null : content * 100, footnotes: footnotes == null ? null : footnotes * 100, total: structextPct, silentWrong, fab, partial: d.partial });
}

const f = (x) => x == null ? '-' : String(Math.round(x));
console.log(`\n============ scotus-amicus-brief . v3 defect-driven scoring ============`);
console.log(`Pure legal prose (no tables/formulas/images) . Structure&Text = avg(skeleton/readorder/content anchors/footnotes) = recovery score . silent errors (dangerous) . fabrications (visible)\n`);
console.log('tool'.padEnd(18) + 'skel'.padStart(6) + 'read'.padStart(6) + 'cont'.padStart(6) + 'foot'.padStart(6) + '|' + 'recov'.padStart(6) + 'sil'.padStart(6) + 'fab'.padStart(6));
rows.sort((a, b) => (b.total - a.total) || (a.silentWrong - b.silentWrong));
for (const r of rows) {
  console.log((r.tool + (r.partial ? '*' : '')).padEnd(18) + f(r.skeleton).padStart(6) + f(r.readorder).padStart(6) + f(r.content).padStart(6) + f(r.footnotes).padStart(6) + '|' + f(r.total).padStart(6) + String(r.silentWrong).padStart(6) + String(r.fab).padStart(6));
}
console.log(`\n(footnotes = survival rate of the 11 footnotes; content = 17 legal anchors; silent = looks right but is wrong)`);
