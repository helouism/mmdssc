<script lang="ts">
  import { addAlternative, problem, removeAlternative, setCell, updateAlternative } from '../store';

  function setCellAt(alternativeIndex: number, criterionIndex: number, event: Event) {
    const value = Number.parseFloat((event.currentTarget as HTMLInputElement).value);
    setCell(alternativeIndex, criterionIndex, Number.isFinite(value) ? value : 0);
  }

  function setName(index: number, event: Event) {
    updateAlternative(index, (event.currentTarget as HTMLInputElement).value);
  }
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-3 flex items-center justify-between">
    <h2 class="text-base font-semibold">Performance matrix</h2>
    <button
      type="button"
      class="rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
      onclick={addAlternative}>Add alternative</button>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="sticky left-0 z-10 bg-white py-2 pr-2 text-left text-xs uppercase tracking-wide text-slate-500">
            Alternative
          </th>
          {#each $problem.criteria as criterion (criterion.id)}
            <th class="py-2 pr-2 text-right text-xs uppercase tracking-wide text-slate-500">
              {criterion.name}
              <span class="block text-[0.625rem] font-normal text-slate-400">
                {criterion.type}
              </span>
            </th>
          {/each}
          <th class="py-2 text-right text-xs uppercase tracking-wide text-slate-500">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each $problem.alternatives as name, i (i)}
          <tr class="border-t border-slate-100">
            <td class="sticky left-0 z-10 bg-white py-1.5 pr-2">
              <input
                class="w-32 rounded border border-slate-200 px-2 py-1"
                value={name}
                oninput={(event) => setName(i, event)}
                aria-label="Alternative name"
              />
            </td>
            {#each $problem.criteria as _, j (j)}
              <td class="py-1.5 pr-2">
                <input
                  class="matrix-input"
                  type="number"
                  step="any"
                  value={$problem.matrix[i]?.[j] ?? 0}
                  oninput={(event) => setCellAt(i, j, event)}
                  aria-label="Value for {name}"
                />
              </td>
            {/each}
            <td class="py-1.5 text-right">
              <button
                type="button"
                class="rounded px-2 py-1 text-xs text-rose-600 hover:bg-rose-50 disabled:opacity-30"
                disabled={$problem.alternatives.length <= 2}
                onclick={() => removeAlternative(i)}>Remove</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p class="mt-2 text-xs text-slate-500">
    Rows are alternatives, columns are criteria. WP requires every value to be &gt; 0.
  </p>
</section>
