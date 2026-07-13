---
title: "Containerize the wheel, don't fight it — a decision, not a fix"
tags: [docker, cuda, jetpack]
sidebar_custom_props:
  entry_type: decision
---

Most entries on this site follow Symptom → Root Cause → Fix, because most problems here are genuinely that shape: something broke, here's why, here's the exact command. This one isn't that. Nothing was broken. This is a record of a decision made *before* anything broke — the kind of judgment call that doesn't show up in a bug report, but shapes everything downstream of it.

## The situation

`faster-whisper` depends on `ctranslate2`. `ctranslate2` has no official CUDA-enabled wheel for aarch64 (the Jetson's architecture) on PyPI. This is a real, structural gap — not a version mismatch, not a missing flag. The wheel that would make GPU-accelerated STT work in-process on this hardware simply doesn't exist upstream.

Pipecat's native `WhisperSTTService` assumes you'll load `faster-whisper` in-process, in the same Python environment as the rest of the pipeline. That assumption is reasonable on x86 hardware with normal PyPI wheels available. It quietly falls apart on a Jetson.

## The options actually on the table

**Option A — compile `ctranslate2` from source, against this Jetson's exact CUDA/cuDNN versions, and hope it stays working.** Possible. Also fragile: any future CUDA or JetPack upgrade risks silently breaking a hand-compiled binary with no upstream maintainer keeping it aligned to new versions. This is exactly the failure mode that had already been hit once before, with `llama.cpp` compiled by hand against CUDA 11.4 — functional, but a dead end that had to be abandoned once the platform moved to JetPack 6.2.

**Option B — a containerized HTTP wrapper.** Use `dustynv/faster-whisper`, a prebuilt jetson-containers image where someone with deeper Jetson/CUDA-build expertise than a single side-project has already solved the aarch64+CUDA wheel problem, and maintains it against new JetPack releases. Wrap it in a thin FastAPI service exposing `/transcribe` and `/health` over local HTTP. Call it from a custom Pipecat `STTService` subclass in the main venv, over `localhost`.

## The decision

Option B. Not because it's clever — because it correctly assigns the hard problem to the party best equipped to keep solving it.

Hand-compiling CUDA bindings from source is a skill this project doesn't need to specialize in, and every hour spent maintaining a hand-built binary against future CUDA bumps is an hour not spent on the actual robot. The jetson-containers maintainers already carry that burden, continuously, for exactly this class of problem. Using their solved output — rather than re-solving it independently — is the same instinct that later drove the Ollama container decision (`dustynv/ollama`, isolated in its own container over local HTTP) rather than hand-installing an LLM runtime directly into the SDK venv.

The mental model that made this decision easy: **treat "no aarch64+CUDA wheel exists" the same way you'd treat "no driver exists for this hardware" — as a signal to use someone else's maintained solution, not a challenge to personally overcome.** That's a deliberate reframe. The instinct to compile it yourself and prove it can be done is a real pull, and worth naming as a pull to resist, not just a path that happened to lose out.

## What this bought, concretely

- The STT container updates independently of the SDK/Pipecat venv — a JetPack or CUDA bump doesn't require re-compiling anything by hand
- The same local-HTTP-container pattern now covers both LLM (Ollama) and STT (faster-whisper), which means the project has one repeatable integration pattern instead of two different bespoke ones
- Zero hand-maintained CUDA build artifacts anywhere in the current stack — a meaningful reduction in what future-me has to personally understand to keep this running

<p className="ro-meta-row">This is a decision-rationale entry, not a pitfall — nothing here was broken. Filed alongside the log because the reasoning is the reusable part.</p>
