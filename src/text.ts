// Small, dependency-free text helpers shared by the scorer and the baseline systems.
// Kept deliberately simple: the benchmark's value is the scenarios and methodology, not
// a clever tokenizer. Anyone plugging in a real system brings their own retrieval.

const STOPWORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "at", "in", "on", "of", "and", "or",
  "to", "now", "no", "longer", "does", "do", "did", "where", "what", "who", "which",
  "his", "her", "their", "just", "our", "my", "your", "for", "with", "that", "this",
  "it", "as", "be", "been", "has", "have", "had", "will",
]);

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Content tokens with stopwords removed, used for keyword overlap. */
export function tokens(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 0 && !STOPWORDS.has(t));
}

/** Number of distinct content tokens shared between two strings. */
export function overlap(a: string, b: string): number {
  const setB = new Set(tokens(b));
  let n = 0;
  for (const t of new Set(tokens(a))) if (setB.has(t)) n++;
  return n;
}

/**
 * A correct answer contains `expect` and none of `reject` (substring, normalized).
 * This is intentionally strict on `reject`: surfacing a stale value is a failure even
 * if the right value is also present.
 */
export function judge(answer: string, expect: string, reject: string[] = []): boolean {
  const a = normalize(answer);
  if (!a.includes(normalize(expect))) return false;
  for (const r of reject) {
    if (a.includes(normalize(r))) return false;
  }
  return true;
}
