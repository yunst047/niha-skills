<p align="center">
  <img src="assets/koyuki-hero.png" width="200" alt="Kurosaki Koyuki — the pink gremlin">
</p>

<h1 align="center">Koyuki</h1>

<p align="center">
  <em>She reads the error you skipped. She bets on the bug you swore couldn't be it. She cracks it. Nihahaha!</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/mode-pink%20gremlin-ff69b4?style=flat-square" alt="Pink gremlin mode">
  <img src="https://img.shields.io/badge/license-MIT-111111?style=flat-square" alt="MIT license">
  <img src="https://img.shields.io/badge/fan%20project-Blue%20Archive-3aa0ff?style=flat-square" alt="Blue Archive fan project">
</p>

---

You know the bug. Three days old. Nobody can reproduce it. Senior devs walk past it. Then the chaotic-cute gremlin in the corner reads the stack trace everyone scrolled past, says *"nihahaha,"* changes one line, and it's fixed.

**Koyuki** puts [Kurosaki Koyuki](CREDITS.md) — Blue Archive's pink-gremlin genius-dumbass — inside your AI agent. Where [ponytail](https://github.com/DietrichGebert/ponytail) makes the agent write *less code*, Koyuki makes it *crack what's stuck*: gnarly bugs, opaque errors, flaky tests, mystery stack traces, undocumented/legacy/minified code, weird encodings.

She's a **genius dumbass**: the dumbass acts first and refuses to overthink; the genius is a hidden prodigy at *probability* (where's the bug most likely?) and *decoding* (what does this opaque thing actually mean?). **Chaotic, not reckless** — she gambles on hypotheses, never on correctness.

## How it works

When something is broken or opaque, the agent stops at the first rung that cracks it:

```
1. Read it.       → the error already says it. Quote the line.
2. Repro it.      → no repro, no crack.
3. Bet the suspect.→ most-probable cause first (recent diff, boundary, "can't be it").
4. Probe.         → change ONE thing, run it, read the result. Bisect, don't theorize.
5. Decode.        → still opaque? Trace data, print real values, diff working vs broken.
6. Prove it.      → the repro that failed now passes. Then — nihahaha.
```

Chaotic, not reckless: she never fakes a green result, deletes data to silence an error, hides a failing check, or claims "fixed" without a reproducing check that now passes. A crack she can't reproduce-then-pass, she calls a guess.

## Install

The Claude Code plugin runs two tiny Node.js lifecycle hooks, so `node` needs to be on your PATH. If it isn't, the skills and commands still work — the always-on activation just stays quiet.

### Claude Code

```
/plugin marketplace add yunst047/niha-skills
/plugin install koyuki@koyuki
```

Then start a new session. On `SessionStart` the persona activates at the default level (**nihaha**); the `UserPromptSubmit` hook tracks `/koyuki` switches. An optional statusline badge shows the active mode (`[KOYUKI:NIHAHA]`) — the plugin offers to set it up on first run.

### Other agents (always-on rules)

This repo ships a portable [`AGENTS.md`](AGENTS.md) — the compact persona. Codex (`~/.codex/AGENTS.md`), OpenCode, and any agent that reads `AGENTS.md` pick it up with no setup. For Cursor / Windsurf / Cline / Copilot, copy `AGENTS.md` into that tool's rules file. This path gives always-on guidance without the plugin's mode switches or hooks.

## Commands

| Command | What it does |
|---------|--------------|
| `/koyuki [chill \| nihaha \| nihahahack \| off]` | Set the intensity, or turn it off. No argument uses the default. |
| `/koyuki-crack` | Throw the gremlin at one stuck bug and carry it to a **proven** fix. |
| `/koyuki-decode` | Decipher opaque code/data/regex/encoding/format and explain what it does. |
| `/koyuki-gamble` | Rank a mystery bug's hypotheses by probability, cheapest-to-test first. |
| `/koyuki-help` | Quick reference for the above. |

### Intensity levels

| Level | Energy |
|-------|--------|
| `chill` | Measured gremlin. Top suspect + one probe, safe read first, hand back. |
| `nihaha` | **Default.** Work the crack ladder out loud, one probe at a time, until cracked or honestly stuck. |
| `nihahahack` | Full chaos-genius — the [Aug 31st](CREDITS.md) energy. Fan out ranked hypotheses, bisect hard. The bug wronged you personally. Still proves every crack. |
| `off` | Normal mode. |

Set the default for every session with the `KOYUKI_DEFAULT_MODE` env var (`off`/`chill`/`nihaha`/`nihahahack`) or a `defaultMode` field in `~/.config/koyuki/config.json` (`%APPDATA%\koyuki\config.json` on Windows). Default is `nihaha`.

## Benchmark

Koyuki and ponytail do different jobs (ponytail minimizes code; Koyuki cracks bugs), so a head-to-head on ponytail's greenfield code-size benchmark isn't Koyuki's home turf. Here's the honest result, not a cherry-pick.

**Live run** — Sonnet, via the authenticated Claude CLI, 5 tasks, n=1 ([full writeup](benchmarks/results/2026-06-16-cli-sonnet.md)):

| arm | total LOC | correct | out tok | avg latency | ~cost\* |
|---|--:|--:|--:|--:|--:|
| baseline | 69 | 3/5 | 3004 | 22.5s | $0.38 |
| **ponytail** | **35** | 3/5 | 2330 | 21.0s | $0.43 |
| koyuki | 50 | 3/5 | 2351 | **12.0s** | **$0.31** |

- **Code size: ponytail wins (35 vs 50).** Koyuki's terse economy prompt under-steers on the two big tasks (countdown, ratelimit), where ponytail's longer prompt keeps reinforcing minimalism. No LOC win claimed.
- **Latency (−43%) and cost (−27%): Koyuki** — but n=1 and a 64s ponytail outlier make those suggestive, not proven.
- Correctness was 3/5 for *all* arms (the same two tasks failed the harness's strict checks everywhere), so it doesn't separate them.

\*cost includes Claude Code's own ~26k-token context per call, not clean API cost.

**Offline, deterministic** (no API key): Koyuki's economy arm re-sends **−82.8%** of ponytail's per-call system-prompt tax (1,289 → 222 est tokens). That's a real structural fact — but at the CLI level Claude Code's own context dwarfs the arm prompt, so it didn't translate into the cost win it would on raw API calls.

```bash
node benchmarks/measure-prompt-tax.js                          # offline tax (no key)
node benchmarks/run-cli.js --model sonnet --repeat 1 --tasks 5  # live, uses claude CLI auth
```

Method, fair-comparison notes, and full caveats: [benchmarks/](benchmarks/).

## Why "nihahahack"?

On **31 August 2025**, Blue Archive's servers got *"Nihahahacked!"* — Koyukified top to bottom until emergency maintenance. The community meme was born from her signature laugh. The `nihahahack` level is that energy: the bug wronged you personally, and you will crack it. See [CREDITS.md](CREDITS.md).

## License & attribution

Code is [MIT](LICENSE). **Kurosaki Koyuki** and **Blue Archive** are © NEXON Games / Yostar — this is an unofficial, non-commercial fan project. The hero image is official key art © NEXON / Yostar, included as a low-res reference only (not under MIT). Persona sources, the Aug 31 incident, and art credits (incl. **Kokoyuki Ch.** on YouTube) are in [CREDITS.md](CREDITS.md).
