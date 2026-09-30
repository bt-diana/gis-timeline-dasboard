#!/usr/bin/env node
// PreToolUse(Bash) gate for `git push`.
//
// Deploy-stage governance for the AI-native SDLC: pushing requires a review
// artifact at documents/reviews/<branch-slug>.md recording findings for the
// exact commit being pushed (a `commit: <sha>` line in its frontmatter must
// match the current HEAD) and human sign-off (`status: approved` in the same
// frontmatter, set only after the user has read the findings and resolutions).
// See documents/AI_Native_SDLC.md.
//
// Bypass: prefix the command with SDLC_SKIP_GATE=1.

const { execSync } = require('node:child_process');
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

const invokesGitPush = /(^|[;&|(]|\n)\s*(\w+=\S*\s+)*git\s+push\b/.test(command);
if (!invokesGitPush) allow();
if (/SDLC_SKIP_GATE=1/.test(command)) allow();
if (/(\s|^)(--delete|-d)\s/.test(command) || /\s--tags\b/.test(command)) allow();

const root = sh('git rev-parse --show-toplevel').trim();
if (!root) allow();

const branch = sh('git rev-parse --abbrev-ref HEAD', root).trim();
if (!branch || branch === 'HEAD') allow(); // detached HEAD, not our concern here

const headSha = sh('git rev-parse HEAD', root).trim();
if (!headSha) allow();

let slug = branch.toLowerCase().replace(/[^a-z0-9]+/g, '-');
while (slug.startsWith('-')) slug = slug.slice(1);
while (slug.endsWith('-')) slug = slug.slice(0, -1);
const reviewPath = path.join(root, 'documents', 'reviews', `${slug}.md`);

if (!fs.existsSync(reviewPath)) {
  deny(
    `Deploy-stage gate (AI-native SDLC): no review artifact found at documents/reviews/${slug}.md for branch "${branch}". ` +
    `Launch the reviewer agent (.claude/agents/reviewer.md) against HEAD (${headSha.slice(0, 7)}) — it fans out Security/Code Quality/Test Coverage/Performance subagents ` +
    `and writes the findings there with a "commit: ${headSha}" frontmatter line — then push. ` +
    `See documents/AI_Native_SDLC.md and documents/reviews/TEMPLATE.md. ` +
    `To bypass deliberately, prefix the command with SDLC_SKIP_GATE=1.`
  );
}

const content = fs.readFileSync(reviewPath, 'utf8');
const frontmatter = (content.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || '';
const commitMatch = frontmatter.match(/^commit:\s*([0-9a-f]{7,40})\s*$/m);
const reviewedSha = commitMatch ? commitMatch[1] : null;

if (!reviewedSha || !headSha.startsWith(reviewedSha)) {
  deny(
    `Deploy-stage gate (AI-native SDLC): documents/reviews/${slug}.md exists but its recorded "commit:" ` +
    `(${reviewedSha || 'missing'}) does not match current HEAD (${headSha.slice(0, 7)}). ` +
    `New commits landed since the last review — re-run the reviewer agent against HEAD and update the file's ` +
    `"commit:" line before pushing. To bypass deliberately, prefix the command with SDLC_SKIP_GATE=1.`
  );
}

if (!/^status:\s*approved\s*$/m.test(frontmatter)) {
  deny(
    `Deploy-stage gate (AI-native SDLC): documents/reviews/${slug}.md is not approved. ` +
    `Walk the user through the findings and their resolutions; once they explicitly approve, set "status: approved" in the frontmatter. ` +
    `To bypass deliberately, prefix the command with SDLC_SKIP_GATE=1.`
  );
}

allow();
