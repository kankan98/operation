# Frontend and AI Product Rules

## Product Context

The initial product direction is a web-based AI operations tool for badminton
racket live-commerce teams. The product should help frontline operators record,
review, and improve live selling content, especially product explanations,
customer questions, talk tracks, and next-session tasks.

If future OpenSpec artifacts define a different product direction, the active
OpenSpec change takes precedence.

## Frontend UX

- Build the actual working tool as the first screen, not a marketing landing page.
- Optimize for repeated operational use: dense but readable layouts, clear tables, fast forms, filters, and task views.
- Avoid decorative UI that makes operational data harder to scan.
- Provide explicit empty, loading, error, and saved states.
- Use stable dimensions for repeated cards, tables, toolbars, and controls to avoid layout shifts.
- Ensure all text fits on mobile and desktop viewports.

## Domain Fit

For badminton racket workflows, preserve domain-specific fields where relevant:

- Racket model, weight class, balance point, shaft stiffness, recommended tension, player level, play style, price band, and selling point.
- Live session theme, host, product order, benefit timing, user questions, objections, talk tracks, and next-session actions.

Do not flatten domain language into generic "item" or "content" concepts when the user workflow needs product specificity.

## AI Analysis UX

- AI output should produce operational artifacts, not only summaries:
  - Live recap.
  - Product explanation diagnosis.
  - User question clusters.
  - Talk-track improvements.
  - Short-video topic suggestions.
  - Next-session tasks.
- Show source inputs or references when practical so operators can trust and edit the result.
- Let users edit, accept, reject, or regenerate AI suggestions.
- Separate facts entered by operators from AI inferences.
- Avoid presenting AI recommendations as guaranteed business truth.

## Prompt and Output Design

- Use structured prompts with clear role, task, domain context, input schema, and output schema.
- Validate AI output before rendering or saving it.
- Include failure handling for empty input, low-quality notes, model refusal, timeout, and malformed JSON.
- Keep prompt versions traceable when outputs are stored.

## Accessibility and Localization

- Use clear Chinese labels for operator-facing flows unless the product spec says otherwise.
- Keep keyboard navigation and focus states usable for forms, tables, dialogs, and task lists.
- Do not rely on color alone to communicate status.
