---
title: "The demo didn't fail because of WiFi — it crashed"
tags: [pipecat]
---

## Symptom

During a live demo, the robot's conversational pipeline stopped responding roughly two minutes in. The initial, reasonable assumption at the time was WiFi degradation — a crowded venue, a flaky access point, a dropped connection. That assumption shaped the immediate post-mortem thinking and, for a while, the architecture priorities that followed.

## Environment

- Earlier build era (cloud-dependent voice stack: GPT-4o + Deepgram STT/TTS)
- Live public demo conditions — real network congestion was a genuinely plausible cause, which is part of why the wrong diagnosis was believable

## Root Cause

It wasn't WiFi. It was an **unhandled exception crashing the pipeline process entirely**, about two minutes into the live run. Once a single network or inference call threw without a caught exception boundary around it, the whole process died — not a hang, not a degraded state, a full crash to desktop. From the outside, mid-demo, a dead process and a dropped connection can look identical: silence, no response, nothing to debug live.

## Why the correct diagnosis matters more than the symptom

This is the finding that reframed the entire reliability strategy going forward: **the root cause was architectural (no crash resilience), not environmental (network conditions)**. That distinction changed what got prioritized next. If the working theory had stayed "WiFi is unreliable," the natural next steps would have been network-hardening — a different, and largely wrong, set of fixes for the actual problem.

## Fix / Resulting principle

- Exception boundaries around every network/inference call in the pipeline (STT calls, LLM calls) so a single failure degrades gracefully instead of taking the whole process down.
- A systemd unit with `Restart=on-failure` as the outer safety net, so even an unhandled crash recovers automatically rather than requiring a manual restart mid-event.
- More broadly, this became a standing principle for the project going forward: **reliability outweighs raw latency**. A faster pipeline that can silently die mid-conversation is a worse product than a slightly slower one that never goes fully dark. This is part of why a local-first architecture was prioritized later, even though it's not the lowest-latency option available — crash elimination, not speed, was the actual justification.

<p className="ro-meta-row">Time cost: The wrong diagnosis (WiFi) persisted for some time before the crash log was actually reviewed carefully enough to identify the unhandled exception — a good example of how an initially-plausible explanation can quietly stall the real fix.</p>
