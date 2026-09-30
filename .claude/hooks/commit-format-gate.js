const fs = require('node:fs');

const TRAILER = /^Co-Authored-By: .+ <.+>$/i;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
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

if (!/(^|[;&|(]|\n)\s*(\w+=\S*\s+)*git\s+commit\b/.test(command)) process.exit(0);
if (/--amend\b|--no-edit\b/.test(command) && !/(\s-m\b|--message|<<)/.test(command)) process.exit(0);

const heredoc = command.match(/<<-?\s*['"]?(\w+)['"]?\r?\n([\s\S]*?)\r?\n\s*\1\b/);
let lines;
if (heredoc) {
  lines = heredoc[2].split(/\r?\n/);
} else {
  const messages = [...command.matchAll(/(?:-m|--message)[=\s]+(?:"((?:[^"\\]|\\.)*)"|'([^']*)')/g)]
    .map((m) => m[1] ?? m[2]);
  if (messages.length === 0) process.exit(0);
  lines = messages.flatMap((m, i) => (i === 0 ? m.split(/\\n|\r?\n/) : ['', ...m.split(/\\n|\r?\n/)]));
}

const content = lines.map((l) => l.trim()).filter(Boolean);
const body = content.filter((l, i) => i > 0 && !TRAILER.test(l));
const hasTrailer = content.some((l) => TRAILER.test(l));

if (body.length > 0) {
  deny('Commit message must be a one-line subject plus the Co-Authored-By trailer, no body. Move rationale into the design docs.');
}
if (!hasTrailer) {
  deny('Commit message must end with the Co-Authored-By trailer given in the session attribution reminder.');
}
