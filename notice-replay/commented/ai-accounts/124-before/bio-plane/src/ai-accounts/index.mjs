/* ai-accounts — the AI accounts the assistant's use is paid by, sealed at rest, and the choice of the one an act uses.
 * From T53 an account is an owner's plan at a provider (R40), reached by one of five means (`gateway`, `sealed`,
 * `reference`, `issued`, `none`) and holding an ordered allow-list of the entries of `ai-catalogue`'s signed list; an
 * owner (a member, a project, the team) keeps one ordered list of accounts (R41), and which account serves an act is the
 * walk of that list under the plan's scope, the checks P1–P7, Gate 1's verdict per part, the account's switch for the kind of
 * use, the free-tier warning, the recipient's notice and the payer flag (R7, R11, R42–R57). The material limits that keep a
 * team's or a project's material away from AI (R20–R22), the notices and disclosure owed before an account pays, and each
 * account's change history (R16) are here too. Who the members are is `membership`'s; what a person signs in with, and the
 * grant an ask reads under, are `credentials`'.
 *
 * Requirements: build/requirements/ai-accounts.md (R1–R77). Split from `credentials` by copy at T48 (R1–R34; N996, K617,
 * K624, K3101); T53 (K5457, N1220; AI-DESIGN's drafts, DEC-465, DEC-466, DEC-471, DEC-476, K5478, K5493, K5501) replaced the
 * one-table-per-kind accounts with the account model of R40 on, retired twelve ops (R35) and declared the new ones (R61, R71),
 * and `migrate` converts today's rows (R59).
 *
 * SHAPE (K61). `aiAccountsOf(ctx)` answers the one instance for a Durable Object's storage, over `ctx.storage.sql`, reaching
 * record-core by `recordOf(ctx)` and membership by `membershipOf(ctx)` on the same `ctx`; credentials' factory creates it with
 * the Worker's seal secret (`sealSecret`, R24, R32) and `ai-catalogue`'s service (`catalogue`), and a test may pass its own
 * `{record, membership, sealSecret, catalogue}`, read on the first call only. Its first construction is this module's start:
 * it registers its two listeners with membership (R27, R77). It reads only record-grammar, record-core, membership and
 * ai-catalogue, and membership only through its services, never by SQL. Every refusal names its reason; no service throws.
 *
 * The class is built in layers, one file each, each extending the one before: base (clock, refusals, authority, seal,
 * catalogue reads, disclosure), limits (R20–R22), accounts (R40 and what is stored of one), lists (R41, R46, R49), offering
 * (R47, R51–R56), serving (R7, R11, R50, R65–R68, R74–R76) and lifecycle (R27, R59, R72, R77, migrate). */
import { recordOf } from "../record-core/index.mjs";
import { membershipOf } from "../membership/index.mjs";
import { localize } from "../setup-words/index.mjs";
import { AiAccountsLifecycle } from "./lifecycle.mjs";
import { deepFreeze } from "./base.mjs";

export { AI_ACCOUNTS_TABLES, AI_ACCOUNTS_MIXED_TABLES, AI_ACCOUNTS_PROJECT_TABLES, AI_ACCOUNTS_HISTORY_TABLE,
  AI_ACCOUNTS_LEGACY_SCHEMA, AI_ACCOUNTS_LEGACY_TABLES } from "./schema.mjs";
export { AI_ACCOUNT_CHECKS, AI_WORDS } from "./checks.mjs";
export { USE_KINDS, EXPLORE_VALUES, USE_SWITCHES, ACCOUNT_SWITCHES, PART_OF_KIND, KEEP_AWAY_REASON, MEANS, CHECK_IDS, HOP_REASONS,
  REFERENCE_MAX_CHARS, TERMS_NOTICE_DAYS, WORKER_CLASS, SIGNIN_TOKEN_LENGTH, HISTORY_LIMIT_DEFAULT, HISTORY_LIMIT_MAX,
  PAYER_CAUSES, GATEWAY_ROUTES } from "./constants.mjs";

/* ===== the kinds of this module's interface (structured comments; nothing here runs) ===== */

/**
 * A refusal, as every act and read of this module answers one instead of throwing: this module's own rows (C-29), or a
 * row of membership or ai-catalogue passed on as they mint it. The optional members are what the refusal of one site adds;
 * a site may add others (any member name), so a refusal is read by its `ok` first.
 * @typedef {RefusalMembers & Object<string, *>} Refusal
 */

/**
 * The members of a refusal that this module names.
 * @typedef {Object} RefusalMembers
 * @property {false} ok
 * @property {string} reason the refusal's code
 * @property {string} code
 * @property {string} [check] the row's number, C-29.n for this module's own
 * @property {*} [translation] the sentence of the row, placeholders left as {name}
 * @property {string} [detail] the sentence for this refusal
 * @property {*} [word] (ai-catalogue's rows carry a word instead of a translation)
 * @property {KeepAwayWho} [keep_away] AI_KEPT_AWAY and PROJECT_AI_KEPT_AWAY: the limit's reason, who and when
 * @property {string | null} [project]
 * @property {string | null} [use]
 * @property {string | null} [member]
 * @property {string | null} [switch]
 * @property {(string | boolean)[]} [values] SWITCH_VALUE_INVALID: the values the switch takes
 * @property {'project' | 'own' | 'group'} [whose] AI_USE_SWITCHED_OFF: whose account it is
 * @property {string | null} [account_id]
 * @property {string | null} [entry_id]
 * @property {string | null} [entry]
 * @property {string | null} [plan]
 * @property {string} [level]
 * @property {string | null} [means]
 * @property {string | null} [provider]
 * @property {number} [min]
 * @property {number} [max]
 * @property {number | null} [position]
 * @property {number} [count]
 * @property {string | null} [check_id]
 * @property {string | null} [part]
 * @property {*} [verdict]
 * @property {Recipient} [recipient] RECIPIENT_NOTICE_DUE: whose notice is due
 * @property {true} [unreadable] what could not be read offers nothing (fail closed)
 * @property {string[]} [reasons] NO_ENTRY_OFFERED: why each pair was excluded
 * @property {string | null} [cause] PAYER_NOT_VERIFIED: the payer flag's cause
 * @property {'administrators' | 'owners' | 'member'} [who] LIST_EXHAUSTED: who can change the list
 * @property {string | null} [hop_reason]
 * @property {{grant_by: string}} [extra] GATEWAY_UNAVAILABLE: who can grant the gateway
 * @bound code: a code of AI_ACCOUNT_CHECKS, or of membership's or ai-catalogue's rows
 * @bound detail: the row's translation with its placeholders filled
 */

/**
 * A refusal membership mints, passed on as it is (membership states no kind; `ok` is false whenever one is answered).
 * @typedef {{ok: boolean, reason: string, code: string, check: *, translation: *, detail: *, [member: string]: *}} MembershipRefusal
 */

/**
 * Who set a material limit, when, and why (R21).
 * @typedef {Object} KeepAwayWho
 * @property {string | null} reason
 * @property {string | null} set_by
 * @property {string | null} set_at
 */

/**
 * The team's material limit (R20–R22): `on` null when it cannot be read (read as kept away).
 * @typedef {Object} KeepAwayState
 * @property {boolean | null} on
 * @property {string | null} reason
 * @property {string | null} set_by the member who set it
 * @property {string | null} set_at
 * @property {string[] | null} uses the kinds of use it covers
 * @bound uses: each one of USE_KINDS, once, in USE_KINDS' order; every kind when the limit names none
 * @bound reason: 1 to 2,000 characters, not blank, whenever the limit is on
 * @bound set_at: an instant written YYYY-MM-DDTHH:MM:SSZ
 */

/**
 * The team's limit as an act answers it.
 * @typedef {{ok: true} & KeepAwayState} KeepAwayAnswer
 */

/**
 * A project's material limit (R22), as its acts and its read answer it.
 * @typedef {Object} ProjectKeepAway
 * @property {true} ok
 * @property {string | null} project
 * @property {boolean | null} on
 * @property {string[] | null} uses
 * @property {string | null} reason
 * @property {string | null} set_by
 * @property {string | null} set_at
 * @bound uses: each one of USE_KINDS, once, in USE_KINDS' order
 */

/**
 * The material limits that can bind an account (R15, R22).
 * @typedef {Object} LimitOf
 * @property {'group' | 'project'} scope
 * @property {string} [project]
 * @property {boolean | null} on
 * @property {string[] | null} uses
 * @property {string | null} reason
 * @property {string | null} set_by
 * @property {string | null} set_at
 */

/**
 * An account's switches for each kind of use (R14), by switch name.
 * @typedef {Object<string, boolean | string>} UseSwitches
 * @bound one entry for each name of USE_SWITCHES; explore one of EXPLORE_VALUES, every other true or false
 */

/**
 * The provider and host an entry sends to (R51).
 * @typedef {Object} Recipient
 * @property {string} provider
 * @property {string} host
 */

/**
 * The means an account's credential is reached by (R40, R43).
 * @typedef {'gateway' | 'sealed' | 'reference' | 'issued' | 'none'} Means
 */

/**
 * An account as its owners read it (R2): never a secret or a digest of one.
 * @typedef {Object} AccountState
 * @property {string} account_id
 * @property {string} owner
 * @property {string} provider
 * @property {string} plan
 * @property {Means} means
 * @property {string[]} entries the ordered allow-list of catalogue entry ids
 * @property {boolean} on
 * @property {boolean} held
 * @property {boolean} flagged
 * @property {string | null} [flag_cause] only while flagged
 * @property {{flag: 'share_with_lists' | 'share_with_projects', on: boolean} | null} opt_in
 * @property {string} set_at
 * @property {boolean} personal
 * @property {UseSwitches} switches
 * @bound account_id: acct-<n>, n a whole number from 1, never reused
 * @bound owner: group, project:<id> or member:<id>
 * @bound flag_cause: one of PAYER_CAUSES
 */

/**
 * An account as a member who is not its owner reads it (R6): the team's with its entries, a project's without.
 * @typedef {Object} AccountPartial
 * @property {string} account_id
 * @property {string} provider
 * @property {string} plan
 * @property {string[]} [entries]
 * @property {boolean} on
 */

/**
 * An account on an owner's list (R41), as `accountsOf` answers it.
 * @typedef {(AccountState | AccountPartial) & {position: number | null, placed_here?: boolean, placed_by?: string | null}} AccountListed
 * @bound position: whole number from 1, or null for an account of the owner's own that stands off the list
 */

/**
 * What it takes to hold an account (R40, R43, R46, R47): `op=aiaccountadd`, `aiownadd`, `aipersonalchoose`.
 * @typedef {Object} AccountSetRequest
 * @property {string | null} [owner]
 * @property {string | null} [provider]
 * @property {string | null} [plan]
 * @property {string | null} [means]
 * @property {string[] | null} [entries]
 * @property {string | null} [secret] a key or a sign-in token, sealed and never answered
 * @property {{store: string, locator: string} | null} [reference]
 * @property {string | null} [terms_version]
 * @property {string | null} [account_id] names the account whose credential, entries or means it replaces
 * @property {string | null} [by] the actor
 * @bound owner: group, project:<id> or member:<id>
 * @bound means: one of MEANS, and one the plan allows
 * @bound entries: at least one, each an entry of the plan, each once
 * @bound secret: not blank; an issued token 20 to 2,000 characters unless the plan states its own bounds
 * @bound reference: store and locator each 1 to 512 characters, not blank
 */

/**
 * An account held (R40). `owner`, `provider` and `plan` echo the request's, which the act has checked.
 * @typedef {Object} AccountSetAnswer
 * @property {true} ok
 * @property {string} account_id
 * @property {string | null} owner
 * @property {string | null} provider
 * @property {string | null} plan
 * @property {Means} means
 * @property {string[]} entries
 * @property {boolean} on
 * @property {boolean} held
 * @property {string} set_at
 */

/**
 * The credential of an account for one call (R3, R7, R65): a secret (sealed, issued), a pointer (reference), a gateway id
 * (gateway), or nothing (none).
 * @typedef {Object} Credential
 * @property {true} ok
 * @property {string} account_id
 * @property {Means} means
 * @property {string} [secret]
 * @property {{store: string, locator: string} | null} [reference]
 * @property {string | null} [gateway_id]
 */

/**
 * One change of an owner's accounts or lists (R16): what the change recorded, and when, by whom, at which level.
 * @typedef {{at: string, by: string | null, change: string, level: string, [detail: string]: *}} AccountChange
 * @bound level: group, project or member
 */

/**
 * An act an account serves (R7, R11).
 * @typedef {Object} Act
 * @property {*} [kind] the kind of use; any other value is refused
 * @property {string} [member]
 * @property {string | null} [project]
 * @property {boolean} [interactive]
 * @bound kind: one of USE_KINDS but explore
 */

/**
 * The account that serves an act, as `accountFor` answers it (R7), with the credential for the one call.
 * @typedef {Object} AccountForAnswer
 * @property {true} ok
 * @property {string} account_id
 * @property {'project' | 'member' | 'group'} level
 * @property {string} owner
 * @property {string} provider
 * @property {string} plan
 * @property {Means} means
 * @property {string} entry_id
 * @property {string[]} entries
 * @property {string} member
 * @property {string | null} [project]
 * @property {boolean} suggestions
 * @property {boolean} personal
 * @property {Recipient[]} disclosed the recipients the member has seen
 * @property {string} [secret]
 * @property {{store: string, locator: string} | null} [reference]
 * @property {string | null} [gateway_id]
 */

/**
 * R11's choice for an act, without unsealing (R25).
 * @typedef {Object} AccountServing
 * @property {string} account_id
 * @property {'project' | 'member' | 'group'} level
 * @property {string} provider
 * @property {string} plan
 * @property {Means} means
 * @property {string} entry_id
 * @property {string | null} [project]
 * @property {string} [member]
 */

/**
 * The head account for an act (R25 `servingAccountOf`).
 * @typedef {Object} ServingAccount
 * @property {string} account_id
 * @property {'project' | 'member' | 'group'} level
 * @property {Means} means
 * @property {boolean} suggestions
 * @property {boolean} standing
 */

/**
 * The next pair a hop moves to (R50).
 * @typedef {Object} HopAnswer
 * @property {true} ok
 * @property {string} account_id
 * @property {string} entry_id
 * @property {'project' | 'member' | 'group'} level
 * @property {string} owner
 * @property {Means} means
 * @property {{from_owner: string, to_owner: string} | null} payer_change
 */

/**
 * A hop that waits for the member to read a recipient's notice (R51).
 * @typedef {Object} HopWait
 * @property {false} ok
 * @property {true} wait
 * @property {'RECIPIENT_NOTICE_DUE'} code
 * @property {'RECIPIENT_NOTICE_DUE'} reason
 * @property {boolean} interactive
 * @property {Recipient | undefined} recipient
 * @property {string} account_id
 * @property {string} entry_id
 */

/**
 * The checks in force for an act (R54): each check ticked, and the levels that tick it.
 * @typedef {{checks: string[], sources: Object<string, ('group' | 'project' | 'member')[]>, unreadable?: undefined} | {unreadable: true, checks?: undefined, sources?: undefined}} ChecksInForce
 * @bound checks: each one of CHECK_IDS, in their order
 */

/**
 * A gateway's record of one call (R45), as the Worker hands it.
 * @typedef {Object} GatewayRecord
 * @property {string | null} [gateway_id]
 * @property {boolean | null} [own_key_served]
 * @property {boolean | null} [platform_credits_used]
 */

/**
 * The port to the gateway's key store (R44), registered once by the composition root.
 * @typedef {Object} GatewayPort
 * @property {() => Promise<string> | string} create makes a gateway and answers its id
 * @property {(gatewayId: string, key: string) => *} put stores a key; an answer of false or {ok: false} is a refusal
 * @property {(gatewayId: string) => Promise<boolean> | boolean} exists
 */

/**
 * A credential held through the gateway (R44).
 * @typedef {Object} GatewayHeld
 * @property {true} ok
 * @property {string} account_id
 * @property {true} held
 * @property {'screen' | 'dashboard'} route
 * @property {string} since
 */

/**
 * What the listeners of `onAccountCleared` are told (R26).
 * @typedef {Object} ClearedNotice
 * @property {string} account_id
 * @property {string} owner
 * @property {string | null} member
 * @property {Means} means
 * @property {string | null} by
 * @property {'removed' | 'revoked' | 'refused' | 'disconnected' | 'unresolved'} why
 * @property {boolean} other_account_serves
 */

/**
 * A payer stop open to a viewer (R75).
 * @typedef {Object} CreditsStop
 * @property {string} key ai-credits-stop|<account_id>|<flagged_at>
 * @property {string} account_id
 * @property {string} flagged_at
 * @property {string} cause
 * @bound cause: one of PAYER_CAUSES
 */

/**
 * A binding terms change of an account's plan within TERMS_NOTICE_DAYS (R76).
 * @typedef {Object} TermsNotice
 * @property {string} account_id
 * @property {string} plan_id
 * @property {*} doc
 * @property {*} version
 * @property {string} effective_from
 * @property {string} key terms|<account_id>|<doc>|<version>
 */

/**
 * A notice owed to an owner (R72, R77, R59).
 * @typedef {{kind: 'left-list', key: string, account_id: string, provider: string, plan: string, list_owner: string, at: string}
 *   | {kind: 'left-project-list', key: string, account_id: string, provider: string, plan: string, project: string, at: string}
 *   | {kind: 'signin-ended', key: string, project: string, member: string | null, at: string}} AccountNotice
 */

/**
 * What `migrate` converted (R59).
 * @typedef {Object} MigrateAnswer
 * @property {true} ok
 * @property {{member_key: number, member_signin: number, team_key: number, project_key: number, project_signin_ended: number, notices_seen: number}} converted
 * @property {number} left rows of a kind it does not know, left in place
 * @property {number} deferred rows whose plan or entries the catalogue cannot give yet
 */

/**
 * A registration answered (membership R81's refusals otherwise).
 * @typedef {{ok: true, module: string}} Registered
 */

/**
 * What the class is made with. The services are other modules' and state no kind.
 * @typedef {Object} AiAccountsDeps
 * @property {*} [sql] the Durable Object's SQL storage (`exec`); null only for KEPT_AWAY_UNREADABLE, built over no store
 * @property {*} [core] record-core's service (`transact`, `declareTable`)
 * @property {*} [membership] membership's service (`memberFacts`, `isAdministrator`, `sight`, `projectAuthority`, `onRevoked`, ...)
 * @property {string | null} [sealSecret] the Worker's seal secret
 * @property {(() => number) | null} [now] the instance clock, in milliseconds
 * @property {*} [catalogue] ai-catalogue's service (`plansOf`, `entryOf`, `entriesFor`, `whyNotOffered`, `catalogueState`)
 */

/**
 * The options of `aiAccountsOf`, read on the first call only.
 * @typedef {Object} AiAccountsOptions
 * @property {*} [record] record-core's service
 * @property {*} [membership] membership's service
 * @property {string | null} [sealSecret]
 * @property {(() => number) | null} [now]
 * @property {*} [catalogue] ai-catalogue's service
 */

/**
 * A request's stamp: the actor (`by`) or the viewer, from the control plane's query.
 * @typedef {string | null} Stamp
 */

/**
 * The ops this module answers by name (R32, R38, R61, R65–R71), each with what its request carries (the body's fields and
 * the control plane's stamps `by` and `viewer` in the query) and what it answers.
 * @typedef {{
 *   aiaccountadd: {req: AccountSetRequest, res: Promise<Refusal | AccountSetAnswer>},
 *   aiownadd: {req: AccountSetRequest, res: Promise<Refusal | AccountSetAnswer>},
 *   aiaccountremove: {req: {account_id: string, by: Stamp}, res: Refusal | {ok: true, account_id: string, removed: true}},
 *   aiaccountswitch: {req: {account_id: string, on: boolean, by: Stamp}, res: Refusal | {ok: true, account_id: string, on: boolean}},
 *   aiorderset: {req: {owner: string, account_id: string, position: number, by: Stamp}, res: Refusal | MembershipRefusal | {ok: true, owner: string | null, accounts: string[]}},
 *   aiprojectorder: {req: {project: string, accounts: string[], by: Stamp}, res: Refusal | MembershipRefusal | {ok: true, owner: string | null, accounts: string[]}},
 *   aimemberallow: {req: {entries?: string[] | null, by: Stamp}, res: Refusal | {ok: true, owner: string | null, entries: string[] | null}},
 *   aiprojectuse: {req: {project?: string, account_id?: string, entries?: string[] | null, by: Stamp}, res: Refusal | {ok: true, owner: string | null, entries: string[] | null} | {ok: true, account_id: string, entries: string[]}},
 *   aimineuse: {req: {account_id?: string, entries?: string[] | null, by: Stamp}, res: Refusal | {ok: true, owner: string | null, entries: string[] | null} | {ok: true, account_id: string, entries: string[]}},
 *   aicheckset: {req: {check: string, ticked: boolean, by: Stamp}, res: Refusal | MembershipRefusal | ChecksSetAnswer},
 *   aiprojectcheckset: {req: {project: string, check: string, ticked: boolean, by: Stamp}, res: Refusal | MembershipRefusal | ChecksSetAnswer},
 *   aimycheckset: {req: {check: string, ticked: boolean, by: Stamp}, res: Refusal | MembershipRefusal | ChecksSetAnswer},
 *   aikeyenter: {req: {account_id: string, key: string, by: Stamp}, res: Promise<Refusal | GatewayHeld>},
 *   aikeycloudflare: {req: {account_id: string, by: Stamp}, res: Promise<Refusal | GatewayHeld>},
 *   aikeyseal: {req: {account_id: string, secret: string, by: Stamp}, res: Promise<Refusal | {ok: true, account_id: string, means: 'sealed', held: true, since: string}>},
 *   aitermsaccept: {req: {account_id: string, by: Stamp}, res: Refusal | FreeTierAnswer},
 *   aitermswithdraw: {req: {account_id: string, by: Stamp}, res: Refusal | {ok: true, account_id: string, withdrawn: boolean}},
 *   aipersonalchoose: {req: AccountSetRequest, res: Promise<Refusal | AccountSetAnswer>},
 *   aicreditsclear: {req: {account_id: string, by: Stamp}, res: Refusal | {ok: true, account_id: string, was_flagged: boolean}},
 *   aioptinset: {req: {account_id: string, on: boolean, by: Stamp}, res: Refusal | {ok: true, account_id: string, flag: 'share_with_lists' | 'share_with_projects', on: boolean, changed: boolean}},
 *   aisend: {req: {provider: string, host: string, by: Stamp}, res: Refusal | {ok: true, seen: true, already: boolean}},
 *   aikeepaway: {req: {on?: boolean, uses?: string[] | null, reason?: string | null, by: Stamp}, res: Refusal | MembershipRefusal | KeepAwayAnswer},
 *   aikeepawaystate: {req: {}, res: KeepAwayState},
 *   projectaikeepaway: {req: {project: string, on?: boolean, uses?: string[] | null, reason?: string | null, by: Stamp}, res: Refusal | ProjectKeepAway},
 *   projectaikeepawaystate: {req: {project: string, viewer: Stamp}, res: Refusal | MembershipRefusal | ProjectKeepAway},
 *   accountusesset: {req: {account_id: string, switch: string, on: boolean | string, by: Stamp}, res: Refusal | {ok: true, account_id: string, switch: string | null, on?: boolean | string}},
 *   accountuses: {req: {account_id: string, viewer: Stamp}, res: Refusal | AccountUsesAnswer},
 *   accounthistory: {req: {owner: string, viewer: Stamp, limit?: string}, res: Refusal | AccountHistoryAnswer},
 *   accountstate: {req: {account_id: string, viewer: Stamp}, res: Refusal | ({ok: true} & AccountState) | ({ok: true} & AccountPartial)},
 *   accountsof: {req: {owner: string, viewer: Stamp}, res: Refusal | MembershipRefusal | {ok: true, owner: string | null, accounts: AccountListed[]}},
 *   aichecks: {req: {level: string, viewer: Stamp}, res: Refusal | {ok: true, level: string | null, ticks: Object<string, boolean> | null, unreadable?: true}},
 *   aioffered: {req: {owner: string, viewer: Stamp}, res: Refusal | {ok: true, owner: string | null, entries: string[] | null, unreadable?: true}},
 *   personalchoice: {req: {account_id: string, viewer: Stamp}, res: Refusal | PersonalChoiceAnswer},
 *   aicredential: {req: {account_id: string, act?: Act | null, by: Stamp}, res: Promise<Refusal | Credential>},
 *   aigatewayserved: {req: {account_id: string, record?: GatewayRecord | null, act?: Act | null, by: Stamp}, res: Refusal | {ok: true} | {flagged: true, cause: string}},
 *   aicredentialfailed: {req: {account_id: string, why: string, act?: Act | null, by: Stamp}, res: Refusal | {ok: boolean, dropped: boolean, unreadable?: true}}
 * }} AiAccountsOps
 * @optable
 * @bound by: the control plane's stamp, read from the query after the body, never the body's own
 * @bound aicredential.by: the agent Worker's stamp, token:agent-worker or class:agent-worker
 * @bound aigatewayserved.by: the agent Worker's stamp, token:agent-worker or class:agent-worker
 * @bound aicredentialfailed.by: the agent Worker's stamp, token:agent-worker or class:agent-worker
 * @bound aicredentialfailed.why: refused or unresolved
 * @bound aiorderset.position: whole number, 1 to the list's length
 * @bound accounthistory.limit: a whole number; at most HISTORY_LIMIT_MAX, HISTORY_LIMIT_DEFAULT when absent
 */

/**
 * The handlers of the ops, one per entry of AiAccountsOps, each reading the request it was made over.
 * @typedef {{[K in keyof AiAccountsOps]: () => AiAccountsOps[K]['res']}} AiAccountsHandlers
 */

/**
 * The checks of a level set (R52, R53).
 * @typedef {{ok: true, level: string | null, check: string, ticked: boolean}} ChecksSetAnswer
 */

/**
 * A free plan's warning accepted (R56); `needed: false` for a plan that needs none.
 * @typedef {{ok: true, account_id: string, needed: false} | {ok: true, account_id: string, needed: true, accepted: true, warning_version: string | null}} FreeTierAnswer
 */

/**
 * A personal subscription's record of the member's choice (R47); `stale` null when the catalogue cannot be read.
 * @typedef {Object} PersonalChoiceAnswer
 * @property {true} ok
 * @property {string} account_id
 * @property {{member: string, at: string, plan: string, terms_version: string | null, account_id: string}} record
 * @property {boolean | null} stale
 */

/**
 * One account's uses and the limits that can bind it, to its owners (R15); every member null when unreadable.
 * @typedef {Object} AccountUsesAnswer
 * @property {true} ok
 * @property {string | null} account_id
 * @property {string | null} owner
 * @property {boolean | null} held
 * @property {UseSwitches | null} uses
 * @property {LimitOf[] | null} keptAway
 * @property {true} [unreadable]
 */

/**
 * An owner's history (R16), capped as credentials R15's.
 * @typedef {Object} AccountHistoryAnswer
 * @property {true} ok
 * @property {string | null} owner
 * @property {number} count
 * @property {number | null} limit
 * @property {boolean} truncated
 * @property {AccountChange[]} changes
 * @property {true} [unreadable]
 * @bound limit: whole number, 1 to HISTORY_LIMIT_MAX
 */

/**
 * The declaration of one op the screens send (R36, R37, R61, R71; op-declarations R80).
 * @typedef {Object} DeclaredOp
 * @property {string[]} classes
 * @property {string[]} machineClasses
 * @property {boolean} mutating
 * @property {null} needs
 * @property {'substrate' | 'reasoned' | 'credential' | 'caller-owned'} weight
 * @property {{accepts: string[], requires: (string | string[])[]}} fields
 * @property {*} [description] the op's sentence, from setup-words' localize
 */

/* ----- the rows of this module's tables (R28) ----- */

/**
 * One account (R40): the secret only sealed, a reference only as a pointer, a gateway account no key at all.
 * @typedef {Object} AccountRow
 * @property {number} seq
 * @property {string} account_id
 * @property {string} owner
 * @property {string | null} project_id
 * @property {string} provider
 * @property {string} plan
 * @property {string} means
 * @property {string} entries a JSON array of entry ids
 * @property {number} is_on
 * @property {number} held
 * @property {string | null} sealed
 * @property {string | null} iv
 * @property {string | null} seal_owner
 * @property {string | null} reference
 * @property {string | null} gateway_id
 * @property {string | null} route
 * @property {string | null} held_since
 * @property {string | null} refused_at
 * @property {string | null} valid_until
 * @property {number} flagged
 * @property {string | null} flag_cause
 * @property {string | null} flagged_at
 * @property {number} share_flag
 * @property {number} personal
 * @property {string | null} set_by
 * @property {string} set_at
 * @property {number} use_ask
 * @property {number} use_draft
 * @property {number} use_run
 * @property {number} standing
 * @property {number} suggestions
 * @property {string} explore
 * @property {number} use_enquire
 * @property {number} use_read
 * @property {number} use_transcribe
 * @property {number} use_account
 * @bound is_on, held, flagged, share_flag, personal and the use_ columns, standing and suggestions: 0 or 1
 * @bound explore: one of EXPLORE_VALUES
 * @storedrows ai_accounts
 */

/**
 * One place on an owner's list (R41, R77).
 * @typedef {{owner: string, project_id: string | null, account_id: string, position: number, placed_by: string | null, placed_at: string | null}} ListRow
 * @storedrows ai_account_lists
 */

/**
 * An owner's ceiling of entries (R46).
 * @typedef {{owner: string, project_id: string | null, entries: string | null, set_by: string | null, set_at: string}} OfferedRow
 * @storedrows ai_offered
 */

/**
 * A level's tick of a check (R52, R53).
 * @typedef {{level: string, project_id: string | null, check_id: string, ticked: number, set_by: string | null, set_at: string}} CheckTickRow
 * @storedrows ai_check_ticks
 */

/**
 * A free plan's warning accepted (R56).
 * @typedef {{account_id: string, plan: string, warning_version: string, accepted_by: string | null, accepted_at: string}} FreeTierRow
 * @storedrows ai_free_tier
 */

/**
 * A personal subscription's choice (R47).
 * @typedef {{account_id: string, member_id: string, plan: string, terms_version: string | null, chosen_at: string}} PersonalChoiceRow
 * @storedrows ai_personal_choices
 */

/**
 * A recipient's notice seen by a member (R51).
 * @typedef {{member_id: string, provider: string, host: string, seen_at: string}} RecipientSeenRow
 * @storedrows ai_recipients_seen
 */

/**
 * One set of the team's material limit (R20, R22).
 * @typedef {{seq: number, is_on: number, reason: string | null, set_by: string, set_at: string, uses: string | null}} KeepAwayRow
 * @storedrows ai_keep_away
 */

/**
 * One set of a project's material limit (R22).
 * @typedef {{seq: number, project_id: string, is_on: number, uses: string | null, reason: string | null, set_by: string, set_at: string}} ProjectKeepAwayRow
 * @storedrows project_keep_away
 */

/**
 * One change of an owner's accounts (R16).
 * @typedef {{seq: number, owner: string, project_id: string | null, at: string, by: string | null, change: string, detail: string | null, origin: string | null}} ChangeRow
 * @storedrows account_changes
 */

export class AiAccounts extends AiAccountsLifecycle {}

/* R34 (T48; N1041, K3148): AI_KEPT_AWAY's fail-closed answer, with its row, as `aiKeptAway` answers it when the setting cannot be
   read: asked of the one site over no store, so it is that answer and never a copy of it. An in-plane caller whose call to
   `aiKeptAway` threw or could not be made answers this as given (K231). */
/** @type {Refusal} AI_KEPT_AWAY with its keep_away members null, frozen */
export const KEPT_AWAY_UNREADABLE = deepFreeze(new AiAccounts({ sql: null }).aiKeptAway());
AiAccounts.KEPT_AWAY_UNREADABLE = KEPT_AWAY_UNREADABLE;

/* K61: the one AiAccounts of a Durable Object's storage, made on first use over its `sql`, reaching record-core and membership
   by their factories on the same `ctx`; its first construction registers its listeners (R27, R77). `record`, `membership`,
   `sealSecret` and `catalogue` are read on the first call only (R32: credentials' factory passes the seal secret it is given). */
const OF = new WeakMap();
/**
 * The one AiAccounts of a Durable Object's storage.
 * @param {*} ctx the Durable Object's state (its `storage`), or the storage itself
 * @param {AiAccountsOptions} [options]
 * @returns {AiAccounts}
 */
export function aiAccountsOf(ctx, { record = null, membership = null, sealSecret = null, now = null, catalogue = null } = {}) {
  const storage = ctx && ctx.storage ? ctx.storage : ctx;
  let a = OF.get(storage);
  if (!a) {
    a = new AiAccounts({ sql: storage.sql, core: record ?? recordOf(ctx), membership: membership ?? membershipOf(ctx, { record }),
                         sealSecret, now, catalogue });
    OF.set(storage, a);
    a.start();
  }
  return a;
}

/* R32, R38, R61, R65–R71: the ops this module answers, as entries of the plane's one route map (spread by the plane before
   credentials'). `url` carries the control plane's stamps (`by`, `viewer`) in its query, read AFTER the body is spread, so a
   caller's own copy never wins (D-136); `body` is the parsed body; a secret or key only ever in the body, never the query.
   (R38) A member's own act takes the member from the door's stamped `by`, never the body. The in-plane reads (`accountFor`,
   `accountSecretFor`, `accountSwitchesOf`, `accountUsesOf`, `aiKeptAway`, `projectsKeptAway`, `disclosureDue`, `hopFor`,
   `gatewayServedCheck`, `creditsStopsOpen`, `termsNoticesDue`, `accountNoticesFor`, `accountsOnSummary` and R24–R26) are not
   routed; the seven ops of R35 and the five of R10, R12, R13 are not in it. Which credential reaches each op is
   op-declarations' and control-plane's. */
/**
 * The handlers of the ops this module answers, over one request.
 * @param {AiAccounts | null} a the instance (credentials' instance holds it as `accounts`); null only lists the ops
 * @param {URL} url the request's URL, whose query carries the stamps `by` and `viewer`
 * @param {*} body the parsed body
 * @param {*} [env] the store's environment (`BIO_NOW_MS`)
 * @returns {AiAccountsHandlers}
 */
export function aiAccountsOps(a, url, body, env) {
  /* R39 (K5192): the store's environment is the instance clock's source (`_nowMs`). `a` is the instance, or `credentials`'
     instance, which answers through its `accounts`; both read the same clock. */
  const inst = a instanceof AiAccounts ? a : a?.accounts;
  if (inst && env && typeof env === "object") inst.env = env;
  const b = body && typeof body === "object" && !Array.isArray(body) ? body : {};
  const by = () => url.searchParams.get("by");
  const viewer = () => url.searchParams.get("viewer");
  const q = (k) => url.searchParams.get(k);
  /* a body field, only when it is a string; the arms below name what each reads */
  const s = (k) => (typeof b[k] === "string" ? b[k] : null);
  const ownerOf = (who) => (who === "group" || who === "team" ? "group" : who === "member" ? `member:${by()}` : null);
  return {
    /* R38, R40: the team's and a project's account by the owner named in the body; a member's own from the stamp alone */
    aiaccountadd: () => (typeof b.owner === "string" && b.owner.startsWith("member:")
      ? a.accountSet({ ...b, owner: null, by: by() }) : a.accountSet({ ...b, by: by() })),
    aiownadd: () => a.accountSet({ ...b, owner: `member:${by()}`, by: by() }),
    aiaccountremove: () => a.accountRemove({ account_id: s("account_id"), by: by() }),
    aiaccountswitch: () => a.accountSwitch({ account_id: s("account_id"), on: b.on, by: by() }),
    /* R70: the team's list or the member's own; `owner` `group` or `member`, the member from the stamp */
    aiorderset: () => a.accountMove({ owner: ownerOf(s("owner")) ?? s("owner"), account_id: s("account_id"), position: b.position, by: by() }),
    aiprojectorder: () => a.accountOrderSet({ owner: s("project") === null ? null : `project:${s("project")}`, accounts: b.accounts, by: by() }),
    /* R46: the ceilings, and an account's own entries when the body names the account */
    aimemberallow: () => a.offeredSet({ owner: "group", entries: b.entries ?? null, by: by() }),
    aiprojectuse: () => (s("account_id") !== null ? a.accountEntriesSet({ account_id: s("account_id"), entries: b.entries, by: by() })
      : a.offeredSet({ owner: s("project") === null ? null : `project:${s("project")}`, entries: b.entries ?? null, by: by() })),
    aimineuse: () => (s("account_id") !== null ? a.accountEntriesSet({ account_id: s("account_id"), entries: b.entries, by: by() })
      : a.offeredSet({ owner: `member:${by()}`, entries: b.entries ?? null, by: by() })),
    /* R52, R53: the checks of the team, of a project, and of the member herself */
    aicheckset: () => a.checksSet({ level: "group", check: s("check"), ticked: b.ticked, by: by() }),
    aiprojectcheckset: () => a.checksSet({ level: s("project") === null ? null : `project:${s("project")}`, check: s("check"), ticked: b.ticked, by: by() }),
    aimycheckset: () => a.checksSet({ level: `member:${by()}`, check: s("check"), ticked: b.ticked, by: by() }),
    /* R44, R69: a gateway key entered (never echoed), confirmed in the dashboard, or kept sealed (R69) */
    aikeyenter: () => a.gatewayKeyEnter({ account_id: s("account_id"), key: b.key, by: by() }),
    aikeycloudflare: () => a.gatewayKeyAttest({ account_id: s("account_id"), by: by() }),
    aikeyseal: () => a.aiKeySeal({ account_id: s("account_id"), secret: b.secret, by: by() }),
    /* R56, R47: the free tier's warning, a personal subscription chosen */
    aitermsaccept: () => a.freeTierAccept({ account_id: s("account_id"), by: by() }),
    aitermswithdraw: () => a.freeTierWithdraw({ account_id: s("account_id"), by: by() }),
    aipersonalchoose: () => a.accountSet({ ...b, owner: `member:${by()}`, by: by() }),
    /* R68, R49, R51: the credits stop cleared, a share flag, a recipient's notice seen */
    aicreditsclear: () => a.aiCreditsClear({ account_id: s("account_id"), by: by() }),
    aioptinset: () => a.crossOwnerOptInSet({ account_id: s("account_id"), on: b.on, by: by() }),
    aisend: () => a.recipientNoticeSeen({ member: by(), provider: s("provider"), host: s("host"), by: by() }),
    /* R20, R21 (DEC-172): the keep-away acts, `by` the stamp after the body; its state, which reaches every active member
       through the op's spec (op-declarations, control-plane) */
    aikeepaway: () => a.aiKeepAwaySet({ ...b, by: by() }),
    aikeepawaystate: () => a.aiKeepAwayState(),
    projectaikeepaway: () => a.projectAiKeepAwaySet({ ...b, by: by() }),
    projectaikeepawaystate: () => a.projectAiKeepAwayState({ project: q("project"), viewer: viewer() }),
    /* R14–R17: an account's switches, its panel, its changes and its state, to its owners; `viewer` the stamp */
    accountusesset: () => a.accountUsesSet({ account_id: s("account_id"), switch: b.switch, on: b.on, by: by() }),
    accountuses: () => a.accountUses({ account_id: q("account_id"), viewer: viewer() }),
    accounthistory: () => a.accountHistory({ owner: q("owner"), viewer: viewer(), limit: q("limit") }),
    accountstate: () => a.accountState({ account_id: q("account_id"), viewer: viewer() }),
    accountsof: () => a.accountsOf({ owner: q("owner"), viewer: viewer() }),
    aichecks: () => a.checksState({ level: q("level"), viewer: viewer() }),
    aioffered: () => a.offeredOf({ owner: q("owner"), viewer: viewer() }),
    personalchoice: () => a.personalChoiceState({ account_id: q("account_id"), viewer: viewer() }),
    /* R65–R67: served to the agent Worker's principal alone; `by` is its stamp */
    aicredential: () => a.aiCredential({ account_id: s("account_id"), act: b.act ?? null, by: by() }),
    aigatewayserved: () => a.aiGatewayServed({ account_id: s("account_id"), record: b.record ?? null, act: b.act ?? null, by: by() }),
    aicredentialfailed: () => a.aiCredentialFailed({ account_id: s("account_id"), why: s("why"), act: b.act ?? null, by: by() }),
  };
}

/**
 * @param {string[]} accepts
 * @param {(string | string[])[]} requires
 * @param {{weight?: DeclaredOp['weight'], description?: *}} [extra]
 * @returns {DeclaredOp}
 */
const D = (accepts, requires, extra = {}) => ({ classes: ["admin", "member"], machineClasses: [], mutating: true, needs: null, weight: "substrate", fields: { accepts, requires }, ...extra });

/* R36, R37, R61, R71 (T51; K4168; op-declarations R80, op-grades R49): the ops this module serves that the screens send,
   declared by their owner beside the ops map: each row's class, weight and description, its fields what the arm reads. The
   plane ops of R65–R67 carry no member rung (served to the Worker's principal alone) and are not declared. */
export const DECLARED_OPS = Object.freeze({
  accountusesset: D(["account_id", "switch", "on"], ["account_id", "switch", "on"], { description: localize("ai-accounts.declared.accountusesset", "the account's configuration: an owner sets one of its uses' switches (explore no, ask or yes); it moves no document, claim or grade") }),
  projectaikeepaway: D(["project", "on", "uses", "reason"], ["project"], { weight: "reasoned", description: localize("ai-accounts.declared.projectaikeepaway", "setting: whether a project keeps its material away from the assistant, an owner's act with a reason; moves no bundle") }),
  aikeepaway: D(["on", "uses", "reason"], [], { weight: "reasoned", description: localize("ai-accounts.declared.aikeepaway", "setting: whether the group keeps its material away from every assistant, an administrator's act with a reason; moves no bundle") }),
  aiaccountadd: D(["owner", "provider", "plan", "means", "entries", "secret", "reference", "terms_version", "account_id"], ["owner", "provider", "plan"], { weight: "credential", description: localize("ai-accounts.declared.aiaccountadd", "credential governance: the team's or a project's AI account, an administrator's or an owner's; a secret is sealed and never answered") }),
  aiownadd: D(["provider", "plan", "means", "entries", "secret", "reference", "terms_version", "account_id"], ["provider", "plan"], { weight: "credential", description: localize("ai-accounts.declared.aiownadd", "credential governance: a member's own AI account, never answered; the subject is a credential, not a bundle") }),
  aiaccountremove: D(["account_id"], ["account_id"], { weight: "credential", description: localize("ai-accounts.declared.aiaccountremove", "credential governance: an owner removes an AI account; the subject is who pays for the assistant, not a bundle") }),
  aiaccountswitch: D(["account_id", "on"], ["account_id", "on"], { description: localize("ai-accounts.declared.aiaccountswitch", "the account's configuration: whether an AI account is on; its owner's; moves no document, claim or grade") }),
  aiorderset: D(["owner", "account_id", "position"], ["owner", "account_id", "position"], { description: localize("ai-accounts.declared.aiorderset", "the account list's configuration: an administrator or a member moves one account to a place in their own list; moves no document, claim or grade") }),
  aiprojectorder: D(["project", "accounts"], ["project", "accounts"], { description: localize("ai-accounts.declared.aiprojectorder", "the account list's configuration: a project's list of accounts, an owner's act; moves no document, claim or grade") }),
  aimemberallow: D(["entries"], [], { description: localize("ai-accounts.declared.aimemberallow", "the offered AIs' configuration: the team's ceiling of which AIs may be offered; an administrator's") }),
  aiprojectuse: D(["project", "entries", "account_id"], [["project", "account_id"]], { description: localize("ai-accounts.declared.aiprojectuse", "the offered AIs' configuration: a project's ceiling, or one of its accounts' entries; an owner's") }),
  aimineuse: D(["entries", "account_id"], [], { description: localize("ai-accounts.declared.aimineuse", "the offered AIs' configuration: a member's own ceiling, or one of their accounts' entries") }),
  aicheckset: D(["check", "ticked"], ["check", "ticked"], { description: localize("ai-accounts.declared.aicheckset", "the checks' configuration: whether the team requires a check of every AI; an administrator's") }),
  aiprojectcheckset: D(["project", "check", "ticked"], ["project", "check", "ticked"], { description: localize("ai-accounts.declared.aiprojectcheckset", "the checks' configuration: whether a project requires a check of the AIs used in it; an owner's") }),
  aimycheckset: D(["check", "ticked"], ["check", "ticked"], { description: localize("ai-accounts.declared.aimycheckset", "the checks' configuration: whether a member requires a check of the AIs used for their own work") }),
  aikeyenter: D(["account_id", "key"], ["account_id", "key"], { weight: "credential", description: localize("ai-accounts.declared.aikeyenter", "credential governance: a key handed to the gateway and kept nowhere here; never answered") }),
  aikeycloudflare: D(["account_id"], ["account_id"], { weight: "credential", description: localize("ai-accounts.declared.aikeycloudflare", "credential governance: confirms that a key was entered in the Cloudflare dashboard; the key never reaches here") }),
  aikeyseal: D(["account_id", "secret"], ["account_id", "secret"], { description: localize("ai-accounts.declared.aikeyseal", "credential governance: a key kept sealed in your team's Civicsmith; never answered") }),
  aitermsaccept: D(["account_id"], ["account_id"], { description: localize("ai-accounts.declared.aitermsaccept", "the account's configuration: its owner accepts a free plan's warning; recorded with who and when") }),
  aitermswithdraw: D(["account_id"], ["account_id"], { description: localize("ai-accounts.declared.aitermswithdraw", "the account's configuration: its owner withdraws a free plan's acceptance") }),
  aipersonalchoose: D(["provider", "plan", "means", "entries", "secret", "reference", "terms_version", "account_id"], ["provider", "plan"], { weight: "credential", description: localize("ai-accounts.declared.aipersonalchoose", "credential governance: a member chooses to connect their own subscription; recorded with who, when, plan and terms version") }),
  aicreditsclear: D(["account_id"], ["account_id"], { description: localize("ai-accounts.declared.aicreditsclear", "the account's configuration: its manager clears a payer stop and turns the account back on; recorded with name and time") }),
  aisend: D(["provider", "host"], ["provider", "host"], { weight: "caller-owned", description: localize("ai-accounts.declared.aisend", "personal state, keyed by member: the notice of what a provider and host receive, seen by them") }),
  aioptinset: D(["account_id", "on"], ["account_id", "on"], { description: localize("ai-accounts.declared.aioptinset", "the account's configuration: whether its owner level shares it with lists; moves no document, claim or grade") }),
});

