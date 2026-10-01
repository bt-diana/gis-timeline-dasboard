const fs = require('node:fs');
const path = require('node:path');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const STATUS_LINE = /^status:[ \t]*(\S+)[ \t]*$/m;
const ARTIFACTS = ['intent.md', 'spec.md', 'plan.md'];
const VERIFICATION_KEY = '#verification';

function readIfExists(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

function frontmatterStatus(text) {
  const fm = text && text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const m = fm && fm[1].match(STATUS_LINE);
  return m ? m[1] : null;
}

// The `## Verification` section of a plan, up to the next `## ` heading.
function verificationSection(text) {
  const m = text && text.match(/^## Verification[ \t]*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  return m ? m[1] : null;
}

function verificationStatus(text) {
  const m = (verificationSection(text) || '').match(/^- \*\*Status:\*\*[ \t]*(\S+)/m);
  return m ? m[1] : null;
}

function reviewedCommit(text) {
  const m = (verificationSection(text) || '').match(/^- \*\*Reviewed commit:\*\*[ \t]*`?([0-9a-f]{7,40})`?/m);
  return m ? m[1] : null;
}

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function designArtifactPaths(root) {
  const design = path.join(root, 'documents', 'design');
  return listDir(design)
    .filter((entry) => entry.isDirectory() && entry.name !== 'TEMPLATE')
    .flatMap((entry) => ARTIFACTS.map((name) => path.join(design, entry.name, name)));
}

// Approval state of every design artifact, plus each plan's Verification section.
function statuses(root) {
  const result = {};
  for (const file of designArtifactPaths(root)) {
    const text = readIfExists(file);
    if (text === null) continue;
    const relPath = path.relative(root, file);
    result[relPath] = frontmatterStatus(text);
    if (relPath.endsWith('plan.md')) result[relPath + VERIFICATION_KEY] = verificationStatus(text);
  }
  return result;
}

function snapshotPath(root, toolUseId) {
  const id = String(toolUseId || 'last').replace(/[^A-Za-z0-9_-]/g, '_');
  return path.join(root, '.claude', 'approval-snapshots', `${id}.json`);
}

function consumeApprovalToken(root) {
  const tokenPath = path.join(root, '.claude', 'approval-token.json');
  try {
    const { at } = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
    fs.rmSync(tokenPath, { force: true });
    return Date.now() - at < TOKEN_TTL_MS;
  } catch {
    return false;
  }
}

// Puts a status that became "approved" back to what it was before the command.
function restoreStatus(root, key, previous) {
  const isVerification = key.endsWith(VERIFICATION_KEY);
  const file = path.join(root, isVerification ? key.slice(0, -VERIFICATION_KEY.length) : key);
  const text = readIfExists(file);
  if (text === null) return;
  const restored = isVerification
    ? text.replace(/(^## Verification[\s\S]*?^- \*\*Status:\*\*[ \t]*)approved/m, `$1${previous || 'draft'}`)
    : text.replace(/^(---\r?\n[\s\S]*?)^status:[ \t]*approved[ \t]*$/m, `$1status: ${previous || 'draft'}`);
  fs.writeFileSync(file, restored);
}

module.exports = {
  statuses,
  snapshotPath,
  consumeApprovalToken,
  restoreStatus,
  frontmatterStatus,
  verificationSection,
  verificationStatus,
  reviewedCommit,
};
