/**
 * DOM wiring for the Archive page: a permanent, read-only home for every
 * story once it's been marked ready_for_review. Reuses the exact exhibition-
 * wall renderer the Story Builder's preview uses, so a conserved exposition
 * looks identical here to how it looked right before it was reviewed.
 */
import { LocalStoryRepository } from "../stories/storyRepository";
import { buildExhibitionWall } from "./exhibitionWall";
import { el } from "./dom";

export function mountArchive(): void {
  const container = document.getElementById("archive-content") as HTMLElement;
  const repository = new LocalStoryRepository();

  const conserved = repository
    .list()
    .filter((draft) => draft.status === "ready_for_review")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  if (conserved.length === 0) {
    container.append(
      el("p", { class: "empty-state" }, [
        "Nothing has been conserved yet. Finish a story in the ",
        el("a", { href: "/story-builder" }, ["Story Builder"]),
        " and mark it ready for review to see it here.",
      ])
    );
    return;
  }

  conserved.forEach((draft, index) => {
    container.append(el("section", { class: "exposition" }, [buildExhibitionWall(draft)]));

    if (index < conserved.length - 1) {
      container.append(el("hr", { class: "exposition-divider" }));
    }
  });
}
