import type { DecisionProblem, MethodResult, StepTable } from './types';
import { normalizeWeights, rankAlternatives, round } from './common';

export function wp(problem: DecisionProblem): MethodResult {
  const { criteria, alternatives, matrix } = problem;
  const weights = normalizeWeights(criteria);
  const signed = weights.map((w, j) => (criteria[j].type === 'cost' ? -w : w));

  const hasInvalid = matrix.some((row) => row.some((value) => !(value > 0)));
  if (hasInvalid) {
    return {
      method: 'wp',
      label: 'WP',
      ranking: [],
      steps: [],
      error: 'WP requires every performance value to be greater than 0 (it raises them to a power).',
    };
  }

  const logs = matrix.map((row) =>
    row.reduce((sum, value, j) => sum + signed[j] * Math.log(value), 0),
  );
  // Recover S from its log to avoid overflow on large matrices.
  const sVector = logs.map((log) => Math.exp(log));
  const total = sVector.reduce((sum, value) => sum + value, 0);
  const scores = sVector.map((value) => value / total);
  const ranking = rankAlternatives(alternatives, scores);

  const steps: StepTable[] = [
    {
      title: '1. Raw decision matrix & normalized weights',
      columns: ['Alternative', ...criteria.map((c) => c.name)],
      rows: matrix.map((row, i) => [alternatives[i], ...row.map((v) => round(v, 4))]),
    },
    {
      title: '2. Weights with polarity (+ benefit / − cost)',
      columns: ['Criterion', 'Raw weight', 'Normalized |w|', 'Signed exponent', 'Attribute'],
      rows: criteria.map((c, j) => [
        c.name,
        round(c.weight, 4),
        round(weights[j], 6),
        round(signed[j], 6),
        c.type,
      ]),
    },
    {
      title: '3. Vector S (Sᵢ = Π xᵢⱼ^wⱼ)',
      columns: ['Alternative', 'Sᵢ'],
      rows: sVector.map((value, i) => [alternatives[i], round(value, 6)]),
    },
    {
      title: '4. Relative preference (Vᵢ = Sᵢ / ΣS) and ranking',
      columns: ['Alternative', 'Vᵢ', 'Rank'],
      rows: ranking.map((row) => [row.alternative, round(row.score, 6), row.rank]),
    },
  ];

  return { method: 'wp', label: 'WP', ranking, steps };
}
