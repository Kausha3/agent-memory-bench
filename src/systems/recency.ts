// Baseline: recency-biased retrieval.
//
// Among the stored statements that share at least one content token with the query, it
// returns the most recent. This fixes the keyword baseline's retraction weakness (the
// newest mention wins), but introduces the opposite failure: under distraction, a recent
// but irrelevant statement that happens to share a token outranks the older relevant one.

import type { MemorySystem } from "../types.js";
import { overlap } from "../text.js";

export class RecencyMemory implements MemorySystem {
  readonly name = "recency";
  private store: string[] = [];

  reset(): void {
    this.store = [];
  }

  remember(text: string): void {
    this.store.push(text);
  }

  query(question: string): string {
    // Walk newest-first; return the first statement with any token overlap.
    for (let i = this.store.length - 1; i >= 0; i--) {
      const text = this.store[i]!;
      if (overlap(question, text) > 0) return text;
    }
    return "";
  }
}
