---
title: "AudioClient.PlayStream() will reject audio that looks fine but isn't"
tags: [audio, firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Audio sent to the G1's onboard speaker via `AudioClient.PlayStream()` either doesn't play, plays corrupted, or fails silently — even when the source audio sounds completely normal on a computer.

## Environment

- G1 EDU onboard speaker path (RockChip-owned, via `AudioClient`, not the external USB audio path)
- TTS source: ElevenLabs (outputs `pcm_22050`)

## Root Cause

`PlayStream()` has a narrow, undocumented-until-you-hit-it format requirement: **16kHz mono, 16-bit PCM, little-endian (int16)**. Nothing else works, and there's no helpful error — the API accepts the call and the failure shows up as silence, glitching, or garbage audio rather than a clear rejection.

Two specific gotchas compound this:

1. **Sample rate mismatch.** ElevenLabs (and most modern TTS) outputs at 22050Hz or higher — you need to actually downsample, not just relabel the sample rate. A naive resample can introduce artifacts; `scipy.signal.resample_poly` gives a clean 3:1 downsample from 22050→16000Hz.
2. **Chunk size and pacing.** The API expects a specific chunk size — **96000 bytes, which is exactly 3 seconds of audio at 16kHz mono 16-bit** — with roughly a 1-second sleep between chunks. Sending audio in arbitrary chunk sizes, or streaming it too fast without pacing, causes playback issues even when the format itself is otherwise correct.

A separate trap worth flagging explicitly: **cached/pre-rendered WAV files can go stale silently.** A WAV cache generated at 48kHz (correct for a different playback path) will have corrupt frame counts when played through this 16kHz-only path — it's not that the file is broken, it's that it was rendered for the wrong destination. If you maintain a WAV cache across multiple audio-output paths, regenerate it explicitly for each target rather than assuming one WAV works everywhere.

## Fix

```python
import scipy.signal

# resample from ElevenLabs' native 22050Hz to the required 16000Hz
audio_16k = scipy.signal.resample_poly(audio_22050, up=16000, down=22050)

# chunk at exactly 96000 bytes (3 seconds @ 16kHz mono 16-bit), 
# with ~1s pacing between chunks
CHUNK_SIZE = 96000
for i in range(0, len(audio_bytes), CHUNK_SIZE):
    chunk = audio_bytes[i:i + CHUNK_SIZE]
    audio_client.PlayStream(chunk)
    time.sleep(1.0)
```

## Reference

Format and chunking behavior confirmed against Unitree's own reference example (`g1_audio_client_play_wav.py` + `wav.py` in `unitree_sdk2_python`) — worth diffing your own implementation against that reference directly if you hit playback issues, rather than debugging from format assumptions alone.

<p className="ro-meta-row">Time cost: A few hours, most of it spent on the WAV-cache staleness issue specifically — the format requirement itself was findable from the reference example, but a cache generated for a different sample rate produced a confusing "corrupt frame count" symptom that looked unrelated to sample rate at first.</p>
