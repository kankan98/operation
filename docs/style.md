# AI Native SaaS Design Language

副标题：

> Inspired by Linear × Stripe × ChatGPT × Notion, distilled from the reference compositions.

---

# 1. Design Philosophy

## Vision

Design interfaces that make complex systems feel calm, intelligent, and effortless.

The interface should disappear behind the user's intent.

---

## Core Values

### Calm

Reduce visual noise.

Avoid urgency unless necessary.

---

### Precise

Every element must have a reason to exist.

---

### Functional

Beauty emerges from usefulness.

---

### Consistent

Familiarity increases confidence.

---

### Adaptive

The system should scale across products without changing its visual identity.

---

# 2. Visual Personality

If this interface were a person:

| Attribute       | Expression               |
| --------------- | ------------------------ |
| Intelligence    | Quiet confidence         |
| Professionalism | Premium but approachable |
| Efficiency      | Fast without rushing     |
| Emotion         | Warm neutrality          |
| Complexity      | Organized simplicity     |

---

# 3. Design Keywords

Always optimize toward:

```text
Calm
Minimal
Structured
Soft
Data-aware
Professional
Intelligent
Focused
Timeless
```

Avoid:

```text
Flashy
Aggressive
Playful
Experimental
Neon
Futuristic cyberpunk
Gamified
Over-decorated
```

---

# 4. Information Density

This is the most defining characteristic.

Beauty comes from density control.

## Comfortable

Used for:

- Forms
- Conversations
- Documentation

Characteristics:

```text
Padding: 24–32
Large whitespace
1–2 hierarchy levels
```

---

## Default

Used for most interfaces.

Characteristics:

```text
Padding: 20–24
Medium density
2–3 hierarchy levels
```

---

## Compact

Used sparingly.

Characteristics:

```text
Padding: 12–16
High efficiency
Table-centric
```

Rule:

> Never use Compact as the default density.

---

# 5. Layout System

## Overall Structure

The interface should follow a stable frame.

```text
Sidebar
↓
Page Header
↓
Primary Content
↓
Secondary Content
```

---

## Reading Direction

Information should flow naturally.

```text
Top → Bottom
Left → Right
```

Priority:

```text
Facts
↓
Insights
↓
Actions
```

---

## Visual Weight Distribution

Recommended ratio:

```text
Primary Content: 70%

Secondary Content: 30%
```

---

## Focal Point Rule

Each viewport may contain:

```text
Maximum 3 major visual anchors.
```

Never exceed this limit.

---

# 6. Grid System

Desktop:

```text
12 columns
24 gutter
```

Tablet:

```text
8 columns
```

Mobile:

```text
4 columns
```

---

## Rhythm

Use the 8pt system.

Allowed values:

```text
4
8
12
16
24
32
40
48
64
80
96
```

No exceptions.

---

# 7. Color Philosophy

Color communicates meaning.

It should not decorate.

---

## Neutral Dominance

Approximate ratio:

```text
Neutral: 85%
Brand: 10%
Semantic: 5%
```

---

## Brand Accent

Used only for:

- Primary actions
- Active navigation
- Focus states
- Key emphasis

Never use the accent color as a background system.

---

## Semantic Colors

Reserved for status communication.

Users should learn their meaning.

---

# 8. Surface System

Surfaces create hierarchy.

Not shadows.

---

## Layer 0

Canvas

---

## Layer 1

Cards

---

## Layer 2

Elevated interactions

Examples:

```text
Dropdowns
Popovers
Context menus
```

---

## Layer 3

Interruptions

Examples:

```text
Modals
Dialogs
```

---

Rule:

> Elevation must increase sparingly.

---

# 9. Card Language

Cards are the primary unit of composition.

---

Structure:

```text
Header
Body
Footer (optional)
```

---

Characteristics:

```text
Soft corners
Clear boundaries
Consistent padding
Minimal decoration
```

---

Cards should:

- Group related information;
- Reduce scanning effort;
- Preserve modularity.

---

Cards should never:

- Nest excessively;
- Compete visually;
- Use strong shadows.

---

# 10. Typography

Typography creates rhythm.

---

Hierarchy:

```text
Display
Heading
Title
Body
Caption
Label
```

---

Characteristics:

```text
High readability
Moderate contrast
Stable spacing
```

---

Rule:

> Use weight before size.

---

# 11. Component Philosophy

Components are behaviors before appearances.

---

All components must define:

```text
Default
Hover
Active
Focus
Disabled
Loading
Error
Success
Empty
```

---

States should feel:

```text
Predictable
Subtle
Accessible
```

---

# 12. Motion System

Motion explains change.

Never seek attention.

---

Allowed:

```text
Fade
Slide
Scale
Skeleton
```

---

Disallowed:

```text
Bounce
Elastic
Spin
Parallax
Large transitions
```

---

Timing:

```text
150ms
200ms
250ms
```

---

Rule:

> The user should notice the result, not the animation.

---

# 13. Empty States

Empty states reduce uncertainty.

They should:

- Explain context;
- Suggest next steps;
- Maintain optimism.

Avoid humor.

Avoid blame.

---

# 14. Feedback

Feedback should reassure.

Types:

```text
Inline
Toast
Persistent
Blocking
```

Escalation should be intentional.

---

# 15. Accessibility

Accessibility is part of aesthetics.

Requirements:

```text
WCAG AA
Visible focus
Keyboard support
44px targets
Reduced motion
```

---

# 16. Dark Mode

Dark mode is not inversion.

Adjust:

- Contrast;
- Borders;
- Shadows;
- Elevation.

Preserve the emotional tone.

---

# 17. AI Generation Rules

For AI-assisted interface generation:

Always:

```text
Reuse existing patterns.

Preserve density levels.

Respect spacing tokens.

Limit focal points.

Prefer composition over customization.

Reduce before adding.
```

Never:

```text
Invent new visual styles.

Mix conflicting aesthetics.

Break hierarchy.

Use decoration without meaning.
```

---

# 18. Design Litmus Test

Before shipping any interface, ask:

1. Can users identify the primary action within 3 seconds?
2. Is any element visually louder than its importance?
3. Can something be removed without harming understanding?
4. Does this page feel calm under prolonged use?
5. Would another team generate the same layout from this specification?

If the answer to any question is "No",

> simplify before expanding.

---

# Final Statement

> Great interfaces are not remembered because they are visually impressive. They are remembered because they make difficult work feel unexpectedly easy.
