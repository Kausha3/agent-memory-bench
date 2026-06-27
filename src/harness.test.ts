// Adversarial tests for the scoring core and the baseline behaviours that define the
// leaderboard. These run offline and pin down the claims the README makes: judging is
// strict on stale values, scenarios are isolated, results are deterministic, and each
// baseline fails exactly where its design says it should.

import { test } from "node:test";
import assert from "node:assert/strict";

import { judge } from "./text.js";
import { score } from "./score.js";
import { runScenarios } from "./harness.js";
import { leaderboard } from "./report.js";
import type { MemorySystem, QueryOutcome, Scenario } from "./types.js";
import { KeywordMemory } from "./systems/keyword.js";
import { RecencyMemory } from "./systems/recency.js";
import { TypedConstraintMemory } from "./systems/typed-constraint.js";

// --- judging --------------------------------------------------------------------

test("judge requires the expected substring, case-insensitively", () => {
  assert.equal(judge("She works at Acme.", "acme"), true);
  assert.equal(judge("She works at Stripe.", "Acme"), false);
});

test("judge rejects an answer that leaks a stale value, even if the right one is present", () => {
  // The whole point of the `reject` list: surfacing the old value is a failure.
  assert.equal(judge("left Stripe, now at Acme", "Acme", ["Stripe"]), false);
  assert.equal(judge("now at Acme", "Acme", ["Stripe"]), true);
});

// --- scoring --------------------------------------------------------------------

test("score aggregates per-category and overall, with empty categories at 0", () => {
  const outcomes: QueryOutcome[] = [
    { scenarioId: "a", category: "retraction", question: "", expect: "", answer: "", passed: true },
    { scenarioId: "b", category: "retraction", question: "", expect: "", answer: "", passed: false },
    { scenarioId: "c", category: "collision", question: "", expect: "", answer: "", passed: true },
  ];
  const report = score("x", outcomes);

  const retraction = report.byCategory.find((c) => c.category === "retraction")!;
  assert.deepEqual([retraction.passed, retraction.total, retraction.rate], [1, 2, 0.5]);

  const conflict = report.byCategory.find((c) => c.category === "conflict")!;
  assert.deepEqual([conflict.passed, conflict.total, conflict.rate], [0, 0, 0]); // no divide-by-zero

  assert.deepEqual([report.overall.passed, report.overall.total], [2, 3]);
});

// --- harness isolation & determinism --------------------------------------------

class CountingMemory implements MemorySystem {
  readonly name = "counting";
  resets = 0;
  private seen: string[] = [];
  reset(): void {
    this.resets++;
    this.seen = [];
  }
  remember(text: string): void {
    this.seen.push(text);
  }
  query(): string {
    return this.seen.join("|");
  }
}

test("the harness resets the system between scenarios so state cannot leak", async () => {
  const scenarios: Scenario[] = [
    {
      id: "s1",
      category: "retraction",
      title: "",
      events: [
        { kind: "remember", text: "alpha" },
        { kind: "query", question: "?", expect: "alpha" },
      ],
    },
    {
      id: "s2",
      category: "retraction",
      title: "",
      events: [{ kind: "query", question: "?", expect: "", reject: ["alpha"] }],
    },
  ];

  const sys = new CountingMemory();
  const outcomes = await runScenarios(sys, scenarios);

  assert.equal(sys.resets, 2, "reset once per scenario");
  assert.equal(outcomes[0]!.passed, true, "scenario 1 sees its own fact");
  assert.equal(outcomes[1]!.answer, "", "scenario 2 must not see scenario 1's 'alpha'");
  assert.equal(outcomes[1]!.passed, true);
});

test("running the same system twice is deterministic", async () => {
  const scenarios: Scenario[] = [
    {
      id: "s",
      category: "retraction",
      title: "",
      events: [
        { kind: "remember", text: "Priya works at Stripe." },
        { kind: "remember", text: "Priya now works at Acme." },
        { kind: "query", question: "Where does Priya work?", expect: "Acme", reject: ["Stripe"] },
      ],
    },
  ];
  const a = await runScenarios(new TypedConstraintMemory(), scenarios);
  const b = await runScenarios(new TypedConstraintMemory(), scenarios);
  assert.deepEqual(a, b);
});

// --- baseline behaviours that the leaderboard depends on ------------------------

const retraction: Scenario = {
  id: "r",
  category: "retraction",
  title: "",
  events: [
    { kind: "remember", text: "Priya works at Stripe." },
    { kind: "remember", text: "Priya now works at Acme." },
    { kind: "query", question: "Where does Priya work?", expect: "Acme", reject: ["Stripe"] },
  ],
};

const collision: Scenario = {
  id: "c",
  category: "collision",
  title: "",
  events: [
    { kind: "remember", text: "Priya Patel works at Google." },
    { kind: "remember", text: "Priya Sharma works at Stripe." },
    { kind: "query", question: "Where does Priya Patel work?", expect: "Google", reject: ["Stripe"] },
  ],
};

const conflict: Scenario = {
  id: "x",
  category: "conflict",
  title: "",
  events: [
    { kind: "remember", text: "Omar works at Datadog." },
    { kind: "remember", text: "Actually, Omar does not work at Datadog — he works at Snowflake." },
    { kind: "query", question: "Where does Omar work?", expect: "Snowflake", reject: ["Datadog"] },
  ],
};

async function passes(system: MemorySystem, scenario: Scenario): Promise<boolean> {
  const outcomes = await runScenarios(system, [scenario]);
  return outcomes[0]!.passed;
}

test("keyword baseline fails retraction (no notion of time) but handles collision", async () => {
  assert.equal(await passes(new KeywordMemory(), retraction), false);
  assert.equal(await passes(new KeywordMemory(), collision), true);
});

test("recency baseline handles retraction but fails collision (recency bias)", async () => {
  assert.equal(await passes(new RecencyMemory(), retraction), true);
  assert.equal(await passes(new RecencyMemory(), collision), false);
});

test("typed-constraint baseline resolves retraction, collision, and conflict", async () => {
  assert.equal(await passes(new TypedConstraintMemory(), retraction), true);
  assert.equal(await passes(new TypedConstraintMemory(), collision), true);
  assert.equal(await passes(new TypedConstraintMemory(), conflict), true);
});

test("keyword and recency both leak the stale value on conflict", async () => {
  assert.equal(await passes(new KeywordMemory(), conflict), false);
  assert.equal(await passes(new RecencyMemory(), conflict), false);
});

// --- report rendering -----------------------------------------------------------

test("leaderboard renders systems sorted by overall, best first", () => {
  const lo = score("lo", [
    { scenarioId: "a", category: "retraction", question: "", expect: "", answer: "", passed: false },
  ]);
  const hi = score("hi", [
    { scenarioId: "a", category: "retraction", question: "", expect: "", answer: "", passed: true },
  ]);
  const table = leaderboard([lo, hi]);
  const lines = table.split("\n");
  // Row order: header, divider, then best-first.
  assert.match(lines[2]!, /`hi`/);
  assert.match(lines[3]!, /`lo`/);
  assert.match(lines[2]!, /100%/);
});
