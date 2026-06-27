// Baseline: keyword retrieval, time-agnostic.
//
// Stores every statement and, on a query, returns the stored statement with the most
// content-token overlap (ties broken by earliest). This is the "naive RAG" stand-in.
// Its characteristic weakness is retraction/conflict: it has no notion of time, so when
// a fact is updated it may happily return the older statement.

import type { MemorySystem } from "../types.js";
import { overlap } from "../text.js";

export class KeywordMemory implements MemorySystem {
  readonly name = "keyword";
  private store: string[] = [];

  reset(): void {
    this.store = [];
  }

  remember(text: string): void {
    this.store.push(text);
  }

  query(question: string): string {
    let best = "";
    let bestScore = 0;
    for (const text of this.store) {
      const score = overlap(question, text);
      if (score > bestScore) {
        bestScore = score;
        best = text;
      }
    }
    return best;
  }
}
