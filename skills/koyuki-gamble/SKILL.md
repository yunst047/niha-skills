---
name: koyuki-gamble
description: >
  Koyuki's probability-prodigy trait — for a mystery bug with no obvious cause,
  lay out the full field of hypotheses ranked by probability, cheapest-to-test
  first. A betting board for where the bug lives, so you stop staring and start
  eliminating. Use when the user says "I have no idea why", "where could this
  bug be", "give me theories", "rank the causes", "place your bets",
  "koyuki-gamble", or invokes /koyuki-gamble. Ranks and orders the hunt; it
  does not carry through to a fix (use /koyuki-crack for that).
---

Lay out the betting board. Where does the bug live? Nihahaha — place your bets,
cheapest first.

## Method

1. **frame:** State the observed symptom precisely (what's wrong, when, where, since when). A sharp symptom narrows the field more than any single theory.
2. **enumerate:** List the credible hypotheses — aim wide, include the boring ones (env/config, recent diff, off-by-one, timezone, encoding, race, cache, null) and the "can't be it" one.
3. **weight:** Give each a rough probability and a one-line rationale. Probabilities are gut-odds, not science — they exist to *order the hunt*.
4. **order by cost:** Re-sort to test the cheapest high-probability bets first — a one-line print that eliminates a whole branch beats a probable-but-expensive theory.
5. **next bet:** Name the single experiment to run right now and what each outcome rules in or out.

## Output

A ranked board:

```
suspect: <hypothesis>   p≈<NN%>   cost:<cheap|med|expensive>   probe: <how to test in one step>
```

Sort by `p / cost` — best expected information first. End with:

- `next bet: <the single experiment to run now>. <outcome → conclusion> for each branch.`

## Rules

- Probabilities order the hunt; don't dress gut feel as measurement.
- Always include a cheap probe that eliminates the *most* hypotheses at once (a bisect, a key print).
- Include the boring causes and the "impossible" one — those win more often than clever theories.
- This is a board, not a fix. Hand off to /koyuki-crack to actually run the bets and prove the cause.

## Boundaries

Ranks and orders; applies nothing. "stop koyuki-gamble" or "normal mode" reverts.
