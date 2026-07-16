---
title: "How the face actually works: a real-time expression engine in one process"
authors: [robotomy]
tags: [audio, pipecat]
---

Voice and gestures get most of the attention in this project, but the face is doing genuinely interesting real-time work of its own — fifteen parameters lerping independently, Perlin-noise-driven mouth movement instead of robotic on/off animation, and speech-synced expression timing that has to stay accurate across a live, streaming audio pipeline. This is how it's built.

{/* truncate */}

## One process, three threads, one render loop

The whole face system runs as a single unified process — not a distributed set of services, deliberately. Three daemon threads handle the actual work underneath a Pygame render loop running at 30fps:

- **A TTS worker thread**, calling ElevenLabs
- **An audio playback thread**, via `sounddevice`
- **An input worker thread**, handling whatever's driving the conversation (text input, or the live pipeline output)

The render loop itself just reads current state and draws — it doesn't own any of the actual audio or network work, which keeps the visual side responsive regardless of what the other threads are doing. One nice practical consequence of this architecture: there are no pipeline restarts needed to iterate on expressions. Edit the face-rendering file directly, and the changes take effect immediately, without touching anything upstream.

## FaceState: fifteen numbers, each moving at its own speed

The core of the whole system is a `FaceState` dataclass — fifteen floating-point parameters (eye openness, brow position, mouth shape components, and more), each one **lerping toward its target value at its own differentiated speed**, not a single global animation rate.

This matters more than it might look like on paper. A single shared animation speed makes every expression change feel the same — uniformly snappy or uniformly sluggish, regardless of what's actually happening. Differentiated speeds let a blink snap shut fast while a brow raise settles in more slowly, which is a lot closer to how real facial movement actually reads: different muscles, different speeds, not one uniform "animation."

## Blinking and micro-movement

Blinks use cubic easing rather than linear interpolation — a blink that eases in and out reads as much more natural than one that moves at a constant rate, since real blinks aren't linear either. On top of that, small **saccade micro-movements** run continuously in the background — the tiny, near-constant eye movements real eyes make even when "still." Without this, a face that's technically animated correctly can still read as dead or uncanny, because real eyes are never actually motionless.

## The mouth: Perlin noise, not a volume meter

This is the detail worth dwelling on. A naive approach to mouth animation during speech is to drive mouth openness directly off the audio's volume envelope — louder means more open. That works, but it reads as mechanical, because real speech doesn't just vary in loudness, it has continuous, organic shape variation even at a constant volume.

The actual approach layers **Perlin noise** — a smooth, continuous pseudo-random function, commonly used in graphics for natural-looking terrain and motion — on top of the coarticulation/viseme interpolation driving the base mouth shape. The Perlin layer adds the small, continuous, non-repeating variation that makes the mouth look like it's actually shaping sounds, rather than mechanically opening and closing in sync with a volume meter.

## Keeping lip sync accurate across a streaming pipeline

The actual viseme-timing math — correcting for ElevenLabs' per-chunk relative timestamps and the sample-rate mismatch between ElevenLabs' output and the playback pipeline — is covered in full technical detail in [the ElevenLabs viseme timing entry](/docs/log/audio-voice/elevenlabs-viseme-timing). The piece that connects to the face system specifically is the anchor pattern: **a single `T0` timestamp is recorded the instant `sound.play()` actually starts**, and every subsequent viseme or expression event is scheduled as an offset from that one anchor (`elapsed = time.time() - T0`), rather than trying to track time independently in each subsystem. One shared anchor, many events scheduled relative to it — simple, and avoids any drift between what the mouth is doing and what's actually coming out of the speaker.

## Why this design holds together

Every piece of this system solves a version of the same problem: **make discrete, computed state look like continuous, organic movement.** Differentiated lerp speeds instead of one animation rate. Cubic easing instead of linear blinks. Saccades instead of a static gaze. Perlin noise instead of a volume meter. A single timing anchor instead of independently-drifting clocks. None of these tricks are individually complicated — the discipline is in applying the same underlying idea consistently across every part of the face, rather than solving expressiveness in only the most visible place (the mouth) and leaving everything else mechanical by comparison.
