# [file] process4_lanes.md (continued)


**What a lane decides.** Within the product's principles a lane decides design and wording in its area. You keep the product's direction, audiences and principles. A decision that would change one of those comes to you with options and the lane's recommendation.

**How questions reach a lane.** Only through ARCH. A job never talks to a lane, and lanes never talk to each other. ARCH recognises a design question, passes it to the lane with enough context to decide, waits for the lane's decision, and keeps the final say. A question that is yours becomes your decision, and a design, before anything is built on it.

**How a lane's work is merged.** A change that touches only files in the lane's own folder merges without a test run. Your reason, as recorded on 5 Nov: the modules that use what the lane produces have already passed their own tests, and design documents do not need testing.

**The UX lane and the walks.** The UX lane owns the folder you named on 14 Nov for screens and journeys. So the UX lane keeps the two documents the walks are measured against: the internal walk uses its Screens document, the external walk follows its journeys.

**PROCESS.** PROCESS is the lane where the process is changed, and the only place it is changed. You interact with it directly. It explains each problem and offers options for you to explore and choose. Several proposals open at once are considered together. ROOT starts it; ARCH can ask ROOT to start it if it is not running; the coordinator can talk to it. A product moves to a changed process only with your prior approval, by the means PROCESS proposes.

*Claude decided* (technical, reported to you):

1. A lane session does not use one of the eight job slots. Your answer "across the account" was about job slots, a lane is not a job, and in Process3 lane sessions took no slot. So beside the eight there can be one session for each lane: three for Civicsmith, and PROCESS.
2. ARCH starts a product's lanes, so a lane sits at the same depth as a job, inside your limit of three levels.
3. One session per lane is held by a record written before the session is started, which refuses a second start while the first is live. Process3 built this and it ran: five lane starts.
4. A fresh lane session begins by reading the lane's research and the recorded links to its design pages. Process3 built the replacing of a lane session; it never once ran, so this is unproven.
5. Every question ARCH puts to a lane, and every answer, is written in the shared record. Process3 built this and it ran: five questions.
6. The report at the end of a tranche lists every change the UX lane made, during that tranche, to the two documents the walks are measured against. This is a line in a report that nothing reads to decide anything. It is not a check.
7. A lane ends when you or ARCH say its area needs no further design; its folder and research stay. Your documents are silent on this.
8. PROCESS follows the lane rules where they fit: one session at a time, its own folder (in the process's repository, not the product's), research recorded before it proposes. It differs in three ways that come from your words of 14 Nov: ROOT starts it, you talk to it directly, and what it changes is the process itself.

---

## 3. Where your documents disagree: yours to decide

1. **Who starts a lane.** Your Foundations: "BOB is the only creator of jobs and lanes". Your answer of 6 Nov as recorded: "BOB starts jobs and lanes, not ROOT". Your typed hint of 14 Nov has ROOT start PROCESS. **My recommendation:** both stand. ARCH starts a product's design lanes; PROCESS is the one lane ROOT starts, because it belongs to the process and not to any one product. I need only your yes.
2. **PROCESS and the two triage lanes.** On 6 Nov you kept a process triage lane and a product triage lane, each to study a problem and bring you options. PROCESS, in your words of 14 Nov, does what the process triage lane was to do, and also makes the change. **My recommendation:** PROCESS takes the place of the process triage lane. For the product triage lane I recommend not starting one: Process3 built it and never once started a session for it (checked today by a worker), and in Process4 a flaw found by a walk already becomes work in the next round. That would end something you kept, so it needs your yes or no.
3. **Whether you work with design lanes directly.** On 5 Nov, as recorded, you described lanes' design documents as pages they "create/update/interact with me using". The session's record of 13 Nov has the coordinator as your front door. **My recommendation:** you work with a lane through its design pages, as on 5 Nov, and with PROCESS directly; everything else comes through the coordinator.
4. **Which lanes Civicsmith begins with.** **My recommendation:** UX, investigation design and publication design, as on 6 Nov, and any further lane when you identify the need. I need only your yes.
5. **Where the Screens document and the journeys live.** Your approvals of 5 Nov: "Their design documents are claude.ai artifacts, not repository files." Your words of 14 Nov: "screens and journeys are kept in docs/development/ux-substrate/ in the product repo". This is the first question under "The end of a tranche" in the five-points document, and my recommendation is there: in the folder, kept by the UX lane.

---

## 4. Wording of yours that Process4 cannot keep as written

These are proposals. Nothing changes until you answer.

1. Your approvals say lanes are "run under BOB". The definition calls that session ARCH. *Proposed:* the approvals name ARCH when they are next edited. Nothing else about the sentence changes.
2. Your approvals say the large files a lane's generators build "are built at layer close, deploy and release, never committed". Layers are ended in Process4, on the session's record of your decisions of 13 and 14 Nov. So "layer close" names something that no longer exists. I will bring the new wording together with the open question of whether a job may commit built files, because they are the same matter.
3. The fifth draft said "ARCH defines lanes". That went against your Foundations: "You identify the need for a lane and BOB opens it". It was Claude's error and I am correcting it; no decision is needed from you.

---

## 5. What is proven and what is not

**Proven in Process3** (checked today by a worker in the product's stored records): three design lanes existed (UX, investigation, publication). Five lane sessions ran; the last three ran from 6 Nov to the end. Each lane recorded its research before deciding. Seventeen design-page links were recorded. Lanes merged 51 changes in three days with no test run.

**What went wrong in Process3** (same worker). Before the one-session rule, three UX sessions ran at once and the tool saw none of them. One lane change broke the building of the word table and merged untested. One lane session waited about two hours on a permission prompt nobody could answer. One question to a lane stayed open forty hours. The UX folder had two owners at once: the lane and a module.

**Not proven.** That lanes made the designs better. What a lane session costs. That a fresh session can take over a lane. Anything at all about PROCESS: no lane in Process3 could change the process, and nothing like PROCESS has been built. Process3's lane commands also lean on parts that Process4 ends (layers and the old merge tool), so they must be rebuilt in Process4's tool, which does not exist yet.

**A risk I can state but not remove.** The UX lane writes the documents a walk is measured against, and its changes merge untested. A flaw could be made to disappear by changing the document instead of the product. Your approvals give the lane that decision, and I am not proposing to take it away. Item 6 in section 2 makes such changes visible to you in the tranche report; it does not stop them.

**A gap in the record.** Your lane requirements of 5 and 6 Nov are in none of the 288 requirement lines that Process4 has been checked against, because that list was made from an earlier copy of your Foundations. A worker is listing what else is missing.


# [file] codex-gpt6-context-window-investigation-20261117.md

# Why published GPT-6 1.05M context differs from Codex observed windows

**17 November 2026. Status: assistant external research, not an adopted Process4 rule or an owner decision.** This note records sources and findings for independent validation. It does **not** establish the model/window of the subscription-hosted Process4 child sessions. Do not use the API merely to meet an owner's subscription-only runtime constraint.

## Short answer

The 1,050,000-token number is an **API model capability**, whereas Codex/ChatGPT Work has **product-specific context settings** and sometimes uses an account/client-specific server-delivered model catalog. OpenAI currently explicitly documents **500,000 as the default Codex/Work context for GPT-6.1 Sol**, while separately advertising its **1,050,000 API context** in the **same model page**. Codex applies a catalog maximum to requested context, a 95% usable-context factor, and an ordinarily 90%-of-raw automatic compaction threshold. Real issue reproductions show smaller runtime limits (258,400; 475,000; 828,400) and catalog-origin/cache inconsistencies. The exact reasons for every product/rollout cap and the particular hosted Process4 child capacity are not publicly established.

## Official published statements

1. https://developers.openai.com/api/docs/models/gpt-6.1-sol — 1,050,000 context; 128,000 maximum output; **500K default in Codex and ChatGPT Work**. The API page states separately that API prompts above 272K have a higher rate, but that is not the Codex default.
2. https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex and https://learn.chatgpt.com/docs/models — Codex and Work are separate product surfaces; **GPT-6.1 Sol defaults to 500,000**, availability depends on workspace/rollout. Subscription usage is not the same billing path as per-token API usage.
3. https://learn.chatgpt.com/docs/config-file/config-reference — Codex config keys `model_context_window`, `model_auto_compact_token_limit`, `model_post_turn_compact_threshold_percent`, etc. Documentation for an override does NOT guarantee that a provider/model catalog will honor its requested size.

## Verified open-source Codex mechanism

At https://github.com/openai/codex/blob/main/codex-rs/models-manager/src/model_info.rs the function `with_config_overrides` resolves an explicitly requested context as `min(requested_context_window, max_context_window)` when a catalog maximum is present. This is a **silent clamp** in the inspected code path.

At https://github.com/openai/codex/blob/main/codex-rs/protocol/src/openai_models.rs the `ModelInfo` methods `usable_context_window` and `auto_compact_token_limit` derive respectively `raw * effective_context_window_percent / 100` and `min(configured_limit, raw * 90% )` when a raw model window is known. Common catalog values report 95% usable.

An illustrative catalog entry `context_window=272000`, `max_context_window=872000`, `effective_context_window_percent=95` yields:
- No override: 258,400 usable; ordinary auto compaction 244,800.
- 500,000 override: 475,000 usable; ordinary auto compaction 450,000.
- 1,000,000 override: **clamped raw to 872,000**, 828,400 usable; compaction limited to 784,800 even if user requests 900,000.

This arithmetic is a source-grounded description of Codex client resolution, not proof of the backend model's physical maximum. The 872K catalog cap is not justified by public source; although 1,000,000 minus 128,000 equals 872,000, that numerical coincidence is **not evidence** of an output-reservation policy, particularly because API spec says 1,050,000 total.
