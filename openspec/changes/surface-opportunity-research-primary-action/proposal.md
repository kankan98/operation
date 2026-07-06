## Why

Playwright auditing of the live opportunity workflow found that an unresearched candidate can be visible in the selected detail panel while the primary "join research workspace" action remains buried lower inside the scrollable detail content. At a common 1280x720 viewport, the button center can sit at the bottom edge of the viewport and clicks can be intercepted by the scroll container. This blocks the first research action immediately after a user creates a product, records a first reading, and opens the opportunity workspace.

## What Changes

- Surface a primary "加入研究工作台" action in the selected opportunity detail header when the candidate has no research entry.
- Reuse the existing research creation behavior and default payload; no API or scoring behavior changes.
- Keep the existing research editor action in place for local context when users scroll to the research section.
- Cover the header action with a focused component test and verify the production workflow with Playwright.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `opportunity-research-workspace`: the selected opportunity detail must expose the join-research action in the immediately visible header action area for candidates that are not already in the research workspace.

## Impact

- Frontend opportunity workspace detail header and tests.
- OpenSpec documentation for the opportunity research workspace.
