import { describe, expect, it } from 'vitest';
import { ahp } from './ahp';
import { runAll } from './index';
import { saw } from './saw';
import { smart } from './smart';
import { wp } from './wp';
import type { DecisionProblem } from './types';

const closeTo = (actual: number, expected: number, epsilon = 1e-6) => {
  expect(Math.abs(actual - expected)).toBeLessThan(epsilon);
};

const baseProblem: DecisionProblem = {
  criteria: [
    { id: 'c1', name: 'C1', weight: 0.5, type: 'benefit' },
    { id: 'c2', name: 'C2', weight: 0.3, type: 'benefit' },
    { id: 'c3', name: 'C3', weight: 0.2, type: 'cost' },
  ],
  alternatives: ['A1', 'A2', 'A3'],
  matrix: [
    [9, 20, 5],
    [20, 10, 8],
    [12, 15, 15],
  ],
};

describe('SAW', () => {
  const result = saw(baseProblem);

  it('normalises benefit and cost columns correctly', () => {
    // Benefit C1: /max(20); Benefit C2: /max(20); Cost C3: min(5)/x
    const r = result.steps[2].rows;
    expect(r[0]).toEqual(['A1', 0.45, 1, 1]);
    expect(r[1]).toEqual(['A2', 1, 0.5, 0.625]);
    expect(r[2]).toEqual(['A3', 0.6, 0.75, 0.333333]);
  });

  it('computes V = Σ w·r and ranks descending', () => {
    closeTo(result.ranking.find((row) => row.alternative === 'A1')!.score, 0.725);
    closeTo(result.ranking.find((row) => row.alternative === 'A2')!.score, 0.775);
    closeTo(result.ranking.find((row) => row.alternative === 'A3')!.score, 0.5916666667, 1e-9);
    expect(result.ranking.map((row) => row.alternative)).toEqual(['A2', 'A1', 'A3']);
  });

  it('never divides by zero on a degenerate column', () => {
    const problem: DecisionProblem = {
      criteria: [
        { id: 'c1', name: 'Zero benefit', weight: 1, type: 'benefit' },
        { id: 'c2', name: 'Cost with zero', weight: 1, type: 'cost' },
      ],
      alternatives: ['A1', 'A2'],
      matrix: [
        [0, 0],
        [0, 4],
      ],
    };
    const result = saw(problem);
    const values = result.ranking.map((row) => row.score);
    expect(values.every((value) => Number.isFinite(value))).toBe(true);
  });
});

describe('SMART', () => {
  const result = smart(baseProblem);

  it('computes utilities and final scores', () => {
    // C1 benefit: (x-9)/11 -> 0,1,0.2727; C2 benefit: (x-10)/10 -> 1,0,0.5;
    // C3 cost: (15-x)/10 -> 1,0.7,0
    closeTo(result.ranking.find((row) => row.alternative === 'A1')!.score, 0.5);
    closeTo(result.ranking.find((row) => row.alternative === 'A2')!.score, 0.64);
    closeTo(result.ranking.find((row) => row.alternative === 'A3')!.score, 0.2863636364, 1e-9);
    expect(result.ranking.map((row) => row.alternative)).toEqual(['A2', 'A1', 'A3']);
  });

  it('assigns full utility when a column is constant', () => {
    const problem: DecisionProblem = {
      criteria: [{ id: 'c1', name: 'Flat', weight: 1, type: 'benefit' }],
      alternatives: ['A1', 'A2'],
      matrix: [[7], [7]],
    };
    const result = smart(problem);
    closeTo(result.ranking[0].score, 1);
  });
});

describe('WP', () => {
  const result = wp(baseProblem);

  it('produces relative preferences that sum to 1', () => {
    const sum = result.ranking.reduce((total, row) => total + row.score, 0);
    closeTo(sum, 1, 1e-9);
  });

  it('computes Sᵢ = Π x^w and ranks by V = S/ΣS', () => {
    // Independent recomputation with signed exponents.
    const weights = [0.5, 0.3, -0.2];
    const s = baseProblem.matrix.map((row) =>
      row.reduce((product, value, j) => product * value ** weights[j], 1),
    );
    const total = s.reduce((a, b) => a + b, 0);
    const expected = s.map((value) => value / total);

    result.ranking.forEach((row) => {
      const index = baseProblem.alternatives.indexOf(row.alternative);
      closeTo(row.score, expected[index], 1e-9);
    });
  });

  it('rejects zero or negative performance values', () => {
    const problem: DecisionProblem = {
      ...baseProblem,
      matrix: [
        [10, 20, 0],
        [20, 10, 10],
        [15, 15, 15],
      ],
    };
    const result = wp(problem);
    expect(result.error).toBeTruthy();
    expect(result.ranking).toHaveLength(0);
  });
});

describe('AHP', () => {
  const problem: DecisionProblem = {
    criteria: [
      { id: 'c1', name: 'C1', weight: 1, type: 'benefit' },
      { id: 'c2', name: 'C2', weight: 1, type: 'benefit' },
      { id: 'c3', name: 'C3', weight: 1, type: 'benefit' },
    ],
    alternatives: ['A1', 'A2'],
    matrix: [
      [1, 1],
      [1, 1],
    ],
    // Classic 3x3 Saaty example.
    ahpMatrix: [
      [1, 3, 5],
      [1 / 3, 1, 3],
      [1 / 5, 1 / 3, 1],
    ],
  };

  const result = ahp(problem);

  it('recovers the textbook priority vector', () => {
    const rows = result.steps[1].rows;
    closeTo(Number(rows[0][1]), 0.637, 1e-3);
    closeTo(Number(rows[1][1]), 0.258, 1e-3);
    closeTo(Number(rows[2][1]), 0.105, 1e-3);
  });

  it('reports lambda max, CI and CR consistently', () => {
    const consistency = result.consistency!;
    closeTo(consistency.lambdaMax, 3.0385, 1e-3);
    closeTo(consistency.ci, 0.0193, 1e-3);
    closeTo(consistency.cr, 0.0332, 1e-3);
    expect(consistency.consistent).toBe(true);
  });

  it('satisfies A·w = λmax·w', () => {
    const w = result.steps[1].rows.map((row) => Number(row[1]));
    const lambda = result.consistency!.lambdaMax;
    problem.ahpMatrix!.forEach((row, i) => {
      const product = row.reduce((sum, value, j) => sum + value * w[j], 0);
      closeTo(product, lambda * w[i], 1e-3);
    });
  });
});

describe('runAll', () => {
  it('returns a result for every method', () => {
    const results = runAll(baseProblem);
    expect(results.map((result) => result.method)).toEqual(['ahp', 'saw', 'wp', 'smart']);
    expect(results.every((result) => result.ranking.length === 3)).toBe(true);
  });
});
