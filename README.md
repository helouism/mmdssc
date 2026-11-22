# mmdssc — Multi-Method DSS Calculator

A 100% client-side web app for Multi-Criteria Decision Making. Model a decision problem once and
rank alternatives with **AHP**, **SAW**, **WP** and **SMART**, inspecting every intermediate
matrix, then compare the methods side by side.

Built with Vite + Svelte 5 + TypeScript + Tailwind CSS. No backend: all computation, parsing and
persistence happen in the browser.

## Methods

| Method | Normalisation | Score |
| :--- | :--- | :--- |
| **SAW** | benefit `x/max`, cost `min/x` | `Vᵢ = Σ wⱼ·rᵢⱼ` |
| **WP** | weighted product with signed exponents | `Sᵢ = Π xᵢⱼ^wⱼ`, `Vᵢ = Sᵢ/ΣS` |
| **SMART** | benefit `(x−min)/(max−min)`, cost `(max−x)/(max−min)` | `Uᵢ = Σ wⱼ·uᵢⱼ` |
| **AHP** | Saaty pairwise matrix → principal eigenvector | criteria priorities applied to the normalised matrix, plus λmax / CI / CR consistency |

## Features

- Dynamic criteria and alternatives (add, rename, reorder, delete; minimum 2 each).
- Criteria weights (auto-normalised) and a benefit/cost attribute per criterion.
- Editable performance matrix with keyboard navigation and paste-from-Excel.
- AHP criteria pairwise matrix with automatic reciprocal sync and a consistency badge.
- Step-by-step audit: raw matrix, weights, normalised/utility/S matrices, weighted scores.
- Cross-method comparison table and grouped bar chart (rank reversals at a glance).
- Import/export `.xlsx` and `.csv` (multi-sheet export: `Input_Data`, `Normalized_Matrix`,
  `Calculation_Steps`, `Final_Ranking`), plus a downloadable template and an import preview.
- Auto-save to `localStorage` and a shareable URL hash (`lz-string`).

## Commands

```bash
npm install
npm run dev      # local dev server
npm run test     # vitest unit tests (engines)
npm run check    # svelte-check + tsc
npm run build    # production build into dist/
npm run preview  # preview the production build
```

## Spreadsheet format

Import reads the `Input_Data` sheet (or the first sheet):

```
Alternative   | Criterion 1 | Criterion 2
Weight        | 1           | 1
Type          | benefit     | cost
Alternative 1 | 4           | 120
Alternative 2 | 7           | 90
```

## Deployment

`.github/workflows/deploy.yml` runs the tests and build on every push to `main` and publishes
`dist/` to GitHub Pages. The site uses a relative base path so it works from a project subpath.

## Notes and limits

- Engines are pure TypeScript under `src/lib/engines/`; `mathjs` from the original PRD stack was
  dropped because the required linear algebra is small and dependency-free.
- AHP scores alternatives in **hybrid rating** mode (AHP criteria weights on the normalised
  performance matrix). Full pairwise alternative matrices per criterion are not in this version.
- SMART assigns utility 1 to every row of a constant column, so that criterion is neutral.
