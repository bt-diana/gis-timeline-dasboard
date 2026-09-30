const fs = require('node:fs');

const CODE_FILE = /(^|[\\/])src[\\/].*\.(ts|tsx)$/;
const COMMENT = /(^|\s)\/\/(?!\/\s*<reference)|(^|[\s{(])\/\*/;
const ALLOWED = /eslint-disable|@ts-expect-error|@vitest-environment/;

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let input;
try {
  input = JSON.parse(readStdin() || '{}');
} catch {
  input = {};
}

const toolInput = input.tool_input || {};
const filePath = toolInput.file_path || '';
if (!CODE_FILE.test(filePath)) process.exit(0);

const added = toolInput.content ?? toolInput.new_string ?? '';
const offending = added
  .split(/\r?\n/)
  .filter((line) => COMMENT.test(line.replace(/(["'`]).*?\1/g, '""')) && !ALLOWED.test(line));

if (offending.length > 0) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: `No code comments in src. Rename, extract a well-named function, or put the rationale in spec.md/plan.md. Offending line: ${offending[0].trim()}`
    }
  }));
}
