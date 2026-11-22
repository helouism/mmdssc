<script lang="ts">
  import { onMount } from 'svelte';
  import { Chart, registerables, type ChartConfiguration } from 'chart.js';
  import type { MethodResult } from '../engines/types';

  Chart.register(...registerables);

  const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6'];

  let { results }: { results: MethodResult[] } = $props();

  let canvas: HTMLCanvasElement | undefined = $state();
  let chart: Chart | null = null;

  function configuration(value: MethodResult[]): ChartConfiguration {
    const valid = value.filter((result) => result.ranking.length > 0);
    const alternatives = valid[0]?.ranking.map((row) => row.alternative) ?? [];
    return {
      type: 'bar',
      data: {
        labels: alternatives,
        datasets: valid.map((result, index) => ({
          label: result.label,
          data: result.ranking.map((row) => row.score),
          backgroundColor: palette[index % palette.length],
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
      },
    };
  }

  onMount(() => {
    if (!canvas) return;
    chart = new Chart(canvas, configuration(results));
    return () => {
      chart?.destroy();
      chart = null;
    };
  });

  $effect(() => {
    if (!chart) return;
    chart.data = configuration(results).data;
    chart.update();
  });
</script>

<div class="relative h-72">
  <canvas bind:this={canvas} aria-label="Method comparison chart"></canvas>
</div>
