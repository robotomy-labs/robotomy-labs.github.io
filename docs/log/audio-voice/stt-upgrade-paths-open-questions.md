---
title: "STT upgrade paths under evaluation — nothing decided yet"
tags: [audio, cuda]
---

:::note Research, not implementation
This is an honest snapshot of options actually researched, not a plan that's been started. Nothing below has been built or benchmarked on this project's actual hardware yet. Filed here as an open question, not a decision.
:::

## The problem being evaluated

The current STT setup (faster-whisper `large-v3`, full-attention architecture) hits a latency ceiling that scales with utterance length regardless of model size or tuning — an architectural limit, not a configuration problem (see the reasoning in [the JetPack ceiling post](/blog/jetpack-5-1-1-hard-ceiling) for the same category of "this isn't fixable by patching" judgment call, applied here to a different layer of the stack). Two candidate replacements have been researched. Neither has been benchmarked on this project's actual Orin NX yet.

## Option 1 — nano-parakeet

A pure-PyTorch reimplementation of NVIDIA's Parakeet-TDT, using a transducer architecture rather than full-attention — which is specifically what sidesteps the length-scaling latency problem. It has a genuinely light dependency footprint: 5 dependencies, versus roughly 180 for NeMo, the framework Parakeet models are normally run through.

**What's promising:** a public benchmark reports 84–112x real-time throughput on a Jetson AGX Orin 64GB — a 12-second audio clip transcribing in roughly 100–200ms of actual compute time. For this project's specific usage pattern (segmented, VAD-triggered, one full utterance at a time, not true incremental streaming), the batch-mode word-error-rate (6.32%) applies rather than the worse streaming-mode WER (9.22%) — meaning the accuracy cost of streaming mode doesn't need to be paid here at all, since streaming isn't actually the requirement.

**What's unresolved:**
- The public benchmark is from an AGX Orin 64GB — a meaningfully more powerful board than this project's Orin NX 16GB. Not yet benchmarked on the actual target hardware.
- There's a documented, real risk in the broader community around getting CUDA working with NeMo-adjacent tooling on Jetson hardware specifically — at least one independently-documented case of a Jetson Orin Nano user being unable to get CUDA working even after rebuilding NeMo from source, falling back to CPU-only.

## Option 2 — NVIDIA Riva

NVIDIA's own packaged, vendor-supported speech AI SDK. Notably, Riva's ASR model is itself built on the Parakeet architecture — meaning both research paths converge on the same underlying model family, just via a from-scratch reimplementation (nano-parakeet) versus NVIDIA's own supported packaging (Riva).

**What's promising:**
- Explicitly, officially supported on Jetson Orin NX 16GB per NVIDIA's own documentation — this project's exact hardware tier, not an adjacent one.
- As of recent NVIDIA documentation, Riva is now distributed through the standard jetson-containers catalog — the same distribution mechanism already used successfully for this project's Ollama and faster-whisper containers, which is a meaningfully smoother path than the standalone NGC quickstart scripts that generated real 2025-era complaints about Jetson deployment (models failing to load, silent hangs with no logs).
- Pipecat has a native `RivaSTTService` — likely no custom wrapper subclass needed at all, unlike the current Whisper integration which required a custom `STTService` subclass to bridge to a containerized HTTP endpoint.

**What's unresolved:**
- A new category of fragility this project hasn't had to deal with before: Riva's deployment pipeline compiles the ASR model into a TensorRT engine specific to the exact GPU/driver/TensorRT version combination in use. Unlike the portable model weights this project's current Ollama and Whisper containers use, a future reflash, driver update, or hardware swap could require rebuilding that compiled engine from scratch.

## Where this stands

Neither option has been started. NVIDIA Riva is the higher-priority candidate to actually try first, given the officially-supported hardware match and the jetson-containers distribution path — but "higher priority to try" is different from "decided." This section will get rewritten in place once real benchmarking happens on actual hardware, per this site's living-document convention for architecture pages.
