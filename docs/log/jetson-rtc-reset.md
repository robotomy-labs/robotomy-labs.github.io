---
title: "The Jetson's clock resets to 1970 on every reboot"
tags: [jetpack]
---

## Symptom

After any reboot, the Jetson's system clock reads some time in 1970. This quietly breaks anything that depends on accurate timestamps — TLS certificate validation, log ordering, any API that checks request freshness — often with confusing downstream errors that don't obviously point back to "the clock is wrong" as the cause.

## Environment

- Unitree G1 EDU, Orin NX companion computer
- Observed across multiple JetPack versions — not tied to one specific release

## Root Cause

The hardware RTC isn't persisting an NTP-synced time across reboots — `hwclock` isn't being written back to on shutdown, or the sync isn't running early enough in boot before something else checks the clock. The practical result: every cold boot starts from a stale/default clock value until NTP sync catches up, if it catches up at all before something time-sensitive runs.

## Fix

Force an explicit NTP sync and write it to hardware clock, and make sure this actually runs on every boot rather than being a one-time manual fix:

```bash
sudo ntpdate -u time.google.com && sudo hwclock -w
```

Add this to crontab (or a boot-time systemd unit, more reliable than cron for this specific timing-sensitive case) so it runs automatically rather than requiring a manual step after every reboot.

**Worth checking explicitly if you're running Docker containers on this platform:** containers can inherit the host's clock state at the moment they start, meaning a container launched before the host's NTP sync completes can end up running with the same stale 1970 timestamp even after the host itself corrects. If you hit clock-dependent failures *inside* a container specifically, don't assume the host fix alone covers it — verify the sync timing relative to container startup order.

<p className="ro-meta-row">Time cost: Low once identified — the fix itself is one line. The time cost is mostly in recognizing "the clock is wrong" as the actual root cause behind whatever downstream symptom shows up first (a cert error, a weird log ordering, an API rejecting a request as expired) rather than debugging that symptom directly.</p>
