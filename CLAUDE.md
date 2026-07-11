# Robotomy Labs — Project Brief

This file is read automatically by Claude Code at the start of every session in this repo. It exists so you don't have to re-explain the project each time.

## What this is

Robotomy Labs is a public engineering documentation site for developing on the **Unitree G1 EDU** humanoid robot platform. The audience is **engineers and serious hobbyists** working with G1 EDU or similar robotics platforms — not a general audience, not a marketing site.

The core value proposition: **specificity of failure**. Generic "we integrated CUDA" posts are useless. What's useful is "here's the exact commit hash of CycloneDDS that will silently fail to compile against 0.10.2 headers if you clone `main` instead of the `0.10.x` tag." Every piece of content should aim for that level of concrete, reproducible detail — exact error text, exact versions, exact commands.

This site documents the real build of **Rossbot** (in-character name: **Ziko**), a Pixar/Disney-inspired character robot performer running on a G1 EDU, deployed at a café for kids ages 9–12. The robot itself and its character are largely out of scope for this site — the site is about the underlying engineering (CUDA, Jetson, DDS, voice pipeline, gesture systems), not the character/entertainment layer.

## Site structure

- **`docs/log/`** — Pitfall-log entries. Each entry follows: Symptom, Environment, Root Cause, Fix, Time Cost (optional).
- **`docs/architecture/`** — Living reference docs, edited in place, not dated posts.
- **Tags**: jetpack, cuda, cyclonedds, docker, audio, webrtc, firmware, pipecat, security.

## Content philosophy

- Port distilled lessons already written up in source engineering docs.
- One retrospective post covering Brewbert → v1-v8 → JP6.2 rebuild history, broad strokes only.
- Skip granular day-by-day session notes and abandoned code internals.
- Current-forward bias: the "present" is the JP6.2/CUDA 12.6 rebuild.

## Tone

Direct, decision-oriented, technical. Concise over exhaustive. No marketing language.

## Technical stack

Docusaurus, GitHub Actions, GitHub Pages. Domain: robotomy.ai. Org: robotomy-labs. Repo: robotomy-labs.github.io.

## What NOT to do

- Don't fabricate version numbers, error text, or timelines — flag uncertainty instead.
- Don't write in a marketing voice.
- Don't restructure docs/architecture into dated posts.
- Don't touch merch, character/costume assets, or anything outside this site's technical scope.
