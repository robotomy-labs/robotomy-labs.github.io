---
title: "From motion-capture dreams to a natural-language gesture tool"
authors: [robotomy]
tags: [pipecat]
---

This is a story about a tool that ended up nothing like what it started as — and about how the detour turned out to be the better path anyway. It starts with wanting to record real human motion for the robot to mimic, and ends with describing a gesture in plain English and getting back a validated, ready-to-run script.

{/* truncate */}

## The starting idea: motion capture

The initial plan was straightforward: use `xr_teleoperate`, a motion-capture pipeline that maps a human operator's body pose (captured via VR headset) onto the robot's joint angles, to record real gestures by literally performing them.

The problem showed up immediately: `xr_teleoperate`'s officially supported hardware list includes Meta Quest 3 and 3S — not the Quest 2 headsets actually on hand. Two paths presented themselves at that point: sink real time into getting unsupported hardware working against a pipeline that doesn't officially support it, or find another way entirely.

## The pivot: the data already existed

Rather than chase Quest 2 compatibility, the actual question worth asking was simpler: was live motion capture even necessary, given what was already sitting on disk? It was not. **LAFAN1 G1-retargeted motion CSVs** and the **`openhe/g1-retargeted-motions`** dataset — both already confirmed working in MuJoCo simulation — represented a substantial, ready-to-use library of real human motion data, already mapped to this exact robot's joint structure. No capture hardware required at all.

This is a pattern worth naming on its own: **the instinct to build new capture infrastructure is often solving a problem that existing, already-validated data has already solved.** Before investing in hardware or a live-capture pipeline, it's worth genuinely checking what usable data already exists — in this case, an entire viable gesture-authoring foundation was already sitting on disk, unused, simply because the original plan hadn't gone looking for it first.

## The real idea: skip capture entirely, describe it in English instead

The pivot led somewhere better than a simple substitution of one data source for another. If joint-angle data for gestures could come from existing datasets, why not go a step further — describe a *new* gesture in plain language, and have an LLM reason about the actual joint angles needed to produce it?

The design: a natural-language-to-joint-angle authoring tool. A person describes a gesture in plain English. The Claude API reasons about G1 joint angles **anatomically**, using a real joint reference table (indices 10–26, with documented safe min/max limits for each), and produces keyframes. Those keyframes get validated against joint limits and velocity thresholds, then exported as a ready-to-deploy Python script matching the existing `rt/arm_sdk` gesture-dispatch pattern exactly.

This was explicitly framed from the start as a small step toward a larger goal: the `[G:tag]` naming convention used for authored gestures is the same one that eventually lets an LLM running the live conversational pipeline autonomously trigger validated gesture scripts — this tool and the live dispatch system share the same underlying contract by design, not by coincidence.

## Building it: three iterations, and an honest dead end

The first attempts built this as an in-browser artifact — and hit real friction: sandbox API blocking, and a click-handler scoping bug that took a deliberate, minimal reproduction (a bare-bones click test confirming an IIFE-plus-`addEventListener` pattern actually worked in that environment) to properly isolate. Worth naming plainly: this wasn't solved on the first or even second attempt.

The actual fix wasn't a deeper artifact-environment workaround — it was recognizing the artifact sandbox was the wrong delivery format for this specific tool, and shipping it as a standalone local HTML file instead. That's a similar shape of decision to [containerizing rather than fighting a missing CUDA wheel](/docs/log/platform-cuda/containerize-dont-fight-the-wheel) elsewhere in this project: when an environment's constraints keep fighting you, the fix is sometimes picking a different environment entirely, not eventually out-stubborning the original one.

## What actually shipped

A self-contained `gesture_tool.html`, structured as five stages: **Describe → Keyframes → Validate → Export → Library.** It handles its own Claude API key (saved locally, provided by whoever's running the tool), uses cosine-eased keyframe interpolation for natural-looking motion, validates against real joint limits and velocity thresholds, estimates center-of-mass to catch balance-affecting gestures before they ever reach hardware, and generates Python output matching the live pipeline's existing `rt/arm_sdk` format exactly — so an authored gesture and a live-dispatched one are structurally identical, not two different code shapes that happen to do similar things.

## Why this whole detour mattered

None of this would have happened if Quest 2 compatibility had just worked on the first attempt. The constraint — no supported capture hardware on hand — is what forced a genuine second look at what already existed, which surfaced better data than live capture likely would have produced anyway, and led to a more capable, more directly integrated tool than "record some gestures with a headset" was ever going to be. Worth remembering the next time a missing piece of hardware feels like a pure blocker: sometimes the workaround it forces is better than the original plan would have been.
