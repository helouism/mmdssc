<script lang="ts">
  import { METHODS, runAll, runMethod } from './lib/engines';
  import type { MethodId } from './lib/engines';
  import { normalisedProblem, resetProblem, selectedMethod } from './lib/store';
  import AhpMatrix from './lib/components/AhpMatrix.svelte';
  import ComparisonView from './lib/components/ComparisonView.svelte';
  import CriteriaPanel from './lib/components/CriteriaPanel.svelte';
  import ImportExport from './lib/components/ImportExport.svelte';
  import MatrixEditor from './lib/components/MatrixEditor.svelte';
  import MethodView from './lib/components/MethodView.svelte';

  const tabs = [...METHODS, { id: 'compare', label: 'Compare' }];

  const current = $derived($normalisedProblem);
  const results = $derived(runAll(current));
  const activeId = $derived($selectedMethod);
  const activeResult = $derived(
    activeId === 'compare' ? undefined : runMethod(activeId as MethodId, current),
  );
</script>

<div id="app" class="mx-auto max-w-6xl px-4 py-6">
  <header class="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-xl font-semibold tracking-tight">Multi-Method DSS Calculator</h1>
      <p class="text-xs text-slate-500">AHP · SAW · WP · SMART — runs entirely in your browser.</p>
    </div>
    <button
      type="button"
      class="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      onclick={resetProblem}>Reset to sample</button>
  </header>

  <nav class="mb-4 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1" aria-label="Methods">
    {#each tabs as tab (tab.id)}
      <button
        type="button"
        class="rounded-md px-3 py-1.5 text-sm font-medium transition {activeId === tab.id
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-800'}"
        aria-current={activeId === tab.id ? 'page' : undefined}
        onclick={() => selectedMethod.set(tab.id)}>{tab.label}</button>
    {/each}
  </nav>

  <div class="grid gap-4 lg:grid-cols-2">
    <CriteriaPanel />
    <MatrixEditor />
  </div>

  {#if activeId === 'ahp'}
    <div class="mt-4">
      <AhpMatrix />
    </div>
  {/if}

  <div class="mt-4">
    {#if activeResult}
      <MethodView result={activeResult} />
    {:else}
      <ComparisonView {results} />
    {/if}
  </div>

  <div class="mt-4">
    <ImportExport />
  </div>

  <footer class="mt-6 text-xs text-slate-400">
    All computation happens locally. Your dataset is stored in this browser and in the page URL —
    nothing is uploaded.
  </footer>
</div>
