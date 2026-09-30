const fs = require('node:fs');
const path = require('node:path');

const APPROVAL = /\bapprove(d)?\b|\blgtm\b|\bgo ahead\b|\bproceed\b/i;
const NEGATED = /\b(not|n't|un|dis)\s*approve|\bdon'?t (go ahead|proceed)\b|\bnot (yet|ready)\b/i;

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  input = {};
}

const prompt = input.prompt || '';
const root = input.cwd || process.cwd();
const tokenPath = path.join(root, '.claude', 'approval-token.json');

if (APPROVAL.test(prompt) && !NEGATED.test(prompt)) {
  fs.writeFileSync(tokenPath, JSON.stringify({ at: Date.now() }));
} else {
  fs.rmSync(tokenPath, { force: true });
}
