const fs = require('node:fs');
const path = require('node:path');
const { designFolder, sliceOf } = require('./design-folders');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const SETS_APPROVED = /^status:\s*approved\s*$/m;
const DESIGN_FILE = /(^|\/)documents\/design\/([^/]+)\/(intent|spec|plan)\.md$/;
const REVIEW_FILE = /(^|\/)documents\/reviews\/(?!TEMPLATE)[^/]+\.md$/;
const TEST_FILE = /\.test\.(ts|tsx)$/;
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

const command = toolInput.command || '';
const ARTIFACT_PATH = /documents\/(design\/[^/\s'"]+\/(intent|spec|plan)|reviews\/(?!TEMPLATE)[^/\s'"]+)\.md/;
const WRITES_FILES = /\bsed\b[^|;&]*\s-i|\bperl\b[^|;&]*\s-i|>|\btee\b|\bpython3?\b|\bnode\b|\bruby\b|\bawk\b[^|;&]*-i|\b(cp|mv|install|dd)\s|\bgit\s+(checkout|restore|apply|stash)\b|\bpatch\b/;

if (command && ARTIFACT_PATH.test(command) && WRITES_FILES.test(command) && /approved/.test(command)) {
  if (!consumeApprovalToken()) {
    deny('Approval gate: this shell command writes a design or review artifact and mentions "approved". Status can only become "approved" right after the user says so in chat. Present the artifact, stop, and wait.');
  }
}

const designMatch = filePath.match(DESIGN_FILE);
const isReview = REVIEW_FILE.test(filePath);
const testSlice = TEST_FILE.test(filePath) ? sliceOf(filePath) : null;

if (designMatch) {
  const [, , feature, artifact] = designMatch;
  const prerequisite = PREREQUISITE[artifact];
  if (prerequisite && !isApproved(feature, prerequisite)) {
    deny(`Approval gate: ${prerequisite}.md for "${feature}" is not approved, so ${artifact}.md can't be drafted yet. Present ${prerequisite}.md and wait for the user's approval.`);
  }
}

if (testSlice && !isApproved(designFolder(testSlice), 'plan')) {
  deny(`Approval gate: plan.md for "${designFolder(testSlice)}" is not approved, so no tests can be written yet.`);
}

if (designMatch || isReview) {
  const before = readIfExists(filePath);
  const after = toolInput.content ?? toolInput.new_string ?? '';
  const flipsToApproved = SETS_APPROVED.test(after) && !SETS_APPROVED.test(before);
  if (flipsToApproved && !consumeApprovalToken()) {
    deny('Approval gate: status can only become "approved" right after the user says so in chat (e.g. "approved"). Present the artifact, stop, and wait.');
  }
}
