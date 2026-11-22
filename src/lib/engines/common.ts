import type { AttributeType, Criterion, RankingRow } from './types';

/** Raw weights -> weights that sum to 1. Returns equal weights if the sum is 0. */
export function normalizeWeights(criteria: Criterion[]): number[] {
  const raw = criteria.map((c) => c.weight);
  const sum = raw.reduce((s, w) => s + w, 0);
  if (sum <= 0) {
    return raw.map(() => 1 / Math.max(raw.length, 1));
  }
  return raw.map((w) => w / sum);
}

export function column(matrix: number[][], criterionIndex: number): number[] {
  return matrix.map((row) => row[criterionIndex] ?? 0);
}

export function minOf(values: number[]): number {
  return Math.min(...values);
}

export function maxOf(values: number[]): number {
  return Math.max(...values);
}

/**
 * SAW / hybrid-AHP cell normalisation.
 * Benefit: x / max. Cost: min / x (x === 0 is treated as the best case, 1).
 * Degenerate columns resolve to 0 rather than NaN.
 */
export function normalizeCell(value: number, values: number[], type: AttributeType): number {
  const lo = minOf(values);
  const hi = maxOf(values);
  if (type === 'benefit') {
    if (hi === 0) return 0;
    return value / hi;
  }
  if (value === 0) return 1;
  return lo / value;
}

/** SMART utility. A constant column yields full utility (1) for every row. */
export function utilityCell(value: number, values: number[], type: AttributeType): number {
  const lo = minOf(values);
  const hi = maxOf(values);
  if (hi === lo) return 1;
  return type === 'benefit' ? (value - lo) / (hi - lo) : (hi - value) / (hi - lo);
}

export function rankAlternatives(
  alternatives: string[],
  scores: number[],
): RankingRow[] {
  const order = scores
    .map((score, index) => ({ alternative: alternatives[index], score, index }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  return order.map((entry, position) => ({
    alternative: entry.alternative,
    score: entry.score,
    rank: position + 1,
  }));
}

export function round(value: number, digits = 6): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function formatNumber(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return '—';
  return value.toFixed(digits);
}
