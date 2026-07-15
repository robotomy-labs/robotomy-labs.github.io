---
title: "The G1 doesn't send mic audio over its WebRTC audio track"
tags: [webrtc, audio, firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

A WebRTC audio transceiver set to `sendrecv` connects without error, but zero audio frames arrive from the robot's microphone over the WebRTC audio track — confirmed over a sustained 15-second window with `switchAudioChannel(True)` active, not a brief timing issue.

## Environment

- Unitree G1 EDU, firmware 1.4.5
- `unitree_webrtc_connect`, WebRTC audio transceiver (`sendrecv`)

## Root Cause

The G1 simply doesn't route microphone audio over the WebRTC audio track on this firmware — the transceiver accepts the connection and the channel toggle without error, which makes the absence of data look like it should be a bug somewhere in the client rather than a platform limitation. It isn't a bug to fix; the audio path just doesn't exist on this transport.

## The actual mic-audio paths that do work

Two real alternatives, each suited to a different use case:

- **`rt/audio_msg`** (DDS topic) — ASR *text* output, not raw audio. Useful if you want the robot's own onboard speech recognition result, not the underlying audio.
- **UDP multicast at `239.168.123.161:5555`** — raw PCM16, 16kHz mono. This is the actual raw-audio path, if what you need is the microphone signal itself rather than a transcript.

Neither of these is the WebRTC audio track — both are separate transports entirely.

## What's still unconfirmed

WebRTC audio **send** *to* the robot's speaker (the other direction on the same `sendrecv` transceiver) was not tested as part of this investigation — the transceiver accepted the channel toggle without error, which is a mild positive signal, but "didn't error" isn't the same as "confirmed working." Worth testing directly before relying on it, not assuming it works by extension from the fact that receive doesn't.

## Time cost

A dedicated test session to confirm the negative result cleanly (a full 15-second window with the channel actively toggled) rather than concluding "it doesn't work" from a shorter, less certain observation.
