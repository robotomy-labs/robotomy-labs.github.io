---
title: System Overview
sidebar_position: 1
---

:::note Living document
This page is a reference, not a post. Edit it in place as the system changes — don't append dated addenda or leave stale sections describing a previous revision.
:::

## Hardware

- **Platform:** Unitree G1 EDU
- **Compute:** Orin NX module (companion computer), running the AI/voice/gesture-orchestration stack. Robot motion control runs on a separate onboard RockChip controller (not directly SSH-accessible), communicating with the Orin NX over DDS.

## Software stack

- **OS / L4T / JetPack:** JetPack 6.2 (L4T R36.4.3), Ubuntu 22.04.5, Python 3.10.12 (system) / 3.11.15 (production venv)
- **CUDA:** 12.6, Driver 540.4.0
- **DDS middleware:** CycloneDDS 0.10.2 (hard-pinned — see the [CycloneDDS version pinning log entry](/docs/log/platform-cuda/cyclonedds-version-pinning) for why this exact version matters)
- **Containerization:** Docker 20.10.12 (pinned — newer versions break GPU passthrough on the tegra kernel)
- **Voice pipeline:** Pipecat, orchestrating STT → LLM → TTS in a single Python 3.11 venv alongside the robot SDK
- **Transport:** WebRTC for gesture dispatch and vendor-adjacent audio; DDS for direct robot-state and arm-command traffic

### Current pipeline components

| Stage | Implementation | Notes |
|---|---|---|
| STT | faster-whisper large-v3, containerized FastAPI HTTP wrapper | Full-attention encoder — latency scales with utterance length regardless of model size (architectural, not a tuning problem) |
| LLM | Ollama, GPU-confirmed | Runs isolated in a jetson-container over local HTTP, separate from the SDK/Pipecat venv |
| TTS | espeak-ng (placeholder) → ElevenLabs Flash v2.5 (target) | ElevenLabs required for viseme data driving face-animation lip sync |
| Gesture dispatch | Custom WebRTC client + DDS arm commands | Custom (taught) gestures require FSM-state gating — see the [FSM gating log entry](/docs/log/webrtc-gestures/fsm-gating-custom-gestures) |
| Safety | SAFE_IDLE — independent listener on the shared mic stream, force-interrupts the pipeline | Not routed through the main pipeline, by design |

## Deployment

Code moves from the development machine to the robot via SSH into the Orin NX (`192.168.123.164`), working directly in the production venv on-device rather than a separate build/push pipeline. There is currently no CI/CD or automated deployment step — changes are made, tested, and run live on the same machine they're developed against.

## Open questions

- **GPU contention at production model scale is not yet confirmed.** STT + LLM sharing the Orin NX GPU has been tested at small LLM scale (1.2B params) with no observed contention — the actual production model (a much larger model) sharing the GPU with `large-v3` STT has not yet been tested under load.
- **SONIC execution-time GPU usage is unconfirmed.** Gesture playback likely runs a whole-body control policy inference continuously at control frequency during a live performance — whether this competes for the same GPU as STT/LLM, or is CPU-light enough to avoid it, isn't confirmed by public documentation as of this writing.
- **Streaming/CTC-based STT (e.g. Parakeet-TDT, NVIDIA Riva) as a Whisper replacement** is under evaluation to break the latency floor imposed by Whisper's full-attention architecture — not yet implemented.
