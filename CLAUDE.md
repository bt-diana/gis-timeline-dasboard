# GIS Timeline Dashboard

Feature work, bug fixes and reviews go through the project agents in `.claude/agents/`; they carry the SDLC rules, so don't re-read `documents/AI_Native_SDLC.md` unless changing the process.

- `intent-writer` → `spec-writer` → `plan-writer` — one agent per Design artifact; each reads the previous approved artifact, drafts its own, and stops for approval.
- `implementer` — tests first, then code, then review, README and PR; one stop each.
- `reviewer` — Deploy-stage review gate; launched by `implementer` after the user accepts the implementation.

Enforced by hooks in `.claude/hooks/`: artifact approval only after the user says so, review approval before push, commit-message format, no comments in `src`. Hook blocked something: fix the cause, never bypass unless the user says so.

Non-negotiable:
- Stop for user approval after every artifact; never set `status: approved` yourself.
- Never push or open a PR unless the user commands it.
- Commits: user's git identity, one-line subject plus the Co-Authored-By trailer, no body. Commit only when allowed.
- No code comments; rationale lives in design docs.
- `npm run verify` before presenting an implementation.
