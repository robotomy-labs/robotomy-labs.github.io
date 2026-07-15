---
title: "G1 sport/locomotion commands return 3203 over WebRTC — expected, not a bug"
tags: [webrtc, firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Standard Unitree sport/locomotion commands (`StandUp`, `BalanceStand`, etc.) sent via `rt/api/sport/request` return `code 3203` on the G1 EDU — "API not implemented on server."

## Environment

- Unitree G1 EDU, firmware 1.4.5
- `unitree_webrtc_connect`, LocalSTA connection

## Root Cause

Not a bug, and not fixable — G1 simply doesn't implement the sport-service API surface that these commands target. This is worth stating plainly since a `3203` response looks exactly like a fixable integration mistake (wrong parameter, wrong auth, wrong timing) rather than "this endpoint doesn't exist on this robot," and it's easy to burn real time debugging a call that was never going to succeed.

## The workaround

Use the physical Bluetooth remote controller to enter operation/standing mode instead of attempting it via WebRTC sport commands.

**One real constraint worth knowing about ahead of time:** the RockChip motion controller only allows **one WebRTC client at a time**. If a custom script is connected, the Unitree app gets disconnected — and the reverse is also true, so the app must be fully closed before a custom client can connect. The Bluetooth remote has no such conflict, since it doesn't go through the WebRTC session at all — which is exactly why it's the right tool for this specific step rather than fighting the single-session limit.

## Time cost

Under an hour once the pattern (this whole API family is simply absent on G1) was recognized rather than treated as a per-command bug to debug individually.
