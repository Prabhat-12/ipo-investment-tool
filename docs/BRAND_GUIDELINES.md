# Divergen — Brand Guidelines v2.0
> Status: **Established** — Source of truth for all design decisions
> Last updated: October 2026

---

## 1. Brand Identity

### 1.1 Product Name
**Divergen**

### 1.2 Tagline
**Systematic Listing Gain Engine**

### 1.3 Core Philosophy & Narrative
Divergen represents a systematic, disciplined approach to IPO investing. In a market driven by hype, speculation, and emotional decisions, Divergen follows a different path — using data, defined rules, and a repeatable decision-making process to identify opportunities and determine where capital should go next.

The core philosophy is **continuous capital rotation**: evaluate an IPO, make a disciplined decision, participate when the criteria are met, exit according to the strategy, and recycle capital into the next opportunity.

### 1.4 Brand Principle
> **Find the signal. Take a different path. Keep the capital moving.**

The logo represents the product's philosophy, not a promise of guaranteed returns. Growth is an aspiration of the system, while disciplined decisions and repeatable execution are its foundation.

### 1.5 Brand Voice
- **Tone**: Precise, calm, data-first. No hype. No speculation.
- **Audience**: Retail investors in India managing family-scale capital rotation on a fixed ₹1 Lakh pool.
- **We are not**: A trading app. Not flashy. Not emotional. Not a tip service.

### 1.6 Operating Modes
- **Cloud Sync** — Authenticated via Supabase. Live market data, persistent across devices.
- **Offline Sandbox** — No login required. All data in localStorage. For strategy simulation.

---

## 2. Logo & Mark: D + Infinity

### 2.1 The Concept
The logo combines the letter **D**, representing Divergen, with an infinity-inspired loop representing continuous movement and capital rotation.
The smaller loop flowing into the larger D-shaped loop introduces a second idea: **growth through repeated cycles**. It symbolizes the potential for capital to progress through successive opportunities, while the continuous connection represents a repeatable system rather than a one-time investment decision.

The mark is intentionally designed around one central idea: **capital in motion, guided by a system**.

### 2.2 Asset References
- Brand Mark: `src/assets/divergen-logo.png`
- Public/Web Asset: `public/divergen-logo.png`
- Logo Component: `src/components/ui/DivergenLogo.jsx`

### 2.3 Implementation & Usage Rules
- **Desktop Sidebar (Expanded):** Mark container (34×34px) with `Divergen` wordmark in Geist (16px, weight 700, `letter-spacing: -0.4px`) and operating mode indicator.
- **Desktop Sidebar (Collapsed):** Optically centered 36×36px container showing the D + Infinity mark with concentric border radius and tooltip.
- **Mobile Responsive Header:** Compact mark (18-20px) next to `Divergen` title, alongside the live status pill.
- **Login / Hero View:** Large 36px mark inside a dedicated padded container with high-impact typography.
- **Surface Depth:** 1px outline at low opacity (`rgba(0,0,0,0.06)` or `oklch(0 0 0 / 0.1)`), never placed directly on busy or unfiltered backgrounds.

## 3. Color System

### 3.1 Design Philosophy
**Neutral-first, semantic accents for signal states only.**

The entire UI defaults to near-white surfaces with slate text. Color is reserved exclusively for financial signal states (YES / NO / WATCH) and live-data indicators. This ensures that when a color appears, it carries clear meaning.

No raw hex values are used in components — every color goes through a CSS token.

### 3.2 Core Design Tokens

Defined in `:root` of `src/index.css`:

| Token | Hex / Value | Tailwind Equivalent | Role |
|---|---|---|---|
| `--text-h` | `#0f172a` | Slate-950 | All headings, strong text, active nav labels |
| `--text` | `#475569` | Slate-600 | Body text, default labels |
| `--text-muted` | `#64748b` | Slate-500 | Secondary labels, captions, table values |
| `--bg` | `#F8F9FA` | Gray-50 (custom) | Page / app background |
| `--bg-subtle` | `#f8fafc` | Slate-50 | Chip, tag, and input surface tint |
| `--card-bg` | `#FFFFFF` | White | Card surfaces, sidebar, drawer background |
| `--sidebar-bg` | `#FFFFFF` | White | Sidebar specifically |
| `--border` | `rgba(0,0,0,0.06)` | — | Default divider, card outline |
| `--border-strong` | `rgba(0,0,0,0.1)` | — | Emphasized border, input outline |
| `--accent` | `#0f172a` | Slate-950 | Primary interactive color (buttons, active states, focus rings) |
| `--accent-hover` | `#1e293b` | Slate-800 | Button hover |
| `--accent-bg` | `#f1f5f9` | Slate-100 | Active nav bg, accent containers |
| `--accent-border` | `#cbd5e1` | Slate-200 | Accent container stroke |

### 3.3 Semantic Signal Tokens

Used exclusively for YES/NO/WATCH decision chips, financial numbers, and status indicators:

| State | Text Token | Hex | Background Token | Hex | Border Token | When to Use |
|---|---|---|---|---|---|---|
| **Success / YES** | `--success` | `#10b981` (Emerald-500) | `--success-bg` | `#ecfdf5` | `--success-border` `rgba(167,243,208,0.5)` | Profit numbers, YES—APPLY chips, live status dots, allotment confirmed |
| **Success Dark** | `--success-dark` | `#047857` (Emerald-700) | `--success-bg` | `#ecfdf5` | `--success-border` | Text on light green background (e.g. badge text) |
| **Danger / NO** | `--danger` | `#be123c` (Rose-700) | `--danger-bg` | `#fff1f2` | `--danger-border` `rgba(254,205,211,0.5)` | NO—AVOID chips, loss values, destructive actions (Sign Out) |
| **Warning / WATCH** | `--warning` | `#b45309` (Amber-700) | `--warning-bg` | `#fffbeb` | `--warning-border` `rgba(253,230,138,0.5)` | MAYBE—WATCH chips |
| **Info** | `--info` | `#0369a1` (Sky-700) | `--info-bg` | `#f0f9ff` | — | Informational callouts only |

### 3.4 Decorative / One-off Values
| Value | Where Used | Why Not a Token |
|---|---|---|
| `#34d399` (Emerald-400) | Pulsing animation ring on live status dot | Animation-only, opacity 0.75, purely decorative |
| `rgba(139,130,115,0.08–0.15)` | `.badge-neutral`, `.btn-secondary`, `.sidebar-profile:hover` | Warm-tinted neutral used sparingly for warm hover states |
| `rgba(15,23,42,0.3)` | `.drawer-backdrop` | One-off overlay only |

### 3.5 What We Do Not Use
- No coral / orange shades (removed as of v2 redesign)
- No raw hex values in component code — always use CSS tokens
- No Tailwind color classes in inline styles — inline styles use `var(--token)`
- Maximum 15 distinct color values in the system

---

## 4. Typography

### 4.1 Typeface Stack

| Role | Font | Fallback Stack |
|---|---|---|
| **Primary** | Geist Variable | Geist, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif |
| **Monospace** | JetBrains Mono | ui-monospace, monospace |

- Geist is loaded via `@fontsource-variable/geist` (variable font, full weight range)
- Monospace is used exclusively for financial numbers and code — tabular-nums rendering guaranteed

### 4.2 Type Scale

Extracted from `src/index.css` and `src/App.jsx`:

| Role | Size | Weight | Letter Spacing | Color Token | Line Height | Notes |
|---|---|---|---|---|---|---|
| **Sidebar Brand Name** | 16px | 700 | -0.4px | `--text-h` | — | `white-space: nowrap` |
| **Page / Section Title** | 20px | 700 | -0.5px | `--text-h` | — | Docs h1 |
| **Card / Panel Heading** | 15–17px | 700 | — | `--text-h` | — | `.premium-card` headings |
| **Section h2** | 16px | 600 | -0.3px | `--text-h` | — | Docs content, underline separator |
| **Section h3** | 14px | 600 | — | `--text-h` | — | Docs sub-section |
| **Metric Number (large)** | 24–28px | 600–800 | -0.025em | `--text-h` or `--success` | 1 | Always `.tabular-nums` |
| **Sidebar Nav Link** | 14px | 500 | — | `--text` → `--text-h` on active | — | `white-space: nowrap` |
| **Docs Nav Link** | 13px | 500 → 600 active | — | `#475569` → `--text-h` active | — | — |
| **Body / Label (standard)** | 13px | 400–500 | — | `--text-muted` | 1.6 | Docs paragraphs, table cells |
| **Metric Strip Label** | 12px | 500 | — | `#64748b` (`--text-muted`) | — | Card sub-labels |
| **Metric Strip Sub-value** | 11px | 500 | — | `--text-muted` | — | e.g. "Across primary & secondary" |
| **Badge / Chip text** | 10–11px | 600–800 | 0.5px | Context-dependent | — | Uppercase, semantic color token |
| **Table Header** | 11px | 700–800 | 0.5px | `--text-muted` | — | Uppercase |
| **Tooltip (collapsed sidebar)** | 12px | 600 | — | `--text-h` | — | CSS `::before` pseudoelement |
| **Mobile Header Title** | 17px | 800 | -0.3px | Gradient: `--text-h` → `--accent` | — | Mobile only |
| **Mobile Tab Label** | 10px | 600 | 0.2px | `--text-muted` → `--accent` active | — | Mobile only |

### 4.3 Rules
- Financial numbers always use the `.tabular-nums` CSS class (or `font-variant-numeric: tabular-nums`)
- Metric numbers use `letter-spacing: -0.025em` for tighter, more professional appearance
- Uppercase labels use `letter-spacing: 0.5px` minimum
- Do not use font sizes below 10px
- Headings never use gradient text effects (gradient is mobile-header-only exception)

---

## 5. Spacing System

### 5.1 Base Unit
**4px** — all spacing values are multiples of 4.

### 5.2 Spacing Scale

| Name | Value | Common Use Case |
|---|---|---|
| `2xs` | 4px | Icon-to-text gap, dot indicators |
| `xs` | 6px | Badge internal gap, small inline spacing |
| `sm` | 8px | Nav link padding (vertical), sidebar footer gap |
| `md` | 12px | Nav link padding (horizontal), tooltip padding, section gap |
| `lg` | 16px | Sidebar padding (horizontal), card row gap |
| `xl` | 20–24px | Card internal padding, metric strip padding |
| `2xl` | 28–36px | Drawer padding, brand-to-nav gap |
| `3xl` | 40–56px | Main content padding (desktop) |

### 5.3 Key Structural Measurements
| Element | Value |
|---|---|
| Sidebar width (expanded) | 250px |
| Sidebar width (collapsed) | 72px |
| Main content padding (desktop) | `40px 56px` |
| Main content padding (tablet) | `24px` |
| Main content padding (mobile) | `16px` + safe area insets |
| Drawer width (desktop) | 540px |
| Mobile header height | 56px |
| Mobile tab bar height | 64px |

---

## 6. Border Radius System

### 6.1 Radius Tokens

All defined in `:root` of `src/index.css`:

| Token | Value | Use Case |
|---|---|---|
| `--radius-lg` | **16px** | Cards (`.premium-card`), metric strips, tables, drawers, IPO grid cards |
| `--radius-md` | **12px** | Logo icon container, inputs (`.input-field`), some modal surfaces |
| `--radius-sm` | **8px** | Sidebar nav links, profile row, docs nav links, tooltip popover, decision badge chips, buttons with `var(--radius-sm)` |
| `--radius-xs` | **6px** | Focus rings, close button hover area, inline decision chips (`border-radius: var(--radius-xs)`) |
| `full / pill` | **999px** | All pill/capsule shapes: `.btn`, live status badge, mobile status chip, "Recommended" filter tab |

### 6.2 Radius Consistency Rules
- **All cards** use `--radius-lg` (16px)
- **All nav interactive elements** (sidebar links, docs nav, profile row) use `--radius-sm` (8px)
- **All decision chips** (YES/NO/WATCH) use `--radius-xs` (6px)
- **All pill-style elements** (live sync badge, status pills, primary `.btn`) use `999px`
- The 8px sidebar nav pill is the anchor reference for all interactive element radius

### 6.3 Mobile Exception
On screens `≤ 768px`, `.premium-card` border-radius overrides to `20px` to feel more native on small screens.

---

## 7. Elevation & Shadow System

### 7.1 Philosophy: Flat Design
IPO Tracker uses a **flat, border-defined** elevation system. Shadows are eliminated from cards and surfaces. Depth is communicated through:
- Border color changes on hover (`var(--border)` → `var(--border-strong)`)
- The drawer shadow (only exception — contextually slides over the main content)

### 7.2 Shadow Tokens

| Token | Value | Use Case |
|---|---|---|
| `--shadow-sm` | `none` | Cards at rest (flat) |
| `--shadow` | `none` | Cards elevated (flat) |
| `--shadow-lg` | `none` | Modals (flat) |
| `--shadow-drawer` | `-12px 0 40px -8px rgba(0,0,0,0.08)` | IPO detail side drawer only |

Tooltip popover (CSS pseudoelement): `0 4px 16px rgba(0,0,0,0.12)` — inline, not a token, acceptable.

### 7.3 Rules
- **No `translateY` lift** on card hover — removed from all components
- Hover state = `border-color` change only (`var(--border)` → `var(--border-strong)`)
- The drawer is the only surface that casts a shadow — it slides over main content

---

## 8. Component Patterns

### 8.1 Cards (`.premium-card`)
```
background: var(--card-bg)
border: 1px solid var(--border)
border-radius: var(--radius-lg)      /* 16px */
padding: 24px
box-shadow: none
transition: border-color 300ms cubic-bezier(0.2, 0, 0, 1)

hover → border-color: var(--border-strong)   /* no lift, no shadow */
```

### 8.2 Metric Strip (Horizontal 4-Card)
Reused across Dashboard, Family Rotator, and Backtest Engine:
```
display: flex, flex-direction: row
border: 1px solid var(--border)
border-radius: var(--radius-lg)
background: var(--card-bg)
Each cell: padding 24px 20px, separated by 1px solid var(--border) dividers

Label:    font-size 12px, weight 500, color var(--text-muted)
Number:   font-size 24px, weight 600, tracking -0.025em, color var(--text-h)
Sub-text: font-size 11px, weight 500, color var(--text-muted)
```

### 8.3 Decision Chips (YES / NO / WATCH)

```
.badge class base:
  display: inline-flex, align-items: center
  gap: 6px
  padding: 4px 10px
  border-radius: var(--radius-xs)    /* 6px */
  font-size: 11px, weight 600, uppercase, letter-spacing: 0.5px

.badge-success:  bg var(--success-bg),  color var(--success-dark), border var(--success-border)
.badge-danger:   bg var(--danger-bg),   color var(--danger),       border var(--danger-border)
.badge-warning:  bg var(--warning-bg),  color var(--warning),      border var(--warning-border)
.badge-neutral:  bg rgba(139,130,115,0.08), color var(--text), border var(--border-strong)
```

### 8.4 Buttons (`.btn`)
```
Base:
  display: inline-flex, align-items: center, justify-content: center
  gap: 8px
  padding: 12px 22px
  border-radius: 999px    /* Always capsule/pill */
  font-size: 13px, weight 700
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1)

.btn-primary:    bg var(--accent), color white, shadow rgba(15,23,42,0.25)
  hover → bg var(--accent-hover), translateY(-1px), stronger shadow

.btn-secondary:  bg rgba(139,130,115,0.08), color var(--text-h)
  hover → bg rgba(139,130,115,0.15), translateY(-1px)

.btn-danger:     bg var(--danger-bg), color var(--danger), border var(--danger-border)
  hover → bg var(--danger), color white
```

### 8.5 Sidebar Navigation

**Expanded state (250px):**
```
.sidebar-link:
  padding: 8px 12px
  border-radius: var(--radius-sm)   /* 8px */
  font-size: 14px, weight 500
  color: var(--text)
  gap: 12px (icon + label)

  hover:  color #0f172a, bg rgba(241,245,249,0.8)
  active: transform scale(0.98)

.sidebar-link-active:
  color: var(--text-h)
  bg: #f1f5f9
  ::after dot: 6px circle, bg var(--text-h), right 12px (centered vertically)
```

**Collapsed state (72px):**
- Width shrinks to 72px, labels hidden, icons centered
- Tooltip appears on hover via CSS `::before` pseudoelement
- Tooltip: 12px, weight 600, bg card-bg, radius `--radius-sm`, border `--border`
- Active indicator dot (`::after`) hidden in collapsed state

### 8.6 Tables
```
Container: border 1px solid var(--border), border-radius var(--radius-lg), overflow: hidden
font-size: 13px, textAlign: left, borderCollapse: collapse

thead: bg rgba(0,0,0,0.015), border-bottom 1px solid var(--border)
       font-size 11px, weight 700-800, uppercase, letter-spacing 0.5px, color var(--text-muted)

tbody row: border-bottom 1px solid var(--border)
           hover: bg rgba(0,0,0,0.015)

Cell padding: 16px 20px (standard), 12px (compact)

Financial number coloring:
  positive  → color: var(--success)
  negative  → color: var(--danger)
  neutral/0 → color: var(--text-muted)
```

### 8.7 Drawer / Side Panel
```
Backdrop:  bg rgba(15,23,42,0.3), backdrop-filter blur(4px)
           animation: fadeInOverlay 300ms ease-out

Content:   width 540px (desktop), 100vw (mobile)
           bg var(--card-bg), border-left 1px solid var(--border)
           box-shadow: var(--shadow-drawer)
           padding: 36px (desktop), 24px 16px (mobile)
           animation: slideInFromRight 300ms cubic-bezier(0.2,0,0,1)
```

### 8.8 Form Inputs (`.input-field`)
```
padding: 12px 18px
border-radius: 16px
border: 1px solid var(--border-strong)
bg: rgba(255,255,255,0.6)
font-size: 13px
color: var(--text-h)

focus:
  border-color: var(--accent)
  box-shadow: 0 0 0 4px var(--accent-bg)
  bg: #ffffff
```

### 8.9 Live Status Dot
```
Outer wrapper: position relative, display flex, width 6px height 6px

Pulse ring:    animate-ping, bg #34d399 (Emerald-400), opacity 0.75
               Tailwind animate-ping = scale(2) + fade out, infinite

Core dot:      position relative, bg var(--success), width 6px, height 6px, borderRadius 50%
```

---

## 9. Interaction & Motion

### 9.1 Motion Tokens
Defined in `:root`:
```
--ease-out-quint:  cubic-bezier(0.2, 0, 0, 1)   /* Fast deceleration — feels snappy */
--duration-enter:  300ms                          /* Primary animation duration */
--duration-exit:   200ms                          /* Slightly faster for dismissals */
```

### 9.2 Transition Rules

| Element | Property Animated | Duration / Easing |
|---|---|---|
| Sidebar (expand/collapse) | `width`, `padding` | `300ms cubic-bezier(0.2,0,0,1)` |
| Sidebar nav links | `all` | `300ms cubic-bezier(0.2,0,0,1)` |
| Cards (`.premium-card`) | `border-color` only | `300ms cubic-bezier(0.2,0,0,1)` |
| Buttons (`.btn`) | `all` | `250ms cubic-bezier(0.16,1,0.3,1)` |
| Drawer backdrop | `opacity` (fadeInOverlay) | `300ms cubic-bezier(0.2,0,0,1)` |
| Drawer content | `transform + opacity` (slideInFromRight) | `300ms cubic-bezier(0.2,0,0,1)` |
| Tooltip (collapsed sidebar) | `opacity`, `transform`, `visibility` | `150ms ease` |
| Close button hover | `background-color` | `150ms ease` |

### 9.3 Hover Rules

| Element | Hover Behavior |
|---|---|
| Cards | Border color → `--border-strong`. **No lift. No shadow.** |
| `.btn-primary` | `bg → --accent-hover`, `translateY(-1px)`, stronger shadow |
| `.btn-secondary` | `bg` slightly darker, `translateY(-1px)` |
| `.btn-danger` | `bg → --danger` (full), `color → white` |
| Sidebar nav links | `bg → rgba(241,245,249,0.8)`, `color → #0f172a` |
| Sign Out / danger text | `color → var(--danger)` |

### 9.4 Micro-Interactions

| Pattern | Implementation |
|---|---|
| Button press (`:active`) | `transform: scale(0.98)` on `.sidebar-link`, `.sidebar-profile` |
| Mobile tab press | `transform: scale(0.88)` |
| Keyboard Escape | Closes open drawer or mobile sheet |
| Live sync dot | `animate-ping` pulse, continuous |
| Page entry | `.animate-fade-in` — `opacity: 0 → 1`, `300ms ease-out-quint` |
| Drawer entry | `slideInFromRight` — `translateX(100%) scale(0.99) → translateX(0) scale(1)` |
| Mobile drawer entry | `slideUpSheet` — `translateY(100%) → translateY(0)` |

### 9.5 Accessibility
```
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-xs);
}
```
All interactive elements (buttons, links, inputs, selects) override with this focus ring via `!important`. Escape key closes drawers — keyboard trap is handled.

---

## 10. Data Visualization

### 10.1 Financial Color Convention
This is a hard rule, non-negotiable:

| State | Token | Hex | Applied To |
|---|---|---|---|
| Positive / Gain | `var(--success)` | `#10b981` | Profit numbers, GMP %, listing gain %, win rate |
| Negative / Loss | `var(--danger)` | `#be123c` | Loss values, negative returns |
| Neutral / Flat | `var(--text-muted)` | `#64748b` | 0% returns, N/A values |

### 10.2 Chart Color Scale (shadcn/recharts)
| Token | Value | Role |
|---|---|---|
| `--chart-1` | `oklch(0.87 0 0)` | Primary series |
| `--chart-2` | `oklch(0.556 0 0)` | Secondary series |
| `--chart-3` | `oklch(0.439 0 0)` | Tertiary |
| `--chart-4` | `oklch(0.371 0 0)` | Quaternary |
| `--chart-5` | `oklch(0.269 0 0)` | Quinary |

Charts use a neutral grayscale progression — consistent with the "neutral-first" color philosophy.

---

## 11. Layout & Grid

### 11.1 App Shell
```
.dashboard-container:  display: flex, min-height: 100vh
.sidebar:              250px fixed column, sticky top: 0
.main-content:         flex-grow: 1, overflow-y: auto, padding 40px 56px (desktop)
```

### 11.2 Docs Layout
```
.docs-layout:          display: grid, grid-template-columns: 220px 1fr, gap: 40px
.docs-sidebar:         220px sticky column, gap 4px between nav items
.docs-content:         max-width 820px, font-size 13px, line-height 1.6
```

### 11.3 IPO Pipeline Grid
```
display: grid
Auto-fit columns, responsive
scrollSnapAlign: 'start' on each card
Min card height: 310px (desktop)
Card radius: var(--radius-lg)
Card padding: 20px
```

### 11.4 Breakpoints
| Breakpoint | px | Behavior |
|---|---|---|
| Desktop | > 1024px | Full sidebar + main content layout, full padding |
| Tablet | 769–1024px | Main content padding shrinks to 24px |
| Mobile | ≤ 768px | Sidebar hidden, mobile header + bottom tab bar shown |

---

## 12. Mobile Design System

### 12.1 Mobile Header
```
Height: 56px, fixed top, z-index: 900
bg: rgba(248,248,248,0.88), backdrop-filter: blur(20px) saturate(180%)
border-bottom: 1px solid var(--border)

Title: 17px, weight 800, gradient text (--text-h → --accent), tracking -0.3px
Status: 10px, weight 700, color --success, bg --success-bg, radius 999px
```

### 12.2 Bottom Tab Bar
```
Height: 64px, fixed bottom, z-index: 1000
bg: rgba(255,255,255,0.92), backdrop-filter: blur(24px) saturate(180%)
border-top: 1px solid var(--border)

Tab button: flex column, icon + 10px label, color --text-muted → --accent active
Active indicator: 20px × 3px bar, top 4px, radius 2px, bg --accent
Press: scale(0.88)
```

### 12.3 Mobile Cards
- `.premium-card` border-radius overrides to `20px`
- Drawer becomes full-screen bottom sheet, slides up (`slideUpSheet`)
- IPO grid becomes single-column vertical stack

---

## 13. Changelog

| Date | Version | Change |
|---|---|---|
| Sep 2026 | v1.0 | Brand guidelines v1.0 — complete first draft from established codebase |
| Sep 2026 | v1.0 | Color tokens consolidated (27 → 15), coral removed |
| Sep 2026 | v1.0 | Shadow system changed to flat (no shadows on cards) |
| Sep 2026 | v1.0 | Radius system formalized: --radius-lg (16), --radius-md (12), --radius-sm (8), --radius-xs (6) |
| Sep 2026 | v1.0 | Motion tokens added: --ease-out-quint, --duration-enter (300ms), --duration-exit (200ms) |
| Sep 2026 | v1.0 | Collapsible sidebar with localStorage persistence added |
| Sep 2026 | v1.0 | Brand renamed: IPO Investment Engine → IPO Tracker |
| Sep 2026 | v1.0 | Logo section placeholder — custom logo in progress |
