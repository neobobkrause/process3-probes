/* ai-catalogue's own refusal rows (requirements: `build/requirements/ai-catalogue.md`, R49). DEC-49: every refusal this
 * module answers carries its code and its row. The module writes no sentence (K3810, K5418): a row names its check, its
 * one site and the WORD KEY the screens read for it (`ai.refused.<code, lower case, no underscores>`), never the words.
 * A state's words are read the same way, by `ai.catalogue.state.<state>` (`STATE_WORDS`).
 *
 * T53 (AI-CATALOGUE #1; K5457, K6): C-156 is a new family, the AI catalogue's, at the next free number of the tree at
 * the job's START (C-155 the highest). */

/**
 * The code of one of this module's refusals; each has its row in CATALOGUE_CHECKS.
 * @typedef {'CATALOGUE_EVIDENCE_MISSING' | 'CATALOGUE_ENTRY_INVALID' | 'CATALOGUE_PLAN_INVALID' | 'CATALOGUE_PAYLOAD_INVALID'
 *   | 'CATALOGUE_PATH_INVALID' | 'CATALOGUE_ROLLBACK_UNKNOWN' | 'CATALOGUE_UNAVAILABLE' | 'DIGEST_MISMATCH' | 'NOT_NEWER'
 *   | 'ADVISORY_BAD_MOVE' | 'ADVISORY_REASON_UNKNOWN' | 'PART_UNKNOWN' | 'CHECK_UNKNOWN'} CatalogueCode
 */

/**
 * A refusal's row: its check, its one site and the word key the screens read for it.
 * @typedef {Object} CatalogueCheckRow
 * @property {string} check
 * @property {string} where
 * @property {string} word
 * @bound check: `C-156.` and the row's number, 1 to 13
 * @bound where: `src/ai-catalogue/<file> <function> > <region>`
 * @bound word: `ai.refused.` and the code in lower case without underscores
 */

/**
 * The fields that name what was refused; which of them a refusal carries depends on its code and site.
 * @typedef {Object} RefusalFields
 * @property {string | null} [kind] CATALOGUE_PATH_INVALID's kind asked for; ADVISORY_BAD_MOVE's advisory kind
 * @property {string | null} [path] CATALOGUE_PATH_INVALID's path; CATALOGUE_PAYLOAD_INVALID's offending path
 * @property {number | null} [seq]
 * @property {number} [heldSeq] NOT_NEWER's highest held seq
 * @property {string} [outcome]
 * @property {number | null} [to_seq] CATALOGUE_ROLLBACK_UNKNOWN's
 * @property {string | null} [part] PART_UNKNOWN's
 * @property {string | null} [check_id] CHECK_UNKNOWN's
 * @property {string} [reason_given] ADVISORY_REASON_UNKNOWN's
 * @property {string} [from] ADVISORY_BAD_MOVE's
 * @property {string} [to] ADVISORY_BAD_MOVE's
 * @property {{entry_id: string} | {plan_id: string}} [target] ADVISORY_BAD_MOVE's
 */

/**
 * The one refusal shape: the code (also as `reason`), its row's check and word key, and the fields that name what was
 * refused.
 * @typedef {{ok: false, code: CatalogueCode, reason: CatalogueCode, check: string, word: string} & RefusalFields} CatalogueRefusal
 */

/**
 * What `validatePayload` answers (R36): `{ok: true}`, or refused with the code CATALOGUE_PAYLOAD_INVALID, `reason` the
 * code of the rule the first offending `path` breaks, and that reason's row.
 * @typedef {Object} PayloadVerdict
 * @property {boolean} ok
 * @property {'CATALOGUE_PAYLOAD_INVALID'} [code] when refused
 * @property {'CATALOGUE_PAYLOAD_INVALID' | 'CATALOGUE_ENTRY_INVALID' | 'CATALOGUE_PLAN_INVALID' | 'CATALOGUE_EVIDENCE_MISSING'} [reason] when refused
 * @property {string} [path] when refused
 * @property {string} [check] when refused
 * @property {string} [word] when refused
 * @bound path: the first offending path, written as `entries[0].checks.P1`
 */

const at = (file, fn, region) => `src/ai-catalogue/${file} ${fn} > ${region}`;
const key = (code) => `ai.refused.${code.toLowerCase().replace(/_/g, "")}`;
const row = (n, file, fn, region, code) => Object.freeze({ check: `C-156.${n}`, where: at(file, fn, region), word: key(code) });

/** @type {Readonly<Record<CatalogueCode, CatalogueCheckRow>>} */
export const CATALOGUE_CHECKS = Object.freeze({
  CATALOGUE_EVIDENCE_MISSING: row(1, "validate.mjs", "validatePayload", "is-claim-evidenced", "CATALOGUE_EVIDENCE_MISSING"),
  CATALOGUE_ENTRY_INVALID: row(2, "validate.mjs", "validatePayload", "is-entry-valid", "CATALOGUE_ENTRY_INVALID"),
  CATALOGUE_PLAN_INVALID: row(3, "validate.mjs", "validatePayload", "is-plan-valid", "CATALOGUE_PLAN_INVALID"),
  CATALOGUE_PAYLOAD_INVALID: row(4, "validate.mjs", "validatePayload", "is-payload-valid", "CATALOGUE_PAYLOAD_INVALID"),
  CATALOGUE_PATH_INVALID: row(5, "index.mjs", "pullRequest", "is-path-relative", "CATALOGUE_PATH_INVALID"),
  CATALOGUE_ROLLBACK_UNKNOWN: row(6, "index.mjs", "rollback", "is-rollback-held", "CATALOGUE_ROLLBACK_UNKNOWN"),
  CATALOGUE_UNAVAILABLE: row(7, "index.mjs", "#unavailable", "is-catalogue-held", "CATALOGUE_UNAVAILABLE"),
  DIGEST_MISMATCH: row(8, "index.mjs", "#acceptPayload", "is-digest-indexed", "DIGEST_MISMATCH"),
  NOT_NEWER: row(9, "index.mjs", "#acceptPayload", "is-seq-newer", "NOT_NEWER"),
  ADVISORY_BAD_MOVE: row(10, "lifecycle.mjs", "badMove", "is-move-legal", "ADVISORY_BAD_MOVE"),
  ADVISORY_REASON_UNKNOWN: row(11, "index.mjs", "#acceptAdvisory", "is-advisory-reason", "ADVISORY_REASON_UNKNOWN"),
  PART_UNKNOWN: row(12, "index.mjs", "#question", "is-part-known", "PART_UNKNOWN"),
  CHECK_UNKNOWN: row(13, "index.mjs", "#question", "is-check-known", "CHECK_UNKNOWN"),
});

/**
 * The one refusal shape: the code, its row's check and word key, and the fields that name what was refused.
 * @param {CatalogueCode} code
 * @param {RefusalFields} [fields]
 * @returns {CatalogueRefusal}
 */
export function refusal(code, fields = {}) {
  const r = CATALOGUE_CHECKS[code];
  return Object.freeze({ ...fields, ok: false, code, reason: code, check: r.check, word: r.word });
}

/** @typedef {'unavailable' | 'needs_newer_release' | 'stale' | 'current'} CatalogueState */

/** @type {readonly CatalogueState[]} */
export const CATALOGUE_STATES = Object.freeze(["unavailable", "needs_newer_release", "stale", "current"]);
/**
 * Each state's word key, `ai.catalogue.state.<state>`.
 * @type {Readonly<Record<CatalogueState, string>>}
 */
export const STATE_WORDS = Object.freeze(/** @type {Record<CatalogueState, string>} */ (Object.fromEntries(CATALOGUE_STATES.map((s) => [s, `ai.catalogue.state.${s}`]))));
