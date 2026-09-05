# IPO Tracker — Brand Guidelines
> Version: DRAFT | Status: Structure Only — Content TBD
> Last updated: September 2026

---

> **NOTE**: This document is a living skeleton. Section headings and structure are final, but content marked **[TBD]** will be filled in after the current design refinement phase is complete. Do not use this as a source of truth until the TBD flags are removed.

---

## 1. Brand Identity

### 1.1 Product Name
**IPO Tracker**

### 1.2 Tagline
Systematic Listing Gain Engine

### 1.3 Mission Statement
[TBD — 1–2 sentences on what IPO Tracker does and who it's for]

### 1.4 Brand Voice & Personality
- **Tone**: [TBD — e.g. precise, calm, data-first, no hype]
- **Audience**: [TBD — retail investors in India, family-scale capital rotation]
- **What we are not**: [TBD — not flashy, not speculative, not emotional]

---

## 2. Logo & Mark

### 2.1 Primary Logomark
[TBD — icon + wordmark combination]

### 2.2 Icon Only
[TBD — standalone mark for favicon, mobile header, sidebar]

### 2.3 Usage Rules
- [TBD — minimum sizes, clear space, what backgrounds are allowed]
- [TBD — do not rotate, distort, recolor, or place over busy backgrounds]

### 2.4 Forbidden Uses
- [TBD]

---

## 3. Color System

### 3.1 Design Philosophy
[TBD — e.g. "neutral-first, semantic accents only for financial signal states"]

### 3.2 Core Tokens

| Token             | Hex   | Role |
|-------------------|-------|------|
| `--text-h`        | [TBD] | Headings, primary text |
| `--text`          | [TBD] | Body, labels |
| `--text-muted`    | [TBD] | Secondary / faded text |
| `--accent`        | [TBD] | Primary interactive color |
| `--accent-hover`  | [TBD] | Button hover state |
| `--accent-bg`     | [TBD] | Accent container fill |
| `--accent-border` | [TBD] | Accent container stroke |
| `--bg`            | [TBD] | Page background |
| `--bg-subtle`     | [TBD] | Chip / tag / input surface |
| `--card-bg`       | [TBD] | Card surface |
| `--border`        | [TBD] | Default divider / outline |
| `--border-strong` | [TBD] | Emphasized divider |

### 3.3 Semantic Signal Colors

| State        | Text Token      | Background Token | Border Token      | When to Use |
|--------------|-----------------|------------------|-------------------|-------------|
| Success / YES | `--success`    | `--success-bg`   | `--success-border`| Profit numbers, YES—APPLY chips, live dots |
| Success Dark  | `--success-dark`| `--success-bg`  | `--success-border`| Text on light green bg (badges only) |
| Danger / NO   | `--danger`     | `--danger-bg`    | `--danger-border` | NO—AVOID chips, losses, destructive actions |
| Warning       | `--warning`    | `--warning-bg`   | `--warning-border`| MAYBE—WATCH chips |
| Info          | `--info`       | `--info-bg`      | —                 | Informational labels |

### 3.4 What We Do Not Use
- No raw hex values in components — always use CSS tokens
- No coral / orange shades (removed as of v2 redesign)
- No more than 15 distinct color values across the entire system

---

## 4. Typography

### 4.1 Typeface
- **Primary**: Geist Variable
- **Monospace**: JetBrains Mono (financial data, numbers)
- **Fallbacks**: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto

### 4.2 Scale

| Role             | Size  | Weight | Color Token    | Notes |
|------------------|-------|--------|----------------|-------|
| Page Title (h1)  | [TBD] | [TBD]  | `--text-h`     | — |
| Section Heading  | [TBD] | [TBD]  | `--text-h`     | — |
| Card Heading     | [TBD] | [TBD]  | `--text-h`     | — |
| Metric Number    | [TBD] | [TBD]  | `--text-h`     | tabular-nums, tracking -0.025em |
| Body / Label     | [TBD] | [TBD]  | `--text`       | — |
| Caption / Muted  | [TBD] | [TBD]  | `--text-muted` | — |
| Table Header     | [TBD] | [TBD]  | `--text-muted` | Uppercase, tracking +0.05em |
| Chip / Badge     | [TBD] | [TBD]  | Context        | — |

### 4.3 Rules
- Numbers in financial tables always use `.tabular-nums` class
- Letter-spacing on metric numbers: `-0.025em`
- Letter-spacing on uppercase labels: `+0.05em`
- [TBD — any other typographic rules after design pass]

---

## 5. Spacing System

### 5.1 Base Unit
[TBD — confirm after design refinement pass]

### 5.2 Scale

| Name | Value   | Use Case |
|------|---------|----------|
| xs   | 4px     | Icon-to-text gap, inline gaps |
| sm   | 8px     | Internal component padding |
| md   | 12px    | Card padding, button padding |
| lg   | 16px    | Section gap, sidebar padding |
| xl   | 20–24px | Card internal padding |
| 2xl  | 32–40px | Section-to-section gap |

---

## 6. Border Radius

### 6.1 Radius Scale

| Name   | Value  | Use Case |
|--------|--------|----------|
| `sm`   | [TBD]  | Inline chips, small tags |
| `md`   | [TBD]  | Buttons, inputs, nav pills |
| `lg`   | [TBD]  | Cards, panels, containers |
| `xl`   | [TBD]  | Modals, drawers, large surfaces |
| `full` | 999px  | Pills, avatars, dots |

> **NOTE**: Radius values are being finalized after the September 2026 design pass. The sidebar active nav pill (`8px`) is the reference anchor for interactive elements. Card containers target `12px`. Do not treat as final until TBD is removed.

---

## 7. Elevation & Shadows

| Token             | Value                                        | Use Case |
|-------------------|----------------------------------------------|----------|
| `--shadow-sm`     | `0 1px 3px rgba(0,0,0,0.02)`                 | Resting cards |
| `--shadow`        | `0 12px 30px -10px rgba(0,0,0,0.06)`         | Hover / elevated |
| `--shadow-lg`     | `0 24px 50px -12px rgba(0,0,0,0.12)`         | Modals |
| `--shadow-drawer` | `-16px 0 45px -10px rgba(0,0,0,0.08)`        | Side drawers |

**Rule**: Cards do **not** lift on hover with `translateY`. Hover = subtle border-color change only.

---

## 8. Component Patterns

### 8.1 Buttons
[TBD — primary, secondary, ghost, destructive variants with token specs]

### 8.2 Chips & Badges
[TBD — YES/NO/WATCH chips, status pills, stat badges]

### 8.3 Cards
[TBD — anatomy, padding, border, shadow, hover]

### 8.4 Tables
[TBD — header, row, alternating rows, cell padding]

### 8.5 Navigation
[TBD — sidebar link states: default, hover, active]

### 8.6 Form Inputs
[TBD]

---

## 9. Interaction & Motion

### 9.1 Transitions
- Default: `all 0.2s ease`
- Border hover: `border-color 0.15s ease`

### 9.2 Hover Rules
- Cards: border highlight only, no lift
- Nav links: `--accent-bg` background, `--text-h` color
- Destructive (Sign Out): text → `var(--danger)`

### 9.3 Animations
- Live status dot: `animate-ping` pulse (decorative, Emerald-400)
- [TBD — page-level transitions, loading states]

---

## 10. Data Visualization

### 10.1 Financial Color Convention
- Positive / gain: `var(--success)` — Emerald-500
- Negative / loss: `var(--danger)` — Rose-700
- Neutral / flat: `var(--text-muted)` — Slate-400

### 10.2 Chart Color Tokens
[TBD — finalize after charting library confirmed]

---

## 11. Changelog

| Date       | Change                                                    |
|------------|-----------------------------------------------------------|
| Sep 2026   | Document skeleton created after color audit               |
| Sep 2026   | Color tokens consolidated (27 → 15 values), coral removed |
| Sep 2026   | Brand renamed: IPO Investment Engine → IPO Tracker        |
