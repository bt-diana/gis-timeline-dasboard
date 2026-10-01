# AI usage

## Tools and what I used them for

I used **Claude Code** for the whole project, following Anthropic's [AI-native SDLC playbook](https://claude.com/blog/the-ai-native-sdlc-playbook). Every feature goes through intent → spec → plan → tests → code → review, with project agents in `.claude/agents/` (one per stage) and hooks in `.claude/hooks/` that check approvals and the review before a push. The design docs for each feature are in `documents/design/`, and every non-obvious choice is recorded in their `## Decisions` sections.

Claude wrote the requirement documents, the design docs, the tests and the code. I reviewed every artifact, approved it or asked for changes, and made the architectural decisions.

## What Claude proposed, and what I changed or rejected

| Claude proposed | What I did | Why |
|---|---|---|
| A props-only layer panel with fixture data and a no-op toggle; the store and requests in later tasks | Changed: the switches work right away through the Vedro store, and the requests and mock API are part of the same task (layer-panel INT-3, INT-5) | One feature should work end to end, not "UI now, data later" |
| Folders grouped by feature in `src/features/<feature>/` | Changed to Feature-Sliced Design (INT-4) | I often follow FSD, and I like its business-logic thinking |
| One Vedro store per entity | Changed: one store, composed from one slice file per entity (PLAN-5) | One source of truth, with each entity's state next to its logic |
| A `pages/` layer | Rejected (PLAN-7) | The app has only one page |
| Mocks in `src/mocks/` with a dev-only `dev-public/` folder | Changed to `src/shared/mocks/` and `public/` (PLAN-12) | Keep them in the lowest FSD layer and the standard folder |
| MSW in dev and tests | Changed: tests mock the request functions with `vi.mock` (SPEC-3) | Simpler tests that control the order of responses directly |
| The mock API only in dev, removed from the production build | Changed: the mock API runs in every build (SPEC-7, PLAN-15) | There is no real backend, so the built app and the demo had no data |
| Failure injection through a URL parameter, then a QA control on the page | Removed | Error states are covered by tests; the extra UI was not worth it |
| Replace Vedro's hooks with custom hooks on React's `useSyncExternalStore` | Rejected (PLAN-14) | The task is to show how Vedro is used, so I keep its hooks as they are |
| An `App` test that checked loading, toggling, errors and StrictMode | Changed: `App` mocks its children with `data-testid` stubs and only checks that they render | Each test covers only its own unit |
| Plain `fetch` instead of axios (I asked) | Accepted (PLAN-13) | Axios would only save the JSON parsing; the error mapping and validation stay our own code |

## My experience

In practice, the AI-native SDLC made new features slower than if I wrote them myself. Claude over-engineers, makes wrong architectural decisions, and then the code goes through review and rewriting again and again. The layer panel, a list with on/off switches, ended up with 6 plan revisions and 6 review rounds.

**Over-engineering.** The SDLC tooling grew too, and I didn't ask for it. Claude added gates on its own: a commit gate that blocked code until all design docs were approved, a map from code folders to design folders, and a hook that took snapshots of every document before and after each shell command. I removed most of it. The push gate checked that the review matched the exact commit, so every small change meant a new review, and most of the time I just pushed with the bypass.

**Wrong decisions.** The requirements said from the start that there is no real backend and all data is mock, and the app was going to be hosted. Still, Claude decided the mock API should run only in dev, and added a build plugin that deleted it from the production build. Tests passed, the review passed, but the built app had no API at all. I only found out when I opened it myself.

**Reviewing decisions without code.** The idea is to review intent, spec and plan before any code. But I don't really understand a decision until I see the code. My first plan said the layer panel is "driven only by props", the app passes fixture data and a no-op toggle callback, and the store and requests come in later tasks. In the document it sounded clean. In the running app it meant switches that don't switch. I only saw it when the code was built. The Decisions sections also filled up with entries like "the active ids are a `readonly string[]`" next to the real architecture decisions, and I had to ask twice to remove the ones that weren't valuable.

**Tests without business value.** Claude treats every piece of my feedback as a strict requirement and writes a test for it. Every review finding got its own test, even a test that the store keeps the same reference, and the next review said that test "proves nothing".

## What I changed in the setup

- **Simplicity rule.** KISS and YAGNI are a rule in `CLAUDE.md`: not every review finding gets fixed, only what matters.
- **Smaller reviews.** The review covers only the app (code quality, security, the feature), not the SDLC files. The results go into a Verification section of the feature's plan instead of a separate file.
- **Unit-only tests.** Each test covers only its own unit, and child components are mocked.
- **Fewer gates.** The commit gate is removed. Approval of the design docs and the review before push stay.
- **Fewer decisions.** Only decisions that explain the architecture or record my choice are kept.
