import type { DecisionProblem, MethodResult, StepTable } from './types';
import {
  column,
  normalizeWeights,
  rankAlternatives,
  round,
  utilityCell,
} from './common';

export function smart(problem: DecisionProblem): MethodResult {
  const { criteria, alternatives, matrix } = problem;
  const weights = normalizeWeights(criteria);

  const utility = matrix.map((row) =>
    row.map((value, j) => utilityCell(value, column(matrix, j), criteria[j].type)),
  );

  const weighted = utility.map((row) => row.map((u, j) => weights[j] * u));
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
      title: '3. Utility matrix (uᵢⱼ, 0–1)',
      columns: ['Alternative', ...criteria.map((c) => c.name)],
      rows: utility.map((row, i) => [alternatives[i], ...row.map((v) => round(v, 6))]),
    },
    {
      title: '4. Weighted utility and final score (Uᵢ = Σ wⱼ·uᵢⱼ)',
      columns: ['Alternative', ...criteria.map((c) => `${c.name} · w`), 'Uᵢ = Σ'],
      rows: matrix.map((_, i) => [
        alternatives[i],
        ...weighted[i].map((v) => round(v, 6)),
        round(scores[i], 6),
      ]),
    },
  ];

  return { method: 'smart', label: 'SMART', ranking, steps };
}
