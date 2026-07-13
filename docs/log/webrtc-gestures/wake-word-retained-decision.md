---
title: "Why the wake word stayed after adopting Pipecat"
tags: [pipecat]
sidebar_custom_props:
  entry_type: decision
---

## The situation

Pipecat brings its own voice-activity detection, barge-in handling, and turn-taking logic — real, working infrastructure that replaced a lot of hand-rolled code from the earlier build era (see [the containerize-vs-hand-compile entry](/docs/log/platform-cuda/containerize-dont-fight-the-wheel) for the same instinct applied to a different layer). A fair question during that migration: does Pipecat's own VAD make the old fuzzy-match wake-word system redundant? Both are, in some sense, about detecting when to start listening.

## The decision: keep the wake word

It stayed, because it was doing two distinct jobs that Pipecat's VAD doesn't do at all — VAD and wake-word detection aren't actually solving the same problem, even though they sound related.

**Job one: identity gating, not just activity gating.** VAD answers "is someone speaking right now?" It does not answer "is someone speaking *to the robot*?" In a real café, with staff, customers, and other children present and talking near the robot, VAD alone means every nearby conversation becomes a candidate for full pipeline processing — transcription, LLM inference, and a spoken response to speech that was never directed at the robot in the first place. In a public space with children specifically, that's not just wasted compute — it's the robot potentially responding to conversations it was never part of, which is its own kind of problem worth avoiding deliberately rather than accepting as a side effect of an otherwise-good framework upgrade.

**Job two: latency masking.** The wake-word trigger is the one clean moment where an instant, pre-recorded acknowledgment sound can fire while the real pipeline (STT → LLM → TTS) runs underneath it — this is what brought perceived response latency down to roughly 1 second, despite the actual pipeline taking closer to 2.5 seconds end to end. Without a wake-word trigger, there's no equivalent clean moment to fire that instant response — every reply would carry the full, un-masked pipeline latency, which is a materially worse experience for something meant to feel like a responsive character rather than a request/response tool.

## The resulting architecture

Wake-word detection sits in front of Pipecat's pipeline, not inside it, and isn't replaced by anything Pipecat brought. Pipecat took over the parts of the old hand-rolled pipeline that were genuinely reinvented wheels — VAD, echo-gating, turn-taking logic. Wake-word detection stayed custom specifically because it's doing something outside Pipecat's actual scope: identity-gating in a shared public space, plus a latency-masking trick tied to a specific product decision about how the character should feel to talk to.

## The general pattern

Adopting a framework doesn't mean everything the old system did becomes redundant just because the framework covers *something* in the same general area. The right question isn't "does the new framework have a feature that sounds similar" — it's "does the new framework's version of that feature actually do the specific jobs the old code was doing." Here, the answer was genuinely no for two distinct reasons, which is why the wake word earned a real, deliberate decision to keep it rather than being dropped by default during the migration.

<p className="ro-meta-row">This is a decision-rationale entry — nothing was broken, the reasoning is the reusable part.</p>
