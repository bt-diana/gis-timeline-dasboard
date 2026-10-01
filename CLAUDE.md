# GIS Timeline Dashboard

Feature work, bug fixes and reviews go through the project agents in `.claude/agents/`; they carry the SDLC rules, so don't re-read `documents/AI_Native_SDLC.md` unless changing the process.

- `intent-writer` → `spec-writer` → `plan-writer` — one agent per Design artifact; each reads the previous approved artifact, drafts its own, and stops for approval.
- `implementer` — tests first, then code, then review, README and PR; one stop each.
- `reviewer` — Deploy-stage review gate; launched by `implementer` after the user accepts the implementation.

Enforced by hooks in `.claude/hooks/`: artifact approval only after the user says so, review approval before push, commit-message format, no comments in `src`. Hook blocked something: fix the cause, never bypass unless the user says so.

Non-negotiable:
- Stop for user approval after every artifact; never set `status: approved` yourself.
- Never push or open a PR unless the user commands it.
- Commits: one-line subject, no body. Commits authored by Claude carry no Co-Authored-By trailer; commits under the user's identity end with it. Commit only when allowed.
- Keep it simple (KISS, YAGNI): no over-engineering, no speculative hardening. Not every review finding gets fixed; fix what matters, accept the rest with a reason.
- Tests cover only their own unit: mock child components as `data-testid` stubs and check they render; don't re-test what a dependency's own tests cover.
- No code comments; rationale lives in design docs.
- `npm run verify` before presenting an implementation.
