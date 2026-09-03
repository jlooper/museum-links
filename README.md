# Museum Media Grouper and Exposition Builder

An Astro app that ingests museum objects from three museums: The Met, Art Institute of Chicago, Cleveland Museum of Art into Cloudinary,
groups them by artist for browsing, and lets a person or AI Agent compose saved objects into a small visual
story.

## Running the app

```sh
npm install
cp .env-example .env   # fill in your Cloudinary credentials
npm run dev
```

- `/` — live search across the Met, the Art Institute of Chicago, and the Cleveland Museum of Art.
  Nothing is saved until you pick results and click "Save selected to my gallery."
- `/gallery` — "My gallery": grouped-by-artist view of everything you've saved under `museums/*` in
  Cloudinary (this is what used to live at `/`).
- `/story-builder` A story-creation studio.
- `/archive` — temporary, read-only home for every story once it's marked ready for review. Each
  conserved exposition renders as its own exhibition wall; a "Download as PDF" button on the
  Story Builder's preview lets you keep one as a file.
- `GET /api/museum-search` — live, read-only search across the three museum APIs (`q`, optional
  `source`, `limit`). Uploads nothing; results carry everything needed to save them later.
- `POST /api/museum-save` — uploads a caller-supplied list of museum records (as returned by
  `/api/museum-search`) into Cloudinary. This is what "Save selected to my gallery" calls.
- `POST /api/ingest` — background/bulk variant: fetches from the Met/AIC/Cleveland APIs *and*
  uploads every match into Cloudinary in one call (useful for scripted ingestion).
- `GET /api/assets` — lists Cloudinary assets under `museums/*`; also accepts `q`, `source`,
  `artist`, `ids` (comma-separated public ids), and `limit` query params for filtered/search use.

Every page shares a `Header`/`Footer` pair (`src/components/`) — same nav links, same 1400px
content width, same footer height, stuck to the bottom of the viewport on short pages.

Run the test suite with:

```sh
npm run test
```

## Agentic Story-Builder

The Agentic Builder is a story-creation layer on top of the existing museum collection. Ask an agent to build a virtual museum exposition card set using an art grouping that you create. 
It will search the saved Cloudinary collection, start an unpublished draft, add objects to it, arrange
them into a sequence, write captions/narrative text, and invite you to view the result as a small
exhibition wall. A human can then mark the story "ready for review," which moves it out of the
Story Builder's draft list and into `/archive` as a read-only exposition — from
there it can also be downloaded as a PDF to keep.

Drafts are stored in the browser (`localStorage`), behind a small `StoryRepository` interface
(`src/lib/stories/storyRepository.ts`) so the persistence layer can be swapped for an authenticated
server-backed one later without touching the UI.

The UI (`storyBuilderController.ts`) is a thin DOM layer over plain, dependency-injected handler
functions in `src/lib/webmcp/toolHandlers.ts`. Those same handlers are also exposed to a
WebMCP-capable browser agent as 8 tools (`src/lib/webmcp/toolDefinitions.ts` for the schemas,
`registerStoryTools.ts` for the `document.modelContext.registerTool(...)` wiring) — a click in the
UI and a tool call from an agent run through the exact same function, so behavior can't drift
between the two paths. Registration is feature-detected: on a browser without
`document.modelContext` it's a no-op and the page works entirely through its normal UI. A small
status pill under the page intro reports `WebMCP: ready (8 tools)` or `WebMCP: unavailable`.

WebMCP (`document.modelContext`) is a very new, fast-moving browser proposal — as of when this was
written, Gemini in Chrome does not peruse the site as expected, but you can use Claude's Chrome extension to good effect. Not in Chrome? Seeing "unavailable" here doesn't
mean this page's tools are broken — it likely means the browser you're testing in doesn't expose
`document.modelContext` yet. Every tool call is also logged to the browser console
(`console.debug`) as `[webmcp] <tool name> succeeded/failed` for debugging live agent runs.
Those handlers are exercised directly in `toolHandlers.test.ts` without needing a browser.

### Story builder actions and their safety boundaries

| Action | What it does | Boundary |
| --- | --- | --- |
| Search | Searches the saved Cloudinary collection by a single artist-or-keyword box, optionally restricted to one museum (`query`, optional `source`/`limit`) | Read-only; returns only structured data (id, title, artist, source, date, thumbnail, source URL) |
| Create draft | Creates an unpublished draft (`title` only) | Local/unpublished only |
| Delete draft | Removes a draft from local storage | Local only; asks for confirmation before deleting |
| Add items | Adds objects to a draft by public id | Only accepts ids the app's own data layer can verify; unverified ids are skipped and reported, never trusted |
| Edit item text | Sets an item's caption/narrativeText | Length-limited; stored as plain text and always rendered via `textContent`, never `innerHTML` |
| Arrange items | Reorders a draft's items | Rejects any list that isn't exactly a permutation of the existing item ids |
| Preview | Renders the story as a small exhibition wall (a fixed-size framed-card grid, one frame per item) | Read-only with respect to story data |
| Request review | Sets status to `ready_for_review`, moving the draft into `/archive` and out of the Story Builder's picker | **Never publishes.** Requires at least one item; a human must still take a separate, explicit action to publish anything |

### Accessibility

- Reordering has visible, keyboard-accessible move-up/move-down buttons (no drag-and-drop required).
- Every item's image `alt` text is its title, set automatically — there's no separate alt-text
  field to fill in or forget.
- Attribution (title, artist, date, source link) is preserved and shown for every item.
- All dynamic text (search results, sequence items, preview) is built with DOM APIs and
  `textContent`/`createTextNode` — never `innerHTML`.
- Selecting search results to save (on `/`) works from the keyboard: each result's checkbox has an
  `aria-label` and drives selection via its own `change` event, not just a mouse click on the card.
- Every interactive control across all four pages (inputs, selects, buttons, checkboxes) gets the
  same visible gold `:focus-visible` outline.

## Deployment

This app is server-rendered (search, gallery, and archive pages all fetch from Cloudinary at
request time) and deploys to Netlify via `@astrojs/netlify` (configured in `astro.config.mjs`).
`npm run build` produces a Netlify Function alongside the static assets. Set the same four
`CLOUDINARY_*` variables from `.env` in the Netlify site's **Site settings → Environment
variables** — without them, requests to `/api/assets` (and anything that depends on it) fail at
request time the same way they'd fail locally without a `.env` file.

## Design system

`PRODUCT.md` and `DESIGN.md` (plus its `DESIGN.json` sidecar) at the project root capture the
strategic and visual design system — who this is for, the OKLCH ink/gold palette, typography,
and component patterns — so future work stays consistent instead of drifting page by page.

### Known limitations / next steps

- Drafts are local to one browser (`localStorage`); there is no cross-device sync or multi-user
  editing yet — swapping in a server-backed `StoryRepository` is the intended next step.
- `add_story_items` re-fetches `/api/assets?ids=...` to verify each asset; for very large collections
  this endpoint's in-memory filtering (capped at the most recent 100 Cloudinary assets) would want
  to move to a proper Cloudinary Search expression instead.
