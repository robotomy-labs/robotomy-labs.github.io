---
title: What Was Ruled Out
---

Nobody publishes their dead ends, which means everybody re-discovers them independently. This page exists so you don't have to.

Each row below is an approach that looked reasonable on paper, got tried on a real G1 EDU, and failed for a specific, documented reason. If you're building on this platform and one of these is on your list, this can save you the session it cost us.

| Approach | Reason ruled out |
|---|---|
| **Vendor ASR** (`rt/audio_msg`) | Stops publishing entirely the moment an external WebRTC client connects — a fundamental exclusivity conflict, not a bug. (Resolved as of firmware 1.5.2 — see the WebRTC/vendor-ASR conflict entry.) |
| **OpenAI Realtime API** | Returns audio, not text. Breaks any pipeline that parses inline tags (e.g. `[G:gesture_id]`) out of the LLM's text response — there's no text stream to parse. |
| **`LocoClient.WaveHand()`** | Returns error `3203` on firmware 1.4.5 and later. Confirmed incompatible, not a transient failure. |
| **WebRTC mic audio receive** | Returns zero frames on G1 firmware 1.4.5. This path is reported to work on Go2 Pro/EDU, but does not work on G1. |
| **Direct ALSA mic access** | The internal mic sits behind an APE XBAR crossbar owned exclusively by a vendor service — not accessible from user-space, regardless of permissions. |
| **Piper (local TTS)** | CPU spikes to 99% under demo load, which introduces DDS instability risk on a platform where DDS is also carrying motion control traffic. Not worth the risk even though it's otherwise a capable engine. |
| **Kokoro (local TTS)** | Required `onnxruntime` version not available for ARM64 on JetPack 5.1.1 — blocked at the dependency level before the engine itself could be evaluated. |
| **Coqui XTTS v2 (local TTS)** | Dependency hell: conflicting `numpy`, `numba`, `trainer`, and `pandas` version requirements couldn't be reconciled into a working ARM64 environment. |
| **Piper (local TTS) — packaging** | No ARM64 wheel available for `piper-phonemize` on JetPack 5.1.1; installation blocked before the engine could run at all. (Distinct from the CPU-spike issue in the Piper row above, hit later once a workaround unblocked installation.) |
| **eGPU for LLM inference** | The available eGPU is AMD RDNA3; the platform runs ARM Ubuntu 20.04. No ROCm support on that combination — dead end at the driver level, not a performance issue. |
| **Direct DDS call to `api_id 7112`** | Returns `7403`. This is a private endpoint not accessible via the public DDS interface, regardless of payload correctness. |
| **Bluetooth as a gesture trigger** | No confirmed working implementation exists for this on the G1's Jetson companion computer. A WiFi hotspot is the correct transport for this use case instead. |

## Why this list exists as its own page

Every one of these took real time to rule out — in most cases, a full session of trying to make something work before finding the specific, load-bearing reason it can't. Grouping them here, separate from the pitfall log, is deliberate: these aren't bugs with fixes, they're **boundaries** — things worth knowing before you start, not after.

If you've hit something here differently, or found a workaround we haven't — genuinely, open an issue. This list is exactly the kind of thing that should get corrected in public.
