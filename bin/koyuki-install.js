#!/usr/bin/env node
// koyuki-install — wire the Koyuki skill into any repo without the Claude Code
// marketplace/CLI. Installs at the project level via the target's `.claude/`:
//   - copies skills/ and commands/ so /koyuki* are discoverable
//   - merges SessionStart + UserPromptSubmit hooks into .claude/settings.json,
//     pointing at THIS package's hook scripts by absolute path
//
// Usage:
//   node bin/koyuki-install.js <targetRepoDir>     # install
//   node bin/koyuki-install.js <targetRepoDir> -u  # uninstall
//
// Idempotent: re-running replaces the koyuki hook entries rather than stacking
// them, and never clobbers unrelated settings.json keys.

const fs = require('fs');
const path = require('path');

const pluginRoot = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const uninstall = args.includes('-u') || args.includes('--uninstall');
const target = path.resolve(args.find((a) => !a.startsWith('-')) || process.cwd());

function die(msg) { console.error('koyuki-install: ' + msg); process.exit(1); }
if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) die('target is not a directory: ' + target);

const claudeDir = path.join(target, '.claude');
const settingsPath = path.join(claudeDir, 'settings.json');

// Hook command for a given script: bash form + native Windows form. CLAUDE_PLUGIN_ROOT
// is not set in project context, so the absolute path is baked in.
function hookCmds(script) {
  const abs = path.join(pluginRoot, 'hooks', script);
  return {
    command: `node "${abs.replace(/\\/g, '/')}"`,
    commandWindows: `node "${abs}"`,
    timeout: 5,
  };
}

// Tag so we can find/replace only our own entries on re-install / uninstall.
const MARK = 'koyuki-';
const isOurs = (h) => JSON.stringify(h).includes(MARK);

function readSettings() {
  try { return JSON.parse(fs.readFileSync(settingsPath, 'utf8')); }
  catch (e) { return {}; }
}

function stripOurHooks(settings) {
  const hooks = settings.hooks || {};
  for (const event of Object.keys(hooks)) {
    hooks[event] = (hooks[event] || []).filter((entry) => !isOurs(entry));
    if (hooks[event].length === 0) delete hooks[event];
  }
  if (Object.keys(hooks).length === 0) delete settings.hooks;
  else settings.hooks = hooks;
  return settings;
}

function copyDir(name) {
  const src = path.join(pluginRoot, name);
  const dest = path.join(claudeDir, name);
  fs.rmSync(dest, { recursive: true, force: true });
  fs.cpSync(src, dest, { recursive: true });
}

function rmDir(name) {
  fs.rmSync(path.join(claudeDir, name), { recursive: true, force: true });
}

if (uninstall) {
  rmDir('skills');
  rmDir('commands');
  if (fs.existsSync(settingsPath)) {
    const settings = stripOurHooks(readSettings());
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
  console.log('Koyuki uninstalled from ' + target);
  console.log('(removed .claude/skills, .claude/commands, and koyuki hooks from settings.json)');
  process.exit(0);
}

// --- install ---
fs.mkdirSync(claudeDir, { recursive: true });
copyDir('skills');
copyDir('commands');

const settings = stripOurHooks(readSettings());
settings.hooks = settings.hooks || {};
(settings.hooks.SessionStart = settings.hooks.SessionStart || []).push({
  matcher: 'startup|resume|clear|compact',
  hooks: [{ type: 'command', statusMessage: 'Nihahaha... loading Koyuki mode...', ...hookCmds('koyuki-activate.js') }],
});
(settings.hooks.UserPromptSubmit = settings.hooks.UserPromptSubmit || []).push({
  hooks: [{ type: 'command', statusMessage: 'Tracking Koyuki mode...', ...hookCmds('koyuki-mode-tracker.js') }],
});
fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');

console.log('Nihahaha~ Koyuki installed into ' + target);
console.log('  plugin root : ' + pluginRoot);
console.log('  copied      : .claude/skills/, .claude/commands/');
console.log('  hooks       : .claude/settings.json (SessionStart + UserPromptSubmit)');
console.log('Open the repo in Claude Code and start a new session — the persona activates at nihaha.');
console.log('Undo anytime: node "' + path.join(pluginRoot, 'bin', 'koyuki-install.js') + '" "' + target + '" -u');
