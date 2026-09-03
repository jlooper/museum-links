---
name: Museum Media Grouper
description: A hushed, archival tool for searching museum collections and conserving small curated expositions.
colors:
  gilt-highlight: "oklch(0.81 0.09 90)"
  museum-gold: "oklch(0.71 0.1 88)"
  restoration-red: "oklch(0.78 0.12 30)"
  herbarium-green-bg: "oklch(0.27 0.045 145)"
  herbarium-green-text: "oklch(0.78 0.12 145)"
  gallery-ink: "oklch(0.13 0.008 264)"
  panel-ink: "oklch(0.17 0.01 262)"
  recessed-ink: "oklch(0.21 0.012 260)"
  bone-white: "oklch(0.92 0.03 92)"
  muted-bone: "oklch(0.74 0.03 90)"
  gilt-hairline: "oklch(0.71 0.1 88 / 20%)"
typography:
  display:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "clamp(2.1rem, 4.5vw, 2.75rem)"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Cinzel, Georgia, serif"
    fontSize: "1.4rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "0.03em"
  title:
    fontFamily: "Jost, 'Avenir Next', Avenir, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Jost, 'Avenir Next', Avenir, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Jost, 'Avenir Next', Avenir, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  sharp: "2px"
  pill: "999px"
  hero-search: "12px"
spacing:
  xs: "0.5rem"
  sm: "0.9rem"
  md: "1.5rem"
  lg: "2.5rem"
  xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.museum-gold}"
    textColor: "{colors.gallery-ink}"
    rounded: "{rounded.sharp}"
    padding: "0.65rem 1.1rem"
  button-secondary:
    backgroundColor: "{colors.recessed-ink}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.sharp}"
    padding: "0.65rem 1.1rem"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.restoration-red}"
    rounded: "{rounded.sharp}"
    padding: "0.45rem 0.7rem"
  badge-pill:
    backgroundColor: "{colors.recessed-ink}"
    textColor: "{colors.gilt-highlight}"
    rounded: "{rounded.pill}"
    padding: "0.2rem 0.7rem"
  field-label:
    textColor: "{colors.gilt-highlight}"
    typography: "{typography.label}"
---

# Design System: Museum Media Grouper

## 1. Overview

**Creative North Star: "The Conservation Room"**

This is the quiet, careful back-room of a museum where objects are handled, catalogued, and kept,
not the public-facing marketing lobby out front. Everything about the interface is hushed and
unhurried: dark, low-contrast chrome that never competes with the artwork sitting on it, generous
negative space, and typography that reads like catalog copy rather than a pitch. Nothing here
blinks, pulses, or auto-advances. The pace is the pace of actually looking at a painting.

The system explicitly rejects the generic SaaS-dashboard vocabulary: no hero-metric tiles, no
bright gradient accents, no identical icon+heading+text card grids, no glassy translucent panels.
It also rejects the cluttered, link-dense look of many real institutional museum websites. The
restraint here is deliberate, not accidental or unfinished.

**Key Characteristics:**
- Dark ink backgrounds at three tonal steps, never pure black.
- A single warm gold accent family, used for headings, labels, and primary actions, and almost
  nowhere else.
- Every card and framed image casts one consistent, soft ambient shadow, as if lit from above in
  a gallery.
- Sharp, squared-off 2px corners everywhere except badges (fully rounded) and the one prominent
  hero search field (softer 12px, a deliberate one-off).

## 2. Colors

The palette is Restrained: tinted near-black neutrals carry almost the entire surface, with one
warm gold family doing all of the accenting.

### Primary
- **Gilt Highlight** (`oklch(0.81 0.09 90)`): the lighter, more luminous gold. Used for the page
  `<h1>`, all navigation links, form field micro-labels, and badge text. This is the color a
  visitor's eye lands on first.
- **Museum Gold** (`oklch(0.71 0.1 88)`): a slightly deeper, more saturated gold. Used for section
  `<h2>` headings and as the background of every primary button (with ink text on top, not gold
  text). Reserve this one for "the thing you're meant to act on."

### Tertiary
- **Restoration Red** (`oklch(0.78 0.12 30)`): used exclusively for destructive actions (Delete
  draft, Delete image) — transparent background, red text and border at rest, a soft red tint on
  hover. Never used decoratively.
- **Herbarium Green** (`oklch(0.27 0.045 145)` background / `oklch(0.78 0.12 145)` text): the
  `ready_for_review` status pill, tuned to sit in the dark palette the same way Restoration Red
  does — a dark tinted well with a bright, saturated text color on top.

### Neutral
- **Gallery Ink** (`oklch(0.13 0.008 264)`): the base page background, nearly black with the
  faintest blue-violet tint. Never pure `#000`.
- **Panel Ink** (`oklch(0.17 0.01 262)`): one step lighter, used for the masthead band and standard
  card backgrounds.
- **Recessed Ink** (`oklch(0.21 0.012 260)`): the lightest of the three darks. Used for anything
  that should read as "inset" — form inputs, badge backgrounds, the well behind a framed image.
- **Bone White** (`oklch(0.92 0.03 92)`): primary body text. A warm off-white, never pure `#fff`.
- **Muted Bone** (`oklch(0.74 0.03 90)`): secondary/muted text — descriptions, metadata, captions,
  status hints.
- **Gilt Hairline** (`oklch(0.71 0.1 88 / 20%)`): the one border/divider color used everywhere,
  a translucent tint of the gold family rather than a flat gray. It's what makes every hairline in
  the system feel like it belongs to the same accent family, even at 20% opacity.

### Named Rules
**The One Accent Rule.** Gold (in its two tones) is the only saturated color used for ordinary UI.
Red and green exist solely as status signals for destructive and completion states, never as
decoration.

## 3. Typography

**Display Font:** Cinzel (with Georgia, serif fallback)
**Body Font:** Jost (with "Avenir Next", Avenir, sans-serif fallback)

**Character:** Cinzel is a carved-stone-letterform serif, doing double duty as museum signage: it
appears only on page titles and section headings, never on body copy or UI chrome. Jost, a
geometric grotesque, carries everything else, so the system reads as one confident display face
sitting on top of a quiet, functional sans.

### Hierarchy
- **Display** (500, `clamp(2.1rem, 4.5vw, 2.75rem)`, line-height 1.15): the one `<h1>` per page,
  set in Cinzel with 0.04em letter-spacing, in Gilt Highlight.
- **Headline** (500, 1.4–1.8rem depending on page, line-height 1.25): section and panel headings
  (`<h2>`), Cinzel, in Museum Gold.
- **Title** (700, 0.95rem, line-height 1.3): card and frame titles (`<h3>`) — a painting's name
  within a result card or exhibition frame — set in Jost at browser-bold weight.
- **Body** (400, 0.85–1rem, line-height 1.5, max ~60ch): all prose, descriptions, and captions, in
  Bone White or Muted Bone depending on emphasis.
- **Label** (600, 0.72rem, letter-spacing 0.06em, uppercase): form field micro-labels and museum
  wall-text ("ARTIST OR KEYWORD", "CAPTION"), always in Gilt Highlight.

### Named Rules
**The Museum-Plaque Rule.** Any label, caption, or attribution reads like the small printed card
beside a painting on a wall: factual, uppercase-or-italic, never promotional. If a piece of copy
sounds like marketing ("Discover amazing art!"), it's wrong for this system.

## 4. Elevation

The system is flat by default with exactly one shadow value, used consistently everywhere a card
or framed image sits: `box-shadow: 0 1rem 2rem oklch(0.05 0.01 264 / 28%)`. It's present at rest,
not applied only on hover, so every card reads as gently lit from above, like objects under
gallery spotlighting, rather than "elevated on interaction" in the conventional UI sense. Hover
adds a small physical lift (`translateY(-4px)`) and brightens the border toward gold, but the
shadow value itself never changes.

### Shadow Vocabulary
- **Gallery lift** (`box-shadow: 0 1rem 2rem oklch(0.05 0.01 264 / 28%)`): the only shadow in the
  system. Search-result cards, gallery cards, and exhibition frames all use this exact value.

### Named Rules
**The One Shadow Rule.** There is no elevation scale. A single soft ambient shadow does the work of
lifting every card-like surface off the ink background; adding a second, heavier shadow tier would
break the calm the rest of the system works to establish.

## 5. Components

### Buttons
- **Shape:** sharp corners everywhere (2px radius, `{rounded.sharp}`); never soft or pill-shaped.
- **Primary:** Museum Gold background, Gallery Ink text, no border, 0.65rem/1.1rem padding. This is
  the only place gold appears as a fill rather than as text.
- **Secondary:** Recessed Ink background, Bone White text, 1px Gilt Hairline border.
- **Danger:** transparent background, Restoration Red text and border at rest; on hover, a soft
  12–20% red tint fills in behind it. Reserved for Delete actions only.
- **Disabled:** 50% opacity, `cursor: not-allowed`, no other visual change.
- **Focus:** every interactive control (buttons, inputs, selects, textareas) gets the same 2px
  Museum Gold outline with 1px offset on `:focus-visible`. This is the system's one consistent,
  highly visible focus treatment.

### Badges (Pills)
- **Style:** fully rounded (`{rounded.pill}`, 999px), Recessed Ink background, Gilt Highlight text,
  small (0.72–0.8rem) uppercase-feeling but not text-transformed — used for museum-name tags
  ("Art Institute of Chicago") and the "Saved" indicator on the search page.
- **Status variant:** the `ready_for_review` pill uses the same shape and structure, swapping
  Gilt Highlight for Herbarium Green to signal completion.

### Cards / Containers
- **Corner Style:** sharp, 2px radius, matching buttons.
- **Background:** Panel Ink, with a 1px Gilt Hairline border.
- **Shadow Strategy:** the single Gallery Lift shadow (see Elevation), always present, not
  hover-only.
- **Hover:** `translateY(-4px)` plus border brightening toward Gilt Highlight at 60% opacity, on
  cards that are actionable (search results, gallery items). Read-only cards (Archive frames) skip
  the hover lift entirely, reinforcing that conserved work is settled, not interactive.

### Inputs / Fields
- **Style:** Recessed Ink background, 1px Gilt Hairline border, sharp 2px radius (except the one
  large hero search field on the homepage and gallery search, which uses a softer 12px radius as a
  deliberate emphasis moment).
- **Label:** always a Label-scale micro-label above the field, never a placeholder-only field.
- **Focus:** 2px Museum Gold outline, border shifts to gold to match.
- **Hover:** border brightens slightly toward gold at 45% opacity, before focus.

### Navigation
- Plain text links in Gilt Highlight, no underline at rest, underline on hover, 600 weight,
  0.9rem. The current page's own link is shown in Muted Bone at normal weight and is not
  clickable (`aria-current="page"`, `pointer-events: none`) rather than omitted from the list, so
  the same four links (Search, My Gallery, Story Builder, Archive) always appear in the same
  order on every page.

### The Exhibition Frame (signature component)
The one custom component unique to this system: every artwork, wherever it's shown, sits inside a
thin gold-line frame (`1px solid oklch(0.71 0.1 88 / 55%)`) with a small inset padding (0.45rem)
against a Recessed Ink mat, cropped with face-aware, content-aware fill so the subject is never
accidentally cut off. Below the frame, a plaque-style caption block: bold Gilt Highlight
attribution line, italic Bone White caption, Muted Bone narrative text, and a small "Source" link.
This exact pattern repeats across the search results, the gallery, the Story Builder's sequence
editor, its exhibition-wall preview, its printed PDF, and the Archive, so a painting looks like the
same physical object no matter where in the app it appears.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for every color, reducing chroma as lightness approaches the extremes (the
  three ink steps and two bone steps are all low-chroma; only the gold family carries real
  saturation).
- **Do** give every framed artwork the Exhibition Frame treatment: thin gold hairline border,
  content-aware crop, plaque-style caption beneath it.
- **Do** keep corners sharp (2px) by default; treat the 12px hero-search radius and 999px badge
  pills as the only two named exceptions, not a pattern to extend.
- **Do** write labels and captions like museum wall text: factual, terse, never promotional.
- **Do** give every interactive control the same 2px gold `:focus-visible` outline.

### Don't:
- **Don't** build hero-metric tiles, bright gradient accents, or glassy translucent panels — the
  generic SaaS-dashboard vocabulary this system explicitly rejects.
- **Don't** repeat identical icon+heading+text cards in a grid; the Exhibition Frame and the
  museum-plaque caption block are this system's card language, not generic icon tiles.
- **Don't** use a second shadow tier. One soft ambient shadow (`0 1rem 2rem oklch(0.05 0.01 264 /
  28%)`) is the whole elevation system.
- **Don't** introduce a light-mode color pairing for a new status color; tune it in OKLCH to sit
  comfortably in the dark palette the way Restoration Red and Herbarium Green already do.
- **Don't** make the Archive's conserved exhibitions hover or lift like editable cards do; read-only
  and settled should look and behave differently from a draft still being worked on.
