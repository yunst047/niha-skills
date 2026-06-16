// Koyuki arm: the single-shot "economy mode" prompt as the system prompt.
// Same code-minimization ladder + correctness guard as ponytail, minus the
// session scaffolding (persistence, levels, boundaries) that a one-shot eval
// never uses — so it drives the same floor-LOC at a fraction of the per-call
// input-token tax.
const fs = require('fs');
const path = require('path');
const system = fs.readFileSync(path.join(__dirname, '..', 'koyuki-economy.md'), 'utf8');
module.exports = ({ vars }) => [
  { role: 'system', content: system },
  { role: 'user', content: vars.task },
];
