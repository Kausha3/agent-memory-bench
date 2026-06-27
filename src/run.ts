// CLI entry point: run every baseline system across the full suite and print the
// leaderboard. Fully offline and deterministic — no API key, no network.
//
//   npm run bench           print the leaderboard
//   npm run bench -- --fails show every failed query (for debugging a system)

import { ALL_SCENARIOS } from "./scenarios/index.js";
import { runScenarios } from "./harness.js";
import { score } from "./score.js";
import { leaderboard } from "./report.js";
import type { MemorySystem, SystemReport } from "./types.js";
import { KeywordMemory } from "./systems/keyword.js";
import { RecencyMemory } from "./systems/recency.js";
import { TypedConstraintMemory } from "./systems/typed-constraint.js";

const SYSTEMS: MemorySystem[] = [
  new KeywordMemory(),
  new RecencyMemory(),
  new TypedConstraintMemory(),
];

async function main() {
  const showFails = process.argv.includes("--fails");
  const reports: SystemReport[] = [];

  for (const system of SYSTEMS) {
    const outcomes = await runScenarios(system, ALL_SCENARIOS);
    reports.push(score(system.name, outcomes));
  }

  console.log(`\nagent-memory-bench — ${ALL_SCENARIOS.length} scenarios\n`);
  console.log(leaderboard(reports));
  console.log("");

  if (showFails) {
    for (const r of reports) {
      const fails = r.outcomes.filter((o) => !o.passed);
      if (fails.length === 0) continue;
      console.log(`\n${r.system} — ${fails.length} failed:`);
      for (const f of fails) {
        console.log(`  [${f.scenarioId}] q="${f.question}" expected~"${f.expect}" got="${f.answer}"`);
      }
    }
    console.log("");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
