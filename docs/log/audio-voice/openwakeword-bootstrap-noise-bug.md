---
title: "openWakeWord's own startup noise can silently wreck your false-positive testing"
tags: [audio]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

A freshly retrained keyword-spotting model shows a 100% catch rate — and also a 100% false-positive rate. Every clip tested, positive or negative, trips the detector. This looks like "the model needs more data" or "the training set is bad," but it isn't either of those.

## Environment

- openWakeWord, custom-trained keyword model
- A lightweight, local, CPU-only KWS detector tapping raw PCM directly off an existing audio capture thread (no second capture path, no cloud dependency)
- Standalone test harness feeding both real and synthetic clips through the detector in isolation, before wiring it into anything live

## Root Cause

openWakeWord's own `AudioFeatures.reset()` / `__init__` seeds its internal feature buffer with noise before any real audio has actually filled it. Early in any clip — right after the buffer resets — the detector can produce a spurious, high-confidence score (observed as `0.9999`, effectively "detected" with near-total certainty) purely from that bootstrap noise, before the buffer has enough real audio in it to be scoring anything meaningful at all.

A 100%/100% result on a freshly retrained model is a strong tell that this is what's happening, rather than a genuinely broken model: **a real bug produces suspiciously perfect (or suspiciously terrible) numbers; a model that's actually just undertrained tends to produce messier, partial numbers instead.** That contrast is worth trusting as a diagnostic signal on its own — a clean 100% is a reason to go looking for a measurement bug before believing the model is either flawless or catastrophic.

## Fix

Confirm the bug directly with a minimal reproduction before touching the harness: feed the detector a known real negative clip and log the raw score chunk by chunk. The signature is unmistakable once you see it — spurious high scores in the first few chunks, settling to a clean, near-zero score (`0.000000`) once the buffer has genuinely filled with real audio.

```python
# minimal diagnostic — log every chunk's score to see the bootstrap artifact directly
for i, chunk in enumerate(real_negative_clip_chunks):
    score = detector.score(chunk)
    print(f"chunk {i}: score={score:.6f}")
# early chunks: spurious high score from cold/noise-seeded buffer
# later chunks: clean near-zero, once the buffer holds real audio
```

The actual fix is to ensure the detector doesn't score — or doesn't trust scores from — the buffer-warmup window immediately after a reset, rather than treating every chunk from the very first one as equally meaningful.

## Why this is worth checking for specifically, not just generally suspecting "bad training data"

This is a library-internal behavior, not something visible from your own training code or your own wrapper — it's easy to spend real time re-examining your training set, your synthetic sample generator, or your phrase choice before realizing the actual problem is in how the underlying feature extractor initializes. If you're using openWakeWord (or any keyword-spotting library with a similar rolling feature buffer) and see suspiciously extreme catch/false-positive numbers right after a retrain, checking the buffer-reset behavior directly — with a chunk-by-chunk score log like above — is worth doing before trusting either number.

## Context: why this surfaced at all

This came up while rebuilding a project's local kill-phrase detector — moving from piggybacking on an existing STT transcript (see [the earlier kill-phrase latency entry](/docs/log/safety-reliability/kill-phrase-stt-latency-spike) for that prior architecture) to a dedicated, local, CPU-only KWS tap directly on the raw capture stream, entirely independent of the main STT pipeline. Part of that work involved choosing a new, more phonetically distinctive kill phrase and properly validating the detector's false-positive and catch rates before considering it safe to wire into anything live — this bug surfaced during that validation process, on the very first retraining run, and would have produced badly misleading confidence in either direction (a falsely perfect model or a falsely broken one) if the numbers had been trusted without investigation.

## Time cost

Caught quickly specifically because the 100%/100% result was suspicious enough to investigate rather than accept — a less extreme, partially-wrong result from the same bug could easily have taken much longer to trace back to buffer initialization rather than the training data itself.
