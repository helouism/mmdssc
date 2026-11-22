import { derived, writable } from 'svelte/store';
import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from 'lz-string';
import type { AttributeType, Criterion, DecisionProblem } from './engines/types';

const STORAGE_KEY = 'mmdssc.problem.v1';
const HASH_KEY = 'p';

export const uid = (): string =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function makeCriterion(name: string, weight: number, type: AttributeType): Criterion {
  return { id: uid(), name, weight, type };
}

export function defaultProblem(): DecisionProblem {
  const criteria = [
    makeCriterion('Quality', 0.5, 'benefit'),
    makeCriterion('Cost', 0.3, 'cost'),
    makeCriterion('Support', 0.2, 'benefit'),
  ];
  return {
    criteria,
    alternatives: ['Vendor A', 'Vendor B', 'Vendor C'],
    matrix: [
      [8, 5000, 7],
      [7, 4000, 9],
      [9, 6000, 6],
    ],
    ahpMatrix: deriveAhpMatrix([0.5, 0.3, 0.2]),
  };
}

/** Consistent pairwise matrix implied by a weight vector (a_ij = w_i / w_j). */
export function deriveAhpMatrix(weights: number[]): number[][] {
  return weights.map((wi, i) => weights.map((wj, j) => (wj === 0 ? 1 : wi / wj)));
}

function syncAhpMatrix(problem: DecisionProblem): number[][] {
  const weights = problem.criteria.map((c) => c.weight);
  const n = weights.length;
  const previous = problem.ahpMatrix ?? [];
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => {
      if (i === j) return 1;
      const value = previous[i]?.[j];
      return typeof value === 'number' && Number.isFinite(value) && value > 0
        ? value
        : deriveAhpMatrix(weights)[i][j];
    }),
  );
}

function normaliseShape(problem: DecisionProblem): DecisionProblem {
  const n = problem.criteria.length;
  const m = problem.alternatives.length;
  const matrix = Array.from({ length: m }, (_, i) =>
    Array.from({ length: n }, (_, j) => problem.matrix[i]?.[j] ?? 0),
  );
  return { ...problem, matrix, ahpMatrix: syncAhpMatrix(problem) };
}

function loadInitial(): DecisionProblem {
  if (typeof window === 'undefined') return defaultProblem();

  const hash = new URLSearchParams(window.location.hash.replace(/^\?/, '').length ? window.location.hash.slice(1) : '');
  const fromHash = hash.get(HASH_KEY);
  if (fromHash) {
    try {
      const parsed = JSON.parse(decompressFromEncodedURIComponent(fromHash) ?? '');
      if (parsed && Array.isArray(parsed.criteria) && Array.isArray(parsed.matrix)) {
        return normaliseShape(parsed as DecisionProblem);
      }
    } catch {
      // Fall through to localStorage.
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DecisionProblem;
      if (parsed && Array.isArray(parsed.criteria) && Array.isArray(parsed.matrix)) {
        return normaliseShape(parsed);
      }
    }
  } catch {
    // Ignore malformed storage.
  }

  return defaultProblem();
}

export const problem = writable<DecisionProblem>(loadInitial());
export const selectedMethod = writable<string>('saw');

export const normalisedProblem = derived(problem, ($problem) => normaliseShape($problem));

function persist(value: DecisionProblem): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    const compressed = compressToEncodedURIComponent(JSON.stringify(value));
    const url = new URL(window.location.href);
    url.hash = `${HASH_KEY}=${compressed}`;
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Storage or URL quota failures must not break editing.
  }
}

problem.subscribe((value) => persist(value));

function update(mutator: (draft: DecisionProblem) => DecisionProblem): void {
  problem.update((current) => normaliseShape(mutator(current)));
}

export function addCriterion(): void {
  update((draft) => ({
    ...draft,
    criteria: [...draft.criteria, makeCriterion(`C${draft.criteria.length + 1}`, 1, 'benefit')],
  }));
}

export function updateCriterion(id: string, patch: Partial<Omit<Criterion, 'id'>>): void {
  update((draft) => ({
    ...draft,
    criteria: draft.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)),
  }));
}

export function removeCriterion(id: string): void {
  update((draft) => {
    const index = draft.criteria.findIndex((c) => c.id === id);
    if (index < 0) return draft;
    return {
      ...draft,
      criteria: draft.criteria.filter((c) => c.id !== id),
      matrix: draft.matrix.map((row) => row.filter((_, j) => j !== index)),
      ahpMatrix: draft.ahpMatrix
        ?.filter((_, i) => i !== index)
        .map((row) => row.filter((_, j) => j !== index)),
    };
  });
}

export function moveCriterion(id: string, direction: -1 | 1): void {
  update((draft) => {
    const index = draft.criteria.findIndex((c) => c.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.criteria.length) return draft;

    const criteria = [...draft.criteria];
    [criteria[index], criteria[target]] = [criteria[target], criteria[index]];

    const matrix = draft.matrix.map((row) => {
      const next = [...row];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

    const ahpMatrix = draft.ahpMatrix?.map((row) => {
      const next = [...row];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    }).map((row, i) => {
      if (i === index || i === target) {
        const col = [...row];
        [col[index], col[target]] = [col[target], col[index]];
        return col;
      }
      return row;
    });

    return { ...draft, criteria, matrix, ahpMatrix };
  });
}

export function addAlternative(): void {
  update((draft) => ({
    ...draft,
    alternatives: [...draft.alternatives, `A${draft.alternatives.length + 1}`],
    matrix: [...draft.matrix, Array.from({ length: draft.criteria.length }, () => 0)],
  }));
}

export function updateAlternative(index: number, name: string): void {
  update((draft) => ({
    ...draft,
    alternatives: draft.alternatives.map((a, i) => (i === index ? name : a)),
  }));
}

export function removeAlternative(index: number): void {
  update((draft) => ({
    ...draft,
    alternatives: draft.alternatives.filter((_, i) => i !== index),
    matrix: draft.matrix.filter((_, i) => i !== index),
  }));
}

export function setCell(alternativeIndex: number, criterionIndex: number, value: number): void {
  update((draft) => ({
    ...draft,
    matrix: draft.matrix.map((row, i) =>
      i === alternativeIndex ? row.map((cell, j) => (j === criterionIndex ? value : cell)) : row,
    ),
  }));
}

export function setAhpCell(i: number, j: number, value: number): void {
  update((draft) => {
    const n = draft.criteria.length;
    const matrix = draft.ahpMatrix ?? deriveAhpMatrix(draft.criteria.map((c) => c.weight));
    const next = matrix.map((row) => [...row]);
    if (i === j) {
      next[i][j] = 1;
      return { ...draft, ahpMatrix: next };
    }
    next[i][j] = value;
    next[j][i] = value === 0 ? 0 : 1 / value;
    return { ...draft, ahpMatrix: next.slice(0, n).map((row) => row.slice(0, n)) };
  });
}

export function loadProblem(value: DecisionProblem): void {
  problem.set(normaliseShape(value));
}

export function resetProblem(): void {
  problem.set(defaultProblem());
}
