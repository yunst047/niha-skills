// Co-op with Yuuka (yunst047/yuuka-skill): detection, instructions, hooks,
// statusline and installer. Every test runs against sandbox dirs — never the
// real ~/.claude.

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const { detectYuuka } = require('../hooks/koyuki-detect');
const { getCoopInstructions, getKoyukiInstructions } = require('../hooks/koyuki-instructions');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'koyuki-test-'));
const rm = (d) => fs.rmSync(d, { recursive: true, force: true });

function write(file, content = '') {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function sandbox(fn) {
  const claudeDir = tmp();
  const cwd = tmp();
  try { return fn({ claudeDir, cwd }); }
  finally { rm(claudeDir); rm(cwd); }
}

function env(claudeDir, extra = {}) {
  const e = { ...process.env };
  for (const k of ['PLUGIN_DATA', 'COPILOT_PLUGIN_DATA', 'KOYUKI_DEFAULT_MODE']) delete e[k];
  return { ...e, CLAUDE_CONFIG_DIR: claudeDir, XDG_CONFIG_HOME: path.join(claudeDir, 'xdg'), ...extra };
}

function activate(claudeDir, cwd) {
  return spawnSync(process.execPath, [path.join(ROOT, 'hooks', 'koyuki-activate.js')],
    { cwd, env: env(claudeDir), encoding: 'utf8' }).stdout;
}

// --- detection -----------------------------------------------------------------

test('detect: nothing installed -> not found', () => sandbox(({ claudeDir, cwd }) => {
  assert.deepEqual(detectYuuka({ claudeDir, cwd }), { found: false, active: null, sources: [] });
}));

test('detect: active Yuuka flag -> found with her mode', () => sandbox(({ claudeDir, cwd }) => {
  write(path.join(claudeDir, '.yuuka-active'), 'ultra\n');
  const r = detectYuuka({ claudeDir, cwd });
  assert.equal(r.found, true);
  assert.equal(r.active, 'ultra');
  assert.ok(r.sources.includes('flag'));
}));

test('detect: plugin registry, cache, user and project skills', () => sandbox(({ claudeDir, cwd }) => {
  write(path.join(claudeDir, 'plugins', 'installed_plugins.json'),
    JSON.stringify({ plugins: { 'yuuka@yuuka': [{ scope: 'user' }] } }));
  write(path.join(claudeDir, 'plugins', 'known_marketplaces.json'), JSON.stringify({ yuuka: {} }));
  fs.mkdirSync(path.join(claudeDir, 'plugins', 'cache', 'yuuka'), { recursive: true });
  fs.mkdirSync(path.join(claudeDir, 'skills', 'yuuka'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.claude', 'skills', 'yuuka'), { recursive: true });
  const r = detectYuuka({ claudeDir, cwd });
  assert.deepEqual(r.sources,
    ['installed_plugins', 'known_marketplaces', 'plugin_cache', 'user_skill', 'project_skill']);
  assert.equal(r.active, null);
}));

test('detect: unrelated plugins and corrupt json do not count', () => sandbox(({ claudeDir, cwd }) => {
  write(path.join(claudeDir, 'plugins', 'installed_plugins.json'), '{ not json');
  write(path.join(claudeDir, 'plugins', 'known_marketplaces.json'), JSON.stringify({ ponytail: {} }));
  write(path.join(claudeDir, '.yuuka-active'), 'garbage');
  const r = detectYuuka({ claudeDir, cwd });
  assert.equal(r.active, null);
  assert.deepEqual(r.sources, ['flag']);
}));

// --- instructions ----------------------------------------------------------------

test('co-op block: ownership, handoffs, her live level', () => {
  const coop = getCoopInstructions({ found: true, active: 'full', sources: ['flag'] });
  assert.match(coop, /CO-OP WITH YUUKA/);
  assert.match(coop, /Koyuki owns broken/i);
  assert.match(coop, /Yuuka owns cost/i);
  assert.match(coop, /handoff/i);
  assert.match(coop, /ledger/);
  assert.match(getCoopInstructions({ found: true, active: null, sources: ['user_skill'] }), /installed/i);
  assert.equal(getCoopInstructions({ found: false, active: null, sources: [] }), '');
  assert.equal(getCoopInstructions(undefined), '');
});

test('instructions: co-op appended only when Yuuka is found', () => {
  assert.doesNotMatch(getKoyukiInstructions('full'), /CO-OP WITH YUUKA/);
  assert.match(getKoyukiInstructions('full', { yuuka: { found: true, active: null, sources: ['flag'] } }),
    /CO-OP WITH YUUKA/);
  assert.match(getKoyukiInstructions('crack', { yuuka: { found: true, active: 'full', sources: ['flag'] } }),
    /CO-OP WITH YUUKA/);
});

test('skill + AGENTS.md carry the co-op section without hooks', () => {
  for (const file of [path.join('skills', 'koyuki', 'SKILL.md'), 'AGENTS.md']) {
    const text = fs.readFileSync(path.join(ROOT, file), 'utf8');
    assert.match(text, /Co-op with Yuuka/i, file);
    assert.match(text, /Yuuka owns cost/i, file);
  }
});

// --- SessionStart hook -------------------------------------------------------------

test('activate: solo session has no co-op block', () => sandbox(({ claudeDir, cwd }) => {
  const out = activate(claudeDir, cwd);
  assert.match(out, /^KOYUKI MODE ACTIVE — level: nihaha/);
  assert.doesNotMatch(out, /CO-OP WITH YUUKA/);
}));

test('activate: installed Yuuka adds the co-op block', () => sandbox(({ claudeDir, cwd }) => {
  write(path.join(claudeDir, '.yuuka-active'), 'full');
  assert.match(activate(claudeDir, cwd), /CO-OP WITH YUUKA/);
}));

test('activate: project-level Yuuka install adds the co-op block', () => sandbox(({ claudeDir, cwd }) => {
  fs.mkdirSync(path.join(cwd, '.claude', 'skills', 'yuuka'), { recursive: true });
  assert.match(activate(claudeDir, cwd), /CO-OP WITH YUUKA/);
}));

// --- statusline ------------------------------------------------------------------

function statusline(claudeDir) {
  const res = process.platform === 'win32'
    ? spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File',
      path.join(ROOT, 'hooks', 'koyuki-statusline.ps1')], { env: env(claudeDir), encoding: 'utf8' })
    : spawnSync('bash', [path.join(ROOT, 'hooks', 'koyuki-statusline.sh')], { env: env(claudeDir), encoding: 'utf8' });
  return res.stdout.trim();
}

test('statusline: solo, combined with Yuuka, Yuuka only', () => sandbox(({ claudeDir }) => {
  assert.equal(statusline(claudeDir), '');
  write(path.join(claudeDir, '.koyuki-active'), 'full');
  assert.equal(statusline(claudeDir), '[KOYUKI:NIHAHA]');
  write(path.join(claudeDir, '.yuuka-active'), 'full');
  assert.equal(statusline(claudeDir), '[KOYUKI:NIHAHA|YUUKA:LEDGER]');
  write(path.join(claudeDir, '.koyuki-active'), 'crack');
  write(path.join(claudeDir, '.yuuka-active'), 'bench');
  assert.equal(statusline(claudeDir), '[KOYUKI:CRACK|YUUKA:BENCH]');
  fs.unlinkSync(path.join(claudeDir, '.koyuki-active'));
  assert.equal(statusline(claudeDir), '[YUUKA:BENCH]');
}));

// --- installer ---------------------------------------------------------------------

test('installer: never touches a co-installed Yuuka', () => {
  const target = tmp();
  try {
    const yuukaSkill = path.join(target, '.claude', 'skills', 'yuuka', 'SKILL.md');
    const yuukaCmd = path.join(target, '.claude', 'commands', 'yuuka.md');
    write(yuukaSkill, 'yuuka');
    write(yuukaCmd, 'yuuka');
    const yuukaHook = { hooks: [{ type: 'command', command: 'node "/x/hooks/yuuka-activate.js"' }] };
    write(path.join(target, '.claude', 'settings.json'),
      JSON.stringify({ model: 'opus', hooks: { SessionStart: [yuukaHook] } }));

    const run = (...a) => spawnSync(process.execPath, [path.join(ROOT, 'bin', 'koyuki-install.js'), target, ...a],
      { encoding: 'utf8' });
    assert.equal(run().status, 0);
    assert.equal(run().status, 0); // idempotent
    assert.ok(fs.existsSync(path.join(target, '.claude', 'skills', 'koyuki', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(target, '.claude', 'commands', 'koyuki.md')));
    assert.equal(fs.readFileSync(yuukaSkill, 'utf8'), 'yuuka');
    let settings = JSON.parse(fs.readFileSync(path.join(target, '.claude', 'settings.json'), 'utf8'));
    assert.equal(settings.hooks.SessionStart.length, 2);
    assert.equal(settings.hooks.UserPromptSubmit.length, 1);

    assert.equal(run('-u').status, 0);
    assert.equal(fs.readFileSync(yuukaSkill, 'utf8'), 'yuuka');
    assert.equal(fs.readFileSync(yuukaCmd, 'utf8'), 'yuuka');
    assert.equal(fs.existsSync(path.join(target, '.claude', 'skills', 'koyuki')), false);
    settings = JSON.parse(fs.readFileSync(path.join(target, '.claude', 'settings.json'), 'utf8'));
    assert.deepEqual(settings, { model: 'opus', hooks: { SessionStart: [yuukaHook] } });
  } finally { rm(target); }
});
