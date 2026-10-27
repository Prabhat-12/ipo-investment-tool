---
version: 2.0
name: Divergen Design System
description: Official design system for the Divergen IPO Investment Platform.
colors:
  primary: "#0f172a"
  background-main: "#F8F9FA"
  background-card: "#ffffff"
  background-sidebar: "#ffffff"
  text-primary: "#475569"
  text-muted: "#64748b"
  text-heading: "#0f172a"
  accent: "#0f172a"
  accent-hover: "#1e293b"
  accent-bg: "#f1f5f9"
  accent-border: "#cbd5e1"
  status-success: "#10b981"
  status-success-dark: "#047857"
  status-success-bg: "#ecfdf5"
  status-danger: "#be123c"
  status-danger-bg: "#fff1f2"
  status-warning: "#b45309"
  status-warning-bg: "#fffbeb"
  status-info: "#1d4ed8"
  status-info-bg: "#eff6ff"
  border-light: "rgba(0, 0, 0, 0.06)"
  border-strong: "rgba(0, 0, 0, 0.1)"
typography:
  sans:
    fontFamily: "'Geist Variable', 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  mono:
    fontFamily: "'JetBrains Mono', ui-monospace, monospace"
  display:
    fontSize: 28px
    fontWeight: 800
    usage: "Financial metric numerics only (₹ totals, %, scores). ≤10 uses total."
  title:
    fontSize: 17px
    fontWeight: 700
    usage: "Card headings, tab page headings, all h2/h3/h4 section labels."
  body:
    fontSize: 13px
    fontWeight: 400
    usage: "Primary readable content: tables, descriptions, form inputs, card content."
  label:
    fontSize: 11px
    fontWeight: 600
    usage: "Badges, status chips, helper text, empty states, button text overrides."
  micro:
    fontSize: 10px
    fontWeight: 600
    usage: "Ultra-compact metadata only: PAN codes, column sub-headers, chart axis labels."
rounded:
  sm: 8px
  md: 16px
  lg: 28px
spacing:
  sm: 16px
  md: 24px
  lg: 32px
  sidebar-width: 280px
---

# Divergen Design System Specification

This document establishes the UI design language for the **Divergen** IPO Investment Platform. It guides layout structures, micro-interactions, and chart design to deliver a premium, user-intuitive financial tool.

## Brand Identity

**Divergen** represents disciplined, data-driven IPO investing through continuous capital rotation. The brand mark — the **D + Infinity** logo — combines the letter D with an infinity-inspired loop symbolizing capital in perpetual motion, guided by a systematic process.

- **Brand Principle:** *Find the signal. Take a different path. Keep the capital moving.*
- **Logo Asset:** `public/divergen-logo.png` / `src/assets/divergen-logo.png`
- **Responsive Component:** `src/components/ui/DivergenLogo.jsx` — adapts for expanded sidebar (34px), collapsed sidebar (36px), mobile header (28px), and login hero contexts.

## Overview

The Divergen dashboard provides a premium, modern, and high-fidelity interface for monitoring initial public offerings. The design uses a clean light-mode theme with a neutral slate color system, soft shadows, vibrant status badges, and precise typographic scales powered by the **Geist** variable font family.

## Colors

The interface uses a refined neutral palette:
* **Backgrounds**: Soft warm gray (`#F8F9FA`) for the main canvas, pure white (`#ffffff`) for sidebar and card containers.
* **Typography**: Deep slate (`#0f172a`) for headings, neutral slate (`#475569`) for readable body text, and medium slate (`#64748b`) for captions/sub-labels.
* **Accent**: Dark neutral (`#0f172a`), transitioning to `#1e293b` on hover, used for primary action buttons and key interactive targets.
* **Status Tints**: Semantic color-coded badges with opaque light backgrounds for contrast:
  - **Success**: Emerald green (`#10b981` / `#047857` on light bg) for positive signals, live indicators, and YES decisions.
  - **Danger**: Rose (`#be123c`) for NO decisions, failed metrics, and critical warnings.
  - **Warning**: Amber (`#b45309`) for PENDING states, upcoming items, and caution indicators.
  - **Info**: Blue (`#1d4ed8`) for informational badges and neutral status.

## Typography

* **Sans Font Family**: `Geist Variable` (primary UI font — all text)
* **Mono Font Family**: `JetBrains Mono` (numeric metrics, data points, PAN codes)
* **Type Scale** (5 steps — no other values permitted):

| Token | Size | Weight | Used For |
|---|---|---|---|
| `display` | `28px` | 800 | Financial metrics only: ₹ totals, win-rate %, backtest yields. ≤10 uses total. |
| `title` | `17px` | 700–800 | All h2/h3/h4 headings — card titles, tab page titles, panel labels. |
| `body` | `13px` | 400–700 | Primary readable content: table rows, descriptions, form inputs. |
| `label` | `11px` | 600–700 | Badges, status chips, helper text, empty states, small button labels. |
| `micro` | `10px` | 600 | Ultra-compact metadata only: PAN codes, column sub-labels, axis annotations. |

> **Exception:** The login screen hero title uses `30px` — a one-off display context outside the app shell.

## Layout

* **Grid Boundaries**: A max-width container of `1440px`.
* **Sidebar Layout**: Enforces a constant width of `280px` when expanded, `72px` when collapsed.
* **Spacing Hierarchy**:
  - Section-to-section: `32px` (`lg`)
  - Inside card containers: `24px` (`md`)
  - List items and element groupings: `16px` (`sm`)
* **Responsive Breakpoints**:
  - `≤ 768px`: Mobile layout — sidebar hidden, bottom-sheet modals, stacked cards
  - `≤ 720px`: Login grid switches to `column-reverse` for CTA-first ordering

## Elevation & Depth

Elements utilize layered shadow offsets for visual depth:
* Small shadow (`sm`): `0 1px 3px rgba(0, 0, 0, 0.02)` for subtle outline boundaries.
* Medium card shadow (`md`): `0 12px 30px -10px rgba(0, 0, 0, 0.06)` for normal cards.
* Large hover/modal shadow (`lg`): `0 24px 50px -12px rgba(0, 0, 0, 0.12)` to lift active interactive states.

## Shapes

All UI cards, widgets, search inputs, and action buttons use smooth, rounded corners:
* Main UI Cards: `28px` (`rounded.lg`)
* Inner Controls / Buttons: `8px` (`rounded.sm`) or `16px` (`rounded.md`)

## Components

### Cards & Panels
Active tracking components utilize a glassmorphism style combined with micro-interactions:
```css
.premium-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-md);
  border-radius: var(--rounded-lg);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.premium-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
  border-color: var(--border-strong);
}
```

### Visualizations
* **GMP Trend Lines**: Smooth cubic interpolation curve styling with a fading green-to-transparent area fill underneath.
* **Subscription Speedometers**: Bullet-shaped progress indicator tracks with a low-contrast background track (`rgba(0, 0, 0, 0.05)`) and numbers styled in monospace.

## Accessibility

* **Focus rings**: All interactive elements display a `2px solid var(--accent)` focus ring with `2px` offset on `:focus-visible`.
* **ARIA attributes**: Drawer panels use `role="dialog"`, navigation uses semantic landmarks.
* **Touch targets**: Minimum `44×44px` hit area on all interactive mobile elements.
* **Color contrast**: Body text meets WCAG 2.1 AA (4.5:1 ratio minimum).
* **iOS Safari**: Input font-size is `max(16px, 1em)` to prevent auto-zoom.

## Do's and Don'ts

* **Do** use `Geist Variable` for text and `JetBrains Mono` for tabular metrics and financial rates.
* **Do** use semantic status background tints (`--success-bg`, `--danger-bg`, etc.) with matching solid text colors.
* **Do** use concentric border-radius (outer radius > inner radius by the padding amount).
* **Don't** use Outfit, Inter, or other fonts that were part of earlier design iterations.
* **Don't** use standard sharp border-radius defaults; always map layouts to the rounded corner system.
* **Don't** introduce raw saturated accent colors (coral, bright red, electric blue) — the palette is intentionally neutral.
