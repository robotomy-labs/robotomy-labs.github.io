---
title: "Mic gain is two independent settings, not one"
tags: [audio, jetpack]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Voice activity detection (VAD) intermittently fails to trigger, even though the microphone is confirmed physically working and audio is visibly being captured. Confidence/loudness thresholds just aren't being cleared.

## Environment

- Jetson Orin NX, JetPack 6.2
- USB mic input via `module-echo-cancel` (PulseAudio virtual source, referred to here as `ec_mic`)
- Silero VAD

## Root Cause

There are **two separate gain layers** in this audio path, and they reset independently. Fixing one does not fix the other, and it's easy to assume you've solved the problem after fixing only the first one you find:

| Layer | Symptom | Fix | Status |
|---|---|---|---|
| **ALSA** (hardware) | Mic capture volume resets to 0 on every reboot | `amixer` re-set with dynamic card-number detection, run at startup | Handled |
| **PulseAudio** (`ec_mic`) | The echo-cancel virtual source defaults to 33% gain, independent of whatever the ALSA layer underneath is set to | `pactl set-source-volume` call, added to startup script | Handled |

The two layers are genuinely independent — this isn't a duplicate report of the same "resets to zero" bug. `ec_mic`'s 33% default gain is insufficient on its own to clear Silero VAD's confidence thresholds, regardless of what the underlying ALSA hardware gain is set to. Both settings must be correct simultaneously for VAD to fire reliably.

## Fix

Add both corrections to your startup sequence, not just one:

```bash
# ALSA layer — hardware capture gain, resets on every reboot
amixer -c <card_number> set <Mic Control Name> <level>%

# PulseAudio layer — ec_mic gain, independent of ALSA, also resets
pactl set-source-volume ec_mic <level>%
```

## Why this is worth documenting explicitly

Without knowing these are separate layers, the natural debugging path is: fix the ALSA reset, test, still broken, conclude the mic itself is faulty or VAD thresholds are miscalibrated — when the actual remaining gap is a completely separate PulseAudio-layer setting that was never touched. Production can silently inherit whatever gain PulseAudio last cached, with no error surfaced anywhere, meaning this can regress after any reboot with zero warning.

<p className="ro-meta-row">Time cost: Moderate — the ALSA-layer fix was already known from prior work, which made the PulseAudio layer genuinely surprising to find as a second, independent cause of the same symptom.</p>
