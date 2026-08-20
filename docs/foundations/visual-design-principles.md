# Wheelwright Visual Design Principles

> Canonical reference for Wheelwright's visual language. Inferred from implementation, ratified August 20, 2026.

---

## Design Principles

1. **Numbers are the product.** Every layout decision subordinates labels to values. Monospace + bold + larger size for data; sans-serif + normal + smaller + uppercase for labels.

2. **No gray text on operational surfaces.** All operational text is black or near-black. Hierarchy is expressed through weight, size, capitalization, and spacing — not by fading text toward invisibility. The only exception is truly disabled/unavailable content.

3. **Semantic color is reserved for meaning.** Color is never decorative. Each color family has a specific domain meaning. Backgrounds are near-white; hierarchy is expressed through typography, not color.

4. **One theme: light.** Wheelwright has one visual regime — light backgrounds, dark readable typography, restrained borders, and semantic color reserved for meaning. No dark mode. No theme switcher.

5. **Viewport-locked density.** Designed for a 1440×900 laptop. The Operator Console locks to `calc(100vh - 40px)`. Content that doesn't fit goes behind progressive disclosure or scrollable sub-regions.

6. **Progressive disclosure over information removal.** Nothing is deleted — it's reorganized into layers. Portfolio collapses to chips. Position detail lives in modals. Recommendation evidence lives in drawers. The primary task surface stays visible.

7. **Restrained borders, whitespace separates.** Borders are subtle and used sparingly. Groups are separated by spacing and background differentiation rather than heavy dividers.

8. **Strategy identity via subtle tint, not bold color.** Put/call/buy-write encoding uses barely-visible background tints (6-7% opacity). The primary scanning signal is moneyness state, not strategy type.

9. **Compact but not cramped.** Body text stays at 11px. Density comes from tight padding (3-4px) and line-height (1.2), not from font sizes below readable thresholds.

10. **Centralized token authority.** All palette values, type scales, and spacing live in `theme-tokens.css`. No raw hex values in component CSS. Every surface speaks the same visual language.

---

## Typography

### Font Families

| Token | Stack | Usage |
|-------|-------|-------|
| `--wd-font-mono` | SF Mono, Fira Code, Cascadia Code, ui-monospace | Numbers, values, prices, quantities, code |
| `--wd-font-sans` | -apple-system, BlinkMacSystemFont, Segoe UI, Roboto | Labels, headings, descriptions, UI chrome |

### Type Scale

| Token | Size | Usage |
|-------|------|-------|
| `--wd-size-hero` | 15px | Decision summary hero values |
| `--wd-size-value` | 13px | Capacity amounts, consequence values, secondary heroes |
| `--wd-size-body` | 11px | Table cells, tile content, general body |
| `--wd-size-label` | 9px | Uppercase section labels, column headers, annotations |
| `--wd-size-micro` | 8px | Posture badges, tertiary hints |

### Weights

| Token | Weight | Usage |
|-------|--------|-------|
| `--wd-weight-bold` | 700 | Primary numbers, symbols, hero values |
| `--wd-weight-semi` | 600 | Active nav, section headings, uppercase labels |
| `--wd-weight-normal` | 400 | Body text, supporting values |

### Typography Rules

- Numeric values: monospace, bold, larger size
- Labels: sans-serif, semi/normal weight, 9px, uppercase, letter-spacing 0.3–0.5px
- Table headers: 9px uppercase sans, semi-bold, strong bottom border
- Table cells: 10–11px monospace, tabular-nums
- All data columns use `font-variant-numeric: tabular-nums`

---

## Color System

### Text Hierarchy (all near-black)

| Token | Value | Usage |
|-------|-------|-------|
| `--wd-text-primary` | `#111827` | Numbers, key values, decisions, headings, symbols |
| `--wd-text-secondary` | `#1f2937` | Supporting text, labels, descriptions |
| `--wd-text-tertiary` | `#374151` | Supplementary metadata, DTE annotations |
| `--wd-text-disabled` | `#6b7280` | Truly unavailable or deferred content only |

### Backgrounds

| Token | Value | Usage |
|-------|-------|-------|
| `--wd-bg-base` | `#f8f9fb` | Page/shell background |
| `--wd-bg-surface` | `#ffffff` | Cards, modals, panels |
| `--wd-bg-raised` | `#f0f2f5` | Alternating rows, control bars, header fills |
| `--wd-bg-hover` | `rgba(0,0,0,0.035)` | Interactive hover state |

### Semantic Color Families

Each family has three coordinated values: text (dark, legible), fill (subtle background), and border (accent stroke).

| Family | Text | Fill (bg) | Border | Meaning |
|--------|------|-----------|--------|---------|
| Green | `#15803d` | `rgba(22,101,52,0.07)` | `#86efac` | Favorable, actionable, production, OTM |
| Amber | `#92400e` | `rgba(146,64,14,0.06)` | `#fbbf24` | Caution, edge, wait, ATM |
| Red | `#b91c1c` | `rgba(185,28,28,0.05)` | `#fca5a5` | Danger, unfavorable, erosion, ITM |
| Blue | `#1d4ed8` | `rgba(29,78,216,0.05)` | `#93c5fd` | Informational, evidence, observed data |
| Purple | `#6d28d9` | `rgba(109,40,217,0.05)` | `#c4b5fd` | Structural, exposure, buy-write |

### Strategy Identity Colors (badge text)

| Strategy | Color | Tile Tint | Usage |
|----------|-------|-----------|-------|
| Put | `#a855a0` | `rgba(180,100,160,0.06)` | Badge text, subtle tile background |
| Call | `#0d9068` | `rgba(60,140,120,0.06)` | Badge text, subtle tile background |
| Buy-Write | `#2563eb` | `rgba(50,100,180,0.07)` | Badge text, subtle tile background |

### Borders

| Token | Value | Usage |
|-------|-------|-------|
| `--wd-border-subtle` | `#e5e7eb` | Internal separators, row dividers |
| `--wd-border-default` | `#d1d5db` | Panel borders, input outlines |
| `--wd-border-strong` | `#9ca3af` | Table header bottoms, drawer edges |
| `--wd-table-row-border` | `#f3f4f6` | Ultra-light row separator |

---

## Layout

### Viewport Target

- Primary: 1440×900 laptop
- Operator Console: viewport-locked (`calc(100vh - 40px)`)
- Write Desk: optimized for drawer-open state (385px right margin reserved)

### Spacing Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--wd-space-section` | 16px | Between major sections |
| `--wd-space-group` | 10px | Between related items |
| `--wd-space-item` | 4px | Between individual elements |

### Density Rhythm

- Table cell padding: 3–4px vertical, 5–8px horizontal
- Tile padding: 6px 10px
- Section padding: 10–12px
- Modal internal: 12–16px

---

## Component Patterns

### Tables

- Monospace cells, tabular-nums alignment
- Uppercase header row (9px, semi-bold, strong bottom border)
- Ultra-light row borders (`#f3f4f6`)
- Selected row: green 3px inset rail + green-tinted background
- Hover: subtle `--wd-bg-hover`

### Status Indicators

- Colored pips (6–7px circles): green=ready, yellow=caution, blue=premarket, gray=closed
- Left-border accents (3px): green=loaded, red=error
- Posture badges: micro text + tinted background in semantic color

### Modals and Drawers

- Modal: centered, max 600px wide, dimmed backdrop (`rgba(0,0,0,0.3)`)
- Drawer: fixed right, 370px wide, subtle left shadow
- Both: surface background, default border, rounded corners

### Controls

- Buttons: subtle borders, 10px, 3–4px padding, border-radius 3–4px
- Active state: green border + green text + green-bg
- Selects: surface background, default border, compact padding

---

## Moneyness Visual Encoding

| State | Color | Meaning |
|-------|-------|---------|
| Favorable (OTM for puts) | `#166534` | Strategy is working as intended |
| Ambiguous (ATM) | `#92400e` | At the boundary, direction unknown |
| Unfavorable (ITM for puts) | `#991b1b` | Counter to strategy intent |
| Neutral | `--wd-text-secondary` | Intent unknown, no color signal |

---

## Token Authority

The canonical source for all visual tokens is `options-prototype/src/theme-tokens.css`. This document describes the system; the token file implements it. If they diverge, the token file is authoritative for current values and this document is authoritative for intent and principles.
