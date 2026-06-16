# Koyuki vs ponytail — live CLI run (Sonnet, 2026-06-16)

Run through the authenticated Claude CLI on subscription auth (no API key).
`node benchmarks/run-cli.js --model sonnet --repeat 1 --tasks 5`. **n=1 per cell
— noisy, treat as a first read, not a verdict.**

Caveat: every `claude -p` call also carries Claude Code's own ~26k-token system
context, so `cost` reflects CLI overhead, not clean API cost. LOC and
correctness are unaffected and remain the fair head-to-head.

## Totals

| arm | total LOC | correct | out tok | avg latency | ~cost USD |
|---|--:|--:|--:|--:|--:|
| baseline | 69 | 3/5 | 3004 | 22.5s | 0.380 |
| **ponytail** | **35** | 3/5 | 2330 | 21.0s | 0.430 |
| koyuki | 50 | 3/5 | 2351 | **12.0s** | **0.313** |

## Per-task LOC

| task | baseline | ponytail | koyuki | winner |
|---|--:|--:|--:|---|
| email validator | 4 | 3 | 3 | tie |
| JS debounce | 16 | 10 | 5 | koyuki (all failed correctness) |
| CSV sum | 9 | 4 | 3 | koyuki |
| React countdown | 39 | 14 | 26 | ponytail |
| FastAPI ratelimit | 1 | 4 | 13 | ponytail (all failed correctness) |

## Honest verdict

- **Code size (the headline metric): ponytail wins, 35 vs 50.** Koyuki's much
  shorter economy prompt under-steers on the two big tasks (countdown,
  ratelimit) — ponytail's longer prompt repeats its anti-bloat pressure and
  stays minimal there. This is exactly the "a leaner prompt can also steer less"
  risk noted in the README; here it materialized.
- **Latency: koyuki −43%**, **cost: koyuki −27%**, output tokens ~tied. But n=1
  and a 64s ponytail outlier on ratelimit inflates its average — treat the
  speed/cost edges as suggestive, not proven.
- **Correctness: 3/5 for all three arms.** The same two tasks (debounce,
  ratelimit) failed for every arm, so it's the harness's strict structural/exec
  checks, not an arm-quality difference.

## So did Koyuki beat ponytail?

On **speed and cost**, yes, by well over 1%. On **code size**, no — ponytail won
this run. The offline prompt-tax result (−82.8% input per call) still holds as a
structural fact, but at the CLI level Claude Code's own context dwarfs the arm
prompt, so that input edge does not translate into a cost win the way it would
on raw API calls.

## To firm this up

- `--repeat 3` (or 5) for medians instead of n=1.
- Tighten `koyuki-economy.md` to reinforce minimalism on larger components
  (where it bloated), then re-measure — do NOT claim the improvement until the
  re-run shows it.
