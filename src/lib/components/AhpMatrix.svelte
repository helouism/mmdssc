<script lang="ts">
  import { problem, setAhpCell } from '../store';

  const scale = [
    1 / 9, 1 / 8, 1 / 7, 1 / 6, 1 / 5, 1 / 4, 1 / 3, 1 / 2, 1,
    2, 3, 4, 5, 6, 7, 8, 9,
  ];

  const matrix = $derived($problem.ahpMatrix ?? []);

  function set(i: number, j: number, event: Event) {
    setAhpCell(i, j, Number.parseFloat((event.currentTarget as HTMLSelectElement).value));
  }

  function label(value: number): string {
    if (!Number.isFinite(value)) return '—';
    if (Number.isInteger(value)) return String(value);
    const reciprocal = Math.round(1 / value);
    return `1/${reciprocal}`;
  }
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <div class="mb-3">
    <h2 class="text-base font-semibold">AHP criteria comparisons</h2>
    <p class="text-xs text-slate-500">
      Saaty 1–9 scale. Choose how much more important the row criterion is than the column
      criterion; the reciprocal is written automatically.
    </p>
  </div>

  <div class="overflow-x-auto">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th class="sticky left-0 z-10 bg-white py-2 pr-2 text-left text-xs uppercase tracking-wide text-slate-500">
            Criterion
          </th>
          {#each $problem.criteria as criterion, j (criterion.id)}
            <th class="py-2 pr-2 text-right text-xs uppercase tracking-wide text-slate-500">
              {criterion.name}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each $problem.criteria as rowCriterion, i (rowCriterion.id)}
          <tr class="border-t border-slate-100">
            <td class="sticky left-0 z-10 bg-white py-1.5 pr-2 text-left whitespace-nowrap">
              {rowCriterion.name}
            </td>
            {#each $problem.criteria as _, j (j)}
              <td class="py-1.5 pr-2 text-right">
                {#if i === j}
                  <span class="font-mono text-xs text-slate-400">1</span>
                {:else if i < j}
                  <select
                    class="rounded border border-slate-200 px-1.5 py-1 text-xs"
                    value={matrix[i]?.[j] ?? 1}
                    onchange={(event) => set(i, j, event)}
                    aria-label="{rowCriterion.name} vs column {j + 1}">
                    {#each scale as option (option)}
                      <option value={option}>{label(option)}</option>
                    {/each}
                  </select>
                {:else}
                  <span class="font-mono text-xs text-slate-500">
                    {label(matrix[i]?.[j] ?? 1)}
                  </span>
                {/if}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</section>
