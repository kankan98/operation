## Context

The current workspace is a static Next.js App Router dashboard with global color
tokens. It already includes `tw-animate-css`, which is useful for simple CSS
animations, but it has no documented motion language and no reusable route or
section animation primitives.

The product is an operational tool for repeated use. Motion should help users
understand structure and interaction state, not create a marketing-style
experience.

## Goals / Non-Goals

**Goals:**

- Define global motion tokens for duration and easing.
- Respect `prefers-reduced-motion` globally.
- Use CSS for simple transitions and hover states.
- Use `motion` for page and panel entry choreography.
- Keep animation restrained, fast, and consistent across routes.
- Document rules so future UI work follows one motion system.

**Non-Goals:**

- Do not add parallax, scroll-jacking, autoplay video, large background motion,
  gesture-heavy interactions, or decorative animation.
- Do not animate data values that do not exist yet.
- Do not add route transition loaders that imply real network activity.
- Do not add new UI component registries or broad design rewrites.

## Decisions

1. **Use `motion` for React choreography.**
   - Rationale: Motion provides React components, `MotionConfig`, reduced-motion
     support, and a small API for page/panel variants. It fits Next.js client
     islands better than imperative animation code.
   - Alternatives considered:
     - CSS only: good for simple hover/enter utilities, but weak for reusable
       staggered route sections.
     - GSAP: powerful, but too broad and imperative for this scope.
     - React Spring: good for physics, but the workspace needs crisp interface
       transitions rather than spring-heavy animation.

2. **Keep motion primitives client-side and narrow.**
   - Rationale: Most workspace UI remains server-rendered. Client components
     should wrap server-rendered children only where animation is needed.
   - Pattern: `WorkspaceMotionProvider`, `MotionPage`, `MotionPanel`, and
     `MotionListItem`.

3. **Expose motion through CSS tokens and utilities.**
   - Rationale: Component authors need consistent values for CSS transitions.
     `globals.css` should define duration/easing variables and reusable utility
     classes.

4. **Reduced motion is mandatory.**
   - Rationale: Motion sensitivity is an accessibility concern. In reduced
     motion mode, entry movement, blur, and transform transitions collapse to
     instant opacity/state changes.

## Risks / Trade-offs

- New dependency can increase bundle size -> Mitigation: import from
  `motion/react` only in small client primitives.
- Too much motion can slow operators down -> Mitigation: animate page structure
  only, keep durations under 320ms, and avoid looping or decorative effects.
- Hydration boundaries can grow if wrappers are overused -> Mitigation: keep the
  shell and content server-rendered, with small client wrappers around sections.
- Visual verification can miss subtle motion issues -> Mitigation: browser check
  route load, hover affordance, mobile layout, console errors, and reduced-motion
  CSS presence.

## Migration Plan

1. Add `motion` to the web app dependencies using the configured pnpm workspace.
2. Add global motion CSS variables, keyframes, utilities, and reduced-motion
   overrides in `globals.css`.
3. Add reusable client motion primitives.
4. Wrap workspace content and panels with motion primitives.
5. Add hover/press transition classes to navigation rows and cards.
6. Document motion standards.
7. Run OpenSpec validation, lint, typecheck, build, browser checks, and Docker
   build.

Rollback: remove the motion primitives and dependency, restore static wrappers,
and keep the CSS variables harmless if no component uses them.

## Open Questions

- None for this slice. Future data-heavy animations, charts, loading skeletons,
  and AI generation progress indicators need separate feature specs.
