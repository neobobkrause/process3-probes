/* plan-work R19 (T51; K4168): each op this module declares in DECLARED_OPS is held true against the op as the door runs it
   (test-support R15): only its requires raise no refusal naming a declared field, a call without each required one is refused
   naming it, and a field outside accepts is dropped or refused naming it. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { declaredOpHolds } from "../../declared-ops.mjs";
import { DECLARED_OPS, planWorkOps } from "../../../src/plan-work/index.mjs";
import { world, by } from "./fixture.mjs";
/** @import { World } from "./fixture.mjs" */
/** @import { PlanWorkOpMap } from "../../../src/plan-work/index.mjs" */
/** @typedef {World & {clockItem: {kind: "clock", action: string, entry: number}}} Env */
/** @typedef {{ok?: boolean, code?: string, reason?: string, detail?: string, error?: string}} Answer */
/** @param {Answer | null | undefined} x @param {Answer | null | undefined} y */
const sameCode = (x, y) => x && y && x.ok === y.ok && (x.code ?? x.reason) === (y.code ?? y.reason);
/* a world with a started action whose first clock entry is the item alice takes up */
const mkWorld = () => {
  const w = world();
  const s = w.started({ subjects: [w.S1], dates: [{ date: "2026-11-01", basis: "statute" }] });
  return { ...w, clockItem: { kind: "clock", action: s.action, entry: 0 } };
};
/** @param {Record<string, unknown>} fields @param {Env} env */
const seeded = (fields, env) => ("item" in fields ? { ...fields, item: env.clockItem } : fields);

/* a refusal names a field by its code (the table) or, as the default does, by the field as a whole word of its code or detail */
const words = (v) => (v == null ? "" : typeof v === "string" ? v : JSON.stringify(v));
/** @param {Record<string, string[]>} codes @param {boolean} [strict] @returns {(answer: Answer | null | undefined, field: string) => boolean} */
const named = (codes, strict = false) => (answer, field) => {
  if (!answer || typeof answer !== "object") return false;
  if ((codes[field] || []).some((c) => answer.code === c || answer.reason === c || answer.error === c)) return true;
  return !strict && new RegExp(`(^|[^\\w])${field}($|[^\\w])`).test([answer.code, answer.detail].map(words).join(" "));
};
/* the call as the door runs it: the stamps and every field in the address, the fields as the body, the arm asked of a fresh owner */
/**
 * @param {string} op @param {Record<string, string>} [stamps] @param {(() => Promise<Env> | Env) | null} [setup]
 * @param {((url: URL, fields: Record<string, unknown>, env: Env, op: string) => unknown) | null} [invoke]
 * @param {((given: Record<string, unknown>, env: Env) => Record<string, unknown>) | null} [adapt]
 * @returns {(given: Record<string, unknown>) => Promise<unknown>}
 */
const mk = (op, stamps = {}, setup = null, invoke = null, adapt = null) => async (given) => {
  const env = setup ? await setup() : await (mkWorld());
  const fields = adapt ? adapt(given, env) : given;
  const q = new URLSearchParams({ op, ...stamps, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)])) });
  const url = new URL("http://x/?" + q);
  return invoke ? await invoke(url, fields, env, op) : await (planWorkOps(env.pw, url, fields)[/** @type {keyof PlanWorkOpMap} */ (op)]());
};

test("R19 plan-work declares itemtakeup: its requires alone raise no refusal naming a field, each missing one is refused naming it, and a field outside accepts is dropped or refused", async () => {
  await declaredOpHolds({ op: "itemtakeup", declaration: DECLARED_OPS["itemtakeup"], call: mk("itemtakeup", {"author":"member:alice","viewer":"member:alice"}, null, null, (fields, env) => (seeded(fields, env))),
    refusedNaming: named({"item":["NO_SUCH_ITEM"]}, true), same: sameCode });
});
