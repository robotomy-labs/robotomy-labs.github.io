---
title: "The dedicated kill-phrase mic plan died at the USB port count"
tags: [audio]
sidebar_custom_props:
  entry_type: pitfall
---

## The situation

The original safety design called for a dedicated second microphone for the kill-phrase listener — physically separate from the visitor-facing mic, on its own capture device and audio thread, never sharing a PulseAudio stream with the main STT pipeline. The reasoning was sound: a safety-critical listener sharing infrastructure with the thing it might need to interrupt is a real design smell (see [the SAFE_IDLE two-tier safety entry](/docs/log/safety-reliability/safe-idle-two-tier-safety) for the general principle).

That plan didn't survive contact with the actual hardware.

## The constraint

The platform has exactly **4 USB-C ports, all already occupied** by other required peripherals. A dedicated second mic isn't an option without either displacing something else that needs a port, or adding external hardware the project wasn't planning to carry.

Before assuming the dedicated-mic plan was simply dead, it was worth actually checking whether the *existing* mic hardware had any usable path to serving both consumers — specifically, the Jieli USB receiver already in use has two physical microphone capsules on it (intended for stereo/dual-mic capture). Checking `arecord -l` and `pactl list sources short` against it directly, rather than assuming.

**Finding:** the Jieli receiver merges both of its physical mics into a single mono ALSA capture device *before* the signal reaches the OS at all — `alsa_input.usb-Jieli_Technology_USB_Composite_Device...mono-fallback`, one channel, 48kHz. There's no separate left/right channel to split out in software. Both mics are already summed at the hardware/driver level, upstream of anything Linux-side could intervene on.

## What this meant

The dedicated-mic design had to be abandoned — not because it was a bad idea, but because the specific hardware on hand had no path to supporting it without new hardware. The actual resolution (checking the kill phrase against the same audio stream already feeding the visitor-facing STT, rather than a separate dedicated capture) is documented as its own entry: [the kill-phrase re-architecture](/docs/log/safety-reliability/kill-phrase-stt-latency-spike).

## Why this is worth documenting as its own entry, separate from the fix that followed

The instinct when a safety design hits a hardware wall is to treat it as a failure of planning. It wasn't — the original design was the right one to *want*; the actual constraint (4 ports, all full, receiver hardware pre-merging the channels) simply wasn't knowable until checked directly against the real hardware. Worth normalizing: a safety-relevant design changing shape because of a genuine hardware constraint, confirmed by direct investigation rather than assumption, is a sign of a project actually checking its assumptions — not a corner being cut.

## Time cost

Under an hour to confirm via `arecord`/`pactl` — the real cost was in adjusting the safety design's shape afterward, covered in the following entry.
