# Product

## Register

product

## Users

Art enthusiasts and hobbyists broadly, not museum professionals specifically: people who enjoy
browsing museum collections and want to save favorites and build small curated exhibitions of
their own. They come to this tool in a casual, unhurried mood, similar to browsing a museum
website for pleasure rather than doing research work.

## Product Purpose

Search the Met, the Art Institute of Chicago, and the Cleveland Museum of Art at once, save
favorite works to a personal gallery, and curate them into small narrative "expositions" using the
Story Builder: gather objects, arrange them into a sequence, write captions and narrative text, and
view the result as a small exhibition wall. Finished expositions are marked ready for review and
conserved permanently in the Archive as read-only exhibition walls, exportable as a PDF to keep.
Success looks like a satisfying, low-friction path from "I found a painting I like" to "here is a
small story I made and can keep or share."

## Brand Personality

Quiet, archival, reverent. Three words: hushed, considered, permanent. The interface should feel
like a small institution's own back-office tool, not a consumer app: dark ink-and-gold palette,
Cinzel serif display type evoking museum signage, and language throughout ("exposition,"
"exhibition wall," "conserved," "archive") drawn from museum practice rather than software
conventions.

## Anti-references

Generic SaaS dashboard tropes: hero-metric tiles, bright gradient accents, identical
icon+heading+text card grids, glassy translucent panels. This should never read as a startup admin
panel. Also avoid the cluttered, dense, dated look of many real institutional museum websites —
the restraint should feel deliberate, not accidental.

## Design Principles

- **Museum-plaque, not marketing copy.** Labels, captions, and attributions read like museum wall
  text: small caps, gold, understated, factual, never promotional.
- **Every image deserves its best crop.** Face-aware, content-aware cropping wherever art is
  shown; never a lazy center-crop that cuts off the subject.
- **The tool disappears in favor of the art.** Chrome stays dark and quiet; the artwork is always
  the visual focus, never competing with UI decoration.
- **Read-only should feel permanent.** Once something is conserved to the Archive it should read
  as settled and final, visually distinct from the mutable draft/editing experience in the Story
  Builder.
- **One consistent rhythm across pages.** The same header, footer, spacing scale, and card
  language on every page, so navigating between search, gallery, builder, and archive feels like
  one continuous space.

## Accessibility & Inclusion

Standard WCAG AA baseline. Reordering has visible, keyboard-accessible controls (no drag-and-drop
required). Every image's alt text is set automatically from its title. Focus states are visible
and on-brand (gold outline) rather than suppressed. Async status (search results, save progress) is
announced via `aria-live` regions. Reduced-motion is respected wherever animation is used.
