# Combined native controller pilot — actual execution contract

Owner-approved layout is ACTIVE; no approval question remains. Console is sole
bootstrap integrator. ROOT supervises; ARCH owns product decisions and module jobs.
All four streams were integrated through the existing pinned process tool into
codex/p4-grants-broker-20261116 (not main/tranche): B275/08e0ab2,
A276/2074729 +277/fc2958f, D278/147f712, C279/be42c23.
Combined actual verification:232bootstrap+46grants tests pass (278); these tool tests
are NOT live product-stage evidence or overall completion. Current stage is pilot.

## Commands and identities

Run from /workspace/process3-probes, always existing state:
`python bootstrap/native/cycle.py --state codex/p4-state-native-workshop-20261116`
Default runtime /workspace/work/p4-native-cycle. No nested inference CLI/API-key.
Resolve actual role addresses/generations from layout-status; no stale hardcoding.
Console and ROOT use supervision-plan --actor ACTUAL_CREATOR --observations FILE
[--native-capacity N] [--pending-role ARCH]. Fresh actual native inventory packets
are role-keyed {target,generation,activity,observed_at,source:'actual-native-inventory'}.
Source/time classify real host observation, not arbitrary packet authentication.
Completed means idle, interrupted/unavailable allows sibling replacement; missing,
stale(>60s), obsolete observations HOLD. Execute only actual returned native tools,
then register actual canonical addresses/generations after spawn events. Console
creates ROOT/WATCHERdepth1; ROOTcreatesARCH/coord/PROCESSdepth2; ARCHJOB/LANEdepth3.
PROCESSrequires actualcurrentARCHrequest. No role creates its own successor.

ARCH schedule-plan --actor ARCHPATH --observations FILE --active-account-jobs N
--native-capacity N produces ready dispatch plans in moduleorder, includingcapacity/
observation holds. It does not execute or prove jobs. Accountcount includes thisrun;
unknownoutsideusage is not invented. ≤8owner ceiling/currenttechnicalslots/native
capacity remain. Sourceoldjob.session fallback is freshness-validated, not permission
to editoldattempt. recovery-plan has sameactor/observations; actions require existing
prepare/checkpoint/integrate paths, never synthesize recovery/CI evidence.

## Existing run, bounded native transport and product work

Preserve existing provider/webbranches and currentintegrationbranch/PRs; do notreset.
Architecturepilot design native/approved-layout-design/PILOT.md and assignments.json.
Currentknown providerattempt2/web3 DONE, pending report recoveryrange2. Minimum1→2
controlledrevision; price/max unchanged, web defaults derivedfromprovider minimum.
ARCHmay settechnicalslots2 via control slots --source arch --value2 (ownerdefaultcap8
unchanged). Productpilot_hold mustbeFalse ONLYafter console's combinedverification.
Controller rejects prepare whileholdtrue. Initialindependentreadyprovider/web source
work canoverlap; don'twaitproviders solelyforreadiness, but baseline/dependency facts
mustremainhonest. Ifnativecapacitycannotfit2, hold/narrow and reportactualconcurrency.

Existing controller commands: control instruction --job JOB --value TEXT --source arch,
control retry --job JOB --source arch, prepare JOB, session JOB CANONICALPATH --actor
ARCHPATH, checkpoint JOB --outcome completed|interrupted|blocked, integrate JOB.
prepare reserves currentattempt and returns exactworkspace/prompt; onlyARCHcreates
nativeJOB underit and binds actualattempt/path. JOBwrites ONLYowned module/tests;
no provider/push/PR/merge/session/grant/process operation. Hostactualownership and
existing typed provider checks run beforepreservation/integration. Samepartialbranch/
PR retained acrossinterruptions; no force/delete. Accountslots review states reserved
untilintegration, failed/blockedwork frees capacity accordingtoownerrequirements.

Use local message/intent -> actualnativefollowup -> delivered -> actualreceipt/ack.
All recipientgeneration/address mappings are logical and current. No SourceGithub
writes permessage/ack/heartbeat. Providercheckpoint fans out locally toeverydeclared
registereduser; unassignedreport obligation staysbounded/durable. Do notsendediting
instructions tostale/unavailable oldwebtarget. Receiptack != consumedproductnotice;
newgenerationmustprepare/registerbeforeediting. Everyproviderversion still sends;
durableoutstandingranges/counts compact only recoveryobligations. Moduletestenvironment
is allowlisted/privateHOME, no inheritedprovider/auth env; not physicalagentisolation.

## Three product stages and precise provenance

Only productstages: module tests, internal Screenswalk, external Journeyswalk.
No new gate/review/stage from processunitverification. Every actual checkpoint now
records command/returncode/test_count/observed_at/verifieractor and dependency-tree
fingerprints from its testedworktree BEFOREcommit. Missing/changedprovider context
cannotbe falselyrelabeled as currentintegration evidence. Reverification after real
providerchanges belongs to the same module stage, not a fourthstage.

After acceptedworkingintegration: round-start --actor ARCHPATH [--expected-head SHA].
It reads actualintegrationhead and snapshots currentmodulepaths. Newhead invalidates
oldstages/carries unresolvedwalkflaws; samehead cannoteraseflaws/changeownershipscope.
module-evidence JOB --actor ARCHPATH derives facts from latestacceptedjobcheckpoint,
actual Git ownedtrees/currenttrees and stored testeddependencies vs currentprovider
trees. It refuses stale/missingtestmetadata, changedtrees or changeddependencies.
Do notfill testeddependencies with currentvalues if actualtestsranoldbaseline. If
neededprepare/rerun moduletests on trustedcurrentbaseline; do not fabricate facts.
Legacyunitresult without metadata is historical, not currentround proof.

Internalwalker uses current UX_SCREENS and actual code/HTTPscreens. Recordactual
JSONreceipt with observed:true,actor,source,observed_at,head,design,coverage:[actual
screen IDs],outcome:'clean'|'flaws',flaws:[{id,module,description,evidence}], optional
resolved_flaws:{priorID:actualresolutionobservation}. Then walk-record internal_walk
--actor ARCHPATH --packet RECEIPT. Actualflaws cause round-assess actions backtoowned
modulework; do not manufactureflaws, injectdefects or claimwalk-discoveredcorrection
when onlymodule regression observed. Correctactualflaws/reintegrate/startnewround/
reverify/rewalk. Until allrequiredpriorflaws resolved, round cannotbe clean.

Externalwalk requirescurrent cleaninternal and actual loopbackdeploymentreceipt.
Create fresh dedicatedworktree UNDERselectedruntime at actualfinalintegrationSHA;
never overwritehistoricalservice. development-plan --actor ARCHPATH --worktree PATH
--entrypoint toy/native-cycle/web/app.py --provider-path toy/native-cycle/provider
--port8766 checks actualHEAD+cleanworktree and returns argumentarray/plan_id/environment.
Execute with subprocess env=plan['environment'] REPLACEMENT, cwd=plan['cwd'],
shell=False; createprivateHOME/CODEX directories owneronly. Never mergeos.environ.
No provider credentials or paid/publichosting. Plan is not receipt. Actuallystart
service/probeURL, thenreceipt observed:true,actor,source,observed_at,head,status:'running',
url:'http://127.0.0.1:8766/',http_status:200,plan_id. Use actual independentclient/
Chromium forJOURNEYS and record outcomes/coverage/limits. Externalwalkreceipt includes
that deploymentobject; walk-record external_walk --actor ARCHPATH --packet RECEIPT.

round-assess --actor ARCHPATH readsactualcurrenthead and returns stage/corrections/
clean. release-prepare --actor ARCHPATH --release-id ID --destination RUNTIME/PATH.json
requires currentclean3stage round, stages boundedlocalmanifest, recordsone meaningful
preparedrelease milestone. This is devpreparation ONLY, never publicpublication or
installer/adoption proof. Public release helper alwaysdenies undercurrentauthority.

## Owner front door and governance

owner-forward --actor /root --packet JSON uses exacttext/kind/message_id/marked/
expected_generation. Questions are transient and never build. Markeddecisions/
instructions may owner-record --actor ACTUALCOORD --packet {envelope,observed_at,
source_evidence} once; duplicateidenticalrecord causesnoemptyGitcommit. Semantic
stop/cap/priority stayexistingtypedcontrols, not inferredfromrecord. ActualownerYes
was forwarded/recorded oncealready; no reapproval/restart.

process-request --actor CURRENTARCH --generation N --evidence ACTUALEVENT stores
observedtechnicalrequest, not ownerwords. ExistingPROCESSbinding fromCwork isretained;
ARCHreplacementmakes oldrequeststale fornewcreation. LANErequires realowneridentified
productdesignneed (kindneed observedownerinput), notrelabelingROOTapproval/proposal.
lane-request NAME --actor ARCH --packet {generation,owner_need,paths} validatesCscope;
lane-plan validatesCprovenance+Adepth; actualspawn+register-role LANE:NAME bindsactual
sessiononly. No wholesaleadoptionofdraftdesignlanes or lane-modulefileoverlap.

Record one aggregate pilot evidence/meaningfulartifacts, not operationalmessage
archives. Standing no main/tranche/CivicSmith2/Claude/.process/grant/settings/pin/account/
credential/publicrelease/paidhosting/meteredAPI restrictions remain. No whole-chat
resurrection, idleconsolewake, credentialrotation or physicaltoolconfinement claim.
