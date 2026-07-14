---
title: "Diagnosing an intermittent Dex3-1 hand fault without touching the hardware"
tags: [firmware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

The left Dex3-1 dexterous hand showed 0% communication quality for the thumb in the Unitree app, with the hand physically stiff. The right hand remained fully nominal throughout. No ROS-level fault was co-occurring at the time the symptom first appeared.

## Environment

- Unitree G1 EDU+, Dex3-1 force-controlled dexterous hands
- ROS 2, standard `/dex3/left/*` and `/dex3/right/*` topic set

## Safety posture, decided before any diagnostic step was taken

Worth stating explicitly, because it shaped every decision that followed: the hand was treated as a high-energy system throughout. No forced backdriving of a clamped joint, no disassembly, no connector reseating, no firmware flashing, no calibration utilities beyond vendor guidance. All ROS 2 interaction was observation-only — no deliberate publishing to `/dex3/left/cmd` during fault reproduction, telemetry reads only.

The reasoning: Dex3-1 contains its own independent MCU and safety firmware. When a safety clamp engages on a joint, sending it further commands can increase risk or actively obscure the actual root cause rather than reveal it. The diagnostic plan prioritized isolation and repeatability over intervention, on purpose, from the start.

## Diagnostic sequence

**A — Establish the symptom.** Confirm scope: left thumb only, right hand unaffected, no ROS fault initially co-occurring.

**B — Isolation boot test.** The critical move: a battery-only cold boot, with no Ethernet, no ROS running at all. This directly rules out an entire category of suspects (ROS graph issues, DDS transport, an external command source) in one step — if the fault reproduces with nothing but the robot's own battery power, it isn't caused by anything upstream of the hand itself. It did reproduce.

**C — Attempt a non-invasive recovery.** Power down, remove the battery for 10+ minutes, reinstall, reboot, observe. This is the one "does the obvious thing help" step, tried before going deeper — the condition persisted, not reliably cleared.

**D — Verify the ROS graph itself.** Confirm the relevant topics (`/dex3/left/state`, `/dex3/right/state`) exist and that nothing is unexpectedly publishing to `/dex3/left/cmd`. This step exists to rule out "is something in my own stack accidentally commanding the hand" before trusting any fault data gathered from it.

**E — Quantify the fault with real telemetry, not just a visual impression.** Sampled `tau_est` (estimated joint torque) at idle, left vs. right, both single-shot and as a 10-sample time series at 2Hz:

```bash
# single-shot snapshot
ros2 topic echo /dex3/left/state --once | awk '...'
ros2 topic echo /dex3/right/state --once | awk '...'

# 10-sample time series
for i in {1..10}; do
  ros2 topic echo /dex3/left/state --once | awk '...'
  ros2 topic echo /dex3/right/state --once | awk '...'
  sleep 0.5
done | tee dex3_postreset_10samples.txt
```

This surfaced the actual fault signature: left joints idx0–2 reported extreme, fixed `tau_est` values across every sample — not noisy, not intermittent within the sample window, *latched*. Right hand stayed in a normal idle band with only minor variation. This single piece of quantified evidence is what turned "the hand feels stiff" into a specific, comparable, reproducible signature.

**F — Real tooling friction, documented rather than glossed over.** `ros2 node list` and related CLI commands hung mid-session; a workstation reboot restored normal behavior. Worth including in the report rather than treating as a footnote — this kind of friction eats real diagnostic time and is worth planning for explicitly in any future incident.

**G — A genuine dead end, also documented.** `/SymState` and a `/robot_state` service were visible on the ROS graph, but decoding them required vendor interface definitions (`unitree_go/msg/SymState`, `unitree_api/srv/Generic`) that weren't present in the local environment. Attempting to query them failed outright — not a bug, just a missing schema. Worth knowing this path exists and is currently blocked, for next time.

**H — Confirming intermittency, not just resolution.** A later boot showed the hand return to fully normal behavior. A second 10-sample good-state capture confirmed symmetric, nominal `tau_est` on both hands — giving a real baseline to compare any future fault-state capture against.

## Findings

- The fault reproduces with no external tethering and no ROS running at all — this alone strongly implicates something hand-local, not anything in the software stack.
- The fault signature is specific and quantified: extreme, fixed `tau_est` on left joints idx0–2 at idle, right hand nominal throughout.
- A hard power-cycle does not reliably clear it.
- The hand can spontaneously return to nominal on a later boot — confirming this is a genuinely intermittent condition, not a permanent failure discovered late.

## Working hypothesis (explicitly non-invasive)

The evidence best fits an intermittent hand-local fault — harness/connector marginality, thumb actuator driver/encoder instability, or hand-MCU initialization timing sensitivity are all consistent with what was observed. This is a hypothesis, not a conclusion, precisely because no invasive step was taken that would have confirmed a specific physical cause — and that trade-off was made deliberately, given the safety posture above.

## When to escalate to the vendor, decided in advance

Rather than deciding this reactively mid-incident, escalation triggers were defined ahead of time: the fault becoming persistent across boots, alarm frequency increasing, sustained mechanical stiffness, or a safety clamp preventing safe operation at all. None of these had occurred at the time of writing — the incident report itself, plus the evidence bundle, was prepared specifically so escalation (if it becomes necessary later) starts from a complete diagnostic record rather than a vague "it's been acting up" report.

## Resolution

Worth adding honestly, since it's a useful data point on its own: **the depth of this diagnostic work turned out not to be what resolved things.** Unitree support's actual ask was much simpler than the evidence bundle above — a video of the fault behavior and the telemetry log. Once received, Unitree's response was to ship a replacement thumb module for a self-service swap, rather than requesting the full diagnostic package, further remote debugging, or an in-person service visit.

That's worth knowing going in, if you hit something similar: the rigorous isolation-and-quantify methodology above is genuinely the right way to *diagnose* a hand-local fault confidently and safely — but if the actual goal is getting a working robot back quickly, a clear video plus a basic state log may be all vendor support actually needs to act. The careful methodology's real value turned out to be confidence in the diagnosis and safety posture along the way, not a prerequisite for getting help.

## Why this is worth documenting as a methodology, not just an incident

The valuable part here isn't the specific fault — it's the discipline: isolate before intervening, quantify before concluding, document dead ends as clearly as findings, and decide your escalation criteria before you're in the middle of deciding under pressure. That approach generalizes to any hardware-level fault on this platform, not just this specific hand issue.

## Time cost

A conservative planning estimate for a similar incident: multiple hours, spread across sessions — driven by the safety posture itself (waiting periods for battery discharge, deliberately unhurried verification steps) rather than any single diagnostic step being slow.
