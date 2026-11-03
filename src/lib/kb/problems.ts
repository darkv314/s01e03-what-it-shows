// What the reports in a ticket show, problem by problem, counted the desk's way.
// causes.ts places every report by its tenant (parser or hint). The desk's notes (desk-notes.json)
// mark the reports whose text shows a one-day move, not a swap: a third problem. As the desk does
// (CauseTable, readAs), they stay counted where they are filed and are shown as a footnote row.
import { groupByCause, readAs, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day';

export type ProblemRow = {
  problem: Problem;
  count: number;
  // For one-day: the cause the reports are counted under.
  countedUnder?: string;
  taggedAs: Record<string, number>;
  channels: Record<string, number>;
  tenants: number;
  firstSeen: string;
  lastSeen: string;
};

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

function row(problem: Problem, rs: Report[], countedUnder?: string): ProblemRow {
  const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
  return {
    problem,
    count: rs.length,
    countedUnder,
    taggedAs: tally(rs, (r) => r.meta.intakeTag),
    channels: tally(rs, (r) => r.channel),
    tenants: new Set(rs.map((r) => r.tenant)).size,
    firstSeen: days[0],
    lastSeen: days[days.length - 1],
  };
}

export function problemRows(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; rowsByProblem: ProblemRow[] } {
  const merged = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(merged);
  const groups = groupByCause(unique, tenantOf);
  const out: ProblemRow[] = [];
  for (const g of groups) {
    if (g.cause === 'unplaced') continue;
    out.push(row(g.cause, g.reports));
  }
  for (const g of groups) {
    if (!readAs(g, oneDayMove)) continue;
    out.push(row('one-day', g.reports.filter((r) => oneDayMove.includes(r.id)), String(g.cause)));
  }
  return { rows: merged.length, unique: unique.length, rowsByProblem: out };
}
