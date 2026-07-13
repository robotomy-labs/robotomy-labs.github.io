---
title: "Planned: the gesture arbitrator will drop conflicting commands instead of queueing them"
tags: [pipecat]
sidebar_custom_props:
  entry_type: planned
---

:::note Not yet built
This describes an architecture decision made ahead of implementation — reasoned through before writing the code, not extracted from a working system. Nothing here has run on hardware yet. Filed here anyway, because the reasoning is useful now, and because a site documenting real development should show planning in progress, not just finished work.
:::

## The situation

Character gestures will be dispatched via `[G:tag]` markers embedded in LLM output and routed to `arm_sdk` position-control scripts. Without any coordination layer, two gesture requests arriving close together — one from the LLM's own output, one from a handler override, or simply two tags in quick succession — would produce **overlapping arm motion**: blended, undefined movement, or a locked joint state. With children physically present around the robot, that's not a failure mode this project is willing to leave to chance, even at the design stage.

## The design under consideration: a strict three-state lock, not a queue

```
IDLE ──[G:tag] received──▶ RUNNING ──motion complete──▶ COOLDOWN ──cooldown elapsed──▶ IDLE
                              │                              │
                    [G:] arriving here            [G:] arriving here
                      would be DROPPED               would be DROPPED
                    (never queued)                  (never queued)
```

Only the `IDLE` state would accept a new gesture request. Anything arriving while a gesture is `RUNNING` or in its post-motion `COOLDOWN` window gets dropped outright — not buffered, not queued for later execution. The one exception: a dedicated safety interrupt overrides this lock unconditionally, driving the arms straight to neutral regardless of what state the arbitrator is in.

## Why drop instead of queue

An earlier, more permissive plan considered a small buffer — queue a couple of pending gestures, fire them once the current one finishes, preempt based on priority. That plan is being set aside in favor of the strict lock, for a few reasons:

**A queued gesture would execute at a moment its trigger no longer describes.** If a gesture is requested in response to something happening in the conversation at time T, and it actually fires at T+3 seconds because it sat behind another gesture in a queue, it can land completely disconnected from whatever prompted it — visually incoherent to anyone watching, even though each individual gesture executes correctly in isolation.

**Dropping is a safe, well-defined failure mode. Queueing introduces new failure modes that all need separate answers.** How deep can the queue grow? What happens if a safety abort fires mid-queue? Does a stale queued gesture ever get silently dropped anyway once it's old enough to be irrelevant? A strict drop-lock makes all of those questions moot, because the situations they describe can't occur in the first place.

**It composes cleanly with the safety design already decided.** The [two-tier SAFE_IDLE system](/docs/log/safety-reliability/safe-idle-two-tier-safety) establishes that safety-relevant state should stay simple and independently verifiable. A strict lock with no queue is trivially easy to confirm has no hidden pending motion state — a queue is one more thing that would need separate verification during any safety review.

## The tradeoff, honestly

This does mean gesture requests can be silently lost — if a `[G:tag]` arrives while the arbitrator is mid-`COOLDOWN` from a previous gesture, that request simply never fires, with no retry. That's an accepted tradeoff going in: a missed gesture is a minor, mostly-invisible cosmetic gap. Overlapping arm motion is not, and this project would rather over-drop than risk that.

## What would change this

If real testing surfaces gesture requests getting dropped often enough to visibly hurt the character's responsiveness, the fallback isn't a full queue — it's a much smaller escape hatch (e.g. one single "next" slot, not an open-ended queue) that preserves the same verifiability property while covering the most common case. That's a deliberate fallback to keep in mind, not a sign the whole approach was wrong if it comes up.
