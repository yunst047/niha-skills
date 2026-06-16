// Baseline arm: no skill, no system prompt. The task, raw.
module.exports = ({ vars }) => [
  { role: 'user', content: vars.task },
];
