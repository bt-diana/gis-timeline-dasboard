#!/usr/bin/env node
// PreToolUse(Bash) gate for `git commit`.
//
// Artifact governance for the AI-native SDLC: anything may be committed except
// a design artifact (documents/design/<folder>/{intent,spec,plan}.md) or a review
// (documents/reviews/<branch>.md) whose committed version would not carry
// `status: approved` — the human's sign-off. Code commits are not gated on the
// design (layer-panel INT-6). See documents/AI_Native_SDLC.md.
//
// Bypass: prefix the command with SDLC_SKIP_GATE=1.

const { execSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const { frontmatterStatus } = require('./approval-state');

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
if (!root) allow();

const ARTIFACT = /^documents\/(design\/(?!TEMPLATE\/)[^/]+\/(intent|spec|plan)|reviews\/(?!TEMPLATE\.md$)[^/]+)\.md$/;
const usesDashA = /\bgit\s+commit\b[^|;&]*(\s-a\b|\s--all\b)/.test(command);

const staged = sh('git diff --cached --name-only --diff-filter=ACMR', root).split('\n').filter(Boolean);
const unstagedTracked = usesDashA
  ? sh('git diff --name-only --diff-filter=ACMR', root).split('\n').filter(Boolean)
  : [];

function committedText(file, fromIndex) {
  try {
    return fromIndex
      ? execFileSync('git', ['show', `:${file}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
      : fs.readFileSync(`${root}/${file}`, 'utf8');
  } catch {
    return '';
  }
}

const unapproved = [
  ...staged.filter((file) => ARTIFACT.test(file)).map((file) => [file, committedText(file, true)]),
  ...unstagedTracked.filter((file) => ARTIFACT.test(file)).map((file) => [file, committedText(file, false)]),
]
  .filter(([, text]) => frontmatterStatus(text) !== 'approved')
  .map(([file]) => file);

if (unapproved.length === 0) allow();

deny(
  `Artifact gate (AI-native SDLC): these design or review artifacts are not approved and cannot be committed:\n` +
  Array.from(new Set(unapproved)).map((file) => `  - ${file}`).join('\n') +
  `\n\nUnstage them (git restore --staged <file>) and commit the rest, or present them and wait for the user's approval.`
);
