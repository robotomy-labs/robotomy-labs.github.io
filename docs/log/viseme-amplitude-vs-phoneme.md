---
title: "Amplitude-based lip sync over phoneme-based — a scope decision, not a quality one"
tags: [audio]
---

## The situation

A robot face renderer needs to move its mouth in sync with speech audio. There are two fundamentally different ways to drive that: read the raw volume envelope of the audio as it plays, or have the TTS engine itself output phoneme/viseme timestamps alongside the audio, and drive precise mouth shapes from actual speech sounds.

This decision had to be made *before* evaluating which TTS engine to use, not after — because it constrains which engines are even eligible. Not every TTS engine outputs phoneme alignment data at all, so committing to phoneme-based sync would have removed otherwise-strong candidates from consideration for a reason unrelated to their actual speech quality or latency.

## The two options, honestly compared

| | Amplitude-based | Phoneme-based |
|---|---|---|
| How it works | Read PCM volume envelope from the audio stream, drive mouth shape from volume buckets (open/mid/closed) | TTS outputs phoneme or viseme IDs with timestamps; mouth shape driven by actual speech sounds |
| TTS requirement | None — works with any engine that outputs audio | Requires an engine that specifically outputs phoneme alignment; not all do, and not all do so on every platform |
| Visual quality | Good — mouth moves naturally with the rhythm of speech | Meaningfully more accurate — mouth shapes actually match speech sounds |
| Implementation cost | Zero — already built | Medium — requires a second parallel data channel (viseme sequence) alongside audio in the pipeline |

## The decision: amplitude-based

Chosen deliberately, not as a fallback. The reasoning:

**It decouples the viseme system from the TTS decision entirely.** Any TTS engine can be swapped in or out later without touching the face-rendering pipeline at all — a real advantage when the TTS engine itself was still an open decision at the time (and did in fact change later, from a placeholder to ElevenLabs Flash v2.5). Coupling lip sync to a specific engine's phoneme output would have made that later TTS swap a two-system change instead of a one-system change.

**It matches the actual bar for this project's current milestone.** The near-term goal was proving the core interaction loop is reliable — not shipping the most visually polished lip sync achievable. Amplitude-based sync is "good enough" for that bar, and phoneme-based accuracy is a real upgrade that can be added later, once there's a concrete reason (e.g. a demo video milestone where visual polish specifically matters) that justifies the added complexity.

**It's explicitly parked, not rejected.** Phoneme-based sync remains a known, scoped option for later — the decision wasn't "amplitude forever," it was "amplitude now, revisit if and when visual quality demands it."

## The general pattern here

This is a recurring shape in this project's decisions: **default to the option that has the fewest hard dependencies on other not-yet-finalized decisions**, even when a more sophisticated option exists, and treat the sophisticated option as a scoped future upgrade rather than something to build in from day one. The CUDA-backend decision (containerize rather than hand-compile) and this viseme decision both follow that same shape, even though the underlying technical domains are completely different.

<p className="ro-meta-row">This is a decision-rationale entry — nothing was broken here, the reasoning is the reusable part.</p>
