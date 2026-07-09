// Evidence layer (reads the key, finds evidence, does NOT pass verdicts). Optional helper: the score.*.mjs
// scripts read the human-reviewed ledgers directly and do not depend on this file. This is here so anyone can
// re-derive the mechanical facts (table counts, broken image links, anchor presence) that back up the ledger.
// Run: node evidence.mjs <corpus>   e.g. node evidence.mjs attention
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const ROOT = new URL('.', import.meta.url).pathname;
export const TOOLS = ['pdfmarkdown-app', 'marker', 'mineru', 'mathpix', 'docling', 'markitdown', 'pymupdf4llm', 'cloudconvert', 'pdf2md'];

export function loadKey(corpus) {
  return JSON.parse(readFileSync(`${ROOT}../keys/${corpus}.json`, 'utf8'));
}

// Collect mechanical probes from the v3 key schema: structext anchors + object detect patterns.
function probesFromKey(key) {
  const probeList = [];
  const anchors = key?.structext?.anchors?.items;
  if (Array.isArray(anchors)) for (const it of anchors) if (it.probe) probeList.push({ id: it.id, probe: it.probe });
  if (key.objects) for (const grp of Object.values(key.objects)) for (const o of grp) if (o.detect) probeList.push({ id: o.id, probe: o.detect });
  return probeList;
}

export function analyze(tool, corpus, key) {
  const f = `${ROOT}../outputs/${tool}/${corpus}.md`;
  if (!existsSync(f)) return { tool, missing: true };
  const md = readFileSync(f, 'utf8');
  const lines = md.split('\n');

  // (1) File-level facts
  const pipeRows = lines.filter((l) => /^\s*\|.*\|/.test(l)).length;
  const htmlTables = (md.match(/<table/gi) || []).length;
  const headingTotal = (md.match(/^#{1,6}\s+\S/gm) || []).length;
  const imageRefs = (md.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
  const codeFences = (md.match(/^```/gm) || []).length;
  const formulaNotDecoded = (md.match(/formula-not-decoded/gi) || []).length;
  const pictureOmitted = (md.match(/intentionally omitted/gi) || []).length;
  const glue = (md.match(/[A-Za-z]{16,}/g) || []).length;
  const doubled = (md.match(/\b(\w{2,})\1\b/g) || []).length;
  let dupLines = 0; for (let i = 1; i < lines.length; i++) { const a = lines[i].trim(); if (a.length > 20 && a === lines[i - 1].trim()) dupLines++; }
  // Broken image links
  const imgdir = `${ROOT}../outputs/${tool}/images/${corpus}`;
  const onDisk = existsSync(imgdir) ? new Set(readdirSync(imgdir)) : new Set();
  let brokenImg = 0; let realImgFiles = onDisk.size;
  for (const m of md.matchAll(/!\[[^\]]*\]\(([^)]+)\)/g)) { const b = (m[1].split('/').pop() || ''); if (/\.(png|jpe?g|gif|webp)$/i.test(b) && !onDisk.has(b)) brokenImg++; }
  const facts = { chars: md.length, pipeRows, htmlTables, hasRealTable: pipeRows > 0 || htmlTables > 0, headingTotal, imageRefs, codeFences, formulaNotDecoded, pictureOmitted, glue, doubled, dupLines, realImgFiles, brokenImg };

  // (2) Candidate evidence for each probe (detect pass) -- guards against the judge hallucinating
  const itemEvidence = {};
  for (const { id, probe } of probesFromKey(key)) {
    const re = new RegExp(probe, 'i');
    let ln = -1; for (let i = 0; i < lines.length; i++) { if (re.test(lines[i])) { ln = i + 1; break; } }
    itemEvidence[id] = { probed: true, found: ln > 0, line: ln > 0 ? ln : null };
  }

  // (3) Readable anomaly signals
  const anomalies = [];
  if (formulaNotDecoded) anomalies.push(`formula-not-decoded x${formulaNotDecoded}`);
  if (pictureOmitted) anomalies.push(`picture-omitted x${pictureOmitted}`);
  if (glue > 50) anomalies.push(`word-glue x${glue}`);
  if (doubled > 40) anomalies.push(`doubled-word x${doubled}`);
  if (dupLines > 3) anomalies.push(`adjacent-duplicate-lines x${dupLines}`);
  if (brokenImg) anomalies.push(`broken-image-link x${brokenImg}`);
  if (headingTotal > 60) anomalies.push(`abnormally-many-headings x${headingTotal}`);

  return { tool, facts, itemEvidence, anomalies };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const corpus = process.argv[2] || 'attention';
  const key = loadKey(corpus);
  for (const t of TOOLS) console.log(JSON.stringify(analyze(t, corpus, key)));
}
