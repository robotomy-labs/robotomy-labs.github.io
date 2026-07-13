---
title: "Milestone 0: nothing gets added until the gate passes"
tags: [pipecat]
sidebar_custom_props:
  entry_type: decision
---

## The situation

Once the core interaction loop existed in any working form — wake word, listen, respond, gesture, face, back to idle — the natural next instinct is to keep building: more gestures, vision, richer character behavior. That instinct was deliberately overridden with a hard rule instead.

## The gate

Before any new feature work — not "should be tested eventually," a genuine hard block:

| Criterion | Pass condition |
|---|---|
| Interaction loop | Wake → Listen → Respond → Gesture → Face → Idle — all six stages complete reliably |
| Stability | 100 consecutive interactions with no crashes |
| Operator intervention | Zero operator interventions during the entire 100-interaction run |
| Gesture safety | No gesture arbitrator failures, no DDS failures, no falls |
| Latency | P95 total latency (wake to first audio) under 5 seconds |
| Safety abort | Kill phrase fires from every state — confirmed specifically from IDLE, CONVERSING, mid-TTS, and mid-gesture, not just the easy case |
| Telemetry | A session summary is generated automatically, with every criterion above visible in the log and the pass/fail determination fully deterministic — not a judgment call |

Vision, additional gestures, and any further character complexity are explicitly withheld until this gate passes. Not paused — withheld. The rule states outright: don't propose adding features before this gate clears.

## Why a hard gate, rather than "test as you go"

**A single demo working once tells you almost nothing about reliability.** The [demo-crash misdiagnosis](/docs/log/safety-reliability/crash-not-wifi) is the concrete example of why: a pipeline that worked fine in casual testing failed live, from an unhandled exception that simply hadn't been triggered yet by the small number of prior runs. A hard numeric bar — 100 consecutive interactions, zero intervention — is specifically designed to surface exactly that class of rare, cumulative failure before it happens in front of real people, rather than after.

**Deterministic pass/fail removes the temptation to round up.** "It's basically working" and "100 consecutive interactions passed with zero intervention, logged and verifiable" are very different claims. The second one can't be fudged by an optimistic read of a mostly-good session — either the log shows 100 clean runs or it doesn't.

**Explicitly gating new features prevents the most common trap in a long-running side project: building sideways instead of down.** It's much more tempting to add a new gesture or a new expression than to go find and fix the crash-causing bug hiding in the existing loop — new features are visible progress, bug-hunting isn't. A hard, quantified gate makes "keep polishing what exists until it's actually solid" the only allowed path forward, rather than a discipline that has to be maintained by willpower alone.

## The general pattern

Given roughly 5 hours a week of actual development time on this project, every hour spent on a new feature that later gets undermined by an undiscovered reliability bug is an hour that's effectively wasted twice — once building the feature, again fixing the bug it exposed, likely under worse conditions (live, in front of people) than if it had been caught by a deliberate stability gate first. A hard numeric gate is a way of forcing that tradeoff to be made consciously, once, as a rule — rather than re-litigated every single week under the pull of "just one more feature first."

<p className="ro-meta-row">This is a decision-rationale entry — nothing here is a bug fix, it's a project-management discipline the codebase itself gets tested against.</p>
