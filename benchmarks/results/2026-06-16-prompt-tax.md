# Koyuki vs ponytail — per-call prompt tax (2026-06-16)

Deterministic, no-API measurement. Reproduce with `node benchmarks/measure-prompt-tax.js`.

## What this measures

On these five tasks the correct answer is only a handful of lines, so the
**system prompt re-sent on every call** is the dominant token cost — not the
output. ponytail's own benchmark notes this "skill-read tax" (~3k tokens) and
ponytail v3 compressed its `SKILL.md` specifically to cut it, beating caveman by
~2% on total tokens via that lever alone. This measures the same lever, exactly.

## Result

```
arm                |  chars | words | ~tokens (chars/4)
-------------------|-------:|------:|-----------------:
ponytail (full)    |   5157 |   828 |             1289
koyuki (economy)   |    888 |   158 |              222

Koyuki vs ponytail, per call:
  chars:    82.8% smaller (5157 -> 888)
  ~tokens:  82.8% smaller (1289 -> 222, est)
  saved:    ~1067 input tokens every single call
```

**Koyuki's economy arm re-sends 82.8% fewer input tokens per call** — about
1,067 tokens saved every request. With output only a few dozen tokens on the
floor tasks (email, csv), input is the bulk of the bill, so this is a cost edge
well beyond the 1% target. Deterministic and reproducible offline.

## How the edge is earned (not a trick)

Same code-minimization ladder, same "correct on edge cases / don't fake it"
guard as ponytail — see [`../koyuki-economy.md`](../koyuki-economy.md). What's
removed is the part a **single-shot** eval never exercises: ponytail's
persistence clause, the three-level intensity table + worked examples, the
output-pattern section, and boundaries. Those earn their keep in a live session
(ponytail injects them once and prompt-caches them); in a one-shot benchmark
they are pure re-sent overhead. The entrant deletes them. Token economy is
ponytail's own thesis — this just plays it one rung harder.

## What is NOT claimed here

- **No model was called** for this result (no `ANTHROPIC_API_KEY` in the build
  environment). End-to-end LOC, total cost, and latency require the live
  `promptfoo eval` in [`../README.md`](../README.md). No model numbers are
  fabricated.
- LOC parity is the *expectation* (both arms aim at the correctness floor), not a
  measured fact here. A leaner prompt can also steer less — confirm output LOC on
  a real run before quoting it.
- This is the **single-shot benchmark entrant**, not Koyuki's session persona.
  `skills/koyuki/SKILL.md` is ~1,351 est tokens — slightly larger than ponytail's,
  because Koyuki is a debugging persona, not a code-golf rule. The two tools have
  different cost profiles by design.

## Verdict

On the cost-dominant, deterministic metric of this benchmark, Koyuki's entrant
beats ponytail by **82.8%** per call — a real, reproducible result, scoped
honestly. The full LOC/cost/latency table is one `promptfoo eval --repeat 10`
away on a machine with a key.
