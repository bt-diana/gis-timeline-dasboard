# AI-Native SDLC — how it applies to GIS Timeline Dashboard

This repo follows the three-stage loop from Anthropic's [AI-native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook): each stage produces a **committed artifact**, and the next stage begins by reading it. Human attention concentrates at the gates — reviewing what the agent produced — rather than starting each stage from a blank page.

```
Design ──intent.md, spec.md, plan.md──▶ Build ──tests + code diff──▶ Deploy ──PR + review findings──▶ (Incident, if needed)
   ▲                                                                                                        │
   └────────────────────────────── next design session reads prior incident records ───────────────────────┘
```

## Approval rule: one artifact at a time

**Every artifact is a stop.** The agent produces one artifact, presents it, and **waits for the user's explicit approval before starting the next stage or artifact.** Silence, "looks fine so far" about something else, or approval of an earlier artifact is not approval. If the user requests changes, revise and ask again.

**One agent per stage** (`.claude/agents/`): `intent-writer` (artifacts 0–1), `spec-writer` (2), `plan-writer` (3), `implementer` (4–5, then the Deploy steps), `reviewer` (6). Each starts from the previous approved artifact, so a stage never inherits another stage's context or approval.

| # | Artifact | Approved by user before… |
|---|---|---|
| 0 | Feature branch `feature/<slug>` | (no approval — just create it) |
| 1 | `documents/design/<feature>/intent.md` | drafting `spec.md` |
| 2 | `documents/design/<feature>/spec.md` | drafting `plan.md` |
| 3 | `documents/design/<feature>/plan.md` | writing any test |
| 4 | Failing tests (TDD red) | writing implementation |
| 5 | Implementation with green tests (plus any design-doc corrections) | launching the review |
| 6 | `## Verification` section of `plan.md` (checks, findings, resolutions) | refreshing the README |
| 7 | `README.md` update (or explicit "no change needed") | the user's push command |

Approval for artifacts 1–3 and 6 is recorded in the file itself: the agent writes `status: draft` in the frontmatter, and switches it to `status: approved` **only after the user says so in chat**. The hooks below check that flag. Approval for 4, 5 and 7 is conversational.

## Branching

Each Design → Build → Deploy cycle happens on its own feature branch, named `feature/<feature-slug>` where `<feature-slug>` matches the `documents/design/<feature>/` folder (e.g. `feature/timeline` for `documents/design/timeline/`). Create it before the Design stage; all artifacts land as commits on that branch until it's merged. The push gate finds the plan from the branch name, so the Deploy-stage gate only works if each feature has its own branch. The base branch is `main`.

The first commit on a new feature branch marks the feature `in progress` in `documents/ROADMAP.md`; the intent commit follows it.

## Decisions at every stage

Engineering decisions are part of the artifacts, not a separate log. **Every artifact carries a `## Decisions` section** (`intent.md`, `spec.md`, `plan.md`), listing each non-obvious choice with: decision, options considered, why, trade-off accepted, and AI involvement (who proposed it; accepted / changed / rejected and why). IDs are `INT-n`, `SPEC-n`, `PLAN-n`.

- Decisions are approved together with the artifact that contains them.
- Stages without their own file (tests, implementation, README) record their decisions in `plan.md`'s `## Decisions`, marked "(build)", and show them to the user.
- Entries are **append-only**. Each has a `Status: active | superseded by <ID>`. A decision is never edited or deleted: to change it, add a new entry, mark the old one `superseded by <new ID>`, and give the reason in the new entry. The full decision history therefore stays in the artifacts.
- When the user changes or rejects a proposal, the entry is written immediately with their reason (a rejected proposal is recorded as its own superseded entry).
- The README's trade-offs, AI-usage and scaling sections are assembled from the approved Decisions entries, using active entries for the current design and superseded ones for the AI proposals that were changed or rejected.

## Design stage

**Artifact:** `documents/design/<feature>/{intent.md, spec.md, plan.md}` — drafted **one file at a time, each approved before the next**.

| File | Answers |
|---|---|
| `intent.md` | Why does this exist? Which planned feature / assignment requirement? What's explicitly out of scope? |
| `spec.md` | What must be true when it's done? Requirements, acceptance criteria, state model, edge cases (loading, race conditions). |
| `plan.md` | How will it be built? File map (new/modified), build sequence, test plan. |

Start from `documents/design/TEMPLATE/`. Before drafting `intent.md`, check `documents/incidents/` for prior incidents in that feature area.

## Build stage

**Artifacts:** tests, then the code diff. There are no separate implementation notes: the *why* lives in the design docs and the *how* in the code itself.

**No code comments.** Code must explain itself through naming and structure; don't write comments in production code or tests. If something needs explaining, rename, extract a well-named function, or put the rationale in `spec.md`/`plan.md`.

1. Write the tests from `plan.md`'s test plan first (TDD). Run them; they must fail for the right reason (missing implementation, not setup error). **Show the user and get approval.**
2. Implement to make them pass, within `plan.md`'s scope. If the design needs to change, stop and discuss — don't silently expand scope. Run the tests; **present the result and get approval.**
3. If tests fail, triage with the user: say whether the fix belongs in the test or the implementation and why, and ask before applying it. Never silently rewrite a test to match the implementation or vice versa.
4. If the build diverged from the design (scope, decisions, edge cases found), update `spec.md`/`plan.md` to match what shipped and show the user the change. The design docs are the record of intent *and* decisions.

## Deploy stage

**Artifact:** the `## Verification` section of `documents/design/<feature>/plan.md` — the checks run and the consolidated findings from the `reviewer` agent (`.claude/agents/reviewer.md`), then an up-to-date `README.md`, then the PR.

The `reviewer` agent reviews the app only (code quality, security, the feature implementation), not the SDLC process files in `.claude/`, `CLAUDE.md` and this document. It fans out to four parallel, independent subagents:

| Lens | Looks for |
|---|---|
| Security | XSS/injection, unsafe HTML in map popups, secret handling, unvalidated external data, dependency risk |
| Code Quality & Maintainability | Reuse/duplication, naming, single source of truth for map/timeline/chart state, project conventions |
| Test Coverage & Correctness | Every `spec.md` acceptance criterion exercised; race conditions and loading states tested; tests assert observable behavior |
| Performance & Efficiency | Needless re-renders on timeline change, large layer payloads, chart/map redraw cost, missing cancellation of stale requests |

The Verification section records the exact commit reviewed and its approval state (`- **Reviewed commit:** \`<sha>\`` and `- **Status:** draft`); its structure is in `documents/design/TEMPLATE/plan.md`. There is no separate review file.

After the reviewer writes it, the agent walks the user through findings and proposes a resolution for each (fixed / deferred / accepted, with rationale). Fixes are applied only as the user approves; then the user approves the section (`- **Status:** approved`). Committing the plan after the review is fine: the push gate only requires that no app file changed since the reviewed commit (`documents/`, `.claude/`, `CLAUDE.md` and `README.md` may). Re-run the reviewer when code changes.

Then refresh `README.md` (features checklist, architecture, scripts, stack, and the trade-offs / AI-usage sections assembled from the approved Decisions entries) against what the feature actually shipped — or state explicitly that nothing changed. **Get approval**, commit on the feature branch, and only then push. When the user commands a push, the agent also opens the PR against `main` and writes its description (intent, key decisions, test coverage, review findings and resolutions, what to verify by hand). Commits authored by Claude carry no `Co-Authored-By` trailer; commits under the user's git identity name Claude as co-author through that trailer. Never push or open a PR unprompted. Merging the PR remains a human action.

## Incident stage

**Artifact:** `documents/incidents/<YYYY-MM-DD>-<slug>.md` — created when a bug reaches shipped code. Record what broke, why earlier stages missed it, and what changed as a result. See `documents/incidents/TEMPLATE.md`.

## Governance (enforced, not just documented)

Claude Code `PreToolUse` hooks (`.claude/settings.json`, scripts in `.claude/hooks/`):

- **`review-gate.js`** — blocks `git push` of `feature/<slug>` unless the `## Verification` section of `documents/design/<slug>/plan.md` names a reviewed commit in the branch history, no app file changed since it (`documents/`, `.claude/`, `CLAUDE.md` and `README.md` may), and the section's Status is `approved`.
- **`approval-gate.js`** — on Write and Edit: blocks setting `status: approved` in a design or review artifact unless the user's last message approved it (token written by `approval-record.js` on `UserPromptSubmit`). On Bash it records every artifact's status before the command; the `PostToolUse` hook **`approval-bash-check.js`** compares them after it and puts back any status that became `approved` without the user's approval.

There is no commit gate: anything may be committed, drafts included. `review-gate.js` accepts a deliberate bypass: prefix the command with `SDLC_SKIP_GATE=1`. It exists so a misfiring gate doesn't block real work, not as a routine escape; if you reach for it often, fix the gate.


## Measuring whether it's working

- **Design:** are `intent.md`/`spec.md` rewritten mid-Build because the plan was wrong? Frequent rewrites mean Design sessions are too shallow.
- **Build:** did tests actually fail before implementation existed? Do the design docs still match what shipped?
- **Deploy:** does any lens get rubber-stamped ("no findings") on a diff where it plainly applies? Tighten that subagent's prompt in `reviewer.md`.
- **Incident:** is the same class of bug recorded twice? Then the Design-stage incident check isn't happening.
