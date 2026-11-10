# Color System: Kali Mandir, Chittagong

Design guide for the temple website colors. Follows the **60-30-10 rule**, a mobile-first approach, and WCAG AA contrast.

- **Palette A, Sindoor & Gold** (light, warm): **primary choice**. Matches the "Divine Timings & Sacred Calendar" section.
- **Palette B, Midnight & Hibiscus** (dark, dramatic): optional alternative or dark mode.

Use **one palette at a time**. If both are supported, switch by swapping the same semantic tokens (see section 4).

---

## 1. The 60-30-10 rule

| Share | Purpose | What it covers |
|---|---|---|
| **60%** | Dominant | Page background and large surfaces |
| **30%** | Secondary / brand | Nav, footer, cards, panels, headings |
| **10%** | Accent | Buttons, active states, highlights, icons |

Keep the accent rare. If everything is accented, nothing stands out.

---

## 2. Palette A: Sindoor & Gold (light)

### 2.1 Tokens

| Token | Name | Hex | Share |
|---|---|---|---|
| `cream` | Cream | `#F7EFE0` | 60% |
| `sand` | Sand | `#F2DFB4` | 60% (alt surface) |
| `maroon` | Sindoor Maroon | `#6E0516` | 30% |
| `maroon-deep` | Dark Maroon | `#3F0A12` | 30% (footer, hover) |
| `gold` | Temple Gold | `#E0A526` | 10% |
| `ink` | Warm Charcoal | `#2B1A17` | Body text |

### 2.2 Usage by element

| Element | Background | Text / Icon | Notes |
|---|---|---|---|
| Page background | `cream` | `ink` | Alternate sections with `sand` |
| Navbar | `maroon` | `cream` | Active link has a `gold` underline |
| Navbar hover | `maroon-deep` | `gold` | Smooth 150ms transition |
| Hero overlay | `maroon-deep` at 55 to 70% | `cream` | Keeps text readable over photos |
| Headings (h1 to h3) | n/a | `maroon` | Decorative serif display font |
| Body text | n/a | `ink` | Never pure black |
| Muted text | n/a | `ink` at 70% | Captions, helper text |
| Section panel | `sand` | `ink` | Rounded corners, soft shadow |
| Feature card | `maroon` | `cream` | Title in `cream`, icon tile in `cream` |
| Time badge | `maroon-deep` | `cream` | Pill shape |
| Selected calendar day | `maroon-deep` | `gold` | Same as the reference design |
| Primary button | `maroon` | `cream` | Hover: `maroon-deep` |
| CTA / Donate button | `gold` | `maroon-deep` | Hover: slightly darker gold. **One per screen** |
| Secondary button | transparent, 1.5px `maroon` border | `maroon` | Hover: fill `maroon`, text `cream` |
| Text links | n/a | `maroon`, underlined | Hover: `gold` underline |
| Borders, dividers | n/a | `gold` at 40 to 60% | Thin 1px lines |
| Input fields | `cream` | `ink` | Border `maroon` at 30%, focus ring `gold` |
| Focus ring | n/a | `gold`, 2px, 2px offset | Visible on every interactive element |
| Footer | `maroon-deep` | `cream` | Headings in `gold` |

### 2.3 Contrast notes

| Pair | Approx. ratio | OK for |
|---|---|---|
| `maroon` on `cream` | ~11:1 | All text |
| `ink` on `cream` | ~14:1 | All text |
| `cream` on `maroon` | ~11:1 | All text |
| `gold` on `maroon` | ~5.5:1 | Headings, icons, large text, UI |
| `maroon-deep` on `gold` | ~8:1 | Button text |
| `gold` on `cream` | ~1.9:1 | **Never use for text** |

Gold is only a **fill, border, icon, or text on dark backgrounds**.

---

## 3. Palette B: Midnight & Hibiscus (dark)

### 3.1 Tokens

| Token | Name | Hex | Share |
|---|---|---|---|
| `midnight` | Midnight | `#14101F` | 60% |
| `midnight-deep` | Deeper Night (footer) | `#0D0A15` | 60% |
| `indigo` | Indigo Night | `#241B36` | 30% |
| `dusk` | Dusk (borders) | `#3A2D52` | 30% |
| `hibiscus` | Hibiscus Red | `#D7263D` | 10% |
| `hibiscus-light` | Light Hibiscus (small text/links) | `#F0505F` | 10% |
| `gold` | Temple Gold | `#E6B34A` | 10% |
| `ivory` | Ivory | `#F3EBDD` | Text |

### 3.2 Usage by element

| Element | Background | Text / Icon | Notes |
|---|---|---|---|
| Page background | `midnight` | `ivory` | |
| Navbar | `indigo` | `ivory` | Bottom border `dusk`, active link `gold` |
| Headings | n/a | `ivory` | Section headings may use `gold` |
| Body text | n/a | `ivory` at 85% | |
| Cards / panels | `indigo` | `ivory` | 1px `dusk` border |
| Primary button | `hibiscus` | `#FFFFFF` | Hover: slightly darker red with a soft glow |
| Secondary button | transparent, 1.5px `gold` border | `gold` | Hover: fill `gold`, text `midnight` |
| Text links | n/a | `hibiscus-light` | Hover: `gold` |
| Selected calendar day | `hibiscus` | `#FFFFFF` | |
| Input fields | `midnight` | `ivory` | Border `dusk`, focus ring `gold` |
| Footer | `midnight-deep` | `ivory` | Headings `gold` |

### 3.3 Contrast notes

| Pair | Approx. ratio | OK for |
|---|---|---|
| `ivory` on `midnight` | ~15:1 | All text |
| `gold` on `midnight` | ~9:1 | All text |
| `#FFFFFF` on `hibiscus` | ~5:1 | Button text |
| `hibiscus` on `midnight` | ~3.7:1 | Large text and UI only. **Not body text** |

Use `hibiscus-light` for small red text on dark backgrounds.

---

## 4. Implementation (Tailwind CSS v4)

Name tokens by **role**, not by color, so palettes can be swapped without touching components.

```css
/* Palette A (default) */
@theme {
  --color-bg: #F7EFE0;
  --color-surface: #F2DFB4;
  --color-brand: #6E0516;
  --color-brand-deep: #3F0A12;
  --color-accent: #E0A526;
  --color-text: #2B1A17;
  --color-on-brand: #F7EFE0;
}

/* Palette B (optional dark theme) */
[data-theme="dark"] {
  --color-bg: #14101F;
  --color-surface: #241B36;
  --color-brand: #D7263D;
  --color-brand-deep: #0D0A15;
  --color-accent: #E6B34A;
  --color-text: #F3EBDD;
  --color-on-brand: #FFFFFF;
}
```

Usage in components: `bg-bg`, `bg-surface`, `bg-brand text-on-brand`, `text-text`, `border-accent`.

Rules:
- Never hard-code hex values in components. Always use tokens.
- Hover, focus and active states come from the same tokens (use `brand-deep` for hover).
- If a dark/light toggle is added, respect `prefers-color-scheme` on first load and save the choice.

---

## 5. Design rules (apply to both palettes)

1. **Follow 60-30-10 strictly.** The accent does one job: buttons and highlights.
2. **Red and maroon are for emphasis,** not for large flat areas, which feel heavy.
3. **Meet WCAG AA:** 4.5:1 for body text, 3:1 for large text and UI components. Re-check any new color pair.
4. **Avoid pure black, pure white, and neon** as large fills. They clash with the traditional feel.
5. **Don't rely on color alone** to show state. Pair it with an underline, icon, or label (for example, links are underlined).
6. **One primary CTA per screen** (for example "Donate" or "Visit Us").
7. **Visible focus ring** on all interactive elements for keyboard users.
8. **Test on a phone in bright sunlight.** Many visitors will view the site outdoors on mobile.
9. **Keep photography consistent.** Warm-toned images work best with Palette A. Use a dark overlay on hero images so text stays readable.
10. **Festival accents are temporary.** If a special banner is needed (for example, Kali Puja), use a `gold` or `hibiscus` strip, and do not change the core palette.

---

## 6. Quick reference: where each color lives (Palette A)

```
Navbar ............ maroon      + cream text + gold active underline
Page bg ........... cream       (alternate sections: sand)
Titles ............ maroon
Body text ......... ink
Cards ............. sand panels / maroon feature cards
Primary button .... maroon  -> hover maroon-deep
CTA button ........ gold + maroon-deep text
Links ............. maroon underlined -> hover gold underline
Dividers .......... gold (thin)
Footer ............ maroon-deep + cream text + gold headings
```
