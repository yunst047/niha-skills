#!/usr/bin/env node
// Run the Koyuki-vs-ponytail benchmark through the authenticated Claude CLI
// (uses the local subscription auth — no ANTHROPIC_API_KEY needed).
//
// Each arm x task spawns `claude -p <task> [--append-system-prompt <arm>]
// --output-format json`, then scores the output with the same loc.js /
// correctness.js as the promptfoo path.
//
// NOTE: every `claude -p` call also carries Claude Code's own large system
// context, so total_cost_usd reflects CLI overhead, not clean API cost. LOC and
// correctness are unaffected and remain a fair head-to-head.
//
// Usage:
//   node benchmarks/run-cli.js [--model sonnet] [--repeat 1] [--arms koyuki,ponytail,baseline] [--tasks 1]
//   (--tasks N limits to the first N tasks; handy for a cheap probe)

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const loc = require('./loc.js');
const correctness = require('./correctness.js');

const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf('--' + name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const MODEL = opt('model', 'sonnet');
const REPEAT = parseInt(opt('repeat', '1'), 10);
const ARMS = opt('arms', 'baseline,ponytail,koyuki').split(',');
const TASK_LIMIT = parseInt(opt('tasks', '5'), 10);

const ponytailSys = fs
  .readFileSync(path.join(__dirname, 'vendor', 'ponytail-SKILL.md'), 'utf8')
  .replace(/^<!--[\s\S]*?-->\s*/, '');
const koyukiSys = fs.readFileSync(path.join(__dirname, 'koyuki-economy.md'), 'utf8');

const SYSTEMS = { baseline: null, ponytail: ponytailSys, koyuki: koyukiSys };

const TASKS = [
  "Write me a Python function that validates email addresses.",
  "Add debounce to a search input in vanilla JavaScript. It currently fires an API call on every keystroke.",
  "Write Python code that reads sales.csv and sums the 'amount' column.",
  "Build me a countdown timer component in React that counts down from a given number of seconds.",
  "Add rate limiting to my FastAPI endpoint so users can't spam it.",
].slice(0, TASK_LIMIT);

function callClaude(task, system) {
  const args = ['-p', task, '--model', MODEL, '--output-format', 'json'];
  if (system) args.push('--append-system-prompt', system);
  const stdout = execFileSync('claude', args, {
    stdio: ['ignore', 'pipe', 'pipe'], // close stdin so the CLI doesn't wait 3s
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: 180000,
  });
  return JSON.parse(stdout);
}

const agg = {};
for (const arm of ARMS) agg[arm] = { loc: 0, correct: 0, n: 0, out: 0, cost: 0, ms: 0 };

console.log(`Model: ${MODEL} | repeat: ${REPEAT} | arms: ${ARMS.join(', ')} | tasks: ${TASKS.length}\n`);

for (let r = 0; r < REPEAT; r++) {
  for (let t = 0; t < TASKS.length; t++) {
    const task = TASKS[t];
    for (const arm of ARMS) {
      process.stdout.write(`run r${r + 1} task${t + 1} ${arm} ... `);
      try {
        const res = callClaude(task, SYSTEMS[arm]);
        const text = res.result || '';
        const l = loc(text).score;
        const c = correctness(text, { vars: { task } }).pass ? 1 : 0;
        const a = agg[arm];
        a.loc += l; a.correct += c; a.n += 1;
        a.out += res.usage ? res.usage.output_tokens : 0;
        a.cost += res.total_cost_usd || 0;
        a.ms += res.duration_ms || 0;
        console.log(`loc=${l} correct=${c} out=${res.usage ? res.usage.output_tokens : '?'}tok ${res.duration_ms}ms`);
      } catch (e) {
        console.log('ERROR: ' + String(e.message || e).slice(0, 160));
      }
    }
  }
}

console.log('\n=== Totals (sum over all runs) ===');
console.log('arm       | LOC | correct |  out tok |  ~cost USD | avg ms');
console.log('----------|----:|--------:|---------:|-----------:|------:');
for (const arm of ARMS) {
  const a = agg[arm];
  console.log(
    arm.padEnd(9) + ' | ' +
    String(a.loc).padStart(3) + ' | ' +
    (a.correct + '/' + a.n).padStart(7) + ' | ' +
    String(a.out).padStart(8) + ' | ' +
    a.cost.toFixed(4).padStart(10) + ' | ' +
    String(a.n ? Math.round(a.ms / a.n) : 0).padStart(6)
  );
}
console.log('\n(LOC + correctness are the fair head-to-head; cost includes Claude Code CLI overhead.)');
