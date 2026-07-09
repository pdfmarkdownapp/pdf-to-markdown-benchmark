# Methodology

How this PDF -> Markdown quality benchmark scores tools, why it scores them that way, and where the method is deliberately conservative. This file consolidates the benchmark design, the answer-key spec, and the scoring rules into one place.

## 1. One principle: the consumer's seat

We sit in the seat of the **consumer of the Markdown** — a reader (an AI or a person) who **only receives the converted Markdown and never sees the original PDF**. The only question is: *can they faithfully reconstruct the document?* Not "does it look tidy," but "is the information correct, does it read in the right order, and were they silently misled?"

## 2. Two axes, deliberately not merged

We report two numbers and keep them separate:

- **Recovery score (0-100)** — of the things that should have been recovered, how much was, correctly.
- **Silent errors (a count)** — the number of times a value was quietly turned into something that *looks* correct but is wrong (a fabricated table/heading, a silently changed number). This is the most corrosive failure because the AI cannot detect it and will propagate it as truth.

The silent-error count is **not folded into the recovery score**, because an honest tool that drops a table is safer than one that silently corrupts a number. A recovery of 82 with zero silent errors can be worth more than 87 with three. A separate, less-severe **visible-fabrication count** (fake headings, prose forced into a table) is also tracked — annoying, but it doesn't fool anyone.

Older drafts collapsed "silent wrong" and "fabricated junk" into a single number. That let 20 obviously-fake headings numerically dominate one quiet wrong number, which contradicts the "silent is most dangerous" thesis. So the two are split into separate columns, and the silent-error column is the one to watch.

## 3. Four dimensions, four questions each

| Dimension | Default weight | The four questions |
|---|--:|---|
| **Structure & Text** | 45% | (1) skeleton: are columns / heading levels / paragraph breaks recognized? (2) reading order: correct, no column-crossing? (3) content fidelity: are characters accurate (no hallucination, no glued words, CJK intact), no dropped paragraphs? (4) misdetection: no fake headings, no prose misread as a table, no large duplicated blocks? |
| **Table** | 20% | (1) detection: how many real tables found? (2) misdetection: prose wrongly called a table? (3) structure: header / row-column alignment? (4) content: key numbers / cells correct? |
| **Formula** | 20% | (1) detection: formulas found, not dropped or rasterized away? (2) misdetection: non-formulas called formulas? (3) structure: sub/superscripts, fractions, roots? (4) content: symbols / values correct? |
| **Image** | 15% | (1) extraction: are the right figures pulled out? (2) misdetection: wrong or extra crops? (3) completeness: crisp, complete, the correct region? (4) caption: caption text and position correct? |

The first two questions of each dimension are **coverage** (recall / precision); the last two are **quality** (accuracy of what was found).

The default weights (45/20/20/15) are an **experience-based judgment**, not a derived constant: they encode "for a typical mixed document, structure and text carry the most, tables and formulas next, images last." They are deliberately not universal — if your own documents skew very differently (say almost all figures, or pure spreadsheets), the weighting that fits your use may differ, so read the weighted total as calibrated for this kind of mixed corpus, not a law. For documents dominated by (or made entirely of) a single object type, the weights renormalize as described next, so a pure-table or pure-image document is judged on the object that actually carries it.

### Renormalization for absent categories

Total = Structure & Text 45 / Table 20 / Formula 20 / Image 15, weighted. **If a document has no objects in a category, that weight is dropped and the rest are scaled proportionally back up to 100.** Examples:

- Scanned cover (no tables, no formulas): 45/15 -> **Structure & Text 75 / Image 25**.
- Japanese financial filing (effectively no formulas, no images): 45/20 -> **Structure & Text ~69 / Table ~31**.
- Pure legal prose (no tables/formulas/images): everything collapses onto Structure & Text.

**Pure-object documents collapse onto that object (general rule).** When a document is entirely one object type — pure data tables, or a pure image page, with no prose/formula/other objects — its recovery score **is** that dimension's score, not a blend, so inflated structure marks can't paper over a weak core. This applies to any such document; in the current set the land-use file is the only one that qualifies (5 tables, nothing else), so its recovery = its table score.

## 4. The rate card (fixed once, applied to every document)

Every evaluation item starts at 1.0. Each verdict maps to a score and, for the dangerous case, a silent-error tick:

| Verdict | Recovery | Silent error |
|---|--:|---|
| **faithful** — the correct information reaches the consumer | 1.0 | — |
| **degraded** — broken but visibly so, and recoverable | 1 − penalty | — |
| **missing** — gone, but not deceptive | 0 | — |
| **silent_wrong** — looks right, is wrong | 0 | **+1** |

Degradation penalties: **P1 (structure collapsed beyond row/column recognition, or half of it lost) = −0.5; P2 (minor mess) = −0.2; P3 (recoverable, e.g. flattened but numbering intact) = −0.05**, floored at 0.

Heading-level recovery uses a level factor: correct = 1.0, flattened-but-numbered = 0.95 (P3), jumbled level = 0.8 (P2).

### How a dimension score is computed (tables as the example)

Score each table that *should* exist, then average; fabricated tables are recorded separately as silent/visible junk, not in the denominator's numerator.

- a table that is **missing** -> 0
- a table that is **detected** -> (structure score + content score) / 2
- **dimension score = mean over the tables that should exist × 100**
- a **misdetection** (prose called a table) -> not scored here; it goes on the fabrication axis.

Fabrications do **not** drag down the recovery score (recovery measures only "how well the real things came through"); they live on their own axis.

## 5. Error taxonomy

Four defect classes, distinguished by *how visible* the damage is:

- **visibly broken** — obvious damage that carries its own warning (a table splayed into loose text). Recoverable; less dangerous.
- **plausibly wrong** — reads cleanly, is actually wrong (a number silently changed). **This is the only class counted as a "silent error."**
- **missing** — content simply absent. Honest gap, not deception.
- **label-stripped** — real content present but its structural label lost (e.g. a heading demoted to body text).

The severity ordering behind the whole benchmark: **a plausibly-wrong value is worse than visibly-broken output, and "I honestly didn't handle this" beats "here's a quiet wrong answer."** Errors that originate in the source document (e.g. the *Attention* paper's own 41.0-vs-41.8 erratum) are tagged **source** and not charged to the converter, since it faithfully carried them over.

## 6. What is an "evaluation item" (removing arbitrariness)

A table could be scored as 1 point or split into 6; changing the split changes the total. So each object type is expanded through a **fixed template** so counts are comparable across documents:

- **Table (5 points):** recognized as a structured object / header hierarchy correct / row-column relations correct / key cells correct / notes-units-signs preserved.
- **Formula (5 points):** exists (not omit/placeholder) / symbols correct / sub-superscript-fraction structure correct / numbering correct / correctly linked to its reference.
- **Image (5 points):** extracted / complete and crisp (pixels) / the correct figure / caption correct / placed sensibly.
- **Text:** paragraph completeness / no hallucination / spacing intact / CJK fidelity / footnote bodies intact / references as a list.
- **Structure (general):** reading order / heading levels / cross-page continuity / heading<->body / footnote<->anchor / figure<->caption / equation-number<->reference / no large duplication / no systematic fake headings.

Positive assertions cover what should be recovered; **negative assertions** cover what must *not* appear (prose turned into a table, every line turned into a heading, a header repeated dozens of times, columns interleaved, a footnote sewn onto the wrong sentence, a negative sign or decimal point silently changed). A stable set of negative checks lives in the keys and scores; newly discovered defects during free auditing are **not** retro-added to the current run (that would be "editing the exam after seeing the answers") — they go into the next key version with a bumped benchmark version.

## 7. Who judges (routing by verifiability)

The routing is by *what can be written as a deterministic assertion*, not by "existence vs quality":

| Check | Who decides | Examples |
|---|---|---|
| `mechanical` | evidence-layer script | is the image file on disk, broken image links, does a key number *appear*, is there real table syntax, count of omit/placeholder markers |
| `mechanical+judge` | script finds candidate evidence -> judge rules on semantics | is a number in the *correct row/column*, are table notes/units preserved |
| `judge` | a constrained AI judge | is a formula semantically equivalent, is a heading fake, is two-column reading order correct, are two-level table headers unambiguously recovered |
| `human` | a person, recorded | high-impact + low-confidence + conflicts with a mechanical signal + any 0/100 extreme |

Two hard-won rules behind this split:

1. **Machines don't get to hallucinate counts.** A naive "let one big model read the output and grade every point" over-extrapolates: it pattern-matches the dominant failure and declares "all formulas were rasterized away" while several formulas sit in the file as plain text. So *existence/counting is mechanical*; the model only rules on points that already have candidate evidence, and must cite a line for each verdict.
2. **Judged calls are constrained, not free-form.** Every semantic verdict is a per-point ruling that must cite evidence, and extreme cells (0 or full marks) are gated behind a mechanical fact-check before they stand. The verdicts are then frozen into the published ledgers, so the scorer reproduces the same numbers every run and any cell can be traced to its evidence.

The AI judge is strong at *qualitative* calls (what kind of defect, how severe, source vs converter) and weak at *exhaustive counting* (how many of 5 formulas survived). The division of labor is drawn on exactly that line.

## 8. Cross-review (evaluator is also a contestant)

Because pdfmarkdown.app is both the evaluator and one of the tools, after the first pass we ran **two independent reviewers** told explicitly to *distrust every cell, hunt for errors, and not protect "ours"*:

- **Verdict audit** — go back to the source and re-check each faithful/degraded/silent verdict, especially missed silent errors and falsely-flagged silent errors.
- **Method / consistency audit** — not individual cells, but systemic issues: is the ruler consistent across documents, do the weights distort the ranking, does any definition drift, is the ranking sensible?

Both reviewers were given all keys, ledgers, raw outputs, and scoring scripts. Everything they found was corrected — **including corrections that helped competitors and lowered our own numbers.** The full log is in CORRECTIONS.md.

## 9. Positioning and reproducibility

- This is a **case-based benchmark**: it says "on these representative documents, X beat Y," not "best for all PDFs" and not "a 3-point gap generalizes."
- To resist overfitting (we are both author and contestant), future expansions reserve a small held-out set that is not used for tuning; the current 6 files are not carved up further, to keep the public set from getting too thin. Later versions may also broaden the corpus with additional document categories (e.g. forms, slides, multi-column magazines).
- Reproducible: the source-document links and page ranges, the per-document answer keys, the per-tool ledgers, the scoring scripts, and every raw output are all published here. Source documents are third-party inputs; if local PDF copies are used for reruns, they should match the documented source/range. If the product changes and a key or rule changes, the benchmark version is bumped and the change recorded.

## Appendix: standard metrics are a dashboard, not the steering wheel

Standard metrics (TEDS for tables, CER/WER for OCR text, LaTeX-token similarity for formulas, Markdown validity) are used only as *auxiliary diagnostics* — a second opinion, a regression tripwire, a way to reduce subjectivity. They cannot answer the questions this benchmark centers on: can flattened text still be reconstructed, did a number land in the wrong column, is a fluent sentence actually a silent error, will the structure mislead an AI? So the primary score stays the two-axis / four-dimension model above, with standard metrics hanging alongside for cross-validation.
