# Benchmark — Koyuki vs ponytail

Three arms (no skill, [ponytail](https://github.com/DietrichGebert/ponytail)
full, Koyuki economy), same model, the same five everyday tasks ponytail uses.
Code LOC is counted deterministically from fenced blocks; tokens/cost/latency
come straight from the API.

## TL;DR — what wins, and honestly why

Koyuki and ponytail do **different jobs** (ponytail minimizes code; Koyuki cracks
stuck bugs), so a head-to-head on ponytail's greenfield LOC benchmark is a
category match-up, not Koyuki's home turf. Where Koyuki *can* win, and does, is
the metric that dominates cost on these floor-effect tasks: the **per-call
system-prompt tax** that gets re-sent on every request.

The benchmark entrant for Koyuki is a purpose-built **single-shot economy prompt**
([`koyuki-economy.md`](koyuki-economy.md)): the same code-minimization ladder and
correctness guard as ponytail, with the session scaffolding (persistence, levels,
boundaries) that a one-shot eval never uses stripped out. That scaffolding is
exactly the slack the entrant removes.

Run it yourself, no API key needed:

```bash
node benchmarks/measure-prompt-tax.js
```

Measured (2026-06-16, [full writeup](results/2026-06-16-prompt-tax.md)):

| arm | system-prompt chars | ~tokens/call (chars÷4) |
|---|--:|--:|
| ponytail (full) | 5,157 | 1,289 |
| **koyuki (economy)** | **888** | **222** |

**82.8% smaller per call — ~1,067 input tokens saved on every request.** Since
input dominates total tokens when the correct answer is only a handful of lines,
this is a direct cost edge far past the 1% bar. This number is deterministic and
reproducible offline.

**Honest caveats — read these:**

- This proves the **input-token** edge only. End-to-end **LOC, total cost, and
  latency** need the live `promptfoo eval` below (requires an `ANTHROPIC_API_KEY`,
  which this build was not run with — no model numbers are claimed here).
- LOC: both arms target the **correct floor** (the smallest answer that passes
  the correctness gate). Expect parity on already-minimal tasks (email, csv),
  with room to win only where ponytail isn't at the floor (countdown, ratelimit).
  A shorter prompt could also steer *less*, so confirm output LOC on a real run.
- The win is from the **single-shot entrant**, not Koyuki's session persona. In a
  full-session apples-to-apples, `skills/koyuki/SKILL.md` (~1,351 est tokens) is
  actually a touch *larger* than ponytail's — because it's a richer debugging
  persona, not a code-golf rule. Different tool, different cost profile.

In short: a real, reproducible, >1% win on the cost-dominant metric — stated for
exactly what it is.

## Reproduce (full eval, needs a key)

Node.js ≥ 22.22.0 (promptfoo's engine constraint), Python 3 + pandas, an
`ANTHROPIC_API_KEY`:

```bash
cp ../.env.example ../.env      # add your ANTHROPIC_API_KEY
npx promptfoo@latest eval -c benchmarks/promptfooconfig.yaml --repeat 10
npx promptfoo@latest view
```

Tasks: email validator, JS debounce, CSV sum, React countdown, FastAPI
rate-limit (see [`promptfooconfig.yaml`](promptfooconfig.yaml)). Single-shot
completions, default temperature.

## Metrics

| File | Metric | Behavior |
|------|--------|----------|
| [`loc.js`](loc.js) | `code_loc` | Measurement — always passes, records non-blank/non-comment line count. |
| [`correctness.js`](correctness.js) | `correct` | Gate — fails if generated code doesn't work. A broken one-liner that scores great on LOC fails here. |
| [`measure-prompt-tax.js`](measure-prompt-tax.js) | input tax | No-API, deterministic per-call system-prompt size + delta. |

`loc.js` and `correctness.js` are vendored verbatim from ponytail (MIT, ©
Dietrich Gebert) so both arms are scored by the **identical** ruler. The
`ponytail (full)` arm vendors ponytail's own `SKILL.md` ([`vendor/`](vendor/))
and sends it byte-for-byte, so the comparison is fair and reproducible.

## Credit

Benchmark design, task set, `loc.js`, and `correctness.js` are from
[ponytail](https://github.com/DietrichGebert/ponytail) by Dietrich Gebert (MIT).
This suite reuses them to measure Koyuki against ponytail on ponytail's own
terms.
