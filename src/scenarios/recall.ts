// Recall: a fact is stated early, then a stretch of unrelated turns goes by, then a
// recent turn that shares surface tokens with the query (but not the answer) appears.
// A correct memory retrieves the original fact; recency-biased retrieval grabs the
// recent look-alike instead. The final scenario is a deliberate frontier case: it needs
// multi-hop reasoning across two facts, which none of the reference baselines do.

import type { Scenario } from "../types.js";
import { remember, query } from "./build.js";

export const recallScenarios: Scenario[] = [
  {
    id: "recall/employer-buried",
    category: "recall",
    title: "Employer stated early, recent look-alike turn",
    events: [
      remember("Sam Okoro works at Vercel."),
      remember("The venue had terrible parking."),
      remember("Lunch was served late."),
      remember("Sam Okoro asked a great question during the Q&A."),
      query("Where does Sam Okoro work?", "Vercel", []),
    ],
  },
  {
    id: "recall/home-buried",
    category: "recall",
    title: "Home city stated early, recent look-alike turn",
    events: [
      remember("Nadia Rahman lives in Lisbon."),
      remember("The keynote ran twenty minutes over."),
      remember("Coffee ran out before noon."),
      remember("Nadia Rahman gave a memorable lightning talk."),
      query("Where does Nadia Rahman live?", "Lisbon", []),
    ],
  },
  {
    id: "recall/role-buried",
    category: "recall",
    title: "Role stated early, recent look-alike turn",
    events: [
      remember("Theo Mensah is a security engineer."),
      remember("The wifi was spotty all afternoon."),
      remember("Badges were printed with the wrong logo."),
      remember("Theo Mensah recommended a great book afterward."),
      query("What is Theo Mensah's role?", "security engineer", []),
    ],
  },
  {
    id: "recall/multi-hop",
    category: "recall",
    title: "Frontier: answer requires joining two facts",
    events: [
      remember("Yuki Tanaka mentored three interns last summer."),
      remember("One of those interns, Priya, now works at Stripe."),
      remember("The afterparty was on the rooftop."),
      query("Who mentored the intern who now works at Stripe?", "Yuki Tanaka", []),
    ],
  },
];
