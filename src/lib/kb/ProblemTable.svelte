<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';
  import { groupByProblem, type Problem } from '#lib/kb/problems';

  // tickets: where each problem is filed now, problem → URL.
  let { ticket, tickets, labels }: { ticket: number; tickets: Partial<Record<Problem, string>>; labels: Record<Problem, string> } =
    $props();

  const view = $derived(groupByProblem(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const list = (n: Record<string, number>) =>
    Object.entries(n)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `${k} ×${v}`)
      .join(' · ');
  const num = (url: string) => '#' + url.split('/').pop();
</script>

<p class="sum">
  <strong>{view.unique}</strong> reports merged into #{ticket}
  ({view.rows} rows in the export; {view.rows - view.unique} are the same report twice) ·
  <strong>{view.groups.length}</strong> problems{#if view.unplaced.length} · {view.unplaced.length} unplaced{/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>ticket</th><th>channels</th><th>intake tagged</th><th>tenants</th><th>seen</th></tr>
  </thead>
  <tbody>
    {#each view.groups as g (g.problem)}
      <tr>
        <td>{labels[g.problem]}</td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{#if tickets[g.problem]}<a href={tickets[g.problem]}>{num(tickets[g.problem]!)}</a>{:else}<span class="none">none</span>{/if}</td>
        <td class="small">{list(g.channels)}</td>
        <td class="small">{list(g.taggedAs)}</td>
        <td>{g.tenants.length}</td>
        <td class="small">{g.firstSeen} → {g.lastSeen}</td>
      </tr>
    {/each}
  </tbody>
</table>

<style>
  .sum { font-size: 1.05rem; }
  .small { color: var(--muted); font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
