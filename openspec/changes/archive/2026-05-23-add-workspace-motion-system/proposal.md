## Why

The workspace now has stable routes and a token-based visual theme, but the UI
still feels static. Operators need clear, restrained motion that makes route
changes, panel hierarchy, hover affordances, and future loading states easier to
understand without distracting from repeated operational work.

## What Changes

- Add a global motion standard for durations, easing, reduced-motion behavior,
  page entry, panel entry, hover feedback, and disabled motion patterns.
- Add the `motion` React animation library for page/section choreography where
  CSS-only transitions are not enough.
- Add reusable client motion primitives that respect user reduced-motion
  preferences.
- Apply restrained route and panel entry animations, list item stagger, and
  hover/press transitions to existing workspace pages.
- Document the motion rules in app documentation for future contributors.
- Do not add parallax, scroll-jacking, autoplay media, gesture-heavy animation,
  analytics, persistence, auth, or AI behavior.

## Capabilities

### New Capabilities

- `workspace-motion-system`: Defines the global animation and transition
  standards, accepted library boundary, accessibility requirements, and route
  motion behavior for the operator workspace.

### Modified Capabilities

- None.

## Impact

- Affected code: `apps/web/src/app/globals.css`, workspace shell/page
  components, app README, and package dependencies for `apps/web`.
- Dependency added: `motion`, used only for React page/section animation
  primitives.
- Accessibility: all animations must respect `prefers-reduced-motion`.
- Data/security: no protected data is read, written, generated, or logged.
