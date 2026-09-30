#!/usr/bin/env node
// PostToolUse(Bash) half of the approval gate. approval-gate.js records the
// status of every design and review artifact before a shell command; this
// compares them afterwards. A status that became "approved" without the user's
// approval in chat is put back and reported. The approval token is spent only
// when a status really changed to "approved".

const fs = require('node:fs');
const { statuses, snapshotPath, consumeApprovalToken, restoreStatus } = require('./approval-state');

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  input = {};
}

const root = input.cwd || process.cwd();
const snapshotFile = snapshotPath(root, input.tool_use_id);

let before;
try {
  before = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
  fs.rmSync(snapshotFile, { force: true });
} catch {
  process.exit(0);
}

const after = statuses(root);
const flipped = Object.keys(after).filter((file) => after[file] === 'approved' && before[file] !== 'approved');

if (flipped.length === 0 || consumeApprovalToken(root)) process.exit(0);

for (const file of flipped) restoreStatus(root, file, before[file]);

process.stdout.write(JSON.stringify({
  decision: 'block',
  reason:
    `Approval gate: this shell command set "status: approved" in ${flipped.join(', ')} without the user's approval in chat. ` +
    `The status was put back. Present the artifact, stop, and wait for the user's approval.`
}));
