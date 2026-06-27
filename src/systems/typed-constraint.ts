// Baseline: typed-constraint memory.
//
// Instead of storing statements as opaque text, this system does light rule-based
// extraction into typed (subject, predicate, value) constraints, and applies
// *retraction* — when a new value arrives for a single-valued predicate, the old value
// is closed rather than left to compete. Queries that name a (subject, predicate) are
// answered from the current constraint; anything unrecognized falls back to keyword
// search over the raw statements, which it also retains.
//
// This is a reference heuristic, not a production memory system — the extraction
// patterns are deliberately small. The point is to show that modeling *time* and
// *identity* explicitly changes which failure modes a system survives. A real
// implementation would do extraction with a model; the harness treats it identically.

import type { MemorySystem } from "../types.js";
import { overlap } from "../text.js";

type Predicate = "works_at" | "lives_in" | "role_is" | "hq_in";

interface Constraint {
  subject: string; // lowercased for matching
  predicate: Predicate;
  value: string;
  retracted: boolean;
}

/** Leading run of Capitalized words — our crude "subject" (a person or org name). */
function leadingSubject(text: string): string | null {
  // Strip a leading discourse marker so "Actually, Omar ..." resolves to "Omar".
  const cleaned = text.replace(/^(actually|correction|note|update|fyi|reminder)[,:]?\s+/i, "");
  const m = cleaned.match(/^([A-Z][\w.]*(?:\s+[A-Z][\w.]*)*)/);
  return m ? m[1]!.trim() : null;
}

function cleanValue(raw: string): string {
  return raw
    .split(/\s+and\s+/)[0]! // "acme and ..." -> "acme"
    .replace(/[.,;:!?]+$/, "")
    .trim();
}

export class TypedConstraintMemory implements MemorySystem {
  readonly name = "typed-constraint";
  private constraints: Constraint[] = [];
  private episodes: string[] = []; // raw text retained for fallback recall

  reset(): void {
    this.constraints = [];
    this.episodes = [];
  }

  remember(text: string): void {
    this.episodes.push(text);
    const subject = leadingSubject(text);
    if (!subject) return;
    const lc = text.toLowerCase();

    const worksAt = lc.match(/(?:works at|joined) ([a-z0-9 .&-]+)/);
    const movedTo = lc.match(/(?:moved to|lives in|based in) ([a-z0-9 .&-]+)/);
    const roleIs = lc.match(/\bis (?:now )?(?:a|an) ([a-z0-9 .&-]+)/);
    const hqIn = lc.match(/headquartered in ([a-z0-9 .&-]+)/);

    if (worksAt) this.assign(subject, "works_at", cleanValue(worksAt[1]!));
    else if (/\b(left|no longer)\b/.test(lc) && /\bat\b|\bworks\b/.test(lc)) this.retract(subject, "works_at");

    if (movedTo) this.assign(subject, "lives_in", cleanValue(movedTo[1]!));
    if (roleIs) this.assign(subject, "role_is", cleanValue(roleIs[1]!));
    if (hqIn) this.assign(subject, "hq_in", cleanValue(hqIn[1]!));
  }

  query(question: string): string {
    const intent = this.parseIntent(question);
    if (intent) {
      const value = this.current(intent.subject, intent.predicate);
      if (value) return value;
    }
    // Unrecognized question, or no constraint yet — fall back to keyword over raw text.
    return this.keywordFallback(question);
  }

  // --- constraint bookkeeping -------------------------------------------------

  private assign(subject: string, predicate: Predicate, value: string): void {
    const s = subject.toLowerCase();
    for (const c of this.constraints) {
      if (c.subject === s && c.predicate === predicate && !c.retracted && c.value !== value) {
        c.retracted = true; // close the prior value rather than overwrite it
      }
    }
    this.constraints.push({ subject: s, predicate, value, retracted: false });
  }

  private retract(subject: string, predicate: Predicate): void {
    const s = subject.toLowerCase();
    for (const c of this.constraints) {
      if (c.subject === s && c.predicate === predicate && !c.retracted) c.retracted = true;
    }
  }

  private current(subject: string, predicate: Predicate): string | null {
    const s = subject.toLowerCase();
    for (let i = this.constraints.length - 1; i >= 0; i--) {
      const c = this.constraints[i]!;
      if (c.subject === s && c.predicate === predicate && !c.retracted) return c.value;
    }
    return null;
  }

  private parseIntent(question: string): { subject: string; predicate: Predicate } | null {
    const rules: Array<[RegExp, Predicate]> = [
      [/where does (.+?) work/i, "works_at"],
      [/where does (.+?) live/i, "lives_in"],
      [/where is (.+?) headquartered/i, "hq_in"],
      [/what is (.+?)'s role/i, "role_is"],
      [/what does (.+?) do\b/i, "role_is"],
    ];
    for (const [re, predicate] of rules) {
      const m = question.match(re);
      if (m) return { subject: m[1]!.replace(/'s$/, "").trim().toLowerCase(), predicate };
    }
    return null;
  }

  private keywordFallback(question: string): string {
    let best = "";
    let bestScore = 0;
    for (const text of this.episodes) {
      const score = overlap(question, text);
      if (score > bestScore) {
        bestScore = score;
        best = text;
      }
    }
    return best;
  }
}
