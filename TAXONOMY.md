# Failure-mode taxonomy

Agent memory is usually evaluated on *retrieval* — did the system fetch a relevant
chunk? But agents fail in the field for reasons retrieval metrics don't capture: the
fetched fact is **out of date**, belongs to the **wrong entity**, was **buried under
noise**, or **contradicts** another fact the system also holds. This benchmark scores
those four failure modes directly.

Each category is defined so that a *different* naive strategy fails it. That's the
point: there is no single trick. A system that survives all four has to model **time**
and **identity**, not just similarity.

---

## 1. Retraction

**A fact is stated, then later updated.** The correct answer is the new value, and the
old value must not be surfaced.

> "Priya works at Stripe." … "Priya now works at Acme." → *Where does Priya work?*

**Why it's hard:** pure similarity retrieval has no notion of time — both statements
match the query equally well, so a keyword system can return the stale one. This is the
single most common real-world memory bug: an agent confidently citing a job, address, or
preference the user changed months ago.

**What it isolates:** does the system order facts in time and let the latest win?

## 2. Collision

**Two entities are superficially similar** — same first name, near-identical project or
company names. The query is about one of them specifically.

> "Priya Patel works at Google." … "Priya Sharma works at Stripe." → *Where does Priya **Patel** work?*

**Why it's hard:** the distinguishing token is small relative to the shared context, so
recency- or popularity-biased retrieval drifts to the wrong entity. Conflation is silent
— the system returns a confident, fluent, wrong answer.

**What it isolates:** does the system bind facts to a stable entity identity?

## 3. Recall

**A fact is stated early, then a stretch of unrelated turns passes, then a recent turn
shares surface tokens with the query** (but not the answer).

> "Sam works at Vercel." … *(noise)* … "Sam asked a great question." → *Where does Sam work?*

**Why it's hard:** recency bias grabs the recent look-alike; naive retrieval over a long,
noisy history loses the signal. This category includes a deliberate **frontier** scenario
that requires joining two facts (multi-hop) — unsolved by every reference baseline, so the
benchmark has visible headroom rather than being saturated.

**What it isolates:** retention and precise retrieval across distance and distraction.

## 4. Conflict

**A fact is asserted, then explicitly contradicted** ("actually, not X — Y"). Both
statements mention the old value, so returning either sentence verbatim leaks it.

> "Omar works at Datadog." … "Actually, Omar does not work at Datadog — he works at Snowflake."

**Why it's hard:** the contradiction is *in the text*, not just across turns. A system has
to recognize that the second statement supersedes the first and resolve to a single
current value — not store both as simultaneously true, and not echo a sentence that names
the negated value.

**What it isolates:** contradiction detection and resolution to a coherent current state.

---

## What the categories reveal together

Each reference baseline fails exactly where its design predicts (see the README
leaderboard for measured rates):

| Strategy | Retraction | Collision | Recall | Conflict | Why |
|---|:---:|:---:|:---:|:---:|---|
| Keyword (time-agnostic) | ✗ | ✓ | ~ | ✗ | No model of time → stale and contradicted facts win |
| Recency-biased | ✓ | ✗ | ✗ | ✗ | Latest-token-match wins → wrong entity / recent noise |
| Typed-constraint | ✓ | ✓ | ~ | ✓ | Models time + identity; still no multi-hop reasoning |

The gap between "retrieved something relevant" and "answered correctly" is the whole
subject of the benchmark.
