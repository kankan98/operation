## Context

The opportunity workspace already supports adding a product to research from the candidate row and from the `ResearchEditor` card inside the selected detail panel. The detail panel is a scrollable `<aside>`, and live Playwright evidence showed the `ResearchEditor` add button can be positioned too low for reliable click targeting at 1280x720. Users following the cold-start path naturally focus on the selected explanation panel, so the join action should be available where other immediate detail actions already live.

## Goals / Non-Goals

**Goals:**

- Make the selected candidate's join-research action visible in the detail header without requiring side-panel scrolling.
- Preserve the existing `handleAddResearch(productId)` behavior and default metadata payload.
- Avoid duplicate action confusion after the candidate has an active or archived research entry.
- Keep row-level and editor-level actions available.

**Non-Goals:**

- Change opportunity scoring, recommendation gates, factor contributions, market signals, or business signals.
- Change research persistence APIs or default research metadata.
- Redesign the entire opportunity workspace layout.

## Decisions

1. **Add a header-level action only for unresearched candidates.**
   - The selected detail header already contains immediate actions such as manual reading, provider check, and market refresh.
   - Gating on `!opportunity.research` prevents two prominent join actions once research metadata exists.

2. **Call the same `onAddResearch(productId)` callback.**
   - This keeps the mutation payload and cache invalidation path unchanged.
   - The existing `ResearchEditor` button remains as contextual fallback.

3. **Use a distinct accessible label for the detail action.**
   - The row action label includes the product title.
   - The header action will use a distinct label such as `从详情面板加入研究工作台` so tests and assistive technology can target it without ambiguity.

## Risks / Trade-offs

- **More buttons in the header** -> The action appears only before research exists and uses the existing compact button style.
- **Duplicate add path** -> Both paths call the same mutation, so behavior stays consistent.
- **Small viewport wrapping** -> Header actions already wrap; the new button follows the same responsive pattern.

## Verification

- Add a failing Opportunities page test proving the detail header exposes and triggers the join action for an unresearched selected candidate.
- Run the targeted Opportunities test file, frontend lint, frontend build, backend build, and strict OpenSpec validation.
- Deploy and verify with Playwright that the header action is visible/clickable on production.
