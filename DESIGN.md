---
version: alpha
name: Antigravity IPO Tracker Design System
description: Official design system for the Antigravity IPO Tracker application.
colors:
  primary: "#e55c3c"
  background-main: "#f8f8f8"
  background-card: "#ffffff"
  background-sidebar: "#ffffff"
  text-primary: "#4b5563"
  text-muted: "#9ca3af"
  text-heading: "#111827"
  accent-coral: "#e55c3c"
  accent-coral-hover: "#d24e2f"
  accent-coral-bg: "rgba(229, 92, 60, 0.08)"
  accent-coral-border: "rgba(229, 92, 60, 0.15)"
  status-success: "#10b981"
  status-success-bg: "rgba(16, 185, 129, 0.08)"
  status-success-border: "rgba(16, 185, 129, 0.15)"
  status-danger: "#ef4444"
  status-danger-bg: "rgba(239, 68, 68, 0.06)"
  status-danger-border: "rgba(239, 68, 68, 0.15)"
  status-warning: "#f59e0b"
  status-warning-bg: "rgba(245, 158, 11, 0.08)"
  status-warning-border: "rgba(245, 158, 11, 0.2)"
  status-info: "#3b82f6"
  status-info-bg: "rgba(59, 130, 246, 0.08)"
  border-light: "rgba(0, 0, 0, 0.05)"
  border-strong: "rgba(0, 0, 0, 0.1)"
typography:
  sans:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
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

# Antigravity Design System Specification

This document establishes the UI design language for the **Antigravity IPO Tracker** portal. It guides layout structures, micro-interactions, and charts design to deliver a premium, user-intuitive financial tool.

## Overview

The Antigravity IPO Tracker dashboard is designed to provide a premium, modern, and high-fidelity interface for monitoring initial public offerings. The design evokes a professional yet accessible aesthetic using a clean light-mode theme, soft shadows, vibrant status badges, and precise typographic scales.

## Colors

The interface uses a tailored color palette:
* **Backgrounds**: A soft neutral gray (`#f8f8f8`) for the main canvas, and pure white (`#ffffff`) for sidebar and card containers.
* **Typography**: Deep slate (`#111827`) for headings, neutral gray (`#4b5563`) for readable body text, and a light gray (`#9ca3af`) for captions/sub-labels.
* **Accent**: Brand-identifying Coral (`#e55c3c`), which transitions to `#d24e2f` on hover, used for primary action targets and highlight sections.
* **Status Tints**: Color-coded badges use custom semi-transparent background opacities to ensure contrast without creating clutter.

## Typography

* **Sans Font Family**: `Outfit` (primary UI font — all text)
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
* **Sidebar Layout**: Enforces a constant width of `280px`.
* **Spacing Hierarchy**:
  - Section-to-section: `32px` (`lg`)
  - Inside card containers: `24px` (`md`)
  - List items and element groupings: `16px` (`sm`)

## Elevation & Depth

To create visual depth, elements utilize layered shadow offsets:
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
  background: var(--background-card);
  border: 1px solid var(--border-light);
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

## Do's and Don'ts

* **Do** use `Outfit` for text and `JetBrains Mono` for tabular metrics and financial rates.
* **Do** use the status background tint opacity (e.g. `rgba(16, 185, 129, 0.08)`) with matching solid status colors.
* **Don't** use standard sharp border-radius defaults; always map layouts to the rounded corner system.
* **Don't** introduce dark themes or raw saturated background colors that disrupt the lightweight design system.
