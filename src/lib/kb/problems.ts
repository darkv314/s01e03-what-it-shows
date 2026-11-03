// What the reports in a ticket show, problem by problem. causes.ts places a report by its tenant;
// the desk's notes (desk-notes.json) mark the reports whose text shows a one-day move, not a swap.
// Those are a third problem: a date that moves by one day is not the parser and not the hint.
import { causeOf, uniqueById, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'one-day';

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  taggedAs: Record<string, number>;
  channels: Record<string, number>;
  tenants: string[];
  firstSeen: string;
  lastSeen: string;
};

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem | null {
  if (oneDayMove.includes(r.id)) return 'one-day';
  return causeOf(r, t);
}

const tally = (rs: Report[], key: (r: Report) => string) =>
  rs.reduce<Record<string, number>>((n, r) => ({ ...n, [key(r)]: (n[key(r)] ?? 0) + 1 }), {});

export function groupByProblem(
  all: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): { rows: number; unique: number; unplaced: Report[]; groups: ProblemGroup[] } {
  const merged = all.filter((r) => r.mergedInto === ticket);
  const unique = uniqueById(merged);
  const by = new Map<Problem, Report[]>();
  const unplaced: Report[] = [];
  for (const r of unique) {
    const p = problemOf(r, tenantOf(r), oneDayMove);
    if (p === null) unplaced.push(r);
    else by.set(p, [...(by.get(p) ?? []), r]);
  }
  const groups = [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        taggedAs: tally(rs, (r) => r.meta.intakeTag),
        channels: tally(rs, (r) => r.channel),
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
  return { rows: merged.length, unique: unique.length, unplaced, groups };
}
