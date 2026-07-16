---
title: "An LLM choosing gestures needs a curated allowlist — not access to the full ID space"
tags: [pipecat, security]
sidebar_custom_props:
  entry_type: decision
---

## The situation

Once an LLM can select and fire its own gestures based on its own read of a conversation — the capability covered in [the voice-to-action pipeline post](/blog/voice-to-action-pipeline-brewbert-era) — a hard question follows immediately: which gestures, out of the full set the robot supports, should the model actually be allowed to choose from?

The naive answer is "all of them, the model will pick something reasonable." [The Frankenstein incident](/blog/voice-to-action-pipeline-brewbert-era#where-autonomy-went-further-than-intended) is the concrete demonstration of why that answer is wrong: the model inferred a hug-style approach gesture from perceived sadness, entirely on its own, from its own instruction base and the local gesture library available to it. Nobody authored that specific response for that situation — the model composed it live, from primitives it had access to.

## The decision: a human-curated, version-controlled allowlist

An AI-driven gesture arbitrator must never be given unrestricted access to the full gesture ID space. Some built-in gestures are almost certainly higher physical risk than others — sustained overhead poses, fast dynamic motions — and an LLM selecting a gesture based on conversational fit has no concept of physical risk or venue safety at all. It's optimizing for "does this fit the conversation," not "is this safe to do near this specific person, in this specific space, right now."

The fix isn't better prompting or a smarter model — it's removing the option entirely. A fixed, human-reviewed, version-controlled subset of gesture IDs is the only set the model is ever allowed to select from. Higher-risk gestures simply aren't in the list the model sees, regardless of how well it might argue for choosing them in a given moment.

## Why this isn't a solo-project-scale overreaction

Unitree's own action marketplace for this platform faces a version of the same problem at a much larger scale: ensuring third-party motion code doesn't introduce what's been described in industry coverage as a "physics-defying bug" is a real, openly acknowledged, unresolved moderation challenge for the vendor itself. If the platform vendor treats this as a genuinely hard problem worth ongoing attention at marketplace scale, a single project dispatching gestures from a live LLM's output needs the same discipline, just scaled down to fit the smaller surface area.

## The general principle

This is a specific case of a broader rule worth generalizing: **when a system with real-world physical consequences delegates a choice to a component that can't evaluate the risk of that choice, the fix is restricting the option set, not trusting the component to reason well within an unrestricted one.** A model has no way to know that a sustained overhead pose is riskier near a small child than a hand wave — so the safeguard can't live in the model's judgment. It has to live in what's structurally available to choose from in the first place.

<p className="ro-meta-row">This is a decision-rationale entry — the reasoning, not any specific allowlist contents, is the reusable part.</p>
