#!/usr/bin/env node
// PreToolUse(Bash) gate for `git commit`.
//
// Design-stage governance for the AI-native SDLC: if a commit touches production
// code under src/features/<feature>/, that feature must already have
// documents/design/<feature>/{intent,spec,plan}.md tracked by git (staged or
// committed) AND each must carry `status: approved` in its frontmatter — the
// human's sign-off on each artifact. See documents/AI_Native_SDLC.md.
//
// Bypass: prefix the command with SDLC_SKIP_GATE=1 (e.g. for hotfixes, merge
// commits, or docs-only commits the pattern below misfires on).

const { execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function sh(cmd, cwd) {
  try {
    return execSync(cmd, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  } catch {
    return '';
  }
}

function allow() {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'allow' }
  }));
  process.exit(0);
}

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason
    }
  }));
  process.exit(0);
}

let input;
try {
  input = JSON.parse(readStdin() || '{}');
} catch {
  input = {};
}

const command = input.tool_input?.command || '';

const invokesGitCommit = /(^|[;&|(]|\n)\s*(\w+=\S*\s+)*git\s+commit\b/.test(command);
if (!invokesGitCommit) allow();
if (/SDLC_SKIP_GATE=1/.test(command)) allow();

const root = sh('git rev-parse --show-toplevel').trim();
if (!root) allow(); // not a git repo somehow — don't block on our own confusion

const usesDashA = /\bgit\s+commit\b[^|;&]*(\s-a\b|\s--all\b)/.test(command);

const staged = sh('git diff --cached --name-only --diff-filter=ACMR', root)
  .split('\n')
  .filter(Boolean);
const unstagedTracked = usesDashA
  ? sh('git diff --name-only --diff-filter=ACMR', root).split('\n').filter(Boolean)
  : [];

const files = Array.from(new Set([...staged, ...unstagedTracked]));

const featureRe = /^src\/features\/([^/]+)\//;
const isTestFile = (f) => /\.(test|spec)\.[jt]sx?$/.test(f) || /\/__tests__\//.test(f) || /\/tests\//.test(f);

// Feature folders whose design lives in another design folder (PLAN-3 of
// dashboard-layout). Remove an entry once that folder gets its own design docs.
const designFolderFor = {
  header: 'dashboard-layout',
  layer: 'layer-panel',
  map: 'dashboard-layout',
  chart: 'dashboard-layout',
};

const features = new Set();
for (const f of files) {
  const m = f.match(featureRe);
  if (m && !isTestFile(f)) features.add(designFolderFor[m[1]] || m[1]);
}

if (features.size === 0) allow();

const isTracked = (relPath) => {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', '--', relPath], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

const isApproved = (relPath) => {
  try {
    const text = fs.readFileSync(path.join(root, relPath), 'utf8');
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    return !!fm && /^status:\s*approved\s*$/m.test(fm[1]);
  } catch {
    return false;
  }
};

const missing = [];
const unapproved = [];
for (const feature of features) {
  for (const doc of ['intent.md', 'spec.md', 'plan.md']) {
    const relPath = `documents/design/${feature}/${doc}`;
    if (!isTracked(relPath)) missing.push(relPath);
    else if (!isApproved(relPath)) unapproved.push(relPath);
  }
}

if (missing.length === 0 && unapproved.length === 0) allow();

const parts = [
  `Design-stage gate (AI-native SDLC): this commit touches src/features/{${Array.from(features).join(', ')}}.`
];
if (missing.length) {
  parts.push(`Design artifacts not yet staged/committed:\n${missing.map((m) => `  - ${m}`).join('\n')}`);
}
if (unapproved.length) {
  parts.push(
    `Design artifacts without "status: approved" in their frontmatter (the human has not signed off):\n` +
    unapproved.map((m) => `  - ${m}`).join('\n')
  );
}
parts.push(
  `Write intent.md, spec.md and plan.md under documents/design/<feature>/ one at a time, get the user's explicit approval of each, ` +
  `then set "status: approved" and stage them before committing implementation. ` +
  `See documents/AI_Native_SDLC.md and documents/design/TEMPLATE/. ` +
  `To bypass deliberately (e.g. a docs-only or hotfix commit misclassified by this gate), prefix the command with SDLC_SKIP_GATE=1.`
);
deny(parts.join('\n\n'));
