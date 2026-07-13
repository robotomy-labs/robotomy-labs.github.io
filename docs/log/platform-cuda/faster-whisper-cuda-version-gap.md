---
title: "The faster-whisper container runs one CUDA minor version ahead of the host — noted, not yet a problem"
tags: [docker, cuda]
---

## The situation

The jetson-containers `autotag` script resolves the correct prebuilt image for a given host automatically — normally an exact match. For faster-whisper specifically, on this host (L4T 36.4, CUDA 12.6), `autotag` resolved to `dustynv/faster-whisper:r36.4.0-cu128-24.04` — **CUDA 12.8, one minor version ahead of the host's actual 12.6.**

## Why this isn't (yet) a pitfall entry

Functionally, it works. The container's own benchmark suite, run against real audio on this exact hardware, showed 96–98% sustained GPU load, correct transcription output, and no errors — confirmed via `tegrastats` during active transcription, not just assumed from a clean exit code. `autotag` judged this the closest compatible match available, and in practice, it's a genuinely working one.

## Why it's still worth flagging explicitly

A minor CUDA version mismatch between container and host *usually* doesn't matter — but "usually" isn't "never," and this is exactly the kind of small, easy-to-forget discrepancy that can resurface confusingly later, especially during a future upgrade. If the [SileroVAD/streaming STT upgrade](/docs/log/audio-voice/stt-upgrade-paths-open-questions) work happens later and something behaves unexpectedly, this version gap is worth checking again before assuming the new code is at fault — it's cheap to rule out, and easy to have forgotten about by then.

## The general pattern

When an automated tool (here, `autotag`) resolves a "closest available match" rather than an exact one, it's worth explicitly noting the gap at the time, even when everything currently works — rather than only discovering it later, mid-debugging-session, when a completely unrelated problem prompts someone to check container versions for the first time.
