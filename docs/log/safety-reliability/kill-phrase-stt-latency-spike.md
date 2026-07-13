---
title: "The kill-phrase listener's first working version added 14 seconds of STT latency"
tags: [pipecat, security]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

After the kill-phrase listener's first real implementation (following the hardware constraint documented in [the shared-mic entry](/docs/log/audio-voice/kill-phrase-shared-mic-constraint)), overall STT response latency spiked by roughly 14 seconds — a severe, immediately noticeable regression in normal conversational responsiveness, not a subtle one.

## Environment

- Shared mono Jieli mic stream (visitor STT and kill-phrase listener both consuming the same audio source, per the hardware constraint that ruled out a dedicated second mic)
- Kill-phrase listener's first implementation: a separate `parec` + Whisper thread, running independently alongside the main visitor-facing STT pipeline

## Root Cause

Running a **second, independent Whisper transcription thread** on the same shared mic stream — one for the kill-phrase listener, one for the main visitor STT pipeline — meant two full STT inference passes competing for the same limited compute on every utterance. The kill-phrase listener wasn't a lightweight tap on the stream; it was a second full transcription pipeline, and the hardware simply couldn't run two Whisper passes concurrently without one severely degrading the other.

## Fix

Rearchitected the kill-phrase check to **piggyback on the visitor STT pipeline's own transcript output**, rather than running a separate transcription pass at all. The kill-phrase check happens as the very first step inside the existing `asr_callback` — checked before the echo-gate, before de-duplication logic, before wake-word matching — against the transcript the main pipeline was already producing for its own purposes.

```python
def asr_callback(transcript: str):
    # kill-phrase check happens FIRST, before anything else,
    # against the transcript already being produced by the main STT pass —
    # no second transcription pipeline, no second inference cost
    if is_kill_phrase(transcript):
        trigger_safe_idle()
        return

    # echo-gate, dedup, wake-word matching follow after
    ...
```

This eliminates the second inference pass entirely — there's exactly one Whisper transcription happening, and the kill-phrase check is just an early, cheap string comparison against output that already exists for another reason.

## Why this is worth documenting as a real gotcha, not just "use fewer threads"

The instinct behind the original design — give the safety-critical listener its own independent processing path, so it doesn't depend on the main pipeline's health — is exactly the right instinct in general (see [the SAFE_IDLE safety design entry](/docs/log/safety-reliability/safe-idle-two-tier-safety)). It's the *specific implementation* of that instinct that backfired here: "independent" was interpreted as "a second full inference pipeline," when what was actually needed was just "checked before anything else, using output that already exists." The corrected version still achieves the actual safety goal (kill phrase checked first, unconditionally, before other logic) without paying for a second transcription pass that the hardware couldn't afford.

**The general lesson:** when a safety mechanism needs to be independent of a pipeline's internal state, that doesn't automatically mean it needs independent *compute* — sometimes the right independence is architectural (checked first, unconditionally) rather than a fully separate process competing for the same limited resources.

## Time cost

The regression was severe and immediately obvious (a 14-second spike is not subtle), which made diagnosis fast — most of the time cost was in re-architecting the fix correctly, not in finding the problem.
