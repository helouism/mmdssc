<script lang="ts">
  import type { MethodResult } from '../engines/types';

  let { result }: { result: MethodResult } = $props();
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <h2 class="text-base font-semibold">{result.label} result</h2>
    {#if result.consistency}
      <span
        class="rounded-full px-2.5 py-1 text-xs font-medium {result.consistency.consistent
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-amber-50 text-amber-700'}">
        {result.consistency.consistent ? 'Consistent' : 'Inconsistent'}
        · CR {result.consistency.cr.toFixed(4)}
      </span>
    {/if}
  </div>

  {#if result.error}
    <p class="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{result.error}</p>
  {:else if result.ranking.length === 0}
    <p class="text-sm text-slate-500">No ranking could be produced for this input.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[24rem] text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
            <th class="py-2 pr-2">Rank</th>
            <th class="py-2 pr-2">Alternative</th>
            <th class="py-2 text-right">Score</th>
          </tr>
        </thead>
        <tbody>
          {#each result.ranking as row (row.alternative)}
            <tr class="border-t border-slate-100">
              <td class="py-1.5 pr-2">
                <span
                  class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold {row.rank === 1
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600'}">{row.rank}</span>
              </td>
              <td class="py-1.5 pr-2">{row.alternative}</td>
              <td class="py-1.5 text-right font-mono text-xs">{row.score.toFixed(6)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if result.consistency}
    <dl class="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-600 sm:grid-cols-4">
      <div class="rounded bg-slate-50 p-2"><dt class="text-slate-400">λmax</dt><dd class="font-mono">{result.consistency.lambdaMax.toFixed(4)}</dd></div>
      <div class="rounded bg-slate-50 p-2"><dt class="text-slate-400">CI</dt><dd class="font-mono">{result.consistency.ci.toFixed(4)}</dd></div>
      <div class="rounded bg-slate-50 p-2"><dt class="text-slate-400">RI</dt><dd class="font-mono">{result.consistency.ri}</dd></div>
      <div class="rounded bg-slate-50 p-2"><dt class="text-slate-400">CR</dt><dd class="font-mono">{result.consistency.cr.toFixed(4)}</dd></div>
    </dl>
  {/if}

  <div class="mt-4 space-y-2">
    {#each result.steps as step, index (step.title)}
      <details class="rounded-lg border border-slate-200 bg-slate-50/60" open={index === 0}>
        <summary class="cursor-pointer px-3 py-2 text-sm font-medium text-slate-700">
          {step.title}
        </summary>
        <div class="overflow-x-auto px-3 pb-3">
          <table class="w-full text-xs">
            <thead>
              <tr>
                {#each step.columns as column, columnIndex (columnIndex)}
                  <th class="py-1 pr-2 text-left font-medium text-slate-500">{column}</th>
                {/each}
              </tr>
            </thead>
            <tbody>
              {#each step.rows as row, rowIndex (rowIndex)}
                <tr class="border-t border-slate-200">
                  {#each row as cell, cellIndex (cellIndex)}
                    <td class="py-1 pr-2 font-mono whitespace-nowrap">{cell}</td>
                  {/each}
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      </details>
    {/each}
  </div>
</section>
