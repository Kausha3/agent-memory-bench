// Core types for the benchmark.
//
// A Scenario is an ordered script of events fed to a memory system: some are facts to
// remember, some are queries with a known-correct answer. A MemorySystem is the thing
// under test — anything that can remember text and answer a question. The harness runs
// scenarios against a system and the scorer turns the transcript into per-category rates.

/** The failure modes the benchmark targets. See TAXONOMY.md for definitions. */
export type Category =
  | "retraction" // a fact is later contradicted — does the new value win?
  | "collision" // similar-but-distinct entities — are they kept apart?
  | "recall" // a fact stated early, needed late, with noise in between
  | "conflict"; // mutually exclusive facts asserted — is the contradiction resolved?

export interface RememberEvent {
  kind: "remember";
  text: string;
}

export interface QueryEvent {
  kind: "query";
  question: string;
  /** A substring the answer MUST contain to be correct. */
  expect: string;
  /** Substrings the answer must NOT contain (e.g. a stale value that should be gone). */
  reject?: string[];
}

export type Event = RememberEvent | QueryEvent;

export interface Scenario {
  id: string;
  category: Category;
  title: string;
  events: Event[];
}

/**
 * The contract a memory system implements to be benchmarked. Methods may be sync or
 * async, so an LLM-backed or embedding-backed system plugs in the same way as the
 * pure-code baselines. The harness awaits every call.
 */
export interface MemorySystem {
  readonly name: string;
  /** Clear all state — called once before each scenario so runs are independent. */
  reset(): void | Promise<void>;
  /** Ingest a statement the user wants remembered. */
  remember(text: string): void | Promise<void>;
  /** Answer a question from memory. Return "" if nothing is known. */
  query(question: string): string | Promise<string>;
}

/** The outcome of a single query within a scenario. */
export interface QueryOutcome {
  scenarioId: string;
  category: Category;
  question: string;
  expect: string;
  answer: string;
  passed: boolean;
}

export interface CategoryScore {
  category: Category;
  passed: number;
  total: number;
  rate: number; // passed / total, 0 when total is 0
}

export interface SystemReport {
  system: string;
  outcomes: QueryOutcome[];
  byCategory: CategoryScore[];
  overall: { passed: number; total: number; rate: number };
}

export const CATEGORIES: Category[] = ["retraction", "collision", "recall", "conflict"];
