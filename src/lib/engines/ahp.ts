import type { Consistency, DecisionProblem, MethodResult, StepTable } from './types';
import { column, normalizeCell, rankAlternatives, round } from './common';

/** Saaty random-consistency index by matrix order. */
const RI: Record<number, number> = {
  1: 0,
  2: 0,
  3: 0.58,
  4: 0.9,
  5: 1.12,
  6: 1.24,
  7: 1.32,
  8: 1.41,
  9: 1.45,
  10: 1.49,
};

/** Power iteration for the principal right eigenvector of a positive matrix. */
export function principalEigenvector(matrix: number[][], tolerance = 1e-12, maxIterations = 2000): number[] {
  const n = matrix.length;
  if (n === 0) return [];
  let vector = Array.from({ length: n }, () => 1 / n);

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = matrix.map((row) => row.reduce((sum, value, j) => sum + value * vector[j], 0));
    const norm = Math.sqrt(next.reduce((sum, value) => sum + value * value, 0));
    if (norm === 0) break;
    const normalised = next.map((value) => value / norm);
    const delta = normalised.reduce((sum, value, i) => sum + Math.abs(value - vector[i]), 0);
    vector = normalised;
    if (delta < tolerance) break;
  }

  // Power iteration yields the unit-norm eigenvector; AHP priorities sum to 1.
  const sum = vector.reduce((total, value) => total + value, 0);
  return sum === 0 ? vector : vector.map((value) => value / sum);
}

/** Build a perfectly consistent pairwise matrix from raw weights (fallback). */
function deriveMatrixFromWeights(weights: number[]): number[][] {
  return weights.map((wi, i) =>
    weights.map((wj, j) => (wj === 0 ? 1 : wi / wj)),
  );
}

export function ahp(problem: DecisionProblem): MethodResult {
  const { criteria, alternatives, matrix } = problem;
  const n = criteria.length;
  const pairwise = problem.ahpMatrix ?? deriveMatrixFromWeights(criteria.map((c) => c.weight));
  const priorities = principalEigenvector(pairwise);

  const products = pairwise.map((row) => row.reduce((sum, value, j) => sum + value * priorities[j], 0));
  const lambdaMax =
    products.reduce((sum, value, i) => sum + value / (priorities[i] || 1e-12), 0) / Math.max(n, 1);
  const ci = n > 1 ? (lambdaMax - n) / (n - 1) : 0;
  const ri = RI[n] ?? 1.49;
  const cr = ri === 0 ? 0 : ci / ri;
  const consistency: Consistency = {
    lambdaMax,
    ci,
    cr,
    ri,
    consistent: cr <= 0.1,
  };

  const normalized = matrix.map((row) =>
    row.map((value, j) => normalizeCell(value, column(matrix, j), criteria[j].type)),
  );
  const scores = normalized.map((row) => row.reduce((sum, r, j) => sum + priorities[j] * r, 0));
  const ranking = rankAlternatives(alternatives, scores);

  const steps: StepTable[] = [
    {
      title: '1. Criteria pairwise matrix (Saaty 1–9)',
      columns: ['Criterion', ...criteria.map((c) => c.name)],
      rows: pairwise.map((row, i) => [criteria[i].name, ...row.map((v) => round(v, 4))]),
    },
    {
      title: '2. Priority vector & consistency',
      columns: ['Criterion', 'Priority (wⱼ)'],
      rows: criteria.map((c, j) => [c.name, round(priorities[j], 6)]),
    },
    {
      title: '3. Consistency check',
      columns: ['λmax', 'CI', 'RI', 'CR', 'Status'],
      rows: [[
        round(lambdaMax, 6),
        round(ci, 6),
        ri,
        round(cr, 6),
        consistency.consistent ? 'Consistent (CR ≤ 0.10)' : 'Inconsistent (CR > 0.10)',
      ]],
    },
    {
      title: '4. Normalized performance matrix',
      columns: ['Alternative', ...criteria.map((c) => c.name)],
      rows: normalized.map((row, i) => [alternatives[i], ...row.map((v) => round(v, 6))]),
    },
    {
      title: '5. AHP-weighted score (Vᵢ = Σ wⱼ·rᵢⱼ) and ranking',
      columns: ['Alternative', 'Vᵢ', 'Rank'],
      rows: ranking.map((row) => [row.alternative, round(row.score, 6), row.rank]),
    },
  ];

  return { method: 'ahp', label: 'AHP', ranking, steps, consistency };
}
