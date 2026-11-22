import type { DecisionProblem, MethodId, MethodResult } from './types';
import { ahp } from './ahp';
import { saw } from './saw';
import { smart } from './smart';
import { wp } from './wp';

export * from './types';

export const METHODS: { id: MethodId; label: string }[] = [
  { id: 'ahp', label: 'AHP' },
  { id: 'saw', label: 'SAW' },
  { id: 'wp', label: 'WP' },
  { id: 'smart', label: 'SMART' },
];

export function runMethod(id: MethodId, problem: DecisionProblem): MethodResult {
  switch (id) {
    case 'ahp':
      return ahp(problem);
    case 'saw':
      return saw(problem);
    case 'wp':
      return wp(problem);
    case 'smart':
      return smart(problem);
  }
}

export function runAll(problem: DecisionProblem): MethodResult[] {
  return METHODS.map((method) => runMethod(method.id, problem));
}
