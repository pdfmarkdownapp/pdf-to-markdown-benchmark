# PDF to Markdown Converter Benchmark — Docling, Marker, MinerU, Mathpix & more

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Tools benchmarked](https://img.shields.io/badge/tools-9-brightgreen)
![Documents](https://img.shields.io/badge/documents-5-orange)
![Dependencies](https://img.shields.io/badge/dependencies-none-success)
![Reproducible](https://img.shields.io/badge/scoring-deterministic-blueviolet)

An evidence-driven, reproducible quality benchmark of **9 PDF -> Markdown converters** on **5 deliberately hard documents**, scored for what an LLM actually needs: can a reader who only sees the converted Markdown (and never the original PDF) faithfully reconstruct the document? Every score is derived from a published answer key and a per-tool defect ledger, so anyone can audit or challenge a number rather than take it on faith.

This is a **case-based benchmark**. It only claims "on these 5 representative documents, tool X did better than tool Y." It does **not** claim "best for all PDFs" or that a 3-point gap generalizes.

## The 9 tools

Open-source / developer tools:

- **[MinerU](https://github.com/opendatalab/MinerU)** — VLM-based document extraction (OpenDataLab)
- **[Marker](https://github.com/VikParuchuri/marker)** — deep-learning PDF -> Markdown pipeline
- **[Docling](https://github.com/docling-project/docling)** — document conversion toolkit (IBM / DS4SD)
- **[PyMuPDF4LLM](https://github.com/pymupdf/RAG)** — PyMuPDF's Markdown/LLM extractor
- **[MarkItDown](https://github.com/microsoft/markitdown)** — Microsoft's file-to-Markdown utility

Online / general-user tools:

- **[Mathpix](https://mathpix.com)** — OCR/Markdown service, strong on math
- **[CloudConvert](https://cloudconvert.com)** — general-purpose online converter
- **[pdf2md](https://pdf2md.morethan.io)** — browser PDF-to-Markdown tool (pdf2md.morethan.io)
- **[pdfmarkdown.app](https://pdfmarkdown.app)** — in-browser, privacy-first PDF -> Markdown (publisher of this benchmark; see Disclosure)

## Which tool should you use?

A practical picker. It factors in things beyond these 5 documents (install, hardware, cost), so treat it as guidance, not a scored result; the [full writeup](https://pdfmarkdown.app/blog/best-pdf-to-markdown-converter) has the reasoning, and the scores that back it are just below.

**Run it open-source, on your own machine (developers)**

| If you need | Use | Watch out for |
|---|---|---|
| Papers, formulas, complex tables | **MinerU** | best quality; deletes footnotes; VLM wants a GPU |
| A safe, balanced default | **Marker** | consistent; check the commercial-use license |
| An honest gap over a fake number | **Docling** | clean tables; drops formulas (never fakes them) |
| Speed on simple PDFs, at scale | **PyMuPDF4LLM** | fast; reading order breaks at figures |
| Many input formats, quick ingestion | **MarkItDown** | no headings — skip for RAG chunking |

**Just want it done, no setup (hosted / browser)**

| If you need | Use | Watch out for |
|---|---|---|
| Formula-heavy paper (you'll double-check) | **Mathpix** | cloud; paid tiers; can silently drop numbers |
| One simple PDF, just once | **CloudConvert** | cloud; simple tables only |
| Everyday / private, in the browser | **pdfmarkdown.app** | runs in your browser; nothing uploaded |

## The 5 documents

| File | What it is | Why it's hard |
|---|---|---|
| `attention.pdf` | *Attention Is All You Need* (arXiv 1706.03762), single-column academic paper | formulas, figures, footnotes, and four tables in one document |
| `toyota-securities.pdf` | Toyota FY2024 annual securities report, EDINET filing (pp.1-8) | Japanese (CJK) plus dense financial tables with negative-sign and bracket conventions |
| `scotus-amicus-brief.pdf` | US Supreme Court amicus brief No.21-659 | pure legal prose: 11 footnotes, a table of authorities, two-column signature blocks |
| `landuse-plan-tables.pdf` | Sonoma County General Plan, Land Use Element (pp.LU-13~16) | 5 dense data tables with hierarchical headers, subtotals, and negative numbers |
| `clean-water-1973-scan.pdf` | 1973 Detroit Metro Water Department booklet, scanned | needs OCR: a script-font title over a photo, a two-column roster, a cover image |

A sixth source input, `landuse-plan-tables-encrypted.pdf`, is a password-protected copy of the land-use plan excerpt. It is a **capability probe** ("can the tool open it at all?"), not part of the quality scoring.

## Headline results

Recovery score per document (0-100; higher is better). Open-source tools first, online tools next, pdfmarkdown.app last.

| Tool | Paper | Financial | Legal | Tables | Scan | **Average** | Silent errors |
|---|--:|--:|--:|--:|--:|--:|--:|
| MinerU | 99 | 95 | 67 | 100 | 71 | **86** | 0 |
| Marker | 95 | 87 | 82 | 96 | 71 | **86** | 0 |
| Docling | 63 | 80 | 90 | 92 | 61 | **77** | 0 |
| PyMuPDF4LLM | 61 | 90 | 90 | 82 | 58 | **76** | 0 |
| MarkItDown | 51 | 65 | 70 | 66 | 33 | **57** | 0 |
| Mathpix | 100 | 84 | 85 | 80 | 59 | **82** | 2 |
| CloudConvert | 62 | 90 | 90 | 70 | 55 | **73** | 0 |
| pdf2md | 55 | 79 | 80 | 50 | 46 | **62** | 1 |
| **pdfmarkdown.app** | 97 | 90 | 91 | 100 | 83 | **92** | 0 |

The **Average** column is a convenience readout, not a universal ranking: per-document scores are not additive across documents, and a lead can rest on one or two documents (e.g. footnote survival on the brief, cover-image extraction on the scan). Read it as "on these 5 documents, tool X did better than Y on these specific items," not "X is better for all PDFs." Swap the corpus and the order can move.

## Two axes, on purpose

We report two numbers that we deliberately do **not** merge into one:

- **Recovery score (0-100)** — of the things that should have come through, how much did, correctly.
- **Silent errors (a count)** — how many times a value was quietly turned into something that *looks* correct but is wrong. This is the most dangerous failure mode, because an AI cannot tell it happened. A tool that honestly drops a table is safer than one that silently corrupts a number, so a recovery of 82 with zero silent errors can be more trustworthy than an 87 with three.

(A visible-fabrication count — fake headings, prose forced into a table — is also tracked in the ledgers as "junk you can see, but it doesn't fool anyone.")

## How to reproduce

Scores are computed by pure Node.js scripts (no dependencies) that read the answer keys in `keys/` and the human-reviewed verdicts in `ledgers/`:

```
node scripts/score.mjs           # attention (paper)
node scripts/score.toyota.mjs    # toyota-securities (financial)
node scripts/score.scotus.mjs    # scotus-amicus-brief (legal)
node scripts/score.landuse.mjs   # landuse-plan-tables (tables)
node scripts/score.cleanwater.mjs # clean-water-1973-scan (scan)
```

Each script prints a per-tool table and reproduces the numbers in `results/scores.csv`. The raw converter outputs live in `outputs/<tool>/`. Source-document links and page ranges are recorded in `documents/README.md`; local PDF copies may be placed under `documents/` for private reruns, but they are third-party inputs and are not part of the MIT-licensed code. An optional mechanical evidence helper is `scripts/evidence.mjs` (e.g. `node scripts/evidence.mjs attention`).

> **Note on outputs:** each tool's Markdown is included together with the figure crops it extracted (under `outputs/<tool>/images/`, or alongside the `.md` for tools that write flat), so every image link resolves. The **image dimension is scored from the crop review recorded in `ledgers/`**, independent of the binaries shown here. Per-tool UI screenshots and raw intermediates are intentionally excluded.

Where the layers live:
- `keys/` — the answer key for each document (ground truth, written from the source document, tool-agnostic).
- `ledgers/` — per-tool, per-item verdicts (faithful / degraded / missing / silent_wrong) with notes.
- `scripts/` — the deterministic scorers that turn a ledger + key into scores.

## Tool versions & run configuration

All runs were performed 2026-07-03 to 07-06, one configuration per tool, default settings unless noted.

| Tool | How it was run | Version / engine | Config |
|---|---|---|---|
| MinerU | local | MinerU2.5-Pro-1.2B (VLM engine) | VLM mode (highest-accuracy path) |
| Marker | local | marker-pdf 1.10.2 | default (no custom flags) |
| Docling | local (pip) | not captured at run time | default |
| PyMuPDF4LLM | local (pip) | not captured at run time | default |
| MarkItDown | local (pip) | not captured at run time | default |
| Mathpix | web UI (mathpix.com); output manually downloaded | service as of run date | default |
| CloudConvert | web service (cloudconvert.com) | service as of run date | default |
| pdf2md | web (pdf2md.morethan.io) | service as of run date | default |
| pdfmarkdown.app | in-browser (pdfmarkdown.app) | production build as of run date | default |

The three pip-installed versions were not pinned at run time; they will be recorded on the next refresh.

## Honest limitations

- **Only 5 documents.** This is case-based and not statistically representative of "all PDFs."
- **One configuration per tool**, run once (see run dates above). Tools change; re-run to refresh.
- **Some scoring involves an AI/human judge** for semantic questions; those verdicts are recorded in the ledgers so you can disagree with a specific cell.
- **The silent-error count is a floor, not a census.** The mechanical probes that flag silent errors are not exhaustive (the ledgers' `_known_gaps` note where checks don't yet reach, e.g. footnote bodies). A `0` means "none caught by the current checks," not "provably none."
- The Japanese financial document naturally contains CJK text in the raw outputs — that is authentic data, not a leak.

## License

The **code** in this repository (scoring scripts, keys, ledgers) is MIT-licensed (see `LICENSE`). The source documents and derived converter outputs are third-party content or third-party-derived artifacts, not covered by that license; see `documents/README.md` for source links and page ranges.

## Disclosure

This benchmark is published by **pdfmarkdown.app**, which is **one of the nine tools tested**. Because the evaluator is also a contestant, everything needed to check our work is in this repository: the full answer keys, the per-tool ledgers, the deterministic scoring scripts, and every tool's raw Markdown output. The methodology (METHODOLOGY.md) and the cross-review correction log (CORRECTIONS.md) document how scores were set and where they were changed during review — including corrections that helped competitors and lowered our own numbers. If you think a score is wrong, trace it to the ledger line and the source document, and propose a fix.

A narrative walkthrough of these results, with practical use-case recommendations, is on the pdfmarkdown.app blog: [Best PDF to Markdown Tools in 2026](https://pdfmarkdown.app/blog/best-pdf-to-markdown-converter).
