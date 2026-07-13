---
title: "The hard ceiling: why JetPack 5.1.1 makes modern embodied AI on the G1 EDU a dead end"
authors: [robotomy]
tags: [jetpack, cuda]
---

If you're building an embodied AI project on the Unitree G1 EDU, and you're still on the stock JetPack 5.1.1 platform, there's a decision point coming that no amount of clever engineering will let you avoid — **if local, on-device inference is your goal.** This post is about why that ceiling is real for that specific goal, why the obvious workarounds don't actually work, and why the decision to stop patching around it was the right one to make earlier rather than later. (If local inference isn't actually required for your project, the ceiling may not apply to you at all — see the [companion post on the cloud-LLM path](/blog/cloud-llm-escape-hatch) before assuming you need to reflash.)

{/* truncate */}

## The ceiling, concretely

The G1 EDU ships with JetPack 5.1.1: Python 3.8, CUDA 11.4. On paper, that's a perfectly capable embedded AI platform. In practice, it quietly locks you out of the current generation of local-AI tooling, for one specific, unglamorous reason: **Ollama's GPU backends require a newer CUDA than 11.4 provides, full stop.** Not slower. Not degraded. Incompatible.

That single fact cascades further than it looks like it should. Most current speech-to-text and text-to-speech libraries assume Python ≥3.10 as a baseline. Whisper's ecosystem, Pipecat, and a good chunk of the current voice-pipeline tooling generally, all lean on language and packaging features that Python 3.8 doesn't have. So the ceiling isn't just "no Ollama" — it's "no current local-LLM tooling, and increasingly awkward footing for current STT/TTS tooling too," all stemming from one version pin.

## The workaround we actually tried, and why it was a dead end

The instinct, reasonably, was: don't reflash the whole robot over a version number — compile around it. So that's what got built first: `llama.cpp`, compiled from source, targeting CUDA 11.4 and `compute_87` explicitly, running local LLM inference in-process.

It worked. That's worth saying plainly — this wasn't a failed experiment, it was a functioning, hand-built inference path that ran real models on real hardware.

But "worked" and "worked for the long haul" are different claims. A hand-compiled binary, targeting an old CUDA version by hand, has no upstream maintainer keeping it aligned with anything. Every future dependency — a new STT library, a new pipeline framework version, a new model architecture — was a fresh compatibility check against a stack nobody but this project was responsible for keeping current. That's not a one-time cost. It's a permanent tax, paid again on every future addition to the stack, for as long as the platform stayed on JetPack 5.1.1.

This is the same shape of problem documented elsewhere on this site in [containerizing rather than hand-compiling CUDA-dependent packages](/docs/log/platform-cuda/containerize-dont-fight-the-wheel) — except in this case, there was no container that could fix it, because the ceiling wasn't in a single package's missing wheel. It was the platform itself.

## Why patching further wasn't the answer

At some point, the honest question stopped being "what's the next workaround" and became "is this ceiling actually fixable in place, or is it structural." It's structural. CUDA 11.4 is a platform-level constraint tied to JetPack 5.1.1's driver stack — there's no user-space fix, no pip flag, no clever container trick that changes what CUDA version the underlying platform actually exposes. Every additional hand-compiled workaround was solving today's specific blocker while leaving the actual ceiling completely intact for the next one.

That's the moment worth naming explicitly for anyone else facing the same fork: **if the blocker is a platform version, not a package version, workarounds are borrowed time, not a fix.** The right question isn't "can I get this one thing working" — it's "how many more times am I going to ask that question before the answer is the same reflash I'm avoiding right now."

## What the reflash actually bought

JetPack 6.2 removes the ceiling entirely — Python 3.11, CUDA 12.6, and critically, Ollama's GPU backends work as intended, with zero hand-compiled anything. The full procedure — disassembly, NVMe flash, separate NX module firmware update, verified platform state afterward — is documented in detail in [the reflash log entry](/docs/log/platform-cuda/jp62-reflash) if you're about to do this yourself.

The bigger shift wasn't really "newer versions" for their own sake. It's that the entire dependency stack going forward — Ollama, faster-whisper, Pipecat, all of it — collapsed into a single, normal, maintainable Python 3.11 environment instead of a hand-tuned exception. That's the actual payoff: not speed, not features, but no longer being the only maintainer of a compatibility layer that upstream projects were never going to support.

## If you're deciding whether to reflash

A few honest questions worth asking before you commit, based on what this project actually hit:

- **Are you trying to run any current local-LLM tooling (Ollama, or anything GPU-accelerated) on stock JetPack 5.1.1?** If yes, you will hit this exact wall, not a softer version of it.
- **Are you hand-compiling anything against CUDA 11.4 right now to work around it?** If yes, you're already paying the tax this post describes — the only question left is whether you keep paying it or reflash.
- **Is your project's timeline measured in months, not days?** If so, the reflash is worth doing sooner rather than later — every workaround built in the meantime is something you'll either maintain indefinitely or eventually throw away.

If none of that applies yet — if you're early, prototyping, not yet asking your platform to do anything CUDA-12-era — there's no reason to reflash preemptively. But the moment any of those three is true, the ceiling stops being theoretical.
