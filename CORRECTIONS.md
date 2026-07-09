# Audit Corrections Log

This file records material scoring and methodology changes found during pre-release cross-review. Because the evaluator (pdfmarkdown.app) is also one of the tools tested, the review focused on traceability, consistency across tools, and corrections that could affect the reported scores or conflict-of-interest assessment.

Version: v3.1. See METHODOLOGY.md for the scoring rules these corrections operate under.

## 1. Direct scoring fixes

| # | Document | Tool | Original | Changed to | Reason |
|---|---|---|---|---|---|
| 1 | financial | MinerU | fabrications = 20 | **13** | The document has only 19 heading lines; 6 are real headings, so at most 13 are fabricated. The original sweeper miscounted. |
| 2 | legal | Docling | content 16/17 | **17/17** | The victim's full name is on line 131; the mechanical probe missed it because of a double space (false negative). |
| 3 | legal | MinerU | content 15/17 | **16/17** | The Richmond precedent is on lines 96/220; the probe was written in the plural and produced a false negative. |
| 4 | paper | PyMuPDF4LLM | Table 2 faithful | **degraded (P2)** | FLOPs split across cells (`3.3·` \| `10^18`) — the same defect Marker was penalized for, so it must be judged the same way. |
| 5 | paper | Docling | Table 2 faithful | **degraded (P2)** | The FLOPs exponent was flattened to `2 . 3 · 10 19`; the notation is systematically damaged. |

Corrections were applied in both directions: #2 and #3 increase competitor recall after false negatives in the mechanical probe, while #4 and #5 make the paper table ruling consistent across tools.

## 2. Deception axis split

The original "deception = silent errors + fabrications" number mixed two different failure modes. It was split into **silent errors** (plausible-looking wrong values) and **fabrications** (visible junk such as fake headings or prose forced into a table). The headline table reports silent errors separately because they are harder for a downstream reader or AI to detect.

## 3. Pure-table document scoring

The fixed 45/20/20/15 weights are designed for mixed documents. On a pure data-table document, those weights reduce tables to about 31% after renormalization, which can understate large differences in table quality.

**Fix:** the land-use document is the only pure-table document in this set (5 tables, no prose/formula/image), so its **recovery score = its table score**, not a blend with structure. The other four documents are mixed or prose, where the fixed weights were left unchanged.

## 4. pdf2md land-use: silent error -> degraded

pdf2md truncated `458,614` to `458,` and `-3,647` to `-3,`. The trailing dangling comma is **visible damage**. By this benchmark's own definition (silent = *looks correct*), that is a **degraded (visibly broken)** result, not silent deception. After the fix, pdf2md's land-use recovery moved 53 -> 50 (tables), its silent-error count 4 -> 0, and the fabrication count was reclassified.

## 5. Author block table ruling

Rendering a genuinely structured block, such as an author roster or address column, as a table is not penalized. This is a general rule for all tools. What is counted as fabrication is different: prose sentences, captions, or references forced into a table, which can mislead a downstream reader into treating prose as data. The test is: *is the content itself structured/list-like?* If yes, no penalty; if it is prose, it counts as fabrication.

## 6. Conflict-of-interest-sensitive items

Two reviewed issues were relevant to the evaluator-as-contestant concern:

- Land-use changed to tables-only (sec. 3), removing the mixed-document weight distortion for that file.
- Competitor-helping corrections were applied where the evidence supported them (pdf2md reclassification, Docling/MinerU anchor fixes).
- The author-block ruling was stated as a general rule rather than a tool-specific exception (sec. 5).
- On the scan, the cover-photo dimension was kept because the cover image is part of the benchmarked document. The ledger also records that **MinerU has the best text/OCR on that page** (including the script-font title; structure 94), while pdfmarkdown.app reaches the top scan score by also extracting the cover photo (structure 77, image 100).

---

*This log is published alongside the scores. If you find a new problem, trace it to the ledger line and the source document, then propose a correction.*
