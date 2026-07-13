---
title: "Flashing the G1's Orin NX from JetPack 5.1.1 to 6.2"
tags: [jetpack, cuda, hardware]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

JetPack 5.1.1 (the G1 EDU's stock platform) caps Python at 3.8 and CUDA at 11.4. That ceiling blocks essentially every modern local-AI tool: Ollama's GPU backends require a newer CUDA than 11.4 provides, and most current STT/TTS/VAD libraries assume Python ≥3.10. Working around it means hand-compiling everything from source against an outdated toolchain — which is exactly what an earlier build era did (`llama.cpp` compiled from source against CUDA 11.4 / `compute_87`, functional, but a dead end for anything beyond hand-rolled inference).

There's no fixing this in place. The only way past it is a full platform reflash.

## Environment

- Unitree G1 EDU, Orin NX module
- Starting point: JetPack 5.1.1, Python 3.8, CUDA 11.4
- Target: JetPack 6.2 (L4T R36.4.3)
- Robot's original 2TB NVMe SSD (not a blank card — the actual boot drive)

## What was actually done

1. Downloaded and integrity-verified two files from Unitree's provided source: `g1-nx-j6.2.img.bz2` (system image, ~256GB decompressed) and `Jetpack_6.2_nx.tar.bz2` (9.3GB, separate NX module firmware package — **not the same thing as the system image**, and both are required).
2. Physically disassembled the G1's back panel/handle to access the Orin NX's NVMe SSD.
3. Burned the system image directly to the SSD via a USB NVMe enclosure:
   ```bash
   bzip2 -dc g1-nx-j6.2.img.bz2 | dd of=/dev/sda bs=4M status=progress conv=fsync
   ```
   ~846 seconds (~14 minutes) at ~303 MB/s.
4. Ran the NX module firmware update — a **separate, required step** from the system image flash. Entered APX flashing mode via the PWR+REC button combo, confirmed the device was in that mode via `lsusb` (should show `NVIDIA Corp. APX`), then ran `sudo ./flash_nx_module.sh`. Completed in ~8 minutes, confirmed by: `*** The target generic has been flashed successfully. ***`
5. Reinserted the freshly-imaged SSD, reassembled the robot, powered on, confirmed it booted from the external `nvme0n1p1`.
6. Enabled max-performance power mode:
   ```bash
   sudo nvpmodel -m 0
   # reboot
   jetson_clocks --show   # confirm NV Power Mode: MAXN, all 8 CPU cores online
   ```
7. Installed required post-flash packages: `nvidia-l4t-dla-compiler`, `libcudla-dev-12-6`.
8. Full reassembly, clean power-down.

## Verified platform state after flash

| Component | Version |
|---|---|
| OS | Ubuntu 22.04.5 LTS, kernel 5.15.148-tegra aarch64 |
| L4T | R36, Revision 4.3 (= JetPack 6.2) |
| Python | 3.10.12 (up from the 3.8 ceiling on JP5.1.1) |
| CUDA | 12.6, Driver 540.4.0 |

## Gotchas worth flagging explicitly

- **SSH host key will change** after reimaging — expected, not a sign anything went wrong. Remove the old entry from `known_hosts` rather than troubleshooting a phantom MITM warning.
- **`nvcc` (the CUDA toolkit compiler) is not installed by default** — only the CUDA runtime ships out of the box. If you need to compile anything against CUDA from source again (e.g. `ctranslate2`, `llama.cpp`), you'll need to install the toolkit separately.
- **Keep a rollback path on hand.** The NX module firmware layer, once updated, will only boot JetPack-6.2-compatible images going forward — so if you need to roll back to 5.1.1, you need the old firmware bundle *and* an old system image backup, not just the image. Confirm both are saved before you start.
- We didn't hit it, but it's worth actively watching for on your own flash: some Jetson reflashes reset the RTC to 1970 on the first boot. Not observed here, but cheap to check.

## Why this mattered beyond "newer versions"

This wasn't just a version bump for its own sake. JP5.1.1's ceiling was blocking the entire modern local-AI stack outright — Ollama's GPU backends were flatly incompatible with CUDA 11.4, full stop, which is why an earlier build era rejected Ollama and hand-compiled `llama.cpp` from source just to get *any* local LLM inference working. JP6.2 removes that ceiling entirely and is what makes a normal, maintainable dependency stack (Ollama, faster-whisper, Pipecat, a single Python 3.11 venv for both the SDK and the pipeline) possible at all.

<p className="ro-meta-row">Time cost: ~1 session for the physical flash and verification (roughly an hour of actual flashing time plus disassembly/reassembly); the *decision* to commit to the reflash — confirming the platform ceiling was real and not fixable in place — took considerably longer, across earlier sessions of hitting the CUDA 11.4 wall repeatedly.</p>
