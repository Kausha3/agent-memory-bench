// Retraction: a fact is stated, then later contradicted by an update. A correct memory
// returns the NEW value and never surfaces the stale one. Time-agnostic retrieval
// (keyword) characteristically fails here.

import type { Scenario } from "../types.js";
import { remember, query } from "./build.js";

export const retractionScenarios: Scenario[] = [
  {
    id: "retraction/job-change",
    category: "retraction",
    title: "Person changes employer",
    events: [
      remember("Priya Sharma works at Stripe."),
      remember("Priya Sharma now works at Acme."),
      query("Where does Priya Sharma work?", "Acme", ["Stripe"]),
    ],
  },
  {
    id: "retraction/relocation",
    category: "retraction",
    title: "Person relocates",
    events: [
      remember("Marcus lives in Boston."),
      remember("Marcus recently moved to Seattle."),
      query("Where does Marcus live?", "Seattle", ["Boston"]),
    ],
  },
  {
    id: "retraction/role-change",
    category: "retraction",
    title: "Person is promoted",
    events: [
      remember("Dana is a designer."),
      remember("Dana is now a product manager."),
      query("What is Dana's role?", "product manager", ["designer"]),
    ],
  },
];
