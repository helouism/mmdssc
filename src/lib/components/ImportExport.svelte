<script lang="ts">
  import { runAll } from '../engines';
  import type { DecisionProblem } from '../engines/types';
  import { downloadTemplate, exportWorkbook, problemFromWorkbook } from '../xlsx';
  import { loadProblem, problem } from '../store';

  let preview = $state<DecisionProblem | null>(null);
  let error = $state('');

  async function onFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    error = '';
    try {
      const buffer = await file.arrayBuffer();
      const parsed = problemFromWorkbook(buffer);
      if (parsed) {
        preview = parsed;
      } else {
        error = 'Could not read a decision problem from that file.';
      }
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      input.value = '';
    }
  }

  function confirmImport() {
    if (preview) loadProblem(preview);
    preview = null;
  }

  function doExport() {
    exportWorkbook($problem, runAll($problem));
  }
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <h2 class="mb-3 text-base font-semibold">Spreadsheet</h2>
  <div class="flex flex-wrap gap-2">
    <button
      type="button"
      class="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
      onclick={doExport}>Export .xlsx</button>
    <button
      type="button"
      class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      onclick={downloadTemplate}>Download template</button>
    <label
      class="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
      Import .xlsx / .csv
      <input type="file" accept=".xlsx,.xls,.csv" class="hidden" onchange={onFile} />
    </label>
  </div>
  {#if error}
    <p class="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
  {/if}
  <p class="mt-2 text-xs text-slate-500">
    Import expects an <span class="font-mono">Input_Data</span> sheet: a header row of criteria,
    then a Weight row, a Type row, then one row per alternative.
  </p>
</section>

{#if preview}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    role="dialog"
    aria-modal="true"
    aria-label="Import preview"
    tabindex="-1"
    onkeydown={(event) => { if (event.key === 'Escape') preview = null; }}
    onclick={(event) => { if (event.target === event.currentTarget) preview = null; }}>
    <div class="max-h-[80vh] w-full max-w-2xl overflow-auto rounded-xl bg-white p-5 shadow-xl">
      <h3 class="text-base font-semibold">Import preview</h3>
      <p class="mt-1 text-xs text-slate-500">
        {preview.criteria.length} criteria · {preview.alternatives.length} alternatives
      </p>
      <div class="mt-3 overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr>
              <th class="py-1 pr-2 text-left">Alternative</th>
              {#each preview.criteria as criterion (criterion.id)}
                <th class="py-1 pr-2 text-right">{criterion.name}</th>
              {/each}
            </tr>
          </thead>
          <tbody>
            {#each preview.alternatives as name, i (i)}
              <tr class="border-t border-slate-100">
                <td class="py-1 pr-2">{name}</td>
                {#each preview.criteria as _, j (j)}
                  <td class="py-1 pr-2 text-right font-mono">{preview.matrix[i]?.[j] ?? 0}</td>
                {/each}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="mt-4 flex justify-end gap-2">
        <button
          type="button"
          class="rounded-md border border-slate-300 px-3 py-1.5 text-xs hover:bg-slate-50"
          onclick={() => (preview = null)}>Cancel</button>
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
          onclick={confirmImport}>Use this dataset</button>
      </div>
    </div>
  </div>
{/if}
