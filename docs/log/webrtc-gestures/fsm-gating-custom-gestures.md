---
title: Custom gestures return success but never move
tags: [cyclonedds, firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Custom gestures recorded via the Unitree mobile app and dispatched by name (`api_id 7112`) return code `0` — success — from the RockChip arm service, but the robot never physically moves. Built-in numeric gestures (`api_id 7106`) execute correctly over the exact same WebRTC connection, at the exact same call site.

This is the worst kind of failure: no error, no exception, no crash. The API tells you it worked.

## Environment

- G1 EDU, firmware 1.4.5
- Custom WebRTC client (not the vendor app)
- Official Unitree C++ SDK reference behavior confirmed via direct technical contact

## Root Cause

The official SDK docs describe two distinct execution paths:

```
ExecuteAction(int32_t action_id)        // built-in gestures — by numeric ID
ExecuteAction(const std::string &name)  // taught gestures — by name, non-blocking
GetActionList(std::string &data)        // returns both lists + FSM requirements per action
```

The critical detail is buried in `GetActionList`'s return payload: it reports per-action **FSM state requirements**. Custom (taught) gestures are gated by the robot's finite-state-machine context — they will only dispatch to the motion controller if the robot is already in one of a specific set of FSM states. Built-in gestures have no such gate, which is exactly why they kept working while custom ones silently didn't.

The arm service accepts the taught-gesture request and returns success because the *request itself* is well-formed — but the motion controller downstream ignores it, because the FSM precondition isn't met. Nothing in the response indicates this. You only find it by reading the FSM-requirement field in `GetActionList`, which most integration examples never touch.

## Fix

Call `SetFsmId()` via `G1LocoClient` to set the robot into an accepted state (`500`, `501`, or `801`) **before** issuing any `api_id 7112` call.

```python
# before dispatching a custom (taught) gesture:
loco_client.SetFsmId(500)
# then:
arm_client.ExecuteAction(gesture_name)
```

## How we found it, not just the fix

Worth documenting the debugging path, since it's arguably more useful than the fix itself: the first instinct was to intercept the WebRTC data channel directly (`webrtc_channel_logger.py`), but that approach was blocked — a separate process (`video_hub_pc4`) permanently holds the external WebRTC slot and can't be displaced without disrupting robot operation.

The better approach turned out to be **DDS snooping** instead of WebRTC capture, for three concrete reasons:

| Factor | WebRTC capture | DDS snoop |
|---|---|---|
| Accessibility | Blocked by existing slot holder | Always accessible — no slot competition |
| Encryption | Potentially encrypted signaling | Unencrypted, raw JSON |
| Disruption | Requires displacing an active client | Passive subscriber, zero disruption |
| Completeness | Only sees data-channel messages | Sees *all* arm service traffic, including app-originated calls |

`rt/api/arm/request` and `rt/api/arm/response` are plain DDS topics carrying unencrypted JSON payloads for every arm command issued to the robot, from any source. Subscribing to them passively surfaced the exact FSM-requirement behavior described above — something that would have been much harder to find by only watching your own client's WebRTC traffic.

<p className="ro-meta-row">Time cost: ~1 full debugging session, most of it spent ruled out on the WebRTC-capture approach before pivoting to DDS.</p>
