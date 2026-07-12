---
title: "Firmware 1.5.1 broke external WebRTC — here's the full arc"
tags: [webrtc, firmware]
---

## Symptom

After updating to firmware 1.5.1, every external WebRTC connection to the G1 fails outright. Any custom stack built on top of WebRTC (gesture dispatch, vendor-ASR-adjacent audio, anything) stops working with no graceful degradation — it just breaks.

## Environment

- G1 EDU, firmware 1.5.1 (break) → 1.5.2 (resolution)
- External/community WebRTC client, not the vendor Unitree app

## Root Cause

Firmware 1.5.1 changed the `/con_notify` endpoint to return `data2=3` — a new BLE-derived, device-specific key that's now required as part of the WebRTC handshake. Any client that doesn't derive and present this key gets rejected at the handshake stage. This wasn't documented publicly at the time; it surfaced through community investigation (credit: legion1581, maintainer of the community WebRTC client, actively investigating in parallel).

## What we did while it was blocked

Rather than sit idle waiting on a vendor fix:
1. Captured a BLE HCI snoop log on Android (Developer Options → BLE HCI snoop log → connect via the Unitree app → pull `btsnoop_hci.log`) to give the community investigation real data to work from.
2. Shared it on the relevant GitHub issue tracking the regression.
3. Used the downtime productively on work that didn't depend on the robot being network-operational at all — gesture-authoring tooling and the digital face system both moved forward during this window, which meant we arrived at the next phase with two modules already done instead of blocked behind firmware.

## Fix / Resolution

Firmware 1.5.2 resolved the conflict this had also caused with vendor ASR (`rt/audio_msg`) — confirmed via a dedicated hardware test session: the topic now stays alive whether the Unitree app is open or closed, where previously WebRTC and vendor ASR were mutually exclusive. Full test results:

| Test | Result |
|---|---|
| `rt/audio_msg` alive on 1.5.2 | ✅ Pass — ASR transcripts, `play_state`, `emotion` field all publishing |
| WebRTC conflict with `rt/audio_msg` | ✅ Resolved — no longer mutually exclusive on 1.5.2 |
| `AudioClient.PlayStream()` onboard speaker | ✅ Pass — clean audio, app open and closed both work |
| `rt/arm_sdk` | ✅ Pass — reference example confirmed, balance intact |

## Why this is worth documenting as an arc, not just a fix

The interesting part isn't just "it broke, then it got fixed" — it's that the fix came from a specific, credited community investigation, not a quiet vendor patch note. If you hit an opaque WebRTC failure after a firmware update on this platform, checking community trackers (not just vendor changelogs) is a legitimate, sometimes-faster path to an answer.

<p className="ro-meta-row">Time cost: Multiple sessions of dead-end debugging before the root cause (the BLE key change) was identified by the community; the actual verification of the 1.5.2 fix took one dedicated hardware test session.</p>
