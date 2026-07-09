# Source Documents

Five documents were chosen to stress different hard parts of PDF -> Markdown conversion, plus one encrypted copy used only as a capability probe. The benchmark records source links and page ranges instead of relying on redistributed third-party PDFs.

Third-party PDFs are not covered by the repository's MIT license. If local copies are present under `documents/`, treat them as local benchmark inputs only and do not redistribute them without checking the source terms.

| File | Source / provenance | Pages used | What it stresses |
|---|---|---:|---|
| `attention.pdf` | *Attention Is All You Need*, Vaswani et al., 2017. Source page: <https://arxiv.org/abs/1706.03762v7>; PDF: <https://arxiv.org/pdf/1706.03762v7>. | All 15 pages | formulas, figures, footnotes, and four tables in one paper |
| `toyota-securities.pdf` | Toyota Motor Corporation 2024 Annual Securities Report (Yukashoken Hokokusho). Archive page: <https://global.toyota/jp/ir/library/securities-report/archives/03.html>; PDF: <https://global.toyota/pages/global_toyota/ir/library/securities-report/archives/archives_2024_03.pdf>. | First 8 PDF pages | CJK text plus dense financial tables with Japanese triangle-negative and bracket conventions |
| `scotus-amicus-brief.pdf` | Amicus curiae brief, U.S. Supreme Court docket No. 21-659. Docket: <https://www.supremecourt.gov/docket/docketfiles/html/public/21-659.html>; PDF: <https://www.supremecourt.gov/DocketPDF/21/21-659/204464/20211208125051265_OPC%20%20Amicus%20Brief%20PRINT%20II.pdf>. | All 20 pages | pure legal prose: 11 numbered footnotes, a dot-leader table of authorities, two-column signature blocks |
| `landuse-plan-tables.pdf` | Sonoma County General Plan 2020, Land Use Element. PDF: <https://permitsonoma.org/Microsites/Permit%20Sonoma/Documents/Long%20Range%20Plans/General-Plan-Land-Use-Element.pdf>. | Pages LU-13 to LU-16 | five dense data tables with hierarchical headers, subtotals, and negative numbers |
| `landuse-plan-tables-encrypted.pdf` | Password-protected derivative of the land-use excerpt above. | Same as `landuse-plan-tables.pdf` | capability probe: can a tool open an encrypted PDF at all? **Not part of the quality scoring.** |
| `clean-water-1973-scan.pdf` | *Clean water .... a new day for Southeast Michigan*, Detroit (Mich.) Metro Water Department, 1973. Internet Archive item: <https://archive.org/details/CleanWaterANewDayForSoutheastMichigan> (identifier: `CleanWaterANewDayForSoutheastMichigan`). | 2 pages: cover + inside cover | OCR: a script-font title over a photograph, a two-column roster of officials, a full-bleed cover image |

If a source URL changes, keep the original citation in the table and add a note with the replacement source rather than silently changing the benchmark input.
