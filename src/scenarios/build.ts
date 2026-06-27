// Terse builders so scenario files read like scripts.
import type { Event } from "../types.js";

export const remember = (text: string): Event => ({ kind: "remember", text });

export const query = (question: string, expect: string, reject: string[] = []): Event => ({
  kind: "query",
  question,
  expect,
  reject,
});
