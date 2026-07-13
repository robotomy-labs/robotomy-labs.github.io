---
title: "ElevenLabs viseme timestamps are per-chunk, not per-utterance — and need a sample-rate correction on top"
tags: [audio]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Lip sync driven by ElevenLabs' character alignment data (`charStartTimesMs`) drifts out of sync with the audio as an utterance goes on — early words line up fine, later words are visibly off, and the drift gets worse the longer the response is.

## Environment

- ElevenLabs Flash v2.5, WebSocket streaming endpoint with alignment data enabled
- Audio played back via `AudioClient.PlayStream()` at 16kHz mono
- ElevenLabs' native output: `pcm_22050`

## Root Cause

Two independent issues stack on top of each other here, and either one alone would cause exactly this symptom — worth checking both, not just the first one you find:

**1. `charStartTimesMs` values are relative to each WebSocket chunk, not the whole utterance.** When ElevenLabs streams a response in multiple chunks, each chunk's alignment data restarts its timestamps from zero for that chunk. If you feed those timestamps directly into a single viseme schedule without accounting for this, every chunk after the first is scheduled as if it started at time zero — which looks like fine sync for the first chunk and increasingly wrong sync for every chunk after it.

**2. The audio itself gets resampled, but the alignment timestamps don't automatically follow.** ElevenLabs outputs at 22050Hz; `AudioClient.PlayStream()` requires 16kHz (see [the PlayStream format entry](/docs/log/audio-voice/audioclient-playstream-format)). The audio gets resampled to match, but the alignment timestamps are still expressed in terms of the original 22050Hz timeline unless explicitly corrected.

## Fix

**For the per-chunk issue:** track a cumulative offset across chunks, and add it to each chunk's timestamps before building the final schedule.

```python
cumulative_offset_ms = 0
viseme_schedule = []

for chunk in streaming_chunks:
    char_times = chunk["alignment"]["charStartTimesMs"]
    chars = chunk["alignment"]["chars"]
    
    for char, t_ms in zip(chars, char_times):
        absolute_t_ms = t_ms + cumulative_offset_ms
        viseme_id = CHAR_TO_VISEME.get(char.lower(), 0)
        viseme_schedule.append([absolute_t_ms, viseme_id])
    
    # advance the offset by this chunk's actual audio duration
    # before processing the next chunk
    cumulative_offset_ms += chunk_duration_ms
```

**For the sample-rate issue:** scale every timestamp by the ratio between the original and target sample rates before scheduling.

```python
RESAMPLE_SCALE = 22050 / 16000  # = 1.378125

scaled_t_ms = absolute_t_ms * RESAMPLE_SCALE
```

Apply both corrections together — cumulative offset first (to get a correct utterance-relative timestamp), then the resample scale (to correct for the sample-rate change) — before handing the final schedule to the face renderer.

## Why this is worth checking as two separate issues, not one

A partial fix (correcting only one of the two) produces a schedule that's *closer* to correct but still visibly wrong — which can send debugging down the wrong path, since "it's better but still off" looks like a tuning problem rather than "there's a second, independent bug still present." Worth explicitly verifying both corrections are in place if lip sync is even slightly off, rather than assuming one fix should have been sufficient.

## Time cost

Moderate — the cumulative-offset issue was identified first and looked like a complete fix; the residual drift after that fix took a second, separate investigation to trace back to the un-corrected sample-rate mismatch.
