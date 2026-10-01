#!/usr/bin/env node
// PreToolUse(Bash) gate for `git push`.
//
// Deploy-stage governance for the AI-native SDLC: pushing `feature/<slug>`
// requires the `## Verification` section of documents/design/<slug>/plan.md to
// record the reviewed commit and the user's sign-off (`- **Status:** approved`),
// and no app file may have changed since the reviewed commit (documents/,
// .claude/, CLAUDE.md and README.md may).
// See documents/AI_Native_SDLC.md.
//
// Bypass: prefix the command with SDLC_SKIP_GATE=1.

const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { verificationSection, verificationStatus, reviewedCommit } = require('./approval-state');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function git(args, cwd) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', cwd, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
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
      permissionDecisionReason: `Deploy-stage gate (AI-native SDLC): ${reason} To bypass deliberately, prefix the command with SDLC_SKIP_GATE=1.`
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

if (!/(^|[;&|(]|\n)\s*(\w+=\S*\s+)*git\s+push\b/.test(command)) allow();
if (/SDLC_SKIP_GATE=1/.test(command)) allow();
if (/(\s|^)(--delete|-d)\s/.test(command) || /\s--tags\b/.test(command)) allow();

const root = git(['rev-parse', '--show-toplevel'], input.cwd || process.cwd());
if (!root) allow();

const branch = git(['rev-parse', '--abbrev-ref', 'HEAD'], root);
if (!branch || branch === 'HEAD') allow();

const featureMatch = branch.match(/^feature\/(.+)$/);
if (!featureMatch) allow();

const planPath = path.join('documents', 'design', featureMatch[1], 'plan.md');
let plan = '';
try {
  plan = fs.readFileSync(path.join(root, planPath), 'utf8');
} catch {
  deny(`${planPath} does not exist for branch "${branch}".`);
}

if (!verificationSection(plan)) {
  deny(`${planPath} has no "## Verification" section. Launch the reviewer agent; it writes the checks and findings there.`);
}

const reviewed = reviewedCommit(plan);
if (!reviewed) {
  deny(`the Verification section of ${planPath} records no "- **Reviewed commit:** <sha>". Launch the reviewer agent against HEAD.`);
}

if (git(['merge-base', '--is-ancestor', reviewed, 'HEAD'], root) === null) {
  deny(`the reviewed commit ${reviewed.slice(0, 7)} is not part of this branch's history. Re-run the reviewer agent against HEAD.`);
}

const changedSinceReview = (git(['diff', '--name-only', reviewed, 'HEAD'], root) || '')
  .split('\n')
  .filter((file) => file && !file.startsWith('documents/') && !file.startsWith('.claude/') && !['CLAUDE.md', 'README.md'].includes(file));
if (changedSinceReview.length > 0) {
  deny(
    `app files changed after the reviewed commit ${reviewed.slice(0, 7)}:\n` +
    changedSinceReview.map((file) => `  - ${file}`).join('\n') +
    `\nRe-run the reviewer agent against HEAD.`
  );
}

if (verificationStatus(plan) !== 'approved') {
  deny(`the Verification section of ${planPath} is not approved. Walk the user through the findings and resolutions; once they explicitly approve, set "- **Status:** approved" there.`);
}

allow();
