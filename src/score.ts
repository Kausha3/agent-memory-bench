// Scoring: turn a flat list of query outcomes into per-category and overall rates.

import type { CategoryScore, QueryOutcome, SystemReport } from "./types.js";
import { CATEGORIES } from "./types.js";

function rate(passed: number, total: number): number {
  return total === 0 ? 0 : passed / total;
}

export function score(system: string, outcomes: QueryOutcome[]): SystemReport {
  const byCategory: CategoryScore[] = CATEGORIES.map((category) => {
    const inCat = outcomes.filter((o) => o.category === category);
    const passed = inCat.filter((o) => o.passed).length;
    return { category, passed, total: inCat.length, rate: rate(passed, inCat.length) };
  });

  const passed = outcomes.filter((o) => o.passed).length;
  return {
    system,
    outcomes,
    byCategory,
    overall: { passed, total: outcomes.length, rate: rate(passed, outcomes.length) },
  };
}
