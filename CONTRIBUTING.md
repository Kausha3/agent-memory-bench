# Contributing

Two kinds of contributions are especially valuable:

1. **New adversarial scenarios** — particularly ones that break the strongest baseline
   (`typed-constraint`). The benchmark is only as good as the cases in it.
2. **New memory systems** — wire up a real memory product, an embedding store, or an
   LLM-backed extractor and put it on the board.

Everything runs offline with no API key. `npm install`, then `npm test` and
`npm run bench` should pass before you open a PR.

## Add a scenario

Scenarios live in `src/scenarios/<category>.ts`. Each is an ordered script of `remember`
and `query` events. A query declares the substring the answer **must** contain and the
stale substrings it **must not**:

```ts
{
  id: "retraction/job-change",
  category: "retraction",
  title: "Person changes employer",
  events: [
    remember("Priya Sharma works at Stripe."),
    remember("Priya Sharma now works at Acme."),
    query("Where does Priya Sharma work?", "Acme", ["Stripe"]),
  ],
}
```

Guidelines:

- **Pick the category by the failure it targets** (see [TAXONOMY.md](./TAXONOMY.md)), not
  by surface topic.
- **Use `reject` for stale values.** Surfacing an out-of-date value is a failure, not a
  near-miss — encode that.
- **Frontier scenarios are welcome.** A case no baseline solves (e.g. multi-hop) is a
  feature: it keeps the benchmark from saturating. Mark it clearly in the `title`.
- Keep the answer judgeable by substring. If a scenario genuinely needs free-form
  grading, open an issue — an optional LLM-judge mode is on the roadmap.

Run `npm run bench -- --fails` to see exactly what each system answered for your case.

## Add a memory system

Implement the interface in `src/types.ts`:

```ts
interface MemorySystem {
  readonly name: string;
  reset(): void | Promise<void>;        // called before each scenario
  remember(text: string): void | Promise<void>;
  query(question: string): string | Promise<string>;
}
```

Methods may be async, so a network- or model-backed system plugs in the same way as the
pure-code baselines. Put your class in `src/systems/`, register it in the `SYSTEMS` array
in `src/run.ts`, and run `npm run bench`.

If your system needs credentials or network, keep that **out** of the default `npm run
bench` path (guard it behind an env var) so the core benchmark stays offline and
reproducible for everyone.

## Ground rules

- New baselines should be **honest reference points**, not tuned to the current scenario
  text. If a system only passes because it memorized the fixtures, that's a bug.
- Keep the core dependency-free. Optional systems may add dependencies behind a guard.
- Tests and typecheck must pass: `npm test && npm run typecheck`.
