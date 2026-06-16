// Ponytail arm: ponytail's own SKILL.md (full) as the system prompt — the exact
// content ponytail's own benchmark sends, so the head-to-head is fair. The
// vendored copy carries an HTML attribution comment; strip it so the system
// prompt is byte-for-byte the original 5,264-char SKILL.md, not inflated.
const fs = require('fs');
const path = require('path');
const raw = fs.readFileSync(path.join(__dirname, '..', 'vendor', 'ponytail-SKILL.md'), 'utf8');
const system = raw.replace(/^<!--[\s\S]*?-->\s*/, '');
module.exports = ({ vars }) => [
  { role: 'system', content: system },
  { role: 'user', content: vars.task },
];
