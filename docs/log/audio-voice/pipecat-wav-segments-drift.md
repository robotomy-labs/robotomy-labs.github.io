---
title: "Pipecat's SegmentedSTTService silently double-wraps audio unless you override one flag"
tags: [pipecat, audio]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

A custom STT service wrapping an external HTTP endpoint (rather than using Pipecat's built-in in-process `WhisperSTTService`) produces corrupted or unreadable audio at the transcription backend — even though the same audio plays back correctly outside the pipeline.

## Environment

- Pipecat (`pipecat-ai==1.5.0`)
- Custom `STTService` subclass wrapping a containerized FastAPI STT endpoint over local HTTP (not Pipecat's native in-process Whisper loader)
- Reason for the custom wrapper in the first place: Pipecat's native `WhisperSTTService` loads `faster-whisper` in-process via `ctranslate2`, which has no CUDA-enabled aarch64 wheel on PyPI — the same category of problem as the CycloneDDS version pin. A containerized HTTP wrapper sidesteps that entirely.

## Root Cause

Pipecat's `SegmentedSTTService` base class — which any custom STT service subclasses — has an attribute, **`wants_wav_segments`, that defaults to `True`**. When true, Pipecat itself wraps the raw audio buffer in a WAV container before handing it to your service's `run_stt()` method, on the assumption that your STT backend expects a properly-headered WAV file rather than raw PCM.

If your own wrapper *also* WAV-wraps the audio (reasonable, since you're sending it to an HTTP endpoint that expects a real file), the result is a **WAV file wrapped inside a WAV file** — a corrupted structure that neither looks like an error at the Pipecat layer nor obviously points back to "double-wrapping" as the cause when the STT backend chokes on it.

## Fix

Override the flag explicitly in your custom service:

```python
class RossbotWhisperSTT(SegmentedSTTService):
    wants_wav_segments = False  # we do our own WAV wrapping before the HTTP call

    async def run_stt(self, audio: bytes):
        # audio here is raw PCM, not pre-wrapped — safe to wrap once, ourselves
        ...
```

## Why this is worth checking for explicitly, not just this one flag

This surfaced during a deliberate **API-surface drift check** — installing the pipeline framework fresh and diffing its actual current behavior against what the integration code assumed, rather than trusting that assumptions made when the wrapper was first written still hold. That check is what caught this; it wouldn't have shown up from reading your own code in isolation, since your own code was internally consistent — the mismatch was between your code's assumption and the framework's actual default.

**General takeaway:** when building a custom subclass against a framework base class, checking the base class's actual default attribute values (not just the methods you're overriding) is worth doing explicitly, especially after any framework version bump — defaults like this one change behavior silently, with no deprecation warning or error at the call site.

<p className="ro-meta-row">Time cost: Caught proactively during a deliberate gate-check step before it ever reached live hardware — worth noting as a case where a systematic verification step (rather than debugging a live failure) found the bug before it cost real debugging time.</p>
