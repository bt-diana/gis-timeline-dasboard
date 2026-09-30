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
| 6 | `documents/reviews/<branch-slug>.md` + resolutions | refreshing the README |
| 7 | `README.md` update (or explicit "no change needed") | the user's push command |

Approval for artifacts 1–3 and 6 is recorded in the file itself: the agent writes `status: draft` in the frontmatter, and switches it to `status: approved` **only after the user says so in chat**. The hooks below check that flag. Approval for 4, 5 and 7 is conversational.

## Branching

Each Design → Build → Deploy cycle happens on its own feature branch, named `feature/<feature-slug>` where `<feature-slug>` matches the `documents/design/<feature>/` folder (e.g. `feature/timeline` for `documents/design/timeline/`). Create it before the Design stage; all artifacts land as commits on that branch until it's merged. `documents/reviews/<branch-slug>.md` is keyed by branch name, so the Deploy-stage gate only works if each feature has its own branch. The base branch is `main`.

The first commit on a new feature branch marks the feature `in progress` in `documents/ROADMAP.md`; the intent commit follows it.

## Decisions at every stage

Engineering decisions are part of the artifacts, not a separate log. **Every artifact carries a `## Decisions` section** (`intent.md`, `spec.md`, `plan.md`, and the review file), listing each non-obvious choice with: decision, options considered, why, trade-off accepted, and AI involvement (who proposed it; accepted / changed / rejected and why). IDs are `INT-n`, `SPEC-n`, `PLAN-n`, `REV-n`.

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

**Artifact:** `documents/reviews/<branch-slug>.md` — consolidated findings from the `reviewer` agent (`.claude/agents/reviewer.md`), then an up-to-date `README.md`, then the PR.

The `reviewer` agent fans out to four parallel, independent subagents:

| Lens | Looks for |
|---|---|
| Security | XSS/injection, unsafe HTML in map popups, secret handling, unvalidated external data, dependency risk |
| Code Quality & Maintainability | Reuse/duplication, naming, single source of truth for map/timeline/chart state, project conventions |
| Test Coverage & Correctness | Every `spec.md` acceptance criterion exercised; race conditions and loading states tested; tests assert observable behavior |
| Performance & Efficiency | Needless re-renders on timeline change, large layer payloads, chart/map redraw cost, missing cancellation of stale requests |

The review file's frontmatter records the exact commit reviewed and approval state:

```markdown
---
commit: <HEAD sha at review time>
status: draft
---
```

After the reviewer writes it, the agent walks the user through findings and proposes a resolution for each (fixed / deferred / accepted, with rationale). Fixes are applied only as the user approves; then the user approves the review file (`status: approved`). Re-run the reviewer and update `commit:` whenever new commits land after the last review — the push gate checks this.

Then refresh `README.md` (features checklist, architecture, scripts, stack, and the trade-offs / AI-usage sections assembled from the approved Decisions entries) against what the feature actually shipped — or state explicitly that nothing changed. **Get approval**, commit on the feature branch, and only then push. When the user commands a push, the agent also opens the PR against `main` and writes its description (intent, key decisions, test coverage, review findings and resolutions, what to verify by hand). Commits are authored by the user (their git identity) with Claude as co-author through a `Co-Authored-By` trailer. Never push or open a PR unprompted. Merging the PR remains a human action.

## Incident stage

**Artifact:** `documents/incidents/<YYYY-MM-DD>-<slug>.md` — created when a bug reaches shipped code. Record what broke, why earlier stages missed it, and what changed as a result. See `documents/incidents/TEMPLATE.md`.

## Governance (enforced, not just documented)

Claude Code `PreToolUse` hooks (`.claude/settings.json`, scripts in `.claude/hooks/`):

- **`design-gate.js`** — blocks `git commit` when staged (or, for `commit -a`, unstaged-tracked) changes touch an FSD slice, `src/{widgets,features,entities}/<slice>/**` or `src/shared/<segment>/**` (excluding tests), unless the slice's design folder `documents/design/<folder>/{intent,spec,plan}.md` are tracked by git **and** each has `status: approved`.
- **`review-gate.js`** — blocks `git push` unless `documents/reviews/<branch-slug>.md` exists, its `commit:` matches `HEAD`, and it has `status: approved`.
- **`approval-gate.js`** — on Write, Edit and Bash: blocks setting `status: approved` in a design or review artifact unless the user's last message approved it (token written by `approval-record.js` on `UserPromptSubmit`), and blocks tests in a slice whose `plan.md` is not approved. On Bash it blocks any command that writes a design or review file (`sed -i`, redirection, `tee`, a script, `cp`/`mv`, `git checkout`/`restore`) and mentions `approved`; for other edits to those files, use Write or Edit.

`design-gate.js` and `review-gate.js` accept a deliberate bypass: prefix the command with `SDLC_SKIP_GATE=1`. It exists so a misfiring gate doesn't block real work, not as a routine escape; if you reach for it often, fix the gate.

Note: the design gate and the approval gate find the slice with `sliceOf` in `.claude/hooks/design-folders.js`; `designFolderFor` there maps a slice to a design folder of another name (e.g. `toggle-layer` → `layer-panel`). `src/app/` is not gated. If the layout changes, update `sliceOf`.

## Measuring whether it's working

- **Design:** are `intent.md`/`spec.md` rewritten mid-Build because the plan was wrong? Frequent rewrites mean Design sessions are too shallow.
- **Build:** did tests actually fail before implementation existed? Do the design docs still match what shipped?
- **Deploy:** does any lens get rubber-stamped ("no findings") on a diff where it plainly applies? Tighten that subagent's prompt in `reviewer.md`.
- **Incident:** is the same class of bug recorded twice? Then the Design-stage incident check isn't happening.
