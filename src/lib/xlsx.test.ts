import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { buildWorkbook, parseSheet, problemFromWorkbook } from './xlsx';
import { defaultProblem } from './store';

function roundTrip(problem: ReturnType<typeof defaultProblem>) {
  const workbook = buildWorkbook(problem, []);
  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return problemFromWorkbook(buffer);
}

describe('spreadsheet round trip', () => {
  it('restores criteria, weights, types and the matrix', () => {
    const problem = defaultProblem();
    const restored = roundTrip(problem);

    expect(restored).not.toBeNull();
    expect(restored!.alternatives).toEqual(problem.alternatives);
    expect(restored!.criteria.map((c) => c.name)).toEqual(
      problem.criteria.map((c) => c.name),
    );
    expect(restored!.criteria.map((c) => c.weight)).toEqual(
      problem.criteria.map((c) => c.weight),
    );
    expect(restored!.criteria.map((c) => c.type)).toEqual(
      problem.criteria.map((c) => c.type),
    );
    expect(restored!.matrix).toEqual(problem.matrix);
  });

  it('assigns fresh criterion ids so a re-import cannot collide', () => {
    const restored = roundTrip(defaultProblem());
    expect(new Set(restored!.criteria.map((c) => c.id)).size).toBe(
      restored!.criteria.length,
    );
  });
});

describe('parseSheet', () => {
  it('reads a minimal header + data layout with default weights', () => {
    const parsed = parseSheet([
      ['Alternative', 'Price', 'Speed'],
      ['A', 10, 20],
      ['B', 30, 40],
    ]);

    expect(parsed).not.toBeNull();
    expect(parsed!.alternatives).toEqual(['A', 'B']);
    expect(parsed!.criteria.map((c) => c.name)).toEqual(['Price', 'Speed']);
    expect(parsed!.criteria.map((c) => c.weight)).toEqual([1, 1]);
    expect(parsed!.criteria.map((c) => c.type)).toEqual(['benefit', 'benefit']);
    expect(parsed!.matrix).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it('honours the Weight and Type rows and ignores trailing empty columns', () => {
    const parsed = parseSheet([
      ['Alternative', 'Price', 'Speed', ''],
      ['Weight', 5, 2, ''],
      ['Type', 'cost', 'benefit', ''],
      ['A', 10, 20, ''],
      ['B', 30, 40, ''],
    ]);

    expect(parsed!.criteria.map((c) => c.weight)).toEqual([5, 2]);
    expect(parsed!.criteria.map((c) => c.type)).toEqual(['cost', 'benefit']);
    expect(parsed!.matrix).toEqual([
      [10, 20],
      [30, 40],
    ]);
  });

  it('returns null for an empty sheet', () => {
    expect(parseSheet([])).toBeNull();
    expect(parseSheet([['', '']])).toBeNull();
  });
});
