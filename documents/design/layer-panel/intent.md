---
status: approved
---

# Intent — Layer Panel (revision)

## Problem

The layer region is still mostly static and the user toggles do nothing. The panel has default fixture data, but it does not update the active layer selection when a switch is clicked, so the behavior is inconsistent with the intended layer controls.

## Requirement source

- BR-03, AR-01 (roadmap task 3).
- Supporting: TR-20 (layers described by data), TR-30 (per-request loading/error/success rendered), TR-71 (panel re-renders only on state changes).
- Layout: dashboard-layout INT-0 (panel content), INT-4 (loading indicator above the map; per-layer error with retry in the panel).

## Goals

- Replace the `Layer` stub with a stateful feature-local layer panel that owns its default fixture data and active-layer selection.
- One on/off switch per layer; click, Space and Enter toggle the active layer and rerender the switch state immediately.
- Keep the app shell dumb: `App` renders only `<LayerPanel />`, and all layer-specific logic lives in the feature folder.
- Wheel the next state layer into the feature folder through a lightweight layer store, so the toggle flow is ready for a future app-wide store integration.
- Accessible: switches remain keyboard-operable with an accessible name per layer.

## Non-goals

- App-level props for layer data or toggle callbacks.
- Full store architecture, API requests and MSW behavior (task 8).
- Layer values ("latest average" from INT-0): needs snapshot data (task 9).
- Map rendering and the loading indicator above the map (INT-4, task 5/9).

## Decisions

### INT-1 — Clicks are handled by local feature state

- **Status:** active
- **Decision:** The layer panel owns the active-layer selection in its feature folder, using a small store/helper for toggling.
- **Options considered:** Allow the app to own state; keep a static panel; implement a full app-wide store immediately.
- **Why:** The user request is explicit that the click behavior should work now and that component logic should live in the layer feature, not in `App`.
- **Trade-off accepted:** This is a minimal feature-local state solution, not the final app-wide store architecture.
- **AI involvement:** Proposed by Claude; accepted by the user.

### INT-2 — The feature remains self-contained until the state layer is introduced

- **Status:** active
- **Decision:** `LayerPanel` uses feature-local fixture data and toggle logic instead of props or a parent callback.
- **Options considered:** Keep props; add `App` wiring; add the full shared store in the same change.
- **Why:** This keeps the UI dumb and avoids app churn while validating the interaction model.
- **Trade-off accepted:** The app-wide store integration remains a later task once the API and state design are formalized.
- **AI involvement:** Proposed by Claude; accepted by the user.
