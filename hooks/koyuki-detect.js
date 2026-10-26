#!/usr/bin/env node
// koyuki — detect a co-installed Yuuka (yunst047/yuuka-skill) so the two
// personas can split the work instead of talking over each other.
//
// Best-effort, any hit counts:
//   flag            <claudeDir>/.yuuka-active (her hooks write it; content = her mode)
//   installed_plugins / known_marketplaces   <claudeDir>/plugins/*.json mentioning yuuka
//   plugin_cache    <claudeDir>/plugins/{cache,marketplaces}/yuuka
//   user_skill      <claudeDir>/skills/yuuka
//   project_skill   <cwd>/.claude/skills/yuuka (yuuka-install into a repo)

const fs = require('fs');
const path = require('path');
const { getClaudeDir } = require('./koyuki-config');

const YUUKA_MODES = ['lite', 'full', 'ultra', 'audit', 'bench'];

function exists(p) {
  try { fs.accessSync(p); return true; } catch (e) { return false; }
}

function jsonMentionsYuuka(file) {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return /yuuka/i.test(JSON.stringify(data));
  } catch (e) {
    return false;
  }
}

function detectYuuka({ claudeDir = getClaudeDir(), cwd = process.cwd() } = {}) {
  const sources = [];
  let active = null;

  const flag = path.join(claudeDir, '.yuuka-active');
  if (exists(flag)) {
    sources.push('flag');
    try {
      const mode = fs.readFileSync(flag, 'utf8').trim().toLowerCase();
      if (YUUKA_MODES.includes(mode)) active = mode;
    } catch (e) {}
  }

  const plugins = path.join(claudeDir, 'plugins');
  if (jsonMentionsYuuka(path.join(plugins, 'installed_plugins.json'))) sources.push('installed_plugins');
  if (jsonMentionsYuuka(path.join(plugins, 'known_marketplaces.json'))) sources.push('known_marketplaces');
  if (exists(path.join(plugins, 'cache', 'yuuka')) || exists(path.join(plugins, 'marketplaces', 'yuuka'))) {
    sources.push('plugin_cache');
  }
  if (exists(path.join(claudeDir, 'skills', 'yuuka'))) sources.push('user_skill');
  if (exists(path.join(cwd, '.claude', 'skills', 'yuuka'))) sources.push('project_skill');

  return { found: sources.length > 0, active, sources };
}

module.exports = { detectYuuka, YUUKA_MODES };
