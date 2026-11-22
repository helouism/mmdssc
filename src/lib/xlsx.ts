import * as XLSX from 'xlsx';
import type { AttributeType, DecisionProblem, MethodResult } from './engines/types';
import { deriveAhpMatrix, uid } from './store';

function criteriaHeader(problem: DecisionProblem): string[] {
  return ['Alternative', ...problem.criteria.map((c) => c.name)];
}

export function buildWorkbook(problem: DecisionProblem, results: MethodResult[]): XLSX.WorkBook {
  const workbook = XLSX.utils.book_new();

  const input = XLSX.utils.aoa_to_sheet([
    criteriaHeader(problem),
    ['Weight', ...problem.criteria.map((c) => c.weight)],
    ['Type', ...problem.criteria.map((c) => c.type)],
    ...problem.alternatives.map((name, i) => [name, ...problem.matrix[i]]),
  ]);
  XLSX.utils.book_append_sheet(workbook, input, 'Input_Data');

  const normalized = XLSX.utils.aoa_to_sheet([
    criteriaHeader(problem),
    ...problem.alternatives.map((name, i) => [
      name,
      ...results.find((r) => r.method === 'saw')?.steps[2]?.rows[i]?.slice(1) ??
        problem.matrix[i],
    ]),
  ]);
  XLSX.utils.book_append_sheet(workbook, normalized, 'Normalized_Matrix');

  const steps: (string | number)[][] = [['Method', 'Step', 'Rows']];
  for (const result of results) {
    for (const step of result.steps) {
      steps.push([result.label, step.title, JSON.stringify({ columns: step.columns, rows: step.rows })]);
    }
  }
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(steps), 'Calculation_Steps');

  const ranking = XLSX.utils.aoa_to_sheet([
    ['Alternative', ...results.map((r) => `${r.label} score`), ...results.map((r) => `${r.label} rank`)],
    ...problem.alternatives.map((name, i) => [
      name,
      ...results.map((r) => r.ranking.find((row) => row.alternative === name)?.score ?? ''),
      ...results.map((r) => r.ranking.find((row) => row.alternative === name)?.rank ?? ''),
    ]),
  ]);
  XLSX.utils.book_append_sheet(workbook, ranking, 'Final_Ranking');

  return workbook;
}

export function exportWorkbook(problem: DecisionProblem, results: MethodResult[]): void {
  XLSX.writeFile(buildWorkbook(problem, results), 'mmdssc.xlsx');
}

export function downloadTemplate(): void {
  const template: DecisionProblem = {
    criteria: [
      { id: uid(), name: 'Criterion 1', weight: 1, type: 'benefit' },
      { id: uid(), name: 'Criterion 2', weight: 1, type: 'cost' },
    ],
    alternatives: ['Alternative 1', 'Alternative 2'],
    matrix: [
      [1, 1],
      [1, 1],
    ],
  };
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      criteriaHeader(template),
      ['Weight', ...template.criteria.map((c) => c.weight)],
      ['Type', ...template.criteria.map((c) => c.type)],
      ...template.alternatives.map((name, i) => [name, ...template.matrix[i]]),
    ]),
    'Input_Data',
  );
  XLSX.writeFile(workbook, 'mmdssc-template.xlsx');
}

interface ParsedSheet {
  criteria: { name: string; weight: number; type: AttributeType }[];
  alternatives: string[];
  matrix: number[][];
}

/** Parse the exported layout: header row, Weight row, Type row, then data rows. */
export function parseSheet(rows: (string | number | undefined)[][]): ParsedSheet | null {
  const cleaned = rows
    .map((row) => row.map((cell) => (typeof cell === 'string' ? cell.trim() : cell)))
    .filter((row) => row.some((cell) => cell !== undefined && cell !== ''));

  if (cleaned.length < 2) return null;

  let headerIndex = cleaned.findIndex(
    (row) => String(row[0] ?? '').toLowerCase() === 'alternative',
  );
  if (headerIndex < 0) headerIndex = 0;

  const header = cleaned[headerIndex];
  const names = header.slice(1).map((cell) => String(cell ?? '').trim());
  // Trim to the last non-empty column.
  let width = names.length;
  while (width > 0 && names[width - 1] === '') width -= 1;
  const criterionNames = names.slice(0, width);

  let weightRow = cleaned[headerIndex + 1];
  let typeRow = cleaned[headerIndex + 2];
  let dataStart = headerIndex + 1;

  let weights: number[] = criterionNames.map(() => 1);
  let types: AttributeType[] = criterionNames.map(() => 'benefit');

  if (weightRow && String(weightRow[0] ?? '').toLowerCase() === 'weight') {
    weights = criterionNames.map((_, j) => Number(weightRow[j + 1]) || 0);
    dataStart += 1;
    if (typeRow && String(typeRow[0] ?? '').toLowerCase() === 'type') {
      types = criterionNames.map((_, j) => {
        const raw = String(typeRow[j + 1] ?? '').toLowerCase();
        return raw.startsWith('c') ? 'cost' : 'benefit';
      });
      dataStart += 1;
    }
  }

  const dataRows = cleaned.slice(dataStart);
  if (dataRows.length === 0) return null;

  const alternatives = dataRows.map((row) => String(row[0] ?? '').trim()).filter(Boolean);
  const matrix = dataRows.slice(0, alternatives.length).map((row) =>
    criterionNames.map((_, j) => {
      const value = Number(row[j + 1]);
      return Number.isFinite(value) ? value : 0;
    }),
  );

  return {
    criteria: criterionNames.map((name, j) => ({ name, weight: weights[j], type: types[j] })),
    alternatives,
    matrix,
  };
}

export function problemFromWorkbook(data: ArrayBuffer): DecisionProblem | null {
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName_ = workbook.SheetNames.includes('Input_Data')
    ? 'Input_Data'
    : workbook.SheetNames[0];
  if (!sheetName_) return null;
  const sheet = workbook.Sheets[sheetName_];
  const rows = XLSX.utils.sheet_to_json<(string | number | undefined)[]>(sheet, { header: 1 });
  const parsed = parseSheet(rows);
  if (!parsed) return null;

  return {
    criteria: parsed.criteria.map((c) => ({ ...c, id: uid() })),
    alternatives: parsed.alternatives,
    matrix: parsed.matrix,
    ahpMatrix: deriveAhpMatrix(parsed.criteria.map((c) => c.weight)),
  };
}
