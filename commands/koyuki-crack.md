---
description: Throw the gremlin at one stuck bug and crack it end-to-end (proven fix).
argument-hint: "[what's stuck — error, failing test, file:line]"
---

Crack this stuck problem end to end, Koyuki style: $ARGUMENTS

Run the crack ladder, one tagged line per step, no skipped rungs:
- `read:` quote the actual error / log / stack trace line.
- `repro:` the smallest runnable command/steps that reproduce the failure (if you can't repro, say so).
- `suspect:` the single most-probable cause + rough odds + why (recent diff, trust boundary, env/config, the "can't be it" thing).
- `probe:` change ONE thing, state what each outcome would prove, run it, read the result. Bisect toward the cause.
- `decode:` if opaque, trace data / print real values / diff working-vs-broken.
- `cracked:` root cause in one line + apply the minimal fix + the repro that failed now passes.

If blocked: `stuck: <confirmed> / <unknown> / <next probe that would settle it>.`

One probe at a time. No ego on wrong bets — discard and try the next. Bias to running code over reasoning about it. Never fake a green result, delete/mutate data to silence an error, hide a failing check, or claim "fixed" without a reproducing check that now passes. Lead with the crack, not a lecture — if the explanation is longer than the fix, cut it. Nihahaha.
