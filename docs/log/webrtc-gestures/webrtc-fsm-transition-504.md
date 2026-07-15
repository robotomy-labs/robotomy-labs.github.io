---
title: "504 Gateway Timeout during FSM transitions — connect before, not after"
tags: [webrtc, firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

New WebRTC connection attempts to the G1 return `504 Gateway Timeout` (from the WebRTC server on port 8081) specifically while the robot is transitioning FSM states — for example, entering operation/standing mode via the remote controller.

## Environment

- Unitree G1 EDU, firmware 1.4.5
- WebRTC server, port 8081

## Root Cause

The WebRTC server on port 8081 appears unable to service new connection *attempts* while an FSM transition is actively in progress — a timing window where the server is presumably busy handling the state change itself and doesn't respond to new session negotiation in time.

## Fix

Connect while the robot is in a stable state first — damping or standing, anything that isn't mid-transition — then transition FSM states afterward, while keeping the already-established WebRTC session alive. **The existing session survives an FSM transition cleanly** — this isn't a "reconnect after every state change" problem, it's specifically a "don't attempt a *new* connection during the transition window" problem.

```
✅ Connect (stable state) → transition FSM → session survives, keep using it
❌ Transition FSM → attempt new connection during transition → 504
```

## Why this is worth knowing ahead of time

This is easy to hit by accident if connection logic is triggered reactively — e.g., a script that connects in response to the robot reaching standing mode, rather than connecting first and letting the robot transition afterward. The fix is really just a sequencing change, not a retry-logic or timeout-tuning problem, so it's worth getting the order right from the start rather than working around the symptom with longer timeouts or retry loops.

## Time cost

Low once identified — the confusing part was initially treating it as a flaky-connection problem worth adding retry logic for, before recognizing it was a specific, avoidable timing window instead.
