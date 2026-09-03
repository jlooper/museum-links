import { describe, expect, it } from "vitest";
import { InMemoryStoryRepository } from "../stories/storyRepository";
import type { MuseumSearchResult } from "../stories/types";
import {
  addStoryItems,
  arrangeStoryItems,
  createStoryDraft,
  deleteStoryDraft,
  previewStory,
  requestReview,
  searchMuseumMedia,
  ToolInputError,
  updateStoryItemText,
  type ToolDeps,
} from "./toolHandlers";
import { StoryValidationError } from "../stories/validation";

const CATALOG: Record<string, MuseumSearchResult> = {
  "museums/met/met-1": {
    assetPublicId: "museums/met/met-1",
    source: "met",
    title: "Woven Blanket",
    artist: "Unknown Weaver",
    date: "19th century",
    thumbnailUrl: "https://example.org/met-1.jpg",
    sourceUrl: "https://metmuseum.org/1",
  },
  "museums/artic/artic-2": {
    assetPublicId: "museums/artic/artic-2",
    source: "artic",
    title: "Migration Series Panel",
    artist: "Jacob Lawrence",
    date: "1941",
    thumbnailUrl: "https://example.org/artic-2.jpg",
    sourceUrl: "https://artic.edu/2",
  },
};

function makeDeps(overrides: Partial<ToolDeps> = {}): ToolDeps {
  return {
    repository: new InMemoryStoryRepository(),
    searchAssets: async () => Object.values(CATALOG),
    getAssetsByPublicIds: async (ids) => ids.map((id) => CATALOG[id]).filter(Boolean),
    showPreview: (storyId) => `/story-builder#preview-${storyId}`,
    ...overrides,
  };
}

describe("searchMuseumMedia", () => {
  it("requires a non-empty query", async () => {
    const deps = makeDeps();
    await expect(searchMuseumMedia(deps, { query: "" })).rejects.toThrow(ToolInputError);
  });

  it("returns results from the data layer", async () => {
    const deps = makeDeps();
    const result = await searchMuseumMedia(deps, { query: "migration" });
    expect(result.results).toHaveLength(2);
  });
});

describe("createStoryDraft + addStoryItems", () => {
  it("only adds assets the data layer can verify, skipping and reporting the rest", async () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Textiles and Memory" });

    const result = await addStoryItems(deps, {
      storyId,
      assetPublicIds: ["museums/met/met-1", "museums/unknown/does-not-exist"],
    });

    expect(result.addedCount).toBe(1);
    expect(result.itemCount).toBe(1);
    expect(result.skippedAssetPublicIds).toEqual(["museums/unknown/does-not-exist"]);
  });

  it("de-duplicates assets already on the story", async () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Textiles and Memory" });

    await addStoryItems(deps, { storyId, assetPublicIds: ["museums/met/met-1"] });
    const second = await addStoryItems(deps, { storyId, assetPublicIds: ["museums/met/met-1"] });

    expect(second.addedCount).toBe(0);
    expect(second.itemCount).toBe(1);
  });
});

describe("updateStoryItemText", () => {
  it("updates caption/narrativeText and enforces length limits", async () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Story" });
    await addStoryItems(deps, { storyId, assetPublicIds: ["museums/met/met-1"] });
    const itemId = deps.repository.get(storyId)!.items[0].id;

    updateStoryItemText(deps, { storyId, itemId, caption: "A hand-woven wool blanket." });
    const draft = deps.repository.get(storyId)!;
    expect(draft.items[0].caption).toBe("A hand-woven wool blanket.");

    expect(() =>
      updateStoryItemText(deps, { storyId, itemId, caption: "x".repeat(500) })
    ).toThrow(StoryValidationError);
  });
});

describe("arrangeStoryItems", () => {
  it("reorders items into the given sequence", async () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Story" });
    await addStoryItems(deps, {
      storyId,
      assetPublicIds: ["museums/met/met-1", "museums/artic/artic-2"],
    });

    const items = deps.repository.get(storyId)!.items;
    const reversed = [items[1].id, items[0].id];

    const result = arrangeStoryItems(deps, { storyId, orderedItemIds: reversed });
    expect(result.order).toEqual(reversed);
  });
});

describe("deleteStoryDraft", () => {
  it("removes the draft from the repository", () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Temporary" });

    const result = deleteStoryDraft(deps, { storyId });
    expect(result.deleted).toBe(true);
    expect(deps.repository.get(storyId)).toBeUndefined();
  });

  it("throws StoryNotFoundError for an unknown id", () => {
    const deps = makeDeps();
    expect(() => deleteStoryDraft(deps, { storyId: "missing" })).toThrow();
  });
});

describe("previewStory", () => {
  it("delegates to showPreview and returns its route", () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Story" });
    const result = previewStory(deps, { storyId });
    expect(result.route).toBe(`/story-builder#preview-${storyId}`);
  });
});

describe("requestReview", () => {
  it("never publishes: it only ever changes status, and reports what's missing otherwise", async () => {
    const deps = makeDeps();
    const { storyId } = createStoryDraft(deps, { title: "Story" });

    const blocked = requestReview(deps, { storyId });
    expect(blocked.ok).toBe(false);
    expect(deps.repository.get(storyId)!.status).toBe("draft");

    await addStoryItems(deps, { storyId, assetPublicIds: ["museums/met/met-1"] });

    const allowed = requestReview(deps, { storyId });
    expect(allowed.ok).toBe(true);
    expect(allowed.status).toBe("ready_for_review");
    expect(allowed.message).toMatch(/does not publish/i);
  });
});
