# Atom & Echo — Official Brand Design System & Token Extraction

> **Extracted directly from**: Live production website `https://atomnecho.com`  
> **Source Files Inspected**: `style.css?v=20260922d`, `index.html`, `script.js?v=20260922d`, `atom-geometry.js`, `icon.svg`  
> **Target Alignment**: Atom & Echo Custom Operating System (Web App & Mobile Client Review Portal)

---

## 1. Core Color Palette & Variables

The brand uses an organic, high-end editorial palette characterized by **deep obsidian-olive darks**, **warm eggshell paper whites**, and an **electric acid lime / chartreuse pop**.

### The 5 Foundational CSS Custom Properties (`:root`)
```css
:root {
  --ink:   #10110f; /* Deep Warm Obsidian Canvas (Primary Background) */
  --paper: #f4f5f0; /* Soft Eggshell / Warm Paper (Primary Foreground) */
  --lime:  #d3ff5a; /* Electric Acid Lime / Chartreuse (Signature Accent) */
  --muted: #a8aaa3; /* Warm Olive Slate (Secondary / Muted Copy) */
  --line:  #383a33; /* Dark Olive Hairline (Borders & Dividers) */
}
```

### Complete Hex & RGB Specification

| Token Name | Hex Code | RGB | Role / Usage on atomnecho.com |
|---|---|---|---|
| **Canvas Base (`--ink`)** | `#10110f` | `16, 17, 15` | Default body canvas, deep backdrop, header base. |
| **Paper Ink (`--paper`)** | `#f4f5f0` | `244, 245, 240` | Primary typography, headers, high-contrast buttons. |
| **Signature Lime (`--lime`)** | `#d3ff5a` | `211, 255, 90` | Active tabs, italics (`<em>`), button borders, brand emphasis. |
| **Lime Hover / Highlight** | `#bfff70` | `191, 255, 112` | Hover state on lime buttons, active glow. |
| **Lime Pale Tint** | `#edffcf` / `#d3ff94` | `237, 255, 207` | Subdued lime badges, soft chips. |
| **Lime Transparent Glow** | `rgba(211, 255, 90, 0.13)` | `rgba(211, 255, 90, 0.13)` | Ambient halo, focus rings, subtle active card border. |
| **Muted Copy (`--muted`)** | `#a8aaa3` | `168, 170, 163` | Subtitles, secondary descriptions, metadata. |
| **Secondary Ink (Light Sage)** | `#c1c8b5` / `#bcc4b1` | `193, 200, 181` | Question text, secondary body copy, kicker tags. |
| **Tertiary Ink (Dull Olive)** | `#74796a` / `#62685a` | `116, 121, 106` | Footnotes, legal text, placeholder labels. |
| **Hairline Border (`--line`)** | `#383a33` | `56, 58, 51` | Subtle container borders, table dividers, header hairline. |
| **Border Active / Strong** | `#424737` / `#34392c` | `66, 71, 55` | Card borders, section separators, divider lines. |
| **Surface Dark Tier 1** | `#152011` / `#131c13` | `21, 32, 17` | Card backgrounds, pill button backgrounds, dialog body. |
| **Surface Dark Tier 2 (Hover)**| `#262a20` / `#1b1e17` | `38, 42, 32` | Interactive row hover, button hover, elevated card surface. |
| **Olive Button Border** | `#4d603c` / `#50603c` | `77, 96, 60` | Circular action buttons, checkbox borders, input outlines. |

---

## 2. Typography Architecture

The live website utilizes a deliberate 3-tier font hierarchy that blends modernist grotesk UI clarity with literary editorial sophistication.

### Font Family Trio
```css
/* Google Fonts Import */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400..700;1,9..40,400..700&family=Manrope:wght@400..800&family=JetBrains+Mono:wght@400..600&display=swap');
```

1. **Primary Interface & Body Font**: `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`
   - **Weights**: `400` (regular), `450` / `500` (medium), `600` (semibold), `700` (bold).
   - **Letter Spacing**: `-0.01em` (clean readability) to `-0.02em` (compact labels).
   - **Line Height**: `1.5` to `1.65`.
   - **Role**: All standard body copy, table data, forms, navigation labels, and modal dialogs.

2. **Secondary Display & Structural Headings Font**: `'Manrope', -apple-system, BlinkMacSystemFont, sans-serif`
   - **Weights**: `500` (medium), `650`, `700`, `800` (extrabold).
   - **Letter Spacing**: Very tight tracking (`-0.03em` to `-0.075em` on hero titles).
   - **Role**: Section titles (`h2`), card headers (`h3`), KPI metric values, and bold structural callouts.

3. **Signature Editorial Accent**: `Georgia, serif`
   - **Style**: `italic`, `font-weight: 400`.
   - **Color**: `var(--lime)` (`#d3ff5a`).
   - **Role**: Emphasized words within headings (`<em>unreasonable ambition</em>`, `<em>say hello</em>`, `<em>You sound more like you</em>`), quote marks (`"`, 80px Georgia), and client testimonial pull quotes.

4. **Technical & Monospace (OS Extension)**: `JetBrains Mono, monospace`
   - **Weights**: `400`, `500`.
   - **Role**: IDs, audit trail timestamps, token hashes, financial numbers, status pill text.

---

## 3. UI Component Design Patterns

### A. Buttons & CTAs
* **Primary High-Contrast Button** (e.g. "Book a discovery call"):
  - `background: var(--paper)` (`#f4f5f0`)
  - `color: var(--ink)` (`#10110f`)
  - `border-radius: 100px` (pill/stadium shaped)
  - `padding: 15px 23px`
  - `font-size: 15px; font-weight: 600; font-family: 'DM Sans'`
  - Hover: `transform: translateY(-3px);`
* **Accent Active Button / Selected Tab**:
  - `background: var(--lime)` (`#d3ff5a`)
  - `color: var(--ink)` (`#10110f`)
  - `border: 1px solid var(--lime)`
* **Subdued Secondary Button / Filter Chip**:
  - `background: #131c13`
  - `border: 1px solid #33412f`
  - `color: #adbaa1`
  - `border-radius: 100px`
  - Hover: `border-color: var(--lime)`
* **Circular Icon Action Button** (e.g. arrows, expanders):
  - `width: 35px; height: 35px; border-radius: 50%`
  - `background: transparent; border: 1px solid #4d603c; color: #d3ff5a`
  - Hover: `background: #34472a`

### B. Cards & Container Shells
* **Base Card**:
  - `background: #152011` (or `#10110f` with surface elevation)
  - `border: 1px solid var(--line)` (`#383a33` / `#34392c`)
  - `border-radius: 8px` to `10px`
  - Hairline top border for sequential grids: `border-top: 1px solid #34392c`
* **Focused / Active Card**:
  - `border-color: #55782a` with soft glow `box-shadow: 0 0 15px rgba(211, 255, 90, 0.08)`

---

## 4. Brand Asset Specifications

* **Favicon Mark**: `/icon.svg` — 480 × 460 viewBox (`viewBox="60 84 480 460"`), white tile containing the geometric black symbol mark.
* **Master Stacked Wordmark**: `/brand-stacked.png` — 1672 × 941 original asset.
* **Dark-Theme Wordmark**: `/brand-wordmark-white.svg` — transparent background with pure white typography, cropped to `viewBox="389 307 880 330"`.
* **Light-Theme Wordmark**: `/brand-wordmark-dark.svg` — transparent background with deep `#10110f` typography.
