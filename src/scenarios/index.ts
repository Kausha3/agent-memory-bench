import type { Scenario } from "../types.js";
import { retractionScenarios } from "./retraction.js";
import { collisionScenarios } from "./collision.js";
import { recallScenarios } from "./recall.js";
import { conflictScenarios } from "./conflict.js";

/** Every scenario in the suite, grouped by the file it lives in. */
export const ALL_SCENARIOS: Scenario[] = [
  ...retractionScenarios,
  ...collisionScenarios,
  ...recallScenarios,
  ...conflictScenarios,
];
