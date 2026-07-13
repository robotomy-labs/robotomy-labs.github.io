---
title: "CycloneDDS version pinning will silently wreck your build"
tags: [cyclonedds, jetpack]
sidebar_custom_props:
  entry_type: pitfall
---

## Symptom

Building `unitree_sdk2_python`'s DDS bindings from a freshly cloned CycloneDDS fails at compile time with an opaque, unhelpful error — header mismatches, undefined symbols, nothing that points back to "wrong version" as the cause.

## Environment

- JetPack 6.2, CUDA 12.6, Python 3.11.15, aarch64
- `unitree_sdk2_python`
- CycloneDDS built from source (the C library, not just the Python binding)

## Root Cause

`unitree_sdk2_python` **hard-pins `cyclonedds==0.10.2`** for its Python binding. If you build the underlying CycloneDDS C library from `main` — which at time of writing sits at `11.0.1`, a major-version jump — the resulting headers don't match what the `0.10.2` Python binding expects. The build doesn't fail with a clear "version mismatch" message; it fails with generic compile errors that look like a broken environment rather than a version problem, because from the compiler's perspective, that's exactly what it is.

This is an easy trap specifically because cloning `main` is the natural default action, and CycloneDDS's own `main` branch is a perfectly healthy, current library — it's only wrong *for this specific downstream dependency*, which pins to a version that's several major releases behind.

## Fix

Build from the pinned release tag, not `main`:

```bash
git clone https://github.com/eclipse-cyclonedds/cyclonedds.git
cd cyclonedds
git checkout releases/0.10.x   # NOT main — main is 11.0.1, incompatible
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=<install path> ..
cmake --build . --target install
```

Then build/install the Python binding (`cyclonedds` PyPI package or from source) against that installed C library, and confirm `CYCLONEDDS_HOME` points at your custom-built install rather than any system default.

## Why this is worth checking first, every time

If you ever see an opaque compile-time failure building anything against `unitree_sdk2_python`'s DDS layer, checking the exact pinned version in that project's dependency spec before doing any other debugging will save you from chasing an environment problem that isn't actually there. This single version pin is a hard constraint — there's no working configuration where building `main` against this SDK version succeeds.

<p className="ro-meta-row">Time cost: A few hours the first time, entirely spent on generic compiler-error debugging before the actual cause (version pin, not environment) was identified.</p>
