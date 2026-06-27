// Harness: run a memory system through every scenario and score each query.
//
// Each scenario is independent — the system is reset, then events are replayed in order.
// Remember events are ingested; query events are answered and judged. The result is a
// flat list of query outcomes, which score.ts aggregates into per-category rates.

import type { MemorySystem, QueryOutcome, Scenario } from "./types.js";
import { judge } from "./text.js";

/** Run one system across the given scenarios, returning every query outcome. */
export async function runScenarios(
  system: MemorySystem,
  scenarios: Scenario[],
): Promise<QueryOutcome[]> {
  const outcomes: QueryOutcome[] = [];

  for (const scenario of scenarios) {
    await system.reset();
    for (const event of scenario.events) {
      if (event.kind === "remember") {
        await system.remember(event.text);
      } else {
        const answer = await system.query(event.question);
        outcomes.push({
          scenarioId: scenario.id,
          category: scenario.category,
          question: event.question,
          expect: event.expect,
          answer,
          passed: judge(answer, event.expect, event.reject ?? []),
        });
      }
    }
  }

  return outcomes;
}
