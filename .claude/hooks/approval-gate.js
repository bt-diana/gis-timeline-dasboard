const fs = require('node:fs');
const path = require('node:path');
const { statuses, snapshotPath, consumeApprovalToken: consumeToken } = require('./approval-state');

const SETS_APPROVED = /^status:\s*approved\s*$/m;
const DESIGN_FILE = /(^|\/)documents\/design\/([^/]+)\/(intent|spec|plan)\.md$/;
const REVIEW_FILE = /(^|\/)documents\/reviews\/(?!TEMPLATE)[^/]+\.md$/;
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

const consumeApprovalToken = () => consumeToken(root);

if (input.tool_name === 'Bash') {
  const snapshotFile = snapshotPath(root, input.tool_use_id);
  const snapshotDir = path.dirname(snapshotFile);
  fs.mkdirSync(snapshotDir, { recursive: true });
  for (const name of fs.readdirSync(snapshotDir)) {
    const stale = path.join(snapshotDir, name);
    if (Date.now() - fs.statSync(stale).mtimeMs > 60 * 60 * 1000) fs.rmSync(stale, { force: true });
  }
  fs.writeFileSync(snapshotFile, JSON.stringify(statuses(root)));
  process.exit(0);
}

const designMatch = filePath.match(DESIGN_FILE);
const isReview = REVIEW_FILE.test(filePath);

if (designMatch) {
  const [, , feature, artifact] = designMatch;
  const prerequisite = PREREQUISITE[artifact];
  if (prerequisite && !isApproved(feature, prerequisite)) {
    deny(`Approval gate: ${prerequisite}.md for "${feature}" is not approved, so ${artifact}.md can't be drafted yet. Present ${prerequisite}.md and wait for the user's approval.`);
  }
}

if (designMatch || isReview) {
  const before = readIfExists(filePath);
  const after = toolInput.content ?? toolInput.new_string ?? '';
  const flipsToApproved = SETS_APPROVED.test(after) && !SETS_APPROVED.test(before);
  if (flipsToApproved && !consumeApprovalToken()) {
    deny('Approval gate: status can only become "approved" right after the user says so in chat (e.g. "approved"). Present the artifact, stop, and wait.');
  }
}
