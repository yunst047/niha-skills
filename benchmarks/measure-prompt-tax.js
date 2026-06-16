#!/usr/bin/env node
// Deterministic, no-API measurement of the per-call system-prompt tax each arm
// re-sends on every request. On the floor-effect tasks in this suite (where the
// correct answer is only a handful of lines), this input tax dominates total
// token cost — so a smaller prompt is a direct, reproducible cost edge.
//
// This does NOT call any model. It measures exactly the system-prompt bytes the
// arms send (matching arms/ponytail.js and arms/koyuki.js). Token counts are the
// standard chars/4 estimate; exact tokens come from the live `promptfoo eval`.
//
//   node benchmarks/measure-prompt-tax.js

const fs = require('fs');
const path = require('path');

const here = __dirname;
const ponytailRaw = fs.readFileSync(path.join(here, 'vendor', 'ponytail-SKILL.md'), 'utf8');
const ponytail = ponytailRaw.replace(/^<!--[\s\S]*?-->\s*/, ''); // strip vendor attribution, send the original
const koyuki = fs.readFileSync(path.join(here, 'koyuki-economy.md'), 'utf8');

const arms = {
  'ponytail (full)': ponytail,
  'koyuki (economy)': koyuki,
};

const stat = (s) => ({
  chars: s.length,
  words: (s.trim().match(/\S+/g) || []).length,
  estTokens: Math.round(s.length / 4),
});

const rows = Object.entries(arms).map(([name, text]) => ({ name, ...stat(text) }));
const pony = rows.find((r) => r.name.startsWith('ponytail'));
const koy = rows.find((r) => r.name.startsWith('koyuki'));

const pct = (a, b) => (((a - b) / a) * 100).toFixed(1);

console.log('Per-call system-prompt tax (re-sent every request):\n');
console.log('arm                |  chars | words | ~tokens (chars/4)');
console.log('-------------------|-------:|------:|-----------------:');
for (const r of rows) {
  console.log(
    r.name.padEnd(18) + ' | ' +
    String(r.chars).padStart(6) + ' | ' +
    String(r.words).padStart(5) + ' | ' +
    String(r.estTokens).padStart(16)
  );
}

console.log('\nKoyuki vs ponytail, per call:');
console.log(`  chars:    ${pct(pony.chars, koy.chars)}% smaller (${pony.chars} -> ${koy.chars})`);
console.log(`  ~tokens:  ${pct(pony.estTokens, koy.estTokens)}% smaller (${pony.estTokens} -> ${koy.estTokens}, est)`);
console.log(`  saved:    ~${pony.estTokens - koy.estTokens} input tokens every single call`);

const ok = koy.estTokens < pony.estTokens;
console.log(`\n${ok ? 'PASS' : 'FAIL'}: koyuki arm is ${ok ? '' : 'NOT '}leaner than ponytail on per-call input tax.`);
process.exit(ok ? 0 : 1);
