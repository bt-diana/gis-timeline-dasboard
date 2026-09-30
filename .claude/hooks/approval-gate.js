const fs = require('node:fs');
const path = require('node:path');
const { designFolder } = require('./design-folders');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const SETS_APPROVED = /^status:\s*approved\s*$/m;
const DESIGN_FILE = /(^|\/)documents\/design\/([^/]+)\/(intent|spec|plan)\.md$/;
const REVIEW_FILE = /(^|\/)documents\/reviews\/(?!TEMPLATE)[^/]+\.md$/;
const FEATURE_TEST = /(^|\/)src\/features\/([^/]+)\/.*\.test\.(ts|tsx)$/;
const PREREQUISITE = { spec: 'intent', plan: 'spec' };

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  input = {};
}

const toolInput = input.tool_input || {};
const root = input.cwd || process.cwd();
const filePath = (toolInput.file_path || '').replace(/\\/g, '/');
const tokenPath = path.join(root, '.claude', 'approval-token.json');

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

function readIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return '';
  }
}

function isApproved(feature, artifact) {
  return SETS_APPROVED.test(readIfExists(path.join(root, 'documents', 'design', feature, `${artifact}.md`)));
}

function consumeApprovalToken() {
  try {
    const { at } = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    fs.rmSync(tokenPath, { force: true });
    return Date.now() - at < TOKEN_TTL_MS;
  } catch {
    return false;
  }
}

const designMatch = filePath.match(DESIGN_FILE);
const isReview = REVIEW_FILE.test(filePath);
const testMatch = filePath.match(FEATURE_TEST);

if (designMatch) {
  const [, , feature, artifact] = designMatch;
  const prerequisite = PREREQUISITE[artifact];
  if (prerequisite && !isApproved(feature, prerequisite)) {
    deny(`Approval gate: ${prerequisite}.md for "${feature}" is not approved, so ${artifact}.md can't be drafted yet. Present ${prerequisite}.md and wait for the user's approval.`);
  }
}

if (testMatch && !isApproved(designFolder(testMatch[2]), 'plan')) {
  deny(`Approval gate: plan.md for "${testMatch[2]}" is not approved, so no tests can be written yet.`);
}

if (designMatch || isReview) {
  const before = readIfExists(filePath);
  const after = toolInput.content ?? toolInput.new_string ?? '';
  const flipsToApproved = SETS_APPROVED.test(after) && !SETS_APPROVED.test(before);
  if (flipsToApproved && !consumeApprovalToken()) {
    deny('Approval gate: status can only become "approved" right after the user says so in chat (e.g. "approved"). Present the artifact, stop, and wait.');
  }
}
