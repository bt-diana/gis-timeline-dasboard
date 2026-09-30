const fs = require('node:fs');
const path = require('node:path');

const TOKEN_TTL_MS = 30 * 60 * 1000;
const STATUS_LINE = /^status:[ \t]*(\S+)[ \t]*$/m;
const ARTIFACTS = ['intent.md', 'spec.md', 'plan.md'];

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

function listDir(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

// Every design and review artifact whose approval the gates guard.
function artifactPaths(root) {
  const design = path.join(root, 'documents', 'design');
  const reviews = path.join(root, 'documents', 'reviews');
  const designFiles = listDir(design)
    .filter((entry) => entry.isDirectory() && entry.name !== 'TEMPLATE')
    .flatMap((entry) => ARTIFACTS.map((name) => path.join(design, entry.name, name)));
  const reviewFiles = listDir(reviews)
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md') && entry.name !== 'TEMPLATE.md')
    .map((entry) => path.join(reviews, entry.name));
  return [...designFiles, ...reviewFiles];
}

function statuses(root) {
  const result = {};
  for (const file of artifactPaths(root)) {
    const text = readIfExists(file);
    if (text !== null) result[path.relative(root, file)] = frontmatterStatus(text);
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

// Puts a file's frontmatter status back to what it was before the command.
function restoreStatus(root, relPath, previous) {
  const file = path.join(root, relPath);
  const text = readIfExists(file);
  if (text === null) return;
  const restored = text.replace(/^(---\r?\n[\s\S]*?)^status:[ \t]*approved[ \t]*$/m, `$1status: ${previous || 'draft'}`);
  fs.writeFileSync(file, restored);
}

module.exports = { statuses, snapshotPath, consumeApprovalToken, restoreStatus, frontmatterStatus };
