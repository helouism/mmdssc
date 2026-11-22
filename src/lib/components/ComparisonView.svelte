<script lang="ts">
  import type { MethodResult } from '../engines/types';
  import RankingChart from './RankingChart.svelte';

  let { results }: { results: MethodResult[] } = $props();

  const alternatives = $derived.by(() => {
    const withRanking = results.find((result) => result.ranking.length > 0);
    return withRanking?.ranking.map((row) => row.alternative) ?? [];
  });

  const score = (result: MethodResult, alternative: string): string => {
    const row = result.ranking.find((entry) => entry.alternative === alternative);
    return row ? row.score.toFixed(4) : '—';
  };

  const rank = (result: MethodResult, alternative: string): string => {
    const row = result.ranking.find((entry) => entry.alternative === alternative);
    return row ? String(row.rank) : '—';
  };
</script>

<section class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <h2 class="mb-3 text-base font-semibold">Cross-method comparison</h2>

  {#if alternatives.length === 0}
    <p class="text-sm text-slate-500">Fix the input errors above to compare methods.</p>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[32rem] text-sm">
        <thead>
          <tr class="text-left text-xs uppercase tracking-wide text-slate-500">
            <th class="py-2 pr-2">Alternative</th>
            {#each results as result (result.method)}
              <th class="py-2 pr-2 text-right" colspan="2">{result.label}</th>
            {/each}
          </tr>
          <tr class="text-left text-[0.6875rem] text-slate-400">
            <th class="py-1 pr-2"></th>
            {#each results as result (result.method)}
              <th class="py-1 pr-1 text-right font-normal">Score</th>
              <th class="py-1 pr-2 text-right font-normal">Rank</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each alternatives as alternative, altIndex (altIndex)}
            <tr class="border-t border-slate-100">
              <td class="py-1.5 pr-2">{alternative}</td>
              {#each results as result (result.method)}
                <td class="py-1.5 pr-1 text-right font-mono text-xs">{score(result, alternative)}</td>
                <td class="py-1.5 pr-2 text-right font-mono text-xs">{rank(result, alternative)}</td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <div class="mt-4">
      <RankingChart {results} />
    </div>
  {/if}
</section>
