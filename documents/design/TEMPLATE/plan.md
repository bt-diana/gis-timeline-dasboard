---
status: draft
---

# Plan — <Feature Name>

## File map

| File | Change |
|---|---|
| `src/features/<feature>/...` | new / modified |
| `src/mocks/...` | new, if MSW handlers change |

## Build sequence

1. ...

## Test plan

Business-critical logic and key user flows to cover. Every acceptance criterion in `spec.md` maps to at least one test.

- [ ] ...

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
