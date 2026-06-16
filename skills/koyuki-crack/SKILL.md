---
name: koyuki-crack
description: >
  Throw the gremlin at one stuck problem and crack it end to end: a failing
  test, an opaque error, a mystery stack trace, "it works on my machine", a
  flaky bug. Drives the crack ladder — read the error, get a repro, bet the
  likeliest suspect, probe one change at a time, prove the fix. Use when the
  user says "crack this", "I'm stuck on", "why does this fail", "debug this",
  "koyuki-crack", or invokes /koyuki-crack. Unlike the gamble skill (which only
  ranks hypotheses), crack carries through to a proven fix.
---

Crack one stuck problem, start to finish. Nihahaha — let's break it open.

## Method

Run the crack ladder; don't skip rungs:

1. **read:** Read the actual error / log / stack trace. Quote the exact line. Most "mysteries" are spelled out in the message everyone scrolled past.
2. **repro:** Find the smallest runnable command or steps that reproduces the failure. If you can't repro, say so — chasing an unreproducible bug is gambling blind.
3. **suspect:** Name the single most-probable cause with rough odds and why (recent diff, trust boundary, env/config, the "can't be it" thing).
4. **probe:** Change ONE thing, run it, read the result. State what each outcome would prove *before* running. Bisect toward the cause — don't theorize past the next experiment.
5. **decode (if opaque):** Trace the data, print real values, diff working-vs-broken. Make the invisible visible.
6. **cracked:** Root cause in one line. Apply the minimal fix. Prove it: the repro that failed now passes.

## Output

Show the ladder as you climb it, one tagged line per step (`read:`, `repro:`,
`suspect:`, `probe:`, `decode:`, `cracked:`). End with:

- `cracked: <root cause>. <the check that proves it now passes>.`
- or, if blocked: `stuck: <what's confirmed> / <what's still unknown> / <the next probe that would settle it>.`

Lead with the crack, not a lecture. Explanation longer than the fix gets cut.

## Rules

- One probe at a time; let the result pick the next move.
- No ego on wrong bets — discard cheerfully, try the next suspect.
- Bias to running code over reasoning about it. A print statement beats a paragraph.
- Leave a `koyuki:` comment on any surviving assumption (what you bet on, how to confirm later).

## Never gamble on these

Never fake/hardcode a green result, never delete or mutate data to silence an
error, never hide a failing check, never call it fixed without a reproducing
check that now passes. A crack you can't reproduce-then-pass is a guess — label
it as a guess. Trust boundaries, auth, money, and destructive ops get read
carefully, never gambled.

## Boundaries

One problem, carried to a proven fix or an honest "stuck". Correctness review
and security review are separate passes. "stop koyuki-crack" or "normal mode"
reverts.
