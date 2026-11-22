export type AttributeType = 'benefit' | 'cost';

export type MethodId = 'ahp' | 'saw' | 'wp' | 'smart';

export interface Criterion {
  id: string;
  name: string;
  /** Raw weight as entered by the user (normalised internally). */
  weight: number;
  type: AttributeType;
}

export interface DecisionProblem {
  criteria: Criterion[];
  alternatives: string[];
  /** matrix[alternativeIndex][criterionIndex] */
  matrix: number[][];
  /** AHP only: reciprocal criteria pairwise matrix (n x n, Saaty 1-9). */
  ahpMatrix?: number[][];
}

export interface RankingRow {
  alternative: string;
  score: number;
  rank: number;
}

export interface StepTable {
  title: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface Consistency {
  lambdaMax: number;
  ci: number;
  cr: number;
  ri: number;
  consistent: boolean;
}

export interface MethodResult {
  method: MethodId;
  label: string;
  ranking: RankingRow[];
  steps: StepTable[];
  consistency?: Consistency;
  error?: string;
}
