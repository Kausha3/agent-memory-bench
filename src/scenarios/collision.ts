// Collision: two entities that are superficially similar (same first name, similar
// project names). A correct memory keeps them distinct and answers about the one asked.
// Ordering is chosen so that recency-biased retrieval is tempted toward the wrong entity.

import type { Scenario } from "../types.js";
import { remember, query } from "./build.js";

export const collisionScenarios: Scenario[] = [
  {
    id: "collision/two-people-same-name",
    category: "collision",
    title: "Two people share a first name",
    events: [
      remember("Priya Patel works at Google."),
      remember("Priya Sharma works at Stripe."),
      query("Where does Priya Patel work?", "Google", ["Stripe"]),
    ],
  },
  {
    id: "collision/similar-orgs",
    category: "collision",
    title: "Two similarly named organizations",
    events: [
      remember("Acme Labs is headquartered in Denver."),
      remember("Acme Corp is headquartered in Austin."),
      query("Where is Acme Labs headquartered?", "Denver", ["Austin"]),
    ],
  },
  {
    id: "collision/same-person-two-jobs-over-time",
    category: "collision",
    title: "Distinguish two people, not a job change",
    events: [
      remember("Lena Ortiz works at Figma."),
      remember("Lena Park works at Notion."),
      query("Where does Lena Ortiz work?", "Figma", ["Notion"]),
    ],
  },
];
