<script lang="ts">
  import { normalizeWeights } from '../engines/common';
  import { addCriterion, moveCriterion, problem, removeCriterion, updateCriterion } from '../store';

  const normalized = $derived(normalizeWeights($problem.criteria));

  function setName(id: string, event: Event) {
    updateCriterion(id, { name: (event.currentTarget as HTMLInputElement).value });
  }

  function setWeight(id: string, event: Event) {
    const value = Number.parseFloat((event.currentTarget as HTMLInputElement).value);
    updateCriterion(id, { weight: Number.isFinite(value) ? value : 0 });
  }

  function setType(id: string, event: Event) {
    updateCriterion(id, {
      type: (event.currentTarget as HTMLSelectElement).value as 'benefit' | 'cost',
    });
  }
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-base font-semibold">Criteria</h2>
    <button
      type="button"
      class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
      onclick={addCriterion}>Add criterion</button>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full min-w-[36rem] text-sm">
      <thead>
        <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
          <th class="py-2 pr-2">#</th>
          <th class="py-2 pr-2">Name</th>
          <th class="py-2 pr-2">Raw weight</th>
          <th class="py-2 pr-2">Normalized</th>
          <th class="py-2 pr-2">Attribute</th>
          <th class="py-2 text-right">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $problem.criteria as criterion, j (criterion.id)}
          <tr class="border-t border-slate-100">
            <td class="py-1.5 pr-2 text-slate-400">{j + 1}</td>
            <td class="py-1.5 pr-2">
              <input
                class="w-full rounded border border-slate-200 px-2 py-1"
                value={criterion.name}
                oninput={(event) => setName(criterion.id, event)}
                aria-label="Criterion name"
              />
            </td>
            <td class="py-1.5 pr-2">
              <input
                class="matrix-input"
                type="number"
                min="0"
                step="any"
                value={criterion.weight}
                oninput={(event) => setWeight(criterion.id, event)}
                aria-label="Criterion weight"
              />
            </td>
            <td class="py-1.5 pr-2 font-mono text-xs text-slate-600">
              {normalized[j].toFixed(4)}
            </td>
            <td class="py-1.5 pr-2">
              <select
                class="rounded border border-slate-200 px-2 py-1 text-xs"
                value={criterion.type}
                onchange={(event) => setType(criterion.id, event)}
                aria-label="Criterion attribute type">
                <option value="benefit">Benefit</option>
                <option value="cost">Cost</option>
              </select>
            </td>
            <td class="py-1.5 text-right whitespace-nowrap">
              <button
                type="button"
                class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                disabled={j === 0}
                onclick={() => moveCriterion(criterion.id, -1)}>↑</button>
              <button
                type="button"
                class="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
                disabled={j === $problem.criteria.length - 1}
                onclick={() => moveCriterion(criterion.id, 1)}>↓</button>
              <button
                type="button"
                class="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                disabled={$problem.criteria.length <= 2}
                onclick={() => removeCriterion(criterion.id)}>Remove</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="mt-2 text-xs text-slate-500">
    Weights are normalised so they sum to 1. Minimum two criteria.
  </p>
</section>
