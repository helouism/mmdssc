import type { DecisionProblem, MethodResult, StepTable } from './types';
import {
  column,
  normalizeCell,
  normalizeWeights,
  rankAlternatives,
  round,
} from './common';

export function saw(problem: DecisionProblem): MethodResult {
  const { criteria, alternatives, matrix } = problem;
  const weights = normalizeWeights(criteria);

  const normalized = matrix.map((row) =>
    row.map((value, j) => normalizeCell(value, column(matrix, j), criteria[j].type)),
  );

  const weighted = normalized.map((row) => row.map((r, j) => weights[j] * r));
  const scores = weighted.map((row) => row.reduce((sum, value) => sum + value, 0));
  const ranking = rankAlternatives(alternatives, scores);

  const steps: StepTable[] = [
    {
      title: '1. Raw decision matrix & normalized weights',
      columns: ['Alternative', ...criteria.map((c) => c.name)],
      rows: matrix.map((row, i) => [alternatives[i], ...row.map((v) => round(v, 4))]),
    },
    {
      title: '2. Weights',
      columns: ['Criterion', 'Raw weight', 'Normalized weight', 'Attribute'],
      rows: criteria.map((c, j) => [c.name, round(c.weight, 4), round(weights[j], 6), c.type]),
    },
    {
      title: '3. Normalized matrix (R)',
      columns: ['Alternative', ...criteria.map((c) => c.name)],
      rows: normalized.map((row, i) => [alternatives[i], ...row.map((v) => round(v, 6))]),
    },
    {
      title: '4. Weighted matrix (wⱼ · rᵢⱼ) and final score',
      columns: ['Alternative', ...criteria.map((c) => `${c.name} · w`), 'Vᵢ = Σ'],
      rows: matrix.map((_, i) => [
        alternatives[i],
        ...weighted[i].map((v) => round(v, 6)),
        round(scores[i], 6),
      ]),
    },
  ];

  return { method: 'saw', label: 'SAW', ranking, steps };
}
