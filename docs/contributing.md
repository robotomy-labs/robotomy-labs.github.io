---
title: Contributing a Log Entry
sidebar_position: 3
---

This page documents the format for everything in `docs/log/`. It isn't a pitfall entry itself — it's the template, kept out of the Log index so it doesn't show up alongside real entries.

Every entry follows the same structure:

## Symptom

What you observed — the exact error text, exact command output, or exact behavior. Not "it didn't work," but the actual message, log line, or stack trace.

## Environment

Every version that matters: OS/JetPack/L4T version, CUDA version, package versions, commit hashes, hardware revision. If a detail is unknown, say so explicitly rather than guessing — an entry that flags "JetPack version not confirmed" is more useful than one with a made-up number.

## Root Cause

Why it actually happened, not just what fixed it. If the root cause is still unclear, say that too.

## Fix

The exact steps, commands, or config change that resolved it. Reproducible enough that someone else hitting the same symptom can apply it directly.

## Time Cost (optional)

Roughly how long this cost to diagnose — useful signal for how nasty a pitfall is. Put it in a meta row at the very end of the entry, not as a regular section:

```mdx
<p className="ro-meta-row">Time cost: ~2h</p>
```

That renders as a small, dim, top-bordered line — visually distinct from the four main sections above, and consistent with the "last updated" row Docusaurus adds automatically below it.

---

Filename convention: `docs/log/short-kebab-case-title.md`. Tag entries with the relevant components from the tag list (`jetpack`, `cuda`, `cyclonedds`, `docker`, `audio`, `webrtc`, `firmware`, `pipecat`, `security`) using frontmatter `tags: [...]`.
