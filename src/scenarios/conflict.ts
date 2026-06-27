// Conflict: a fact is asserted, then explicitly contradicted ("actually, not X — Y").
// Both statements name the old value, so any system that returns the contradicting
// sentence verbatim leaks the stale value and fails the `reject` check. Resolving the
// conflict requires modeling that the second statement *supersedes* the first.

import type { Scenario } from "../types.js";
import { remember, query } from "./build.js";

export const conflictScenarios: Scenario[] = [
  {
    id: "conflict/employer",
    category: "conflict",
    title: "Explicit correction of employer",
    events: [
      remember("Omar works at Datadog."),
      remember("Actually, Omar does not work at Datadog — he works at Snowflake."),
      query("Where does Omar work?", "Snowflake", ["Datadog"]),
    ],
  },
  {
    id: "conflict/location",
    category: "conflict",
    title: "Negated then corrected location",
    events: [
      remember("Greta lives in Munich."),
      remember("Greta does not live in Munich anymore; she moved to Berlin."),
      query("Where does Greta live?", "Berlin", ["Munich"]),
    ],
  },
  {
    id: "conflict/role",
    category: "conflict",
    title: "Negated then corrected role",
    events: [
      remember("Ivan is a backend engineer."),
      remember("Ivan is not a backend engineer; he is a data scientist."),
      query("What is Ivan's role?", "data scientist", ["backend"]),
    ],
  },
];
