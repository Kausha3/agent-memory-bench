# agent-memory-bench

[![CI](https://github.com/Kausha3/agent-memory-bench/actions/workflows/ci.yml/badge.svg)](https://github.com/Kausha3/agent-memory-bench/actions/workflows/ci.yml)

**An open benchmark for the failure modes of agent memory systems.**

Everyone shipping an AI agent bolts on a "memory," and everyone evaluates it the same
shallow way: *did retrieval fetch a relevant chunk?* But agents don't fail in the field
because retrieval missed. They fail because the fact they retrieved was **stale**,
belonged to the **wrong entity**, was **buried under noise**, or **contradicted** another
fact the system also believed. Those are the bugs that make an agent confidently wrong.

`agent-memory-bench` scores those four failure modes directly — and it runs **offline,
with zero dependencies and no API key**, so the leaderboard is reproducible by anyone in
one command.

```bash
npm install
npm run bench        # prints the leaderboard below
npm test             # adversarial tests for the scoring core + baselines
```

## Leaderboard

Reference baselines across 13 scenarios in 4 categories. Numbers are produced by
`npm run bench` — reproduce them yourself.

| system | retraction | collision | recall | conflict | overall |
| --- | --- | --- | --- | --- | --- |
| `typed-constraint` | 100% | 100% | 75% | 100% | **92%** |
| `keyword` | 0% | 100% | 75% | 0% | **46%** |
| `recency` | 100% | 0% | 0% | 0% | **23%** |

Read this as a map of *where each strategy breaks*, not a ranking of products:

- **`keyword`** (similarity retrieval, no model of time) aces collision but scores **0% on
  retraction and conflict** — with no notion of time it happily returns the value the user
  already changed.
- **`recency`** (latest token-match wins) fixes retraction but collapses on **collision and
  recall** — it drifts to the most recent look-alike, which is usually the wrong entity.
- **`typed-constraint`** models *time* (facts retract) and *identity* (facts bind to an
  entity), so it survives three categories. It still misses the one **multi-hop** recall
  scenario — a deliberate frontier item **no baseline solves**, so the benchmark isn't
  saturated.

The headline isn't "92%." It's that retrieval-quality metrics would rate all three systems
similarly, while their *answer correctness* ranges from 23% to 92%. That gap is the point.

## The four failure modes

| Category | One-line definition |
|---|---|
| **Retraction** | A fact is updated; the new value must win and the old must not surface. |
| **Collision** | Two similar entities; answer about the one asked, don't conflate. |
| **Recall** | Fact stated early, needed late, with noise (incl. a multi-hop frontier case). |
| **Conflict** | A fact is explicitly contradicted in-text; resolve to one current value. |

Full definitions, worked examples, and *why each one is hard* are in
[TAXONOMY.md](./TAXONOMY.md).

## Add your system

A system implements one small interface (`src/types.ts`):

```ts
interface MemorySystem {
  readonly name: string;
  reset(): void | Promise<void>;        // called before each scenario
  remember(text: string): void | Promise<void>;
  query(question: string): string | Promise<string>;
}
```

Methods may be async, so an embedding store, a hosted memory product, or an LLM-backed
extractor plugs in exactly like the pure-code baselines. Drop your class into
`src/systems/`, add it to the list in `src/run.ts`, and run `npm run bench`. Use
`npm run bench -- --fails` to see every query your system missed and what it answered.

## How it works

- **Scenarios** (`src/scenarios/`) are ordered scripts of `remember` and `query` events.
  Each query declares the substring the answer must contain and the stale substrings it
  must not — so leaking an out-of-date value is scored as a failure, not a near-miss.
- **Harness** (`src/harness.ts`) resets the system, replays a scenario, and judges each
  query. Scenarios are fully isolated.
- **Scoring** (`src/score.ts`, `src/report.ts`) aggregates per-category and overall rates
  and renders the leaderboard.

The scoring core and every baseline behaviour are pinned by an adversarial test suite
(`npm test`).

## Status & roadmap

v0.1: 4 categories, 13 scenarios, 3 reference baselines, offline and reproducible.

Next: broaden each category (more scenarios, harder distractors), add **temporal** and
**preference-drift** categories, add an optional LLM-judge mode for free-form answers,
and publish a contribution guide so external memory systems can submit to the board.

Contributions of new scenarios — especially adversarial ones that break the
`typed-constraint` baseline — are the most valuable thing you can add.

## License

MIT
