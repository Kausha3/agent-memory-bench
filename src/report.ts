// Report: render a set of system reports as a Markdown leaderboard table.

import type { SystemReport } from "./types.js";
import { CATEGORIES } from "./types.js";

const pct = (r: number): string => `${Math.round(r * 100)}%`;

/** A Markdown table: one row per system, one column per category plus overall. */
export function leaderboard(reports: SystemReport[]): string {
  const header = ["system", ...CATEGORIES, "overall"];
  const divider = header.map(() => "---");

  // Sort best overall first so the table reads like a leaderboard.
  const sorted = [...reports].sort((a, b) => b.overall.rate - a.overall.rate);

  const rows = sorted.map((r) => {
    const cells = CATEGORIES.map((c) => {
      const cat = r.byCategory.find((x) => x.category === c)!;
      return pct(cat.rate);
    });
    return [`\`${r.system}\``, ...cells, `**${pct(r.overall.rate)}**`];
  });

  const toLine = (cells: string[]) => `| ${cells.join(" | ")} |`;
  return [toLine(header), toLine(divider), ...rows.map(toLine)].join("\n");
}
