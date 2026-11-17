"""Durable Process4 assignment completion classification.

This module CANNOT make a terminated ChatGPT conversation resume. It is an
input to the independent persistent supervisor, which must actually schedule
successors. It prevents a milestone or an agent turn from being marked complete.
"""
from dataclasses import dataclass
from typing import Mapping, Any


@dataclass(frozen=True)
class Result:
    status: str
    reason: str
    runnable: tuple[str, ...]
    blocked: tuple[str, ...]
    missing_proofs: tuple[str, ...]


PROOF_KEYS = (
    "trusted_broker_integrated",
    "jobs_cannot_bypass_broker",
    "github_allow_and_deny_live",
    "cloudflare_allow_and_deny_live",
    "role_replacement_live",
    "oauth_inference_and_refresh_live",
)


def assess(state: Mapping[str, Any], *, proofs: Mapping[str, bool],
           dependencies: Mapping[str, str]) -> Result:
    """Return a state based on evidence, never on agent prose.

    dependencies maps outstanding job IDs or proof IDs to a confirmed
    external blocker description. Empty strings do not constitute blockers.
    """
    if not isinstance(state, Mapping) or not isinstance(state.get("jobs"), dict):
        raise ValueError("invalid durable assignment state")
    jobs = state["jobs"]
    if not isinstance(proofs, Mapping) or not isinstance(dependencies, Mapping):
        raise ValueError("invalid evidence data")
    missing = tuple(k for k in PROOF_KEYS if proofs.get(k) is not True)
    unfinished = tuple(k for k, v in jobs.items()
                       if not isinstance(v, Mapping) or v.get("status") != "done"
                       or not isinstance(v.get("last_result"), Mapping)
                       or v["last_result"].get("verified") is not True
                       or v["last_result"].get("turn_completed") is not True
                       or not v.get("checkpoint"))
    if state.get("stopped") is True:
        return Result("owner_stopped" if state.get("stop_source") == "owner" else "stopped",
                      "durable stop is not completion", (), unfinished, missing)
    # A turn.completed, a local test result, or a committed PR is not a
    # substitute for actual acceptance evidence.
    if not unfinished and not missing:
        return Result("complete", "all work and external proofs verified", (), (), ())
    outstanding = unfinished + missing
    runnable = tuple(key for key in outstanding
                     if not isinstance(dependencies.get(key), str)
                     or not dependencies.get(key, "").strip())
    blocked = tuple(key for key in outstanding if key not in runnable)
    if runnable:
        return Result("continue", "remaining executable work exists", runnable, blocked, missing)
    return Result("external_blocked",
                  "all remaining work has specific recorded external dependencies",
                  (), blocked, missing)


def require_valid_exit(result: Result) -> None:
    """For supervised use: a supervisor must not accept a premature close."""
    if result.status not in ("complete", "owner_stopped", "stopped", "external_blocked"):
        raise RuntimeError("unfinished runnable work: supervisor must continue or recover")
