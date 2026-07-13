---
title: "A dead DNS entry inside a prebuilt container, and why the fix isn't 'just repoint everything'"
tags: [docker, jetpack]
---

## Symptom

Building a custom Docker image on top of `dustynv/faster-whisper` (a prebuilt jetson-containers GPU image) fails during the pip install step for your own added dependencies, with a DNS resolution failure.

## Environment

- Jetson Orin NX, JetPack 6.2
- Base image: `dustynv/faster-whisper` (jetson-containers)
- Adding a thin FastAPI wrapper (`fastapi`, `uvicorn`, `python-multipart`, `soundfile`) on top of the base image's existing GPU-enabled stack (`faster-whisper`, `ctranslate2`, `torch`)

## Root Cause

The base image has `pypi.jetson-ai-lab.dev` baked in as its configured pip index — a NVIDIA/jetson-ai-lab mirror used specifically to serve pre-built ARM64 CUDA wheels for packages like `ctranslate2` and `torch` that don't have official aarch64+CUDA wheels on the normal PyPI. That mirror was returning **NXDOMAIN** — confirmed independently via public DNS, not a local network issue.

## The trap in the obvious fix

The instinctive fix is to just repoint the whole image's pip index at regular `pypi.org` and move on. **Don't do that.** The reason the image points at that specific mirror in the first place is that `ctranslate2` and `torch` don't have working CUDA-enabled aarch64 wheels on ordinary PyPI — that's the entire reason a custom mirror exists. Blanket-repointing the index would "fix" the DNS error while silently swapping your GPU-accelerated STT backend for a CPU-only (or simply broken) one, with no obvious error to tell you that happened.

## Fix

Repoint **only your own added, plain dependencies** at regular PyPI, and leave the base image's existing CUDA-critical packages completely untouched:

```dockerfile
# Base image already has faster-whisper, ctranslate2, torch installed
# correctly against the jetson-ai-lab mirror — do not touch those.

# Only for wrapper-specific, plain dependencies:
RUN pip install --index-url https://pypi.org/simple \
    fastapi uvicorn python-multipart soundfile
```

This keeps the GPU-critical install path exactly as the base image maintainers built it, and only routes your own additions through a working index.

## Why this is worth documenting explicitly

This is the same underlying category of problem as CycloneDDS version pinning (see that entry) — a dependency chain where the "obvious" fix (point everything at the working source) actively breaks the thing that made the setup work in the first place. Any time a prebuilt jetson-containers image has a custom pip index configured, assume it's there for a load-bearing reason before repointing it wholesale.

<p className="ro-meta-row">Time cost: Under an hour once diagnosed as a DNS issue rather than a package problem — the DNS confirmation itself (ruling out local network causes) was the main time sink.</p>
