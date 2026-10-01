---
status: draft
---

# Plan — <Feature Name>

## File map

| File | Change |
|---|---|
| `src/<layer>/<slice>/...` | new / modified |
| `src/shared/mocks/...` | new, if MSW handlers change |

## Build sequence

1. ...

## Test plan

Business-critical logic and key user flows to cover. Every acceptance criterion in `spec.md` maps to at least one test.

- [ ] ...

## Verification

Written by the `reviewer` agent after the user accepts the implementation; the push gate reads it. The user approves it by setting the Status below, only after reading the findings and resolutions.

- **Reviewed commit:** `<full HEAD sha>`
- **Status:** draft

### Checks

- [ ] `npm run verify`
- [ ] `npm run build` (and anything the build must or must not contain)
- [ ] By hand: ...

### Findings

One row per finding from the Security, Code Quality & Maintainability, Test Coverage & Correctness and Performance & Efficiency lenses, or "No findings." per lens.

| ID | Lens | Severity | Finding | Resolution | AI involvement |
|---|---|---|---|---|---|
| CQ-1 | Code Quality | minor | `file:line` — ... | TODO | |

## Decisions

Every non-obvious choice made in this artifact, or "None." One entry per decision. Entries are append-only: never edit or delete one. To change a decision, add a new entry, set the old one's status to `superseded by <new ID>`, and say why in the new entry. IDs are `PLAN-1`, `PLAN-2`, …

Build-stage decisions (choices made while writing tests or implementation, or when the build diverged from the design) are added here too, marked "(build)" in the title, and shown to the user for approval.

### PLAN-1 — <title>

- **Status:** active / superseded by <ID>
- **Decision:** ...
- **Options considered:** ...
- **Why:** ...
- **Trade-off accepted:** ...
- **AI involvement:** proposed by Claude / by the user; accepted / changed / rejected (reason)
