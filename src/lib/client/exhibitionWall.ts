/**
 * Builds the "exhibition wall" DOM for a story: every item framed and hung at
 * once, salon-style. Shared by the Story Builder's preview/print view and the
 * Archive's read-only conserved view, so both render a story identically.
 */
import { el } from "./dom";
import { withImageTransform } from "../cloudinaryAsset";
import type { StoryDraft } from "../stories/types";

// Every story image is shown cropped to this same face-aware fill, applied at
// render time (not just when an item is added) so it self-heals items added
// before this crop existed — those still have a plain, uncropped imageUrl.
const STORY_IMAGE_CROP = { crop: "fill", gravity: "auto:face", width: 512, height: 544 };

export function storyImageSrc(imageUrl: string): string {
  return withImageTransform(imageUrl, STORY_IMAGE_CROP);
}

// A neutral dark placeholder, swapped in when an item's image 404s — e.g. the
// underlying Cloudinary asset was deleted from the gallery after it was added
// to a story. The title is already shown as visible text next to every image,
// so the placeholder doesn't need to repeat it.
const IMAGE_FALLBACK_SRC =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'%3E%3Crect width='4' height='3' fill='%23242730'/%3E%3C/svg%3E";

export function withImageFallback(img: HTMLImageElement): HTMLImageElement {
  img.addEventListener("error", () => {
    img.src = IMAGE_FALLBACK_SRC;
  }, { once: true });
  return img;
}

/** Builds a title heading plus the framed-item grid for one story. */
export function buildExhibitionWall(draft: StoryDraft): HTMLElement {
  const container = el("div", { class: "story-page" }, [el("h1", {}, [draft.title])]);
  const wall = el("div", { class: "exhibition-wall" });

  const items = [...draft.items].sort((a, b) => a.position - b.position);

  for (const item of items) {
    const frame = el("figure", { class: "frame" }, [
      withImageFallback(el("img", { src: storyImageSrc(item.imageUrl), alt: item.title }) as HTMLImageElement),
      el("figcaption", {}, [
        el("p", { class: "attribution" }, [
          `${item.title}${item.artist ? ` — ${item.artist}` : ""}${item.date ? `, ${item.date}` : ""}`,
        ]),
        item.caption ? el("p", { class: "plaque-caption" }, [item.caption]) : el("span", {}, []),
        item.narrativeText ? el("p", { class: "plaque-narrative" }, [item.narrativeText]) : el("span", {}, []),
        el("a", { href: item.sourceUrl, target: "_blank", rel: "noreferrer" }, ["Source"]),
      ]),
    ]);

    wall.append(frame);
  }

  container.append(wall);
  return container;
}
