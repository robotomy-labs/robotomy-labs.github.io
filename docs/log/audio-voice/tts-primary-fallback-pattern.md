---
title: "Reusing the cloud-primary/local-fallback pattern for TTS, not just LLM"
tags: [pipecat]
sidebar_custom_props:
  entry_type: decision
---

## The situation

The LLM layer already settled on a pattern: a cloud model (GPT-4o) as primary, a local model (via Ollama) as an offline/fallback tier. When it came time to decide the TTS architecture, the same fork appeared again — a cloud TTS engine (ElevenLabs) versus a fully offline one (Piper or Kokoro).

## The decision: apply the same pattern, deliberately, not by coincidence

ElevenLabs Flash v2.5 as primary, Piper/Kokoro evaluated as an offline fallback tier — explicitly mirroring the LLM primary/fallback structure, rather than re-deriving a TTS-specific answer from scratch.

## Why reusing the pattern is the right call here, not just convenient

**The underlying tradeoff is genuinely the same shape.** Cloud gives higher quality (frontier LLM responses; ElevenLabs' voice quality and, critically, its character-alignment data for lip sync — see [the viseme timing entry](/docs/log/audio-voice/elevenlabs-viseme-timing)) at the cost of a network dependency. Local gives resilience — no network dependency, no per-call cost — at the cost of quality and, in TTS's case specifically, no alignment/viseme data at all from most offline engines. That's the exact same axis the LLM decision already reasoned through.

**A functional requirement, not just a preference, tips the scale toward cloud as primary here.** Deepgram's Aura was evaluated and rejected specifically because it *couldn't* provide the viseme timing data the face-animation system needs — this isn't a close call decided on voice quality alone, it's a hard functional gap. Piper/Kokoro carry the same limitation as offline options: real, usable TTS, but no alignment data, meaning lip sync would fall back to the amplitude-based approach (see [that decision entry](/docs/log/audio-voice/viseme-amplitude-vs-phoneme)) whenever the fallback tier is active.

**One consistent pattern across the stack is easier to reason about than two bespoke ones.** Anyone reading this project's architecture only needs to understand "cloud-primary, local-fallback" once, and it applies to both the brain and the voice. That consistency has real value beyond just the individual technical merits of each choice.

## The honest tradeoff, inherited from the pattern itself

Whenever the fallback tier is active (network degraded or unavailable), TTS quality *and* lip-sync quality both degrade together — losing ElevenLabs means losing both frontier voice quality and the alignment data in the same failure. That's a real, compounding cost of the fallback path, not a free safety net. Worth knowing going in, rather than assuming "fallback" means "same experience, slightly lower quality."

<p className="ro-meta-row">This is a decision-rationale entry — the reasoning, not any specific code, is the reusable part.</p>
