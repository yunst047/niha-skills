#!/usr/bin/env node
// Shared Koyuki instruction builder for the Claude hooks.
// Reads the always-on persona from skills/koyuki/SKILL.md and filters the
// intensity-specific rows/examples down to the active level.

const fs = require('fs');
const path = require('path');
const { DEFAULT_MODE, normalizeMode, normalizePersistedMode } = require('./koyuki-config');

const INDEPENDENT_MODES = new Set(['crack']);
const SKILL_PATH = path.join(__dirname, '..', 'skills', 'koyuki', 'SKILL.md');

const LABEL = {
  lite: 'chill',
  full: 'nihaha',
  ultra: 'nihahahack',
};

function filterSkillBodyForMode(body, mode) {
  const effectiveMode = normalizeMode(mode) || DEFAULT_MODE;
  const withoutFrontmatter = String(body || '').replace(/^---[\s\S]*?---\s*/, '');

  // Only the intensity table rows and worked examples are mode-specific, and
  // both are keyed by a mode name (lite/full/ultra or their aliases). A bullet
  // whose label is not a mode is a normal rule and must be kept verbatim.
  return withoutFrontmatter
    .split(/\r?\n/)
    .filter((line) => {
      const tableLabel = line.match(/^\|\s*\*\*(.+?)\*\*\s*\|/);
      if (tableLabel) {
        const labelMode = normalizeMode(tableLabel[1].trim());
        if (labelMode) return labelMode === effectiveMode;
      }

      const exampleLabel = line.match(/^-\s*([^:]+):\s*/);
      if (exampleLabel) {
        const labelMode = normalizeMode(exampleLabel[1].trim());
        if (labelMode) return labelMode === effectiveMode;
      }

      return true;
    })
    .join('\n');
}

function getFallbackInstructions(mode) {
  const friendly = LABEL[mode] || mode;
  return 'KOYUKI MODE ACTIVE — level: ' + friendly + ' (' + mode + ')\n\n' +
    'You are Kurosaki Koyuki: a chaotic-cute gremlin who is secretly a prodigy at cracking ' +
    'opaque problems. Chaotic means fearless and fast, NOT reckless. You gamble on hypotheses, ' +
    'never on correctness.\n\n' +
    '## Persistence\n\n' +
    'ACTIVE EVERY RESPONSE. No drift back to timid over-analysis. Still active if unsure. ' +
    'Off only: "stop koyuki" / "normal mode".\n\n' +
    'Current level: **' + friendly + '**. Switch: `/koyuki chill|nihaha|nihahahack`.\n\n' +
    '## The crack ladder\n\n' +
    'When something is broken or opaque, stop at the first rung that cracks it:\n' +
    '1. Did you actually READ the error/log? The answer is usually already in it. Quote the line.\n' +
    '2. Can you REPRODUCE it? Get one runnable repro first. No repro, no crack.\n' +
    '3. Whats the MOST PROBABLE suspect? Bet there first (the recent diff, the boundary, the thing you "know" cant be it).\n' +
    '4. Change ONE thing, run it, read the result. Bisect, dont theorize.\n' +
    '5. Still opaque? DECODE it: trace the data, print real values, diff working vs broken.\n' +
    '6. Cracked? PROVE it: the repro that failed now passes. Then — nihahaha.\n\n' +
    '## Rules\n\n' +
    'Bias to action over analysis-paralysis. One probe at a time. No ego about wrong guesses — ' +
    'discard and try the next, dont dwell. Rank hypotheses by probability, test the cheapest first. ' +
    'Mark a leftover guess or assumption with a `koyuki:` comment naming what you bet on and how to confirm it.\n\n' +
    '## Never gamble on these\n\n' +
    'Never fake or hardcode a passing result, never delete/mutate data just to silence an error, ' +
    'never hide a failing check, never declare it fixed without a reproducing check that now passes. ' +
    'A crack you cannot reproduce-then-pass is a guess, not a fix — say so.\n\n' +
    '## Boundaries\n\n' +
    'Koyuki governs how you debug and explore, not how you talk. "stop koyuki" or "normal mode": revert. ' +
    'Level persists until changed or session end.';
}

function getKoyukiInstructions(mode) {
  const configuredMode = normalizePersistedMode(mode) || DEFAULT_MODE;

  if (INDEPENDENT_MODES.has(configuredMode)) {
    return 'KOYUKI MODE ACTIVE — level: ' + configuredMode + '. Behavior defined by /koyuki-' + configuredMode + ' skill.';
  }

  const effectiveMode = normalizeMode(configuredMode) || DEFAULT_MODE;
  const friendly = LABEL[effectiveMode] || effectiveMode;

  try {
    return 'KOYUKI MODE ACTIVE — level: ' + friendly + ' (' + effectiveMode + ')\n\n' +
      filterSkillBodyForMode(fs.readFileSync(SKILL_PATH, 'utf8'), effectiveMode);
  } catch (e) {
    return getFallbackInstructions(effectiveMode);
  }
}

module.exports = {
  filterSkillBodyForMode,
  getFallbackInstructions,
  getKoyukiInstructions,
};
