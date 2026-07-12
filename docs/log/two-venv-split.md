---
title: "Two Python venvs, two different silent-failure modes"
tags: [jetpack]
---

## Symptom

Scripts that should work produce confusing errors, or fail silently, depending on which terminal session you happen to be running them from — with no obvious connection between the symptom and the actual cause.

## Environment

- G1 EDU Orin NX, an earlier build era (pre-JP6.2, Python 3.8 platform ceiling)
- Two required, incompatible virtual environments on the same machine

## Root Cause

This project's earlier build era required **two separate venvs that could not be merged**, because their dependency requirements were genuinely incompatible on the JetPack 5.1.1 / Python 3.8 platform:

| Venv | Python | Purpose |
|---|---|---|
| Voice pipeline venv | 3.8.10 | Voice pipeline only |
| SDK/gesture venv | 3.10 | Robot SDK2, dance/gesture pipeline, direct arm control |

Running an SDK script from the voice-pipeline venv — or vice versa — doesn't always fail loudly. Sometimes it does. Often it produces a confusing, unrelated-looking error, or silently no-ops, because the wrong Python version has *some* but not all of the required packages available, just enough to get partway through before failing in a way that doesn't point back to "wrong venv" as the cause.

## Fix

No real fix beyond discipline and a checked habit, given the platform constraint at the time — the two venvs genuinely couldn't be unified until the JetPack 6.2 migration removed the Python 3.8 ceiling entirely (see the [JP6.2 reflash log entry](/docs/log)). The practical mitigation:

```bash
# ALWAYS check which venv is active before running ANY script
python --version
```

Treat this as a mandatory first line of every session, not an occasional sanity check — the failure modes from running in the wrong venv are inconsistent enough that "it usually works" is not a safe signal.

## Where this stands now

Post-JP6.2, this is resolved architecturally rather than by discipline: Python 3.11 supports both the SDK and Pipecat in a single venv, so the two-venv split — and the whole class of "wrong venv" silent failures — no longer applies to the current stack. Documenting it here anyway, since anyone working with G1 EDU on an older JetPack/Python ceiling will hit exactly this.

<p className="ro-meta-row">Time cost: Not a single large cost — more a recurring background tax of a few minutes lost per incident, across many sessions, until the venv-check habit became automatic.</p>
