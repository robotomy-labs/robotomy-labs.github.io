---
title: "Teaching kids to program a humanoid: sim first, harness always, teacher never leaves"
tags: [pipecat]
sidebar_custom_props:
  entry_type: planned
---

:::note Planned architecture
This describes a curriculum safety design reasoned through for a future teaching phase of this project — block-based programming, MuJoCo validation, and a physical harness workflow. Not yet built. Filed here because the safety architecture is worth documenting now, even ahead of implementation.
:::

## The situation

Part of this project's eventual goal is letting students write code that runs on a real humanoid robot — not just watch it perform, but actually program it themselves, with real motors and real physics responding to their own logic. That's a genuinely different risk profile than an adult engineer testing their own code: the person writing the program has no experience judging whether their own logic is safe to run on real hardware, and won't necessarily know what "looks wrong" before it's too late to stop.

## The three-layer answer

**A block-based programming tool** (Scratch-style), so students compose behavior from safe, pre-validated primitives rather than writing arbitrary code against the robot's raw control surface.

**Mandatory simulation validation before any hardware run.** Every student program runs in MuJoCo first — a validated physics simulation of the actual G1 — before it's ever allowed near the real robot. A script that fails or behaves dangerously in simulation never gets a chance to do so on hardware at all.

**A physical harness, and a teacher or operator at the controls, always.** Even after clearing simulation, student code runs on the real robot only in a harness, with an adult operator present as the actual safety authority for the whole session — never bypassed, never a "trusted student" exception.

## Is this overkill? No — and here's the honest comparison

This combination isn't a novel invention from scratch. Simulation-before-hardware pipelines exist elsewhere (Boston Dynamics for Spot, MoveIt/Gazebo in ROS2, university humanoid labs using MuJoCo). Block-based robot programming exists elsewhere too (Scratch extensions for NAO, LEGO Mindstorms). What's genuinely less common is this **specific combination** — block tool → simulation validation → harnessed real humanoid — aimed specifically at non-expert students, on a platform this physically capable, with the teacher/operator safety layer built into the workflow from the start rather than added afterward as a patch.

The harness specifically does more work than it might first appear to. A fall in an unharnessed real-world test is a real, expensive, potentially dangerous incident. The same fall, in a harness, becomes a swing — a non-event, a learning moment about why the code didn't do what the student expected, rather than a reason to be afraid of the next attempt. That shift changes the actual psychological experience of making a mistake, for the student and the supervising adult both — mistakes stay recoverable rather than becoming reasons to pull back from letting students try things at all.

## The honest risk, named rather than glossed over

The whole safety argument rests on one assumption: that "passes MuJoCo validation" is a meaningful, trustworthy signal for "safe to run on real hardware." That's only true if the simulation's physics model is actually accurate enough to catch the failure modes that matter — particularly for gesture and arm dynamics, where the details of joint limits and momentum genuinely affect whether something is safe. Unitree's published URDF files aren't guaranteed to be perfectly tuned for MuJoCo out of the box; getting that physics model tight enough to trust as a real safety gate, not just a rough approximation, is real, non-trivial work that has to happen before this architecture can be trusted at face value. A simulation that's quietly too forgiving would let students pass validation on things that actually fail — or worse — on the real robot, which would defeat the entire point of the gate.

## The general principle

When you're designing a system where the person writing the logic can't personally evaluate whether their own code is safe to run in the physical world, the safety architecture can't rely on their judgment at any layer — not in what they're allowed to write (hence the block tool, not raw code), not in whether it's safe to try (hence mandatory simulation first), and not in the moment it actually runs (hence the harness and a present, empowered adult operator). Each layer exists because the one before it isn't sufficient on its own — removing any single layer, even the one that feels most like "just a formality," breaks the actual safety case for the whole pipeline.
