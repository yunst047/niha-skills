#!/usr/bin/env node
// koyuki — UserPromptSubmit hook to track which Koyuki mode is active.
// Inspects user input for /koyuki commands and writes the mode to the flag file.
// Accepts both engine names (lite/full/ultra/off) and the Koyuki aliases
// (chill/nihaha/nihahahack).

const { getDefaultMode, normalizeMode } = require('./koyuki-config');
const { clearMode, setMode, writeHookOutput } = require('./koyuki-runtime');

const LABEL = { lite: 'chill', full: 'nihaha', ultra: 'nihahahack' };

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('end', () => {
  try {
    // Strip UTF-8 BOM some shells prepend when piping (breaks JSON.parse)
    const data = JSON.parse(input.replace(/^﻿/, ''));
    const prompt = (data.prompt || '').trim().toLowerCase();

    // Match /koyuki commands (also @koyuki / $koyuki for Codex-style hosts)
    if (/^[/@$]koyuki/.test(prompt)) {
      const parts = prompt.split(/\s+/);
      const cmd = parts[0].replace(/^[@$]/, '/');
      const arg = parts[1] || '';

      let mode = null;

      if (cmd === '/koyuki-crack' || cmd === '/koyuki:koyuki-crack') {
        mode = 'crack';
      } else if (cmd === '/koyuki' || cmd === '/koyuki:koyuki') {
        if (arg === 'off') mode = 'off';
        else mode = normalizeMode(arg) || getDefaultMode();
      }

      if (mode && mode !== 'off') {
        setMode(mode);
        writeHookOutput(
          'UserPromptSubmit',
          mode,
          'KOYUKI MODE CHANGED — level: ' + (LABEL[mode] || mode),
        );
      } else if (mode === 'off') {
        clearMode();
        writeHookOutput('UserPromptSubmit', 'off', 'KOYUKI MODE OFF');
      }
    }

    // Detect deactivation
    if (/\b(stop koyuki|normal mode)\b/i.test(prompt)) {
      clearMode();
      writeHookOutput('UserPromptSubmit', 'off', 'KOYUKI MODE OFF');
    }
  } catch (e) {
    // Silent fail
  }
});
