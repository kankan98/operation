# style.md — Cross-border E-commerce Agent Platform Design System

> Version: v1.0
> Project: Cross-border E-commerce Agent Platform
> Reference: Based on the generated long-form prototype image
> Applicable Scope: Dashboard / Product / Alerts / Chat / Settings / Future Agent Modules

---

# 1. Design Philosophy

## Core Keywords

- AI Native
- Professional SaaS
- Cross-border Commerce
- Calm Intelligence
- Data-first
- Efficient Operations
- Minimalism with Warmth

This platform should not look like a traditional ERP.

It should feel like:

> "An intelligent business copilot helping sellers make decisions."

The experience should balance:

| Dimension    | Direction                       |
| ------------ | ------------------------------- |
| Professional | Enterprise-grade SaaS           |
| Intelligence | AI Assistant First              |
| Data         | Strong analytical capability    |
| Emotion      | Soft, approachable              |
| Efficiency   | Low learning cost               |
| Modernity    | Mainstream 2026 Agent aesthetic |

---

# 2. Benchmark References

Visual references:

- OpenAI ChatGPT Team
- Perplexity
- Linear
- Notion
- Vercel Dashboard
- Stripe Dashboard
- Ramp
- Shopify Admin (new version)
- Retool
- Anthropic Console

Target impression:

> Stripe × Linear × ChatGPT × Shopify

---

# 3. Overall Visual Language

## Design Tone

### Should Feel Like

- Clean
- Quiet
- Premium
- Trustworthy
- Intelligent
- Focused

### Avoid

- Overly colorful
- Cyberpunk
- Glassmorphism-heavy
- Excessive gradients
- Gaming style
- Traditional ERP density
- Chinese B2B aesthetics

---

# 4. Color System

## Primary Brand Color

Agent Purple

```css
Primary-50:  #F5F3FF
Primary-100: #EDE9FE
Primary-200: #DDD6FE
Primary-300: #C4B5FD
Primary-400: #A78BFA
Primary-500: #8B5CF6
Primary-600: #7C3AED
Primary-700: #6D28D9
Primary-800: #5B21B6
Primary-900: #4C1D95
```

Use cases:

- Primary buttons
- Active navigation
- Selected tabs
- AI-related actions
- Focus states

---

## Neutral System

Primary background palette.

```css
Gray-50:  #FAFAFA
Gray-100: #F5F5F5
Gray-200: #E5E7EB
Gray-300: #D1D5DB
Gray-400: #9CA3AF
Gray-500: #6B7280
Gray-600: #4B5563
Gray-700: #374151
Gray-800: #1F2937
Gray-900: #111827
```

Ratio:

```text
Neutral: 85%
Primary: 10%
Semantic: 5%
```

---

## Semantic Colors

### Success

```css
#22C55E
```

Used for:

- Profit increase
- Connected integrations
- Healthy metrics

---

### Warning

```css
#F59E0B
```

Used for:

- Inventory shortage
- ROAS decline
- Medium alerts

---

### Error

```css
#EF4444
```

Used for:

- Critical alerts
- Failed syncs
- Revenue drops

---

### Info

```css
#3B82F6
```

Used for:

- Recommendations
- AI insights
- Notifications

---

# 5. Typography

## Font Stack

### English

```css
Inter
```

Fallback:

```css
Inter,
SF Pro Display,
Segoe UI,
Roboto,
sans-serif
```

---

### Chinese

```css
PingFang SC
```

Fallback:

```css
PingFang SC,
HarmonyOS Sans,
Microsoft YaHei,
sans-serif
```

---

## Font Scale

| Usage         | Size | Weight |
| ------------- | ---- | ------ |
| Display       | 32   | 700    |
| Page Title    | 28   | 700    |
| Section Title | 20   | 600    |
| Card Title    | 16   | 600    |
| Body          | 14   | 400    |
| Secondary     | 13   | 400    |
| Caption       | 12   | 400    |
| Label         | 11   | 500    |

---

## Line Height

```css
120% → Headings
150% → Body
160% → Long text
```

---

# 6. Layout System

## Structure

```text
┌ Sidebar (240)
├ Main Content
│   ├ Header
│   ├ Content
│   └ Footer(optional)
```

---

## Sidebar

Width:

```css
240px
```

Collapsed:

```css
72px
```

Characteristics:

- White background
- Soft separators
- Rounded active state
- Icon-first hierarchy

---

## Content Width

Maximum:

```css
1600px
```

Default padding:

```css
32px
```

Mobile:

```css
16px
```

---

# 7. Grid System

Desktop:

```text
12 Columns
24px Gutter
```

Tablet:

```text
8 Columns
```

Mobile:

```text
4 Columns
```

---

# 8. Spacing System

Use 8pt Grid.

```css
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

Rule:

> All spacing must be multiples of 4.

Preferred:

```text
16 / 24 / 32
```

---

# 9. Border Radius

```css
Input: 10px
Button: 12px
Card: 20px
Modal: 24px
Badge: 999px
Chart container: 20px
```

Overall impression:

> Soft geometry.

---

# 10. Shadow System

## Elevation 1

Cards

```css
0 1px 2px rgba(16,24,40,.05)
```

---

## Elevation 2

Hover

```css
0 4px 12px rgba(16,24,40,.08)
```

---

## Elevation 3

Modal

```css
0 20px 40px rgba(16,24,40,.12)
```

---

Rule:

> Never use harsh shadows.

---

# 11. Navigation Style

## Sidebar Items

Height:

```css
44px
```

Padding:

```css
12px 16px
```

Gap:

```css
12px
```

---

Inactive:

```css
Text: Gray-600
Icon: Gray-500
```

Active:

```css
Background: Primary-50
Text: Primary-600
Icon: Primary-600
```

Hover:

```css
background: Gray-100;
```

---

# 12. Card Design

Structure:

```text
Card Title
Card Description(optional)

Content

Action(optional)
```

Padding:

```css
24px
```

Radius:

```css
20px
```

Border:

```css
1px solid Gray-100
```

---

# 13. KPI Cards

Layout:

```text
Metric
Value
Trend
```

Example:

```text
Total Sales
$128,198
↑ 12.5%
```

Specifications:

```css
Height: 120px
Padding: 24px
```

Trend:

- Green up
- Red down

---

# 14. Data Tables

Design Principles

> Spreadsheet capability, dashboard aesthetics.

Specifications:

```css
Row Height: 64px
Header Height: 48px
Cell Padding: 16px
```

---

Interactions

Hover:

```css
background: Gray-50;
```

Selected:

```css
background: Primary-50;
```

---

Actions:

- Edit
- More
- Quick View

Hidden until hover.

---

# 15. Charts

Style:

- Minimal
- No heavy borders
- Rounded lines

---

Line Charts

```css
Stroke Width: 3
```

Grid:

```css
Dashed
Opacity: 20%
```

---

Donut Charts

Thickness:

```css
14–18px
```

Center:

Show key metric.

---

# 16. Buttons

## Primary

```css
Background: Primary-600
Text: White
Height: 44px
Radius: 12px
```

Hover:

```css
Primary-700
```

---

## Secondary

```css
White
Gray border
Gray text
```

---

## Ghost

Transparent.

Hover:

```css
Gray-100
```

---

# 17. Inputs

Height:

```css
44px
```

Radius:

```css
10px
```

Border:

```css
Gray-200
```

Focus:

```css
2px Primary-200
```

---

# 18. Badges

Height:

```css
24px
```

Radius:

```css
999px
```

Padding:

```css
0 10px
```

Types:

- Success
- Warning
- Error
- Info
- Neutral

---

# 19. AI Experience Guidelines

This is the platform's differentiator.

Principle:

> AI should guide, not interrupt.

---

AI should:

- Recommend
- Summarize
- Predict
- Explain
- Automate

---

AI should NOT:

- Spam alerts
- Replace dashboards
- Force conversations

---

Tone:

```text
Professional
Concise
Actionable
Confident
Helpful
```

---

# 20. Chat Module

Role:

> Merchant Copilot

Layout:

```text
Sidebar
Conversation
Composer
Suggested Actions
```

---

Suggestions:

```text
Analyze sales trends
Find winning products
Summarize alerts
Optimize ad spend
Forecast inventory
```

---

Message Bubbles

Assistant:

```css
Gray-50
Radius: 20px
```

User:

```css
Primary-50
Radius: 20px
```

---

# 21. Alerts Module

Priority Levels

| Level    | Color  |
| -------- | ------ |
| Critical | Red    |
| Warning  | Orange |
| Info     | Blue   |

---

Design Principles

> Alerts should reduce anxiety, not create it.

Each alert must include:

- What happened
- Why it matters
- Recommended action

---

# 22. Product Module

Core Functions

- Product catalog
- Inventory
- Pricing
- Performance
- Advertising metrics
- AI recommendations

Card hierarchy:

```text
Product
Status
Revenue
Trend
Actions
```

---

# 23. Settings Module

Categories:

```text
General
Account
Integrations
Notifications
Billing
API
Team
```

Integrations:

Prefer logo + status.

Example:

```text
Amazon
Shopify
eBay
TikTok Shop
Google Ads
Meta Ads
```

---

# 24. Motion System

Duration:

```css
150ms
200ms
250ms
```

Easing:

```css
ease-out
```

---

Allowed Animations

- Fade
- Scale 98→100
- Slide 8px
- Skeleton Loading

Avoid:

- Bounce
- Elastic
- Dramatic transitions

---

# 25. Accessibility

Minimum contrast:

```text
WCAG AA
```

Requirements:

- Keyboard navigation
- Visible focus
- Screen reader labels
- Large click targets (≥44px)

---

# 26. Dark Mode

Principle:

> Same elegance, reduced glare.

Dark background:

```css
#0F172A
```

Card:

```css
#111827
```

Primary:

Maintain purple scale.

Avoid pure black.

---

# 27. Future Expansion Principles

New modules must follow:

1. AI-first experience
2. Card-based composition
3. Neutral-dominant palette
4. 8pt spacing
5. Soft radius
6. Low cognitive load
7. Consistent motion
8. Action-oriented information hierarchy

---

## Final Design Statement

> Build an AI-native cross-border commerce operating system that combines the clarity of Linear, the trust of Stripe, the intelligence of ChatGPT, and the efficiency of Shopify—helping merchants make better decisions with less effort.
